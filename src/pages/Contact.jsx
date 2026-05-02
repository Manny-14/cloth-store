import React from "react"
import { FiMail, FiPackage, FiRefreshCw } from "react-icons/fi"
import Title from "../components/Title"
import { ShopContext } from "../context/ShopContext"
import { SUPPORT_EMAIL, supportTemplates } from "../helper/support"
const Contact = () => {

  const {theme } = React.useContext(ShopContext);
  const supportHref = supportTemplates.general();
  const borderColor = theme === "dark" ? "border-gray-800" : "border-gray-200";
  const textColor = theme === "dark" ? "text-gray-300" : "text-gray-700";
  const mutedText = theme === "dark" ? "text-gray-400" : "text-gray-500";
  const panelBg = theme === "dark" ? "bg-slate-900/80" : "bg-slate-50";
  const softPanelBg = theme === "dark" ? "bg-slate-950" : "bg-white";
  const iconPanel = theme === "dark" ? "bg-slate-800 text-slate-100" : "bg-slate-100 text-slate-900";
  const buttonClasses =
    theme === "dark"
      ? "bg-white text-black hover:bg-slate-200"
      : "bg-black text-white hover:bg-slate-800";
  const secondaryButtonClasses =
    theme === "dark"
      ? "border-gray-700 text-slate-100 hover:bg-slate-900"
      : "border-gray-300 text-slate-900 hover:bg-slate-50";

  return (
    <div className="transition-colors duration-300">
      <div className={`text-center text-lg pt-10 border-t ${borderColor}`}>
        <Title text1={"CONTACT"} text2={"US"}/>
      </div>

      <div className="mx-auto my-10 mb-24 max-w-5xl">
        <div className={`grid overflow-hidden rounded-lg border ${borderColor} ${softPanelBg} md:grid-cols-[1.1fr_0.9fr]`}>
          <section className={`p-6 sm:p-8 ${panelBg}`}>
            <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${mutedText}`}>
              Vendor Support
            </p>
            <h1 className="mt-3 max-w-xl text-3xl font-semibold leading-tight sm:text-4xl">
              Need help with an order, checkout, or product?
            </h1>
            <p className={`mt-4 max-w-2xl text-sm leading-6 sm:text-base ${textColor}`}>
              Send a message with your order number, product name, or the issue
              you saw. The email template opens with the details we need to help
              quickly.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={supportHref}
                className={`inline-flex items-center justify-center gap-2 rounded px-5 py-3 text-sm font-medium transition-colors ${buttonClasses}`}
            >
                <FiMail className="text-base" aria-hidden="true" />
              Message Vendor
            </a>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className={`inline-flex items-center justify-center rounded border px-5 py-3 text-sm font-medium transition-colors ${secondaryButtonClasses}`}
              >
                {SUPPORT_EMAIL}
              </a>
            </div>
          </section>

          <aside className="p-6 sm:p-8">
            <div className={`flex gap-4 border-b pb-5 ${borderColor}`}>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded ${iconPanel}`}>
                <FiPackage aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold">Shipping</p>
                <p className={`mt-1 text-sm leading-6 ${textColor}`}>
                  We ship across the United States. Free shipping is available
                  on orders above $75, with standard delivery typically taking
                  4-6 business days.
                </p>
              </div>
            </div>

            <div className="flex gap-4 pt-5">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded ${iconPanel}`}>
                <FiRefreshCw aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold">Returns & Cancellations</p>
                <p className={`mt-1 text-sm leading-6 ${textColor}`}>
                  Returns are accepted within 7 days of delivery. Customers are
                  responsible for return shipping, and orders can be canceled
                  before shipping preparation.
                </p>
              </div>
            </div>
          </aside>
        </div>

        <div className={`mt-5 grid gap-3 text-sm ${textColor} sm:grid-cols-3`}>
          <div className={`rounded border p-4 ${borderColor}`}>
            <p className="font-semibold text-slate-900 dark:text-slate-100">Checkout help</p>
            <p className="mt-1">Include any payment or cart error message.</p>
          </div>
          <div className={`rounded border p-4 ${borderColor}`}>
            <p className="font-semibold text-slate-900 dark:text-slate-100">Order questions</p>
            <p className="mt-1">Share your order number if one is available.</p>
          </div>
          <div className={`rounded border p-4 ${borderColor}`}>
            <p className="font-semibold text-slate-900 dark:text-slate-100">Product concerns</p>
            <p className="mt-1">Send the product name, size, or link.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact
