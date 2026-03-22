import React from "react";
import { assets } from "../assets/assets.js";
import {ShopContext} from "../context/ShopContext";
const Hero = () => {
  const { theme } = React.useContext(ShopContext);
  const textColor = theme === "light" ? "text-[#414141]" : "text-white";
  const accentColor = theme === "light" ? "bg-[#414141]" : "bg-gray-200";
  const borderColor = theme === "light" ? "border-gray-400" : "border-gray-700";
  return (
    <div className={`flex flex-col sm:flex-row border ${borderColor} transition-colors`}>
      {/* Hero Left Side */}
      <div className="w-full sm:w-1/2 flex items-center justify-center py-10 sm:py-0">
        <div className={textColor}>
          <div className="flex items-center gap-2">
            <p className={`w-8 md:w-11 h-[0.125rem] ${accentColor}`}></p>
            <p className="font-medium text-sm md:text-base">HANDMADE FAVORITES</p>
          </div>
          <h1 className="prata-regular text-3xl sm:py-3 lg:text-5xl leading-relaxed">
            Beaded Jewelry & Embroidered Essentials
          </h1>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm md:text-base">SHOP DRESS-IT-UP</p>
            <p className={`w-8 md:w-11 h-[0.125rem] ${accentColor}`}></p>
          </div>
        </div>
      </div>
      {/* Hero Right Side */}
      <img src={assets.hero_img} className="w-full sm:w-1/2" alt="" />
    </div>
  );
};

export default Hero;
