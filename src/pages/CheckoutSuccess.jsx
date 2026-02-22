import React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Title from "../components/Title";
import { fetchCheckoutSession, finalizeCheckoutSession } from "../helper/checkoutSession";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";

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
  const { clearCart, refreshProducts } = React.useContext(ShopContext);
  const [status, setStatus] = React.useState("pending");
  const finalizedRef = React.useRef(false);

  React.useEffect(() => {
    // Guard: no session id
    if (!sessionId) {
      setStatus("error");
      return;
    }

    // Guard: only finalize once
    if (finalizedRef.current) return;
    finalizedRef.current = true;

    const finalizeOrder = async () => {
      try {
        const session = await fetchCheckoutSession(sessionId);
        if (session.payment_status !== "paid") {
          throw new Error("Payment not confirmed yet. Try refreshing in a moment.");
        }

        const finalizeResult = await finalizeCheckoutSession(session.id);
        if (finalizeResult.checkoutMode !== "buy_now") {
          clearCart();
        }
        await refreshProducts();
        setStatus("done");
        if (finalizeResult.alreadyFinalized) {
          toast.info(
            finalizeResult.orderId
              ? `Order already saved (#${String(finalizeResult.orderId).slice(-6)})`
              : "Order already saved"
          );
          return;
        }

        toast.success(
          finalizeResult.orderId
            ? `Order saved (#${String(finalizeResult.orderId).slice(-6)})`
            : "Order saved"
        );
      } catch (err) {
        console.error("Finalize order failed", err);
        finalizedRef.current = false; // allow manual retry
        toast.error(err?.message || "Unable to finalize order");
        setStatus("error");
      }
    };

    finalizeOrder();
    // Only depend on sessionId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

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
