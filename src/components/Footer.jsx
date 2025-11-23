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
        <p className={`text-xl font-medium ${headingColor}`}>CLOTHIFY</p>
      </div>
      <div className="flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 text-sm">
        <div>
          <p className={`w-full md:w-2/3 ${bodyColor}`}>
            Clothify was founded in 2024 with the mission to revolutionize the
            fashion industry. Our innovative approach combines cutting-edge
            technology with a curated selection of trendsetting apparel and
            accessories. We have over 10 stores all over the United States, so
            you can shop online & in-store.
          </p>
        </div>

        <div>
          <p className={`text-xl font-medium mb-5 ${headingColor}`}>COMPANY</p>
          <ul className={`flex flex-col gap-1 ${bodyColor}`}>
            <li>HOME</li>
            <li>ABOUT US</li>
            <li>DELIVERY</li>
            <li>PRIVACY POLICY</li>
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
          © Copyrights 2024 @ CLOTHIFY - All Rights Reserved.
        </p>
      </div>
    </div>
  );
};

export default Footer;
