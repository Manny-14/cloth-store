import React from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import { useAuth } from "../context/authContext";
import { getOrdersByUser } from "../../firebase/orders/getOrdersByUser";
import { assets } from "../assets/assets";
import { DEFAULT_ORDER_STATUS, formatOrderStatusLabel } from "../helper/orderStatus";
import { NON_SIZED_KEY } from "../helper/inventory";
import { supportTemplates } from "../helper/support";

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatOrderDate = (timestamp) => {
  if (!timestamp) return "-";
  try {
    const dateValue =
      typeof timestamp.toDate === "function" ? timestamp.toDate() : new Date(timestamp);
    return dateValue.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch (error) {
    return "-";
  }
};

const Orders = () => {
  const { currency, theme, navigate } = React.useContext(ShopContext);
  const { currentUser, userLoggedIn } = useAuth();
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!userLoggedIn || !currentUser?.uid) {
      setOrders([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError("");

    getOrdersByUser(currentUser.uid)
      .then((orderList) => {
        if (!isMounted) return;
        setOrders(orderList);
      })
      .catch((loadError) => {
        console.error("Failed to load orders", loadError);
        if (isMounted) setError("Unable to load your orders right now.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [userLoggedIn, currentUser?.uid]);

  const borderColor = theme === "dark" ? "border-gray-800" : "border-gray-200";
  const cardBg = theme === "dark" ? "bg-gray-900" : "bg-white";
  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-700";
  const mutedText = theme === "dark" ? "text-gray-400" : "text-gray-500";
  const supportHref = supportTemplates.general();

  if (!userLoggedIn) {
    return (
      <div className="orders-container border-t pt-16">
        <div className="text-center">
          <Title text1="YOUR" text2="ORDERS" />
          <p className="mt-4 text-sm">Please log in to view your orders.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <div className={`border-t pt-16 ${borderColor}`}>
        <div className="text-xl text-center">
          <Title text1="YOUR" text2="ORDERS" />
        </div>

        {loading && (
          <p className="text-center mt-10 text-sm">Loading your orders...</p>
        )}

        {!loading && error && (
          <div className="mt-10 flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-red-500">{error}</p>
            <a href={supportHref} className="border px-4 py-2 rounded text-sm">
              Message Vendor
            </a>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="mt-10 flex flex-col items-center gap-3 text-center">
            <p className="text-sm">You have not placed any orders yet.</p>
            <button
              type="button"
              onClick={() => navigate("/collection")}
              className="bg-black text-white dark:bg-white dark:text-black px-4 py-2 rounded text-sm"
            >
              Browse Collection
            </button>
          </div>
        )}

        <div className="flex flex-col gap-4 mt-8">
          {orders.map((order) => {
            const orderTotal = toNumber(order.total ?? order.subtotal ?? 0);
            const subtotal = toNumber(order.subtotal);
            const deliveryFee = toNumber(order.deliveryFee);
            const statusLabel = order.delivery?.status || order.status || DEFAULT_ORDER_STATUS;
            const trackingUrl = order.delivery?.trackingUrl || "";
            const trackingNumber = order.delivery?.trackingNumber || "";
            const deliveryMethod = order.deliveryMethod || "standard_shipping";
            return (
              <div
                key={order.id}
                className={`py-4 border rounded-lg flex flex-col gap-4 px-4 min-w-0 ${borderColor} ${cardBg} transition-colors`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between text-sm">
                  <div className={`min-w-0 ${textColor}`}>
                    <p className="font-semibold text-base">Order #{order.id.slice(-6)}</p>
                    <p className={`${mutedText} text-xs mt-1`}>
                      Placed on {formatOrderDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-3 md:mt-0">
                    <span className="text-xs uppercase tracking-wide px-3 py-1 rounded-full bg-green-500/20 text-green-500">
                      {formatOrderStatusLabel(statusLabel)}
                    </span>
                    <p className="text-sm font-medium">
                      Total: {currency}
                      {orderTotal.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {(order.items || []).map((item, index) => (
                    <div
                      key={`${order.id}-${item.productId}-${item.size}-${index}`}
                      className={`py-3 flex items-center gap-4 border rounded ${borderColor}`}
                    >
                      <img
                        src={item.image || assets.hero_img}
                        alt={item.productName}
                        className="w-16 h-16 object-cover rounded shrink-0"
                      />
                      <div className="flex-1 min-w-0 text-sm">
                        <p className={`font-medium break-words ${textColor}`}>{item.productName}</p>
                        <div className={`flex flex-wrap gap-4 ${mutedText}`}>
                          <span>
                            Qty: <strong>{item.quantity}</strong>
                          </span>
                          {item.size && (
                            <span>
                              Size:{" "}
                              <strong>
                                {item.size === NON_SIZED_KEY ? "One size" : item.size}
                              </strong>
                            </span>
                          )}
                          <span>
                            Price: {currency}
                            {(toNumber(item.pricePerUnit || item.price || 0) * toNumber(item.quantity)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={`text-xs ${mutedText} flex flex-col gap-1`}>
                  <p>
                    Delivery method: <strong>{deliveryMethod.replace(/_/g, " ")}</strong>
                  </p>
                  {trackingNumber && (
                    <p className="break-all">
                      Tracking: <strong>{trackingNumber}</strong>
                    </p>
                  )}
                  {(subtotal > 0 || deliveryFee > 0) && (
                    <p>
                      Items: <strong>{currency}{subtotal.toFixed(2)}</strong>
                      {" · "}
                      Shipping: <strong>{currency}{deliveryFee.toFixed(2)}</strong>
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={!trackingUrl}
                    onClick={() => {
                      if (trackingUrl) {
                        window.open(trackingUrl, "_blank", "noopener,noreferrer");
                      }
                    }}
                    className={`px-4 py-2 text-xs font-medium rounded-sm ${
                      theme === "dark"
                        ? "bg-gray-800 text-white hover:bg-gray-700"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                    } transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {trackingUrl ? "Track Order" : "Tracking Pending"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Orders;
