const getPrimaryProductImage = (product = {}) => {
  if (Array.isArray(product.images) && product.images.length > 0) {
    return String(product.images[0] || "").trim();
  }

  if (Array.isArray(product.image) && product.image.length > 0) {
    return String(product.image[0] || "").trim();
  }

  if (typeof product.images === "string") {
    return product.images.trim();
  }

  if (typeof product.image === "string") {
    return product.image.trim();
  }

  return "";
};

export const createEnsureStripeProductPriceHandler = ({
  adminDb,
  stripe,
  toNumber,
  stripeCurrency = "usd",
}) => {
  return async (req, res) => {
    try {
      const {
        productId = "",
        productName,
        description,
        sellingPrice,
        images,
        stripeProductId: providedStripeProductId,
        stripePriceId: providedStripePriceId,
      } = req.body || {};

      const normalizedProductId = String(productId || "").trim();
      let firestoreProduct = null;
      let productRef = null;

      if (normalizedProductId) {
        productRef = adminDb.collection("products").doc(normalizedProductId);
        const productDoc = await productRef.get();
        if (!productDoc.exists) {
          return res.status(404).json({ error: "Product not found" });
        }
        firestoreProduct = productDoc.data() || {};
      }

      const resolvedName = String(
        productName ||
          firestoreProduct?.productName ||
          firestoreProduct?.name ||
          ""
      ).trim();

      if (!resolvedName) {
        return res.status(400).json({ error: "productName is required" });
      }

      const resolvedDescription = String(
        description ?? firestoreProduct?.description ?? ""
      ).trim();

      const resolvedImages = Array.isArray(images)
        ? images.filter(Boolean).map((img) => String(img))
        : Array.isArray(firestoreProduct?.images)
          ? firestoreProduct.images.filter(Boolean).map((img) => String(img))
          : [];

      const primaryImage = resolvedImages[0] || getPrimaryProductImage(firestoreProduct);

      const resolvedSellingPrice = toNumber(
        sellingPrice ?? firestoreProduct?.sellingPrice ?? firestoreProduct?.price
      );

      if (resolvedSellingPrice <= 0) {
        return res.status(400).json({ error: "sellingPrice must be greater than 0" });
      }

      const normalizedCurrency = String(stripeCurrency || "usd").toLowerCase();
      const unitAmount = Math.round(resolvedSellingPrice * 100);

      const existingStripeProductId = String(
        providedStripeProductId || firestoreProduct?.stripeProductId || ""
      ).trim();

      const existingStripePriceId = String(
        providedStripePriceId || firestoreProduct?.stripePriceId || ""
      ).trim();

      let stripeProduct = null;
      let createdProduct = false;

      if (existingStripeProductId) {
        try {
          stripeProduct = await stripe.products.retrieve(existingStripeProductId);
        } catch {
          stripeProduct = null;
        }
      }

      if (!stripeProduct) {
        stripeProduct = await stripe.products.create({
          name: resolvedName,
          description: resolvedDescription || undefined,
          images: primaryImage ? [primaryImage] : undefined,
          metadata: normalizedProductId
            ? { firebaseProductId: normalizedProductId }
            : undefined,
        });
        createdProduct = true;
      } else {
        const shouldUpdateProduct =
          stripeProduct.name !== resolvedName ||
          (resolvedDescription && stripeProduct.description !== resolvedDescription) ||
          (primaryImage && !(stripeProduct.images || []).includes(primaryImage));

        if (shouldUpdateProduct) {
          stripeProduct = await stripe.products.update(stripeProduct.id, {
            name: resolvedName,
            description: resolvedDescription || undefined,
            images: primaryImage ? [primaryImage] : undefined,
            metadata: {
              ...(stripeProduct.metadata || {}),
              ...(normalizedProductId ? { firebaseProductId: normalizedProductId } : {}),
            },
          });
        }
      }

      let stripePriceId = existingStripePriceId;
      let createdPrice = false;

      if (stripePriceId) {
        try {
          const existingPrice = await stripe.prices.retrieve(stripePriceId);
          const isReusable =
            existingPrice.active &&
            existingPrice.currency === normalizedCurrency &&
            toNumber(existingPrice.unit_amount) === unitAmount &&
            existingPrice.product === stripeProduct.id;

          if (!isReusable) {
            stripePriceId = "";
          }
        } catch {
          stripePriceId = "";
        }
      }

      if (!stripePriceId) {
        const newPrice = await stripe.prices.create({
          currency: normalizedCurrency,
          unit_amount: unitAmount,
          product: stripeProduct.id,
          metadata: normalizedProductId
            ? { firebaseProductId: normalizedProductId }
            : undefined,
        });
        stripePriceId = newPrice.id;
        createdPrice = true;
      }

      const patch = {
        stripeProductId: stripeProduct.id,
        stripePriceId,
        stripeCurrency: normalizedCurrency,
        stripeUnitAmount: unitAmount,
        stripeLastSyncedAt: new Date().toISOString(),
      };

      if (productRef) {
        await productRef.set(patch, { merge: true });
      }

      return res.json({
        ok: true,
        productId: normalizedProductId || null,
        stripeProductId: stripeProduct.id,
        stripePriceId,
        createdProduct,
        createdPrice,
        currency: normalizedCurrency,
        unitAmount,
      });
    } catch (error) {
      console.error("Failed to ensure Stripe product price", error);
      return res.status(500).json({
        error: error?.message || "Unable to sync Stripe product pricing",
      });
    }
  };
};
