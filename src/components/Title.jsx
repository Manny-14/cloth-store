import React from "react";
import PropTypes from "prop-types";
import { ShopContext } from "../context/ShopContext";

const Title = ({ text1, text2 }) => {
  const { theme } = React.useContext(ShopContext);
  Title.propTypes = {
    text1: PropTypes.node.isRequired,
    text2: PropTypes.node.isRequired,
  };
  const helperColor = theme === "dark" ? "text-gray-400" : "text-gray-500";
  const accentColor = theme === "dark" ? "text-white" : "text-gray-700";
  const barColor = theme === "dark" ? "bg-gray-200" : "bg-gray-700";
  return (
    <div className="inline-flex gap-2 items-center mb-3">
      <p className={helperColor}>
        {text1} <span className={`${accentColor} font-medium`}>{text2}</span>
      </p>
      <p className={`w-8 sm:w-12 h-[0.063rem] sm:h-[0.125rem] ${barColor}`}></p>
    </div>
  );
};

export default Title;
