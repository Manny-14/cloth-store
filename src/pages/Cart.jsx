import React from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import { assets } from "../assets/assets";
import CartTotal from "../components/CartTotal";
import { calculateShippingFee, estimateCartWeightKg } from "../helper/shipping";

const Cart = () => {
  const {
    cartItems,
    currency,
    products,
    updateQuantity,
    theme,
    navigate,
    getSizeQuantity,
    getAvailableSizes,
    changeCartItemSize,
  } =
    React.useContext(ShopContext);
  const [cartData, setCartData] = React.useState([]);
  const iconColor = theme === "dark" ? "filter invert" : "";
  const sizeBadgeClasses =
    theme === "dark"
      ? "bg-slate-900 text-slate-200 border-gray-700"
      : "bg-white text-slate-600 border-gray-200";
  const selectWrapClasses =
    theme === "dark"
      ? "bg-slate-900 text-slate-200 border-gray-700"
      : "bg-white text-slate-700 border-gray-200";
  const quantityInputClasses =
    theme === "dark"
      ? "bg-slate-900 text-white border-gray-700"
      : "bg-white text-black border-gray-300";

  React.useEffect(() => {
    const cartData = Object.entries(cartItems).flatMap(([id, sizes]) =>
      Object.entries(sizes)
        .filter(([size, quantity]) => quantity > 0)
        .map(([size, quantity]) => ({
          _id: id,
          size,
          quantity,
        }))
    );
    setCartData(cartData);
  }, [cartItems]);

  const cartLineItems = React.useMemo(() => {
    return cartData
      .map((item) => {
        const productData = products.find((product) => product._id === item._id);
        if (!productData) return null;
        return {
          productName: productData.name,
          category: productData.category,
          subCategory: productData.subCategory,
          type: productData.type,
          quantity: item.quantity,
          price: Number(productData.price) || 0,
        };
      })
      .filter(Boolean);
  }, [cartData, products]);

  const subtotal = React.useMemo(() => {
    return cartLineItems.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
      0
    );
  }, [cartLineItems]);

  const estimatedWeightKg = React.useMemo(() => {
    return estimateCartWeightKg(cartLineItems);
  }, [cartLineItems]);

  const shippingFee = React.useMemo(() => {
    return calculateShippingFee({
      subtotal,
      deliveryMethod: "standard_shipping",
      estimatedWeightKg,
    });
  }, [subtotal, estimatedWeightKg]);

  const total = subtotal > 0 ? subtotal + shippingFee : 0;

  return (
    <div className="border-t pt-14 min-h-screen">
      <div className="text-2xl mb-3">
        <Title text1={"YOUR"} text2={"CART"} />
      </div>

      {cartData.length > 0 ? (
        <div>
          {cartData.map((item, index) => {
            const productData = products.find(
              (product) => product._id === item._id
            );

            if (!productData) {
              return null;
            }

            const isSizeBasedProduct = productData.hasSizes !== false;
            const sizeStock = getSizeQuantity(productData, item.size);
            const hitStockLimit = item.quantity >= sizeStock && sizeStock > 0;
            const sizeOptions = getAvailableSizes(productData, {
              includeCurrentSize: item.size,
            });

            return (
              <div
                key={`${item._id}-${item.size}-${index}`}
                className="py-4 border-t border-b flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={productData.image[0]}
                    alt="product image"
                    className="w-20 h-20 object-cover rounded-md flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm sm:text-lg font-medium leading-snug line-clamp-2">
                      {productData.name}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <p className="text-sm font-medium">
                        {currency}
                        {productData.price}
                      </p>
                      {isSizeBasedProduct ? (
                        <div className={`px-2 sm:px-3 sm:py-1 border text-sm rounded ${selectWrapClasses}`}>
                          <label className="sr-only" htmlFor={`size-${item._id}-${item.size}`}>
                            Change size
                          </label>
                          <select
                            id={`size-${item._id}-${item.size}`}
                            value={item.size}
                            onChange={(e) =>
                              changeCartItemSize(item._id, item.size, e.target.value)
                            }
                            className="bg-transparent focus:outline-none"
                          >
                            {sizeOptions.length > 0 ? (
                              sizeOptions.map((option) => (
                                <option value={option} key={option}>
                                  {option}
                                </option>
                              ))
                            ) : (
                              <option value={item.size}>{item.size}</option>
                            )}
                          </select>
                        </div>
                      ) : (
                        <div className={`px-2 sm:px-3 sm:py-1 border text-xs rounded ${sizeBadgeClasses}`}>
                          One size
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:ml-auto">
                  <div className="flex flex-col items-center">
                    <input
                      type="number"
                      min={1}
                      max={sizeStock || undefined}
                      defaultValue={item.quantity}
                      onChange={(e) => {
                        if (e.target.value === "" || e.target.value === "0") {
                          return;
                        }
                        updateQuantity(
                          item._id,
                          item.size,
                          Number(e.target.value)
                        );
                      }}
                      className={`border w-12 px-2 py-1.5 text-center text-sm rounded ${quantityInputClasses}`}
                    />
                    {sizeStock > 0 && (
                      <p
                        className={`text-[10px] mt-1 ${
                          hitStockLimit ? "text-red-500" : "text-slate-500"
                        }`}
                      >
                        {hitStockLimit
                          ? `Max ${sizeStock} in stock`
                          : `In stock: ${sizeStock}`}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item._id, item.size, 0)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Remove item"
                  >
                    <img
                      src={assets.bin_icon}
                      alt="bin icon"
                      className={`w-4 sm:w-5 ${iconColor}`}
                    />
                  </button>
                </div>
              </div>
            );
          })}

          <div className="flex justify-center my-10 sm:my-20">
            <div className="w-full sm:w-[450px]">
              <CartTotal subtotal={subtotal} shippingFee={shippingFee} total={total} />
              <div className="w-full text-center">
                <button
                  className={`${
                    theme === "light"
                      ? "bg-black text-white"
                      : "bg-white text-black"
                  } w-full sm:w-auto text-sm my-6 sm:my-8 px-8 py-3.5 rounded active:scale-[0.98] transition-transform`}
                  onClick={() => navigate("/place-order")}
                >
                  PROCEED TO CHECKOUT
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Centered Message when Cart is Empty
        <div className="flex items-center justify-center h-[50vh] text-xl">
          <p>Add items to the cart</p>
        </div>
      )}
    </div>
  );
};

export default Cart;
