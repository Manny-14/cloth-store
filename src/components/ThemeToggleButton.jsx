import React from "react";
import PropTypes from "prop-types";
import { FiSun, FiMoon } from "react-icons/fi";
import { ShopContext } from "../context/ShopContext";

const ThemeToggleButton = ({ className = "", variant = "text" }) => {
  const { theme, toggleTheme } = React.useContext(ShopContext);
  const isDark = theme === "dark";
  const nextModeLabel = isDark ? "Switch to light mode" : "Switch to dark mode";
  const sharedClasses =
    "transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500";

  if (variant === "icon") {
    return (
      <button
        type="button"
        aria-label={nextModeLabel}
        title={nextModeLabel}
        onClick={toggleTheme}
        className={`rounded-full p-2 sm:p-2.5 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-700 ${sharedClasses} ${className}`}
      >
        {isDark ? <FiSun className="h-4 w-4 sm:h-5 sm:w-5" /> : <FiMoon className="h-4 w-4 sm:h-5 sm:w-5" />}
        <span className="sr-only">{nextModeLabel}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`px-3 py-2 text-xs sm:text-sm bg-gray-200 dark:bg-gray-800 rounded text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-700 ${sharedClasses} ${className}`}
    >
      {isDark ? "Light Mode" : "Dark Mode"}
    </button>
  );
};

ThemeToggleButton.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.oneOf(["text", "icon"]),
};

export default ThemeToggleButton;