import React from "react";
import Title from "../components/Title";
import { ShopContext } from "../context/ShopContext";
import { getAllOrders } from "../../firebase/orders/getAllOrders";
import { assets } from "../assets/assets";

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatDate = (timestamp) => {
  if (!timestamp) return "-";
  try {
    const dateValue =
      typeof timestamp.toDate === "function" ? timestamp.toDate() : new Date(timestamp);
    return dateValue.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
};

const statusOptions = [
  "all",
  "pending-payment",
  "pending-shipment",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const AllOrders = () => {
  const { theme, currency } = React.useContext(ShopContext);
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const fetchOrders = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const results = await getAllOrders();
      setOrders(results);
    } catch (err) {
      console.error("Failed to fetch admin orders", err);
      setError("Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const borderColor = theme === "dark" ? "border-gray-800" : "border-gray-200";
  const cardBg = theme === "dark" ? "bg-gray-900" : "bg-white";
  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-700";
  const mutedText = theme === "dark" ? "text-gray-400" : "text-gray-500";

  const filteredOrders = React.useMemo(() => {
    if (statusFilter === "all") return orders;
    return orders.filter((order) => (order.status || "processing") === statusFilter);
  }, [orders, statusFilter]);

  return (
    <div className="p-4 flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xl">
          <Title text1="ALL" text2="ORDERS" />
          <p className={`text-sm ${mutedText}`}>
            Monitor every order placed across the store.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fetchOrders}
            className={`px-4 py-2 rounded text-sm border ${
              theme === "dark"
                ? "border-gray-700 bg-gray-900 hover:bg-gray-800"
                : "border-gray-300 bg-white hover:bg-gray-100"
            }`}
          >
            Refresh Orders
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="statusFilter" className="font-semibold">
            Filter by status
          </label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`border rounded px-3 py-1 text-sm ${
              theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-white border-gray-300"
            }`}
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "All" : option.replace(/-/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <p className={`text-xs ${mutedText}`}>
          Showing {filteredOrders.length} of {orders.length} orders
        </p>
      </div>

      {loading && <p className="text-sm">Loading orders...</p>}
      {!loading && error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && !error && filteredOrders.length === 0 && (
        <p className="text-sm">No orders found for the selected filter.</p>
      )}

      <div className="flex flex-col gap-4">
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            className={`p-4 border rounded-lg ${borderColor} ${cardBg} flex flex-col gap-3`}
          >
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div>
                <p className={`font-semibold ${textColor}`}>Order #{order.id.slice(-6)}</p>
                <p className={`text-xs ${mutedText}`}>
                  Placed {formatDate(order.createdAt)} by {order.customerName || "Guest"} ({
                    order.userEmail || "unknown"
                  })
                </p>
              </div>
              <div className="flex gap-3 flex-wrap text-sm">
                <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 uppercase text-xs">
                  {order.status || "processing"}
                </span>
                <span className="font-medium">
                  Total: {currency}
                  {toNumber(order.total ?? order.subtotal ?? 0).toFixed(2)}
                </span>
                <span className={mutedText}>Items: {order.itemsCount || order.items?.length || 0}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {(order.items || []).map((item, index) => (
                <div
                  key={`${order.id}-${item.productId}-${item.size}-${index}`}
                  className={`flex items-center gap-3 border rounded p-2 ${borderColor}`}
                >
                  <img
                    src={item.image || assets.hero_img}
                    alt={item.productName}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1 text-sm">
                    <p className={`font-medium ${textColor}`}>{item.productName}</p>
                    <p className={`text-xs ${mutedText}`}>
                      Qty: {item.quantity} · Size: {item.size}
                    </p>
                  </div>
                  <p className={`text-sm font-medium ${textColor}`}>
                    {currency}
                    {(
                      toNumber(item.pricePerUnit || item.price || 0) * toNumber(item.quantity)
                    ).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            {order.shippingAddress && (
              <div className={`text-xs ${mutedText}`}>
                Ship to: {order.shippingAddress.street}, {order.shippingAddress.city},
                {" "}
                {order.shippingAddress.state} {order.shippingAddress.zip}, {" "}
                {order.shippingAddress.country}. Phone: {order.shippingAddress.phone}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllOrders;