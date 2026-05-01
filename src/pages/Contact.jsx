import React from "react"
import { assets } from "../assets/assets"
import Title from "../components/Title"
import { ShopContext } from "../context/ShopContext"
const Contact = () => {

  const {theme } = React.useContext(ShopContext);
  const supportEmail = "dressitup1000@gmail.com";
  const supportHref = `mailto:${supportEmail}?subject=${encodeURIComponent(
    "Dress-It-Up support request"
  )}`;
  const borderColor = theme === "dark" ? "border-gray-800" : "border-gray-200";
  const textColor = theme === "dark" ? "text-gray-300" : "text-gray-700";
  const panelBg = theme === "dark" ? "bg-slate-900" : "bg-slate-50";
  const buttonClasses =
    theme === "dark"
      ? "bg-white text-black hover:bg-slate-200"
      : "bg-black text-white hover:bg-slate-800";

  return (
    <div className="transition-colors duration-300">

      <div className={`text-center text-lg pt-10 border-t ${borderColor}`}>
        <Title text1={"CONTACT"} text2={"US"}/>
      </div>

      <div className="my-10 flex flex-col justify-center md:flex-row gap-10 mb-28">
        <img src={assets.contact_img} alt="contact us image" className="w-full md:max-w-[480px]"/>
        <div className={`flex flex-col my-10 text-lg items-start gap-6 ${textColor}`}>
          {/* <p className="font-semi-bold text-lg">Our Store</p>
          <p className="text-gray-500">54709 Willms Station<br/>Suite 350, Washington, USA</p> */}
          <p>
            Email:{" "}
            <a className="underline underline-offset-4" href={`mailto:${supportEmail}`}>
              {supportEmail}
            </a>
          </p>
          <div className={`text-sm border rounded-lg p-4 w-full ${borderColor} ${panelBg}`}>
            <p className="font-semibold mb-2">Message Vendor</p>
            <p className="mb-4">
              For checkout issues, order questions, or product concerns, email us
              with your order number if you have one.
            </p>
            <a
              href={supportHref}
              className={`inline-flex items-center justify-center rounded px-5 py-2 text-sm transition-colors ${buttonClasses}`}
            >
              Message Vendor
            </a>
          </div>
          <div className={`text-sm border rounded-lg p-4 w-full ${borderColor}`}>
            <p className="font-semibold mb-2">Shipping & Return Summary</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>We currently ship across the United States.</li>
              <li>Free shipping is available on orders above $75.</li>
              <li>Delivery timeline is typically 4-6 business days.</li>
              <li>Returns are accepted within 7 days of delivery.</li>
              <li>Customers are responsible for return shipping costs.</li>
              <li>Orders can be canceled before shipping preparation.</li>
            </ul>
          </div>
          {/* <p className="font-semibold text-lg">Careers at Clothify</p>
          <p className="text-gray-500">Learn more about our teams and job openings</p>
        <button className={`${theme === "light" ? "bg-black text-white hover:bg-white hover:text-black" : "bg-white text-black hover:bg-black hover:text-white"} border rounded px-8 py-4 text-sm transition-all duration-300`}>Explore Jobs</button> */}
        </div>
      </div>
    </div>
  )
}

export default Contact
