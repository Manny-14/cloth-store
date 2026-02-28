import React from "react";
import { assets } from "../assets/assets";
import CartTotal from "../components/CartTotal";
import Title from "../components/Title";
import { ShopContext } from "../context/ShopContext";
import { useAuth } from "../context/authContext";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";
import { createStripeCheckoutSession } from "../helper/stripe";
import { calculateShippingFee, estimateCartWeightKg } from "../helper/shipping";

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
  const location = useLocation();
  const navigate = useNavigate();
  const {
    theme,
    cartItems,
    products,
    getSizeQuantity,
  } = React.useContext(ShopContext);
  const { currentUser } = useAuth();

  const [deliveryMethod, setDeliveryMethod] = React.useState("standard_shipping");
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

  const buyNowLineItem = React.useMemo(() => {
    const buyNowItem = location.state?.buyNowItem;
    if (!buyNowItem?.productId || !buyNowItem?.size) return null;

    const product = products.find(
      (item) => item._id === buyNowItem.productId || item.id === buyNowItem.productId
    );

    if (!product) return null;

    const quantity = Math.max(1, toNumber(buyNowItem.quantity || 1));

    return {
      productId: buyNowItem.productId,
      size: buyNowItem.size,
      quantity,
      productRef: product,
      productName: product?.name || product?.productName || "Product",
      price: product?.price || product?.sellingPrice || 0,
      image: product?.image?.[0] || assets.hero_img,
    };
  }, [location.state, products]);

  const activeLineItems = React.useMemo(() => {
    return buyNowLineItem ? [buyNowLineItem] : cartLineItems;
  }, [buyNowLineItem, cartLineItems]);

  const isBuyNowFlow = Boolean(buyNowLineItem);

  const subtotal = React.useMemo(() => {
    return activeLineItems.reduce(
      (sum, item) => sum + toNumber(item.price) * toNumber(item.quantity),
      0
    );
  }, [activeLineItems]);

  const estimatedWeightKg = React.useMemo(() => {
    return estimateCartWeightKg(activeLineItems);
  }, [activeLineItems]);

  const shippingFee = React.useMemo(() => {
    return calculateShippingFee({
      subtotal,
      deliveryMethod,
      estimatedWeightKg,
    });
  }, [subtotal, deliveryMethod, estimatedWeightKg]);

  const grandTotal = subtotal > 0 ? subtotal + shippingFee : 0;
  const isCartEmpty = activeLineItems.length === 0;

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

    if (!currentUser) {
      toast.error("Please sign in to continue checkout.");
      navigate("/login");
      return;
    }

    setIsSubmitting(true);
    try {
      const validationErrors = [];
      const orderItems = [];

      activeLineItems.forEach((lineItem) => {
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
      });

      if (validationErrors.length) {
        toast.error(validationErrors.join(" "));
        setIsSubmitting(false);
        return;
      }

      try {
        const lineItemsWithPrice = orderItems
          .map((item) => {
            const product = activeLineItems.find((p) => p.productId === item.productId && p.size === item.size)?.productRef;
            const priceId = product?.stripePriceId;
            return priceId
              ? { priceId, quantity: item.quantity, metadata: { size: item.size, firebaseProductId: item.productId } }
              : null;
          })
          .filter(Boolean);

        if (lineItemsWithPrice.length !== orderItems.length) {
          toast.error("Some products are missing Stripe prices. Please contact support.");
          setIsSubmitting(false);
          return;
        }

        const origin = window.location.origin;
        const basePath = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
        const customerName = `${formData.firstName} ${formData.lastName}`.trim();
        const authToken = await currentUser.getIdToken();
        const { url } = await createStripeCheckoutSession({
          lineItems: lineItemsWithPrice,
          customerEmail: currentUser.email || formData.email,
          successUrl: `${origin}${basePath}/#/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${origin}${basePath}/#/checkout/cancel`,
          metadata: {
            userId: currentUser.uid,
            customerName,
            checkoutMode: isBuyNowFlow ? "buy_now" : "cart",
            deliveryMethod,
            shippingStreet: formData.street,
            shippingCity: formData.city,
            shippingState: formData.state,
            shippingZip: formData.zip,
            shippingCountry: formData.country,
            shippingPhone: formData.phone,
          },
        }, {
          authToken,
        });

        if (url) {
          window.location.href = url;
          return;
        }

        toast.error("Unable to start Stripe checkout. Please try again.");
      } catch (err) {
        console.error("Stripe checkout failed", err);
        toast.error(err?.message || "Unable to start Stripe checkout. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
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

          <div className="flex flex-col gap-2 mt-2">
            <label className="text-sm font-medium">Delivery Option</label>
            <div className="flex gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setDeliveryMethod("standard_shipping")}
                className={`px-3 py-2 rounded border text-sm ${
                  deliveryMethod === "standard_shipping"
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                    : "border-slate-300 dark:border-slate-700"
                }`}
              >
                Standard Shipping
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMethod("doorstep_delivery")}
                className={`px-3 py-2 rounded border text-sm ${
                  deliveryMethod === "doorstep_delivery"
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                    : "border-slate-300 dark:border-slate-700"
                }`}
              >
                Doorstep Delivery
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {deliveryMethod === "doorstep_delivery"
                ? "Priority doorstep handoff by local delivery partner."
                : "Standard shipping to your provided address."}
            </p>
            {isBuyNowFlow && (
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Buy Now mode: only the selected product will be checked out.
              </p>
            )}
          </div>
        </div>

        {/* Right Side */}
        <div className="mt-8 w-full sm:w-auto">
          <div className="mt-8 min-w-80">
            <CartTotal subtotal={subtotal} shippingFee={shippingFee} total={grandTotal} />
          </div>
          <div className="mt-8">
            <Title text1={"PAYMENT"} text2={"METHOD"} />
            <div className="flex gap-3 flex-col lg:flex-row">
              <div className="flex items-center gap-3 border p-2 px-3 rounded bg-slate-50 dark:bg-slate-900">
                <span className="min-w-3.5 h-3.5 border rounded-full bg-green-500" />
                <img src={assets.stripe_logo} alt="stripe logo" className="h-5 mx-4" />
                <p className="text-sm font-medium">Stripe Checkout</p>
              </div>
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
                } w-full sm:w-auto px-16 py-3.5 mt-4 text-sm rounded disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] transition-transform`}
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
