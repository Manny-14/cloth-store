const SIZE_FIELD_MAP = {
  XS: "extraSmallQuantity",
  "EXTRA SMALL": "extraSmallQuantity",
  S: "smallQuantity",
  SM: "smallQuantity",
  SMALL: "smallQuantity",
  M: "mediumQuantity",
  MEDIUM: "mediumQuantity",
  L: "largeQuantity",
  LARGE: "largeQuantity",
  XL: "xlQuantity",
  "X-L": "xlQuantity",
  "EXTRA LARGE": "xlQuantity",
  XXL: "xxlQuantity",
  "2XL": "xxlQuantity",
  "XX-L": "xxlQuantity",
  "XX-LARGE": "xxlQuantity",
};

const resolveSizeFieldKey = (size) => {
  if (!size && size !== 0) return null;
  return SIZE_FIELD_MAP[String(size).trim().toUpperCase()] || null;
};

const parseLineItemMeta = (session) => {
  try {
    return JSON.parse(session?.metadata?._lineItemMeta || "{}");
  } catch {
    return {};
  }
};

export const createFinalizePaidCheckoutSession = ({
  adminDb,
  stripe,
  FieldValue,
  toNumber,
}) => {
  const getExistingOrderBySessionId = async (sessionId) => {
    if (!adminDb || !sessionId) return null;

    const snapshot = await adminDb
      .collection("orders")
      .where("stripeSessionId", "==", sessionId)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    const existing = snapshot.docs[0];
    return { id: existing.id, ...existing.data() };
  };

  const buildOrderArtifactsFromSession = (session) => {
    const lineItemMeta = parseLineItemMeta(session);
    const orderItems = [];
    const inventoryAdjustments = {};

    (session.line_items?.data || []).forEach((line, idx) => {
      const price = line.price;
      const product = price?.product;
      const meta = lineItemMeta[String(idx)] || {};
      const productId =
        meta.firebaseProductId ||
        price?.metadata?.firebaseProductId ||
        product?.metadata?.firebaseProductId ||
        "";

      const quantity = toNumber(line.quantity);
      if (!productId || quantity <= 0) return;

      const size = meta.size || "";
      const pricePerUnit = line.amount_subtotal
        ? line.amount_subtotal / 100 / quantity
        : 0;

      orderItems.push({
        productId,
        productName: product?.name || price?.nickname || "Product",
        size,
        quantity,
        pricePerUnit,
        image: product?.images?.[0] || "",
      });

      const sizeField = resolveSizeFieldKey(size);
      if (sizeField) {
        inventoryAdjustments[productId] = inventoryAdjustments[productId] || {};
        inventoryAdjustments[productId][sizeField] =
          (inventoryAdjustments[productId][sizeField] || 0) + quantity;
      }
    });

    return {
      orderItems,
      inventoryAdjustments,
    };
  };

  return async (sessionId, source = "manual") => {
    if (!adminDb) {
      throw new Error("Order finalization is not configured on server.");
    }

    const existingOrder = await getExistingOrderBySessionId(sessionId);
    if (existingOrder) {
      return {
        orderId: existingOrder.id,
        alreadyFinalized: true,
        checkoutMode: existingOrder?.checkoutMode || "cart",
      };
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items.data.price.product"],
    });

    if (session.payment_status !== "paid") {
      throw new Error("Payment not confirmed yet. Try refreshing in a moment.");
    }

    const { orderItems, inventoryAdjustments } = buildOrderArtifactsFromSession(session);
    if (!orderItems.length) {
      throw new Error("Could not map checkout items to products.");
    }

    const defaultStatus = "pending-shipment";
    const checkoutMode = session.metadata?.checkoutMode || "cart";
    const orderPayload = {
      userId: session.metadata?.userId || null,
      userEmail: session.customer_email || "",
      customerName: session.metadata?.customerName || "",
      paymentMethod: "stripe",
      paymentStatus: "paid",
      status: defaultStatus,
      subtotal: orderItems.reduce((sum, item) => sum + toNumber(item.pricePerUnit) * item.quantity, 0),
      deliveryFee: toNumber(session.metadata?.deliveryFee),
      total: session.amount_total ? session.amount_total / 100 : undefined,
      itemsCount: orderItems.reduce((sum, item) => sum + item.quantity, 0),
      items: orderItems,
      shippingAddress: {
        street: session.metadata?.shippingStreet || "",
        city: session.metadata?.shippingCity || "",
        state: session.metadata?.shippingState || "",
        zip: session.metadata?.shippingZip || "",
        country: session.metadata?.shippingCountry || "",
        phone: session.metadata?.shippingPhone || "",
      },
      deliveryMethod: session.metadata?.deliveryMethod || "standard_shipping",
      delivery: {
        status: defaultStatus,
        carrier: "",
        trackingNumber: "",
        trackingUrl: "",
        statusHistory: [
          {
            status: defaultStatus,
            at: new Date().toISOString(),
            note: `Payment confirmed via ${source}. Awaiting seller fulfillment.`,
          },
        ],
      },
      guestCheckout: !session.metadata?.userId,
      stripeSessionId: session.id,
      paymentIntentId: session.payment_intent || null,
      checkoutMode,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const orderId = session.id;
    const orderRef = adminDb.collection("orders").doc(orderId);
    let createdNow = false;

    await adminDb.runTransaction(async (transaction) => {
      const existingById = await transaction.get(orderRef);
      if (existingById.exists) return;

      for (const [productId, fields] of Object.entries(inventoryAdjustments)) {
        const productRef = adminDb.collection("products").doc(productId);
        const productDoc = await transaction.get(productRef);
        if (!productDoc.exists) continue;

        const nextFields = {};
        Object.entries(fields).forEach(([field, orderedQty]) => {
          const currentValue = toNumber(productDoc.data()?.[field]);
          nextFields[field] = Math.max(0, currentValue - toNumber(orderedQty));
        });

        if (Object.keys(nextFields).length) {
          transaction.update(productRef, nextFields);
        }
      }

      transaction.set(orderRef, orderPayload);
      createdNow = true;
    });

    return {
      orderId,
      alreadyFinalized: !createdNow,
      checkoutMode,
    };
  };
};
