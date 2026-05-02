import React from "react";
import { assets } from '../assets/assets.js'
import { ShopContext } from "../context/ShopContext";
const OurPolicy = () => {
  const { theme } = React.useContext(ShopContext);
  const headingColor = theme === "dark" ? "text-white" : "text-gray-700";
  const subTextColor = theme === "dark" ? "text-gray-400" : "text-gray-500";
  return (
    <div className={`flex flex-col sm:flex-row justify-around gap-12 sm:gap-2 text-center py-10 text-xs sm:text-sm md:text-base ${headingColor}`}>
      <div>
        <img src={assets.exchange_icon} className="w-12 m-auto mb-0.2" alt="exchange icon" />
        <p className='font-semibold'>Easy Exchange Policy</p>
        <p className={`text-sm ${subTextColor}`}>We offer hassle free exchange policy.</p> 
      </div>
      <div>
        <img src={assets.quality_icon} className="w-12 m-auto mb-0.2" alt="policy icon" />
        <p className='font-semibold'>7 Days Return Policy</p>
        <p className={`text-sm ${subTextColor}`}>We provide 7 days free return policy.</p> 
      </div>
      <div>
        <img src={assets.support_img} className="w-12 m-auto mb-0.2" alt="support icon" />
        <p className='font-semibold'>Best Customer Support</p>
        <p className={`text-sm ${subTextColor}`}>We provide 24/7 Customer Support.</p> 
      </div>
    </div>
  );
};

export default OurPolicy;
