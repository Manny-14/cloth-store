import React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Title from "../components/Title";
import { fetchCheckoutSession } from "../helper/checkoutSession";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";
import { createOrder } from "../../firebase/orders/createOrder";
import { editProduct } from "../../firebase/products/editProduct";
import { resolveSizeFieldKey } from "../helper/inventory";

const getSessionId = () => {
  // HashRouter: params may live after the hash, e.g. /#/checkout/success?session_id=...
  // Try react-router search params first, then parse from window.location.hash
  const hashQuery = window.location.hash.split("?")[1];
  if (hashQuery) {
    const params = new URLSearchParams(hashQuery);
    if (params.get("session_id")) return params.get("session_id");
  }
  // Also check the top-level search (non-hash deployments)
  const topParams = new URLSearchParams(window.location.search);
  return topParams.get("session_id");
};

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id") || getSessionId();
  const navigate = useNavigate();
  const { products, productsLoading, clearCart, refreshProducts } = React.useContext(ShopContext);
  const [status, setStatus] = React.useState("pending");
  const finalizedRef = React.useRef(false);

  const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  React.useEffect(() => {
    // Guard: no session id
    if (!sessionId) {
      setStatus("error");
      return;
    }

    // Guard: wait for products to finish loading
    if (productsLoading || products.length === 0) return;

    // Guard: only finalize once
    if (finalizedRef.current) return;
    finalizedRef.current = true;

    const finalizeOrder = async () => {
      try {
        const session = await fetchCheckoutSession(sessionId);
        if (session.payment_status !== "paid") {
          throw new Error("Payment not confirmed yet. Try refreshing in a moment.");
        }

        // Build order items from Stripe session line items
        const orderItems = [];
        const inventoryAdjustments = {};

        (session.lineItems || []).forEach((line) => {
          const productId = line.firebaseProductId;
          if (!productId) return;
          const product = products.find((p) => p._id === productId || p.id === productId);
          const quantity = toNumber(line.quantity);
          if (!product || quantity <= 0) return;

          const pricePerUnit = line.amountSubtotal
            ? line.amountSubtotal / 100 / quantity
            : toNumber(product?.price || product?.sellingPrice || 0);

          orderItems.push({
            productId,
            productName: product?.name || product?.productName || line.name || "Product",
            size: line.size || line.metadata?.size || "",
            quantity,
            pricePerUnit,
            image: product?.images?.[0] || product?.image?.[0] || "",
          });

          const sizeField = resolveSizeFieldKey(line.size || line.metadata?.size || "");
          if (sizeField) {
            inventoryAdjustments[productId] = inventoryAdjustments[productId] || {};
            inventoryAdjustments[productId][sizeField] =
              (inventoryAdjustments[productId][sizeField] || 0) + quantity;
          }
        });

        if (!orderItems.length) {
          throw new Error("Could not match Stripe line items to products.");
        }

        const orderPayload = {
          userId: session.metadata?.userId || null,
          userEmail: session.customer_email,
          customerName: session.metadata?.customerName || "",
          paymentMethod: "stripe",
          paymentStatus: "paid",
          status: "pending-shipment",
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
            status: "pending-shipment",
            carrier: "",
            trackingNumber: "",
            trackingUrl: "",
            statusHistory: [
              {
                status: "pending-shipment",
                at: new Date().toISOString(),
                note: "Payment confirmed. Awaiting seller fulfillment.",
              },
            ],
          },
          guestCheckout: !session.metadata?.userId,
          stripeSessionId: session.id,
        };

        const orderId = await createOrder(orderPayload);

        // Decrement inventory
        const updatePromises = Object.entries(inventoryAdjustments).map(
          async ([productId, fields]) => {
            const productReference = products.find((item) => item._id === productId || item.id === productId);
            if (!productReference) return;

            const payload = {};
            Object.entries(fields).forEach(([field, orderedQty]) => {
              const currentValue = toNumber(productReference[field]);
              payload[field] = Math.max(0, currentValue - orderedQty);
            });

            if (Object.keys(payload).length > 0) {
              await editProduct(productId, payload);
            }
          }
        );

        await Promise.all(updatePromises);
        clearCart();
        await refreshProducts();
        setStatus("done");
        toast.success(orderId ? `Order saved (#${orderId.slice(-6)})` : "Order saved");
      } catch (err) {
        console.error("Finalize order failed", err);
        finalizedRef.current = false; // allow manual retry
        toast.error(err?.message || "Unable to finalize order");
        setStatus("error");
      }
    };

    finalizeOrder();
    // Only depend on sessionId, productsLoading, and products.length — not the full products array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, productsLoading, products.length]);

  const isLoading = status === "pending";

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
      <div className="text-4xl">{isLoading ? "⏳" : status === "done" ? "✅" : "⚠️"}</div>
      <Title text1="PAYMENT" text2={status === "error" ? "ISSUE" : "SUCCESS"} />
      <p className="max-w-xl text-slate-600 dark:text-slate-300">
        {isLoading && "Finalizing your order..."}
        {status === "done" && "Your payment was confirmed. We’re preparing your order."}
        {status === "error" && "We couldn't finalize the order. Please check your orders or try again."}
      </p>
      <div className="flex gap-3">
        <Link
          to="/orders"
          className="bg-black text-white dark:bg-white dark:text-black px-4 py-2 rounded"
        >
          View Orders
        </Link>
        <button
          className="border px-4 py-2 rounded"
          onClick={() => navigate("/collection")}
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
