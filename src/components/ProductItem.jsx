import React from "react";
import { ShopContext } from "../context/ShopContext";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { assets } from "../assets/assets";

const ProductItem = ({ id, image, name, price }) => {
  const { currency, theme } = React.useContext(ShopContext);
  const imageArray = Array.isArray(image)
    ? image
    : image
    ? [image]
    : [];
  const thumbnail = imageArray[0] || assets.hero_img;
  return (
    <Link
      to={`/product/${id}`}
      className={`${
        theme === "light" ? "text-gray-700" : "text-white"
      } cursor-pointer`}
    >
      <div className="overflow-hidden aspect-[8/9]">
        <img
          src={thumbnail}
          className="w-full h-full object-cover hover:scale-105 transition ease-in-out"
          alt="Product Image"
        />
      </div>
      <p className="pt-3 pb-1 text-sm">{name}</p>
      <p className="text-sm font-medium">
        {currency}
        {price}
      </p>
    </Link>
  );
};

ProductItem.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  image: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.string,
  ]).isRequired,
  name: PropTypes.string.isRequired,
  price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default ProductItem;
