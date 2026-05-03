import React from "react";
import { Link, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import Title from "../components/Title";
import { ShopContext } from "../context/ShopContext";
import { doSendPasswordResetEmail } from "../../firebase/auth";
import { supportTemplates } from "../helper/support";

const ForgotPassword = () => {
  const location = useLocation();
  const { theme } = React.useContext(ShopContext);
  const [email, setEmail] = React.useState(location.state?.email || "");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [sentTo, setSentTo] = React.useState("");
  const supportHref = supportTemplates.account();

  const inputClasses =
    theme === "dark"
      ? "bg-slate-900 border-gray-700 text-white placeholder:text-gray-400"
      : "bg-white border-gray-800 text-black placeholder:text-gray-500";
  const panelClasses =
    theme === "dark"
      ? "border-gray-800 bg-slate-900"
      : "border-gray-200 bg-white";
  const mutedText = theme === "dark" ? "text-gray-300" : "text-gray-600";
  const buttonClasses =
    theme === "dark"
      ? "bg-white text-black hover:bg-slate-200"
      : "bg-black text-white hover:bg-slate-800";

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      toast.error("Please enter the email address for your account.");
      return;
    }

    setIsSubmitting(true);
    try {
      await doSendPasswordResetEmail(trimmedEmail);
      setSentTo(trimmedEmail);
      toast.success("If an account exists for that email, a reset link has been sent.");
    } catch (error) {
      toast.error(error?.message || "We couldn't send a password reset email right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-10">
      <form
        onSubmit={onSubmitHandler}
        className={`w-full max-w-md border rounded-lg p-6 sm:p-8 ${panelClasses}`}
      >
        <div className="text-center mb-6">
          <Title text1="RESET" text2="PASSWORD" />
          <p className={`mt-3 text-sm leading-6 ${mutedText}`}>
            Enter your account email and we will send a secure password reset link if
            an account exists.
          </p>
        </div>

        <label htmlFor="reset-email" className="text-sm font-medium">
          Email address
        </label>
        <input
          id="reset-email"
          name="email"
          value={email}
          type="email"
          className={`mt-2 w-full px-3 py-2 border rounded ${inputClasses}`}
          placeholder="you@example.com"
          required
          onChange={(event) => setEmail(event.target.value)}
        />

        {sentTo && (
          <p className="mt-3 text-sm text-green-600 dark:text-green-400">
            If an account exists for {sentTo}, a reset link has been sent. Check your
            inbox and spam folder.
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`mt-5 w-full rounded px-5 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${buttonClasses}`}
        >
          {isSubmitting ? "Sending..." : "Send Reset Link"}
        </button>

        <div className={`mt-5 flex flex-col gap-2 text-center text-sm ${mutedText}`}>
          <Link to="/login" className="underline underline-offset-4">
            Back to Login
          </Link>
          <a href={supportHref} className="underline underline-offset-4">
            Need account help?
          </a>
        </div>
      </form>
    </div>
  );
};

export default ForgotPassword;
