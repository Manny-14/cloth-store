import React from "react";
import { assets } from "../assets/assets";
import CartTotal from "../components/CartTotal";
import Title from "../components/Title";
import { ShopContext } from "../context/ShopContext";
import { useAuth } from "../context/authContext";
import { toast } from "react-toastify";
import { createOrder } from "../../firebase/orders/createOrder";
import { editProduct } from "../../firebase/products/editProduct";
import { resolveSizeFieldKey } from "../helper/inventory";

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  zip: "",
  country: "",
};

const splitDisplayName = (displayName = "") => {
  if (!displayName) return { firstName: "", lastName: "" };
  const parts = displayName.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const PlaceOrder = () => {
  const {
    theme,
    navigate,
    cartItems,
    products,
    getSizeQuantity,
    delivery_fee,
    clearCart,
    refreshProducts,
  } = React.useContext(ShopContext);
  const { currentUser } = useAuth();

  const [method, setMethod] = React.useState("cod");
  const [formData, setFormData] = React.useState(() => {
    const { firstName, lastName } = splitDisplayName(currentUser?.displayName);
    return {
      ...emptyForm,
      firstName,
      lastName,
      email: currentUser?.email || "",
      phone: currentUser?.phoneNumber || "",
    };
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!currentUser) return;
    const { firstName, lastName } = splitDisplayName(currentUser.displayName);
    setFormData((prev) => ({
      ...prev,
      email: prev.email || currentUser.email || "",
      phone: prev.phone || currentUser.phoneNumber || "",
      firstName: prev.firstName || firstName,
      lastName: prev.lastName || lastName,
    }));
  }, [currentUser]);

  const cartLineItems = React.useMemo(() => {
    return Object.entries(cartItems || {}).flatMap(([productId, sizes]) => {
      const product = products.find(
        (item) => item._id === productId || item.id === productId
      );

      return Object.entries(sizes || {})
        .filter(([, quantity]) => quantity > 0)
        .map(([size, quantity]) => ({
          productId,
          size,
          quantity,
          productRef: product,
          productName: product?.name || product?.productName || "Product",
          price: product?.price || product?.sellingPrice || 0,
          image: product?.image?.[0] || assets.hero_img,
        }));
    });
  }, [cartItems, products]);

  const subtotal = React.useMemo(() => {
    return cartLineItems.reduce(
      (sum, item) => sum + toNumber(item.price) * toNumber(item.quantity),
      0
    );
  }, [cartLineItems]);

  const grandTotal = subtotal > 0 ? subtotal + delivery_fee : 0;
  const isCartEmpty = cartLineItems.length === 0;

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isCartEmpty) {
      toast.error("Your cart is empty.");
      return;
    }

    setIsSubmitting(true);
    try {
      const validationErrors = [];
      const orderItems = [];
      const inventoryAdjustments = {};

      cartLineItems.forEach((lineItem) => {
        const product = lineItem.productRef;
        if (!product) {
          validationErrors.push(
            `${lineItem.productName} is no longer available. Please remove it from your cart.`
          );
          return;
        }

        const availableStock = getSizeQuantity(product, lineItem.size);
        if (lineItem.quantity > availableStock) {
          validationErrors.push(
            `${lineItem.productName} (${lineItem.size}) has only ${availableStock} left.`
          );
          return;
        }

        orderItems.push({
          productId: lineItem.productId,
          productName: lineItem.productName,
          size: lineItem.size,
          quantity: lineItem.quantity,
          pricePerUnit: toNumber(lineItem.price),
          image: lineItem.image,
        });

        const sizeField = resolveSizeFieldKey(lineItem.size);
        if (sizeField) {
          inventoryAdjustments[lineItem.productId] =
            inventoryAdjustments[lineItem.productId] || {};
          inventoryAdjustments[lineItem.productId][sizeField] =
            (inventoryAdjustments[lineItem.productId][sizeField] || 0) +
            lineItem.quantity;
        }
      });

      if (validationErrors.length) {
        toast.error(validationErrors.join(" "));
        setIsSubmitting(false);
        return;
      }

      const orderPayload = {
        userId: currentUser?.uid || null,
        userEmail: formData.email,
        customerName: `${formData.firstName} ${formData.lastName}`.trim(),
        paymentMethod: method,
        status: method === "cod" ? "pending-shipment" : "pending-payment",
        subtotal,
        deliveryFee: subtotal > 0 ? delivery_fee : 0,
        total: grandTotal,
        itemsCount: orderItems.reduce((sum, item) => sum + item.quantity, 0),
        items: orderItems,
        shippingAddress: {
          ...formData,
        },
        guestCheckout: !currentUser,
      };

      const orderId = await createOrder(orderPayload);

      const updatePromises = Object.entries(inventoryAdjustments).map(
        async ([productId, fields]) => {
          const productReference =
            cartLineItems.find((item) => item.productId === productId)?.productRef ||
            products.find((item) => item._id === productId || item.id === productId);

          if (!productReference) return;

          const payload = {};
          Object.entries(fields).forEach(([field, orderedQty]) => {
            const currentValue = toNumber(productReference[field]);
            payload[field] = Math.max(0, currentValue - orderedQty);
          });

          if (Object.keys(payload).length > 0) {
            await editProduct(productId, payload);
          }
        }
      );

      await Promise.all(updatePromises);
      clearCart();
      await refreshProducts();

      toast.success(
        orderId
          ? `Order placed successfully (#${orderId.slice(-6)}).`
          : "Order placed successfully."
      );
      navigate("/orders");
    } catch (error) {
      console.error("Failed to place order", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t">
        {/* Left Side */}
        <div className="flex flex-col gap-4 w-full sm:max-w-[480px]">
          <div className="text-lg sm:text-xl my-3">
            <Title text1={"DELIVERY"} text2={"INFORMATION"} />
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className="w-full border rounded py-1.5 px-3.5 text-black"
              required
            />
            <input
              type="text"
              placeholder="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className="w-full border rounded py-1.5 px-3.5 text-black"
              required
            />
          </div>
          <input
            type="email"
            placeholder="Email Address"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full border rounded py-1.5 px-3.5 text-black"
            required
          />
          <input
            type="text"
            placeholder="Street"
            name="street"
            value={formData.street}
            onChange={handleInputChange}
            className="w-full border rounded py-1.5 px-3.5 text-black"
            required
          />
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="City"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className="w-full border rounded py-1.5 px-3.5 text-black"
              required
            />
            <input
              type="text"
              placeholder="State"
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              className="w-full border rounded py-1.5 px-3.5 text-black"
              required
            />
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Zipcode"
              name="zip"
              value={formData.zip}
              onChange={handleInputChange}
              className="w-full border rounded py-1.5 px-3.5 text-black"
              required
            />
            <input
              type="text"
              placeholder="Country"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              className="w-full border rounded py-1.5 px-3.5 text-black"
              required
            />
          </div>
          <input
            type="tel"
            placeholder="Phone Number"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="w-full border rounded py-1.5 px-3.5 text-black"
            required
          />
        </div>

        {/* Right Side */}
        <div className="mt-8 w-full sm:w-auto">
          <div className="mt-8 min-w-80">
            <CartTotal />
          </div>
          <div className="mt-8">
            <Title text1={"PAYMENT"} text2={"METHOD"} />
            <div className="flex gap-3 flex-col lg:flex-row">
              <button
                type="button"
                onClick={() => setMethod("stripe")}
                className={`flex items-center gap-3 border p-2 px-3 cursor-pointer rounded focus:outline-none ${
                  method === "stripe" ? "ring-2 ring-green-500" : ""
                }`}
              >
                <span
                  className={`min-w-3.5 h-3.5 border rounded-full ${
                    method === "stripe" ? "bg-green-500" : ""
                  }`}
                ></span>
                <img
                  src={assets.stripe_logo}
                  alt="stripe logo"
                  className="h-5 mx-4"
                />
              </button>
              <button
                type="button"
                onClick={() => setMethod("razorpay")}
                className={`flex items-center gap-3 border p-2 px-3 cursor-pointer rounded focus:outline-none ${
                  method === "razorpay" ? "ring-2 ring-green-500" : ""
                }`}
              >
                <span
                  className={`min-w-3.5 h-3.5 border rounded-full ${
                    method === "razorpay" ? "bg-green-500" : ""
                  }`}
                ></span>
                <img
                  src={assets.razorpay_logo}
                  alt="razorpay logo"
                  className="h-5 mx-4"
                />
              </button>
              <button
                type="button"
                onClick={() => setMethod("cod")}
                className={`flex items-center gap-3 border p-2 px-3 cursor-pointer rounded focus:outline-none ${
                  method === "cod" ? "ring-2 ring-green-500" : ""
                }`}
              >
                <span
                  className={`min-w-3.5 h-3.5 border rounded-full ${
                    method === "cod" ? "bg-green-500" : ""
                  }`}
                ></span>
                <p className="text-sm font-medium mx-4">CASH ON DELIVERY</p>
              </button>
            </div>
            <div className="w-full flex flex-col items-center mt-8 gap-3">
              {!currentUser && (
                <p className="text-xs text-center text-red-500">
                  Orders placed without an account cannot be tracked later. Consider
                  logging in first.
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting || isCartEmpty}
                className={`${
                  theme === "light"
                    ? "bg-black text-white"
                    : "bg-white text-black"
                } px-16 py-3 mt-4 text-sm rounded disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {isSubmitting ? "PLACING ORDER..." : "PLACE ORDER"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
