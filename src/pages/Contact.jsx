import React from "react"
import { assets } from "../assets/assets"
import Title from "../components/Title"
import { ShopContext } from "../context/ShopContext"
const Contact = () => {

  const {theme } = React.useContext(ShopContext);
  const borderColor = theme === "dark" ? "border-gray-800" : "border-gray-200";
  const textColor = theme === "dark" ? "text-gray-300" : "text-gray-700";
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
          <p className="">Phone Number : +6154797177</p>
          <p> Email : okorieemmanuelapp@gmail.com</p>
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