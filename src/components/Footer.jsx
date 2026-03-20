import React from "react";
import { useLocation } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
const Footer = () => {

  const location = useLocation();
  const { theme } = React.useContext(ShopContext);
  const headingColor = theme === "dark" ? "text-white" : "text-gray-900";
  const bodyColor = theme === "dark" ? "text-gray-300" : "text-gray-600";
  const borderColor = theme === "dark" ? "border-gray-800" : "border-gray-200";

  // Excluding the footer from the admin panel
  if (location.pathname.startsWith('/admin-panel')) {
    return null;
  }
  return (
    <div className={`border-t ${borderColor} mt-10 pt-10`}>
      <div className="flex flex-col sm:flex-row items-start justify-between gap-6 mb-8">
        <div className={`leading-none ${headingColor} select-none`}>
          <p className="text-[1.28rem] font-black italic tracking-[0.08em]">Dress</p>
          <p className="text-[0.72rem] font-medium tracking-[0.22em] mt-1">✦ IT UP ✦</p>
        </div>
      </div>
      <div className="flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-8 sm:gap-14 text-sm">
        <div>
          <p className={`w-full md:w-2/3 ${bodyColor}`}>
            Dress-It-Up offers handcrafted and embroidered fashion accessories,
            including beaded jewelry, embroidered tees, and towel sets. We ship
            across the United States and focus on quality pieces made with care.
          </p>
        </div>

        <div>
          <p className={`text-xl font-medium mb-5 ${headingColor}`}>POLICIES</p>
          <ul className={`flex flex-col gap-1 ${bodyColor}`}>
            <li>Shipping: United States</li>
            <li>Free shipping over $75</li>
            <li>Delivery: 4-6 business days</li>
            <li>Returns: within 7 days</li>
            <li>Return shipping: customer pays</li>
            <li>Cancel allowed before shipping</li>
          </ul>
        </div>

        <div>
          <p className={`text-xl font-medium mb-5 ${headingColor}`}>
            GET IN TOUCH
          </p>
          <ul className={`flex flex-col gap-1 ${bodyColor}`}>
            <li>+201221335111</li>
            <li>contact@clothify.com</li>
          </ul>
        </div>
      </div>
      <div className="flex justify-center items-center relative mt-8">
        <p className={`py-4 text-sm text-center ${bodyColor}`}>
          © Copyrights 2026 @ DRESS-IT-UP - All Rights Reserved.
        </p>
      </div>
    </div>
  );
};

export default Footer;
