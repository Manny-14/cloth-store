import { Link } from "react-router-dom";
import Title from "../components/Title";
import { supportTemplates } from "../helper/support";

const CheckoutCancel = () => {
  const supportHref = supportTemplates.checkout();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
      <div className="text-4xl">⚠️</div>
      <Title text1="PAYMENT" text2="CANCELLED" />
      <p className="max-w-xl text-slate-600 dark:text-slate-300">
        Looks like the payment didn’t complete. You can try again or adjust your cart.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          to="/cart"
          className="bg-black text-white dark:bg-white dark:text-black px-4 py-2 rounded"
        >
          Back to Cart
        </Link>
        <Link
          to="/collection"
          className="border px-4 py-2 rounded"
        >
          Continue Shopping
        </Link>
        <a
          href={supportHref}
          className="border px-4 py-2 rounded"
        >
          Message Vendor
        </a>
      </div>
    </div>
  );
};

export default CheckoutCancel;
