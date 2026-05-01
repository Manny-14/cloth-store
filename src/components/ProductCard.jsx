import React from "react";
import PropTypes from "prop-types";

// Accepts product, onEdit, onDelete, and optionally theme/currency as props
const ProductCard = ({
  product,
  onEdit,
  onDelete,
  theme = "light",
  currency = "$",
  isSoldOut = false,
}) => {
  const isSizeBasedProduct = product.hasSizes !== false;
  const imageBorder = theme === "dark" ? "border-slate-700" : "border-gray-200";
  const costChip =
    theme === "dark"
      ? "bg-blue-900/60 text-blue-100"
      : "bg-blue-100 text-blue-800";
  const priceChip =
    theme === "dark"
      ? "bg-emerald-900/60 text-emerald-100"
      : "bg-green-100 text-green-800";
  const sizeChip =
    theme === "dark"
      ? "bg-slate-800 text-slate-100"
      : "bg-gray-100 text-gray-800";

  return (
    <div
      className={`border rounded-lg shadow-md p-4 flex flex-col gap-2 transition hover:shadow-lg ${
        theme === "light"
          ? "bg-white"
          : "bg-slate-900 text-white border-slate-700"
      }`}
    >
      <div className="flex gap-4 items-center">
        <img
          src={product.images && product.images[0]}
          alt={product.productName}
          className={`w-24 h-24 object-cover rounded-md border ${imageBorder}`}
        />
        <div className="flex-1">
          <h3 className="font-semibold text-lg line-clamp-2">
            {product.productName}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-300 line-clamp-1">
            {product.category} &bull; {product.type}
          </p>
          {isSoldOut && (
            <p className="text-xs uppercase font-semibold text-red-500 mt-1">
              Sold Out
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-1 mt-2">
        <div className="flex gap-2 text-xs mb-1">
          <span className={`px-2 py-0.5 rounded ${costChip}`}>
            Cost: {currency}
            {product.costPrice}
          </span>
          <span className={`px-2 py-0.5 rounded ${priceChip}`}>
            Price: {currency}
            {product.sellingPrice}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {isSizeBasedProduct ? (
            <>
              <span className={`px-2 py-0.5 rounded ${sizeChip}`}>
                S: {product.smallQuantity || 0}
              </span>
              <span className={`px-2 py-0.5 rounded ${sizeChip}`}>
                M: {product.mediumQuantity || 0}
              </span>
              <span className={`px-2 py-0.5 rounded ${sizeChip}`}>
                L: {product.largeQuantity || 0}
              </span>
              <span className={`px-2 py-0.5 rounded ${sizeChip}`}>
                XL: {product.xlQuantity || 0}
              </span>
            </>
          ) : (
            <span className={`px-2 py-0.5 rounded ${sizeChip}`}>
              Stock: {product.stockQuantity || product.totalQuantity || 0}
            </span>
          )}
        </div>
      </div>
      <p className="text-xs mt-2 line-clamp-2">{product.description}</p>
      <div className="flex gap-2 mt-3">
        {onEdit && (
          <button
            className="px-3 py-1 rounded bg-yellow-400 text-black text-xs hover:bg-yellow-500"
            onClick={() => onEdit(product)}
          >
            Edit
          </button>
        )}
        {onDelete && (
          <button
            className="px-3 py-1 rounded bg-red-500 text-white text-xs hover:bg-red-600"
            onClick={() => onDelete(product)}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

ProductCard.propTypes = {
  product: PropTypes.object.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  theme: PropTypes.string,
  currency: PropTypes.string,
  isSoldOut: PropTypes.bool,
};

export default ProductCard;
