import { getAllProducts } from "../../firebase/products/getAllProducts";
import { getAllUsers } from "../../firebase/user/getAllUsers";
import { getOrdersByUser } from "../../firebase/orders/getOrdersByUser";
import { getAllOrders } from "../../firebase/orders/getAllOrders";

const CHECKS = (
  currentUserId
) => [
  {
    key: "products",
    label: "Products collection",
    description: "Fetches all products via Firestore",
    run: async () => {
      const products = await getAllProducts();
      return { count: products.length };
    },
  },
  {
    key: "users",
    label: "Users collection",
    description: "Fetches all user documents",
    run: async () => {
      const users = await getAllUsers();
      return { count: users?.length || 0 };
    },
  },
  {
    key: "ordersRead",
    label: "Orders (admin)",
    description: "Reads all orders",
    run: async () => {
      const orders = await getAllOrders();
      return { count: orders.length };
    },
  },
  {
    key: "ordersUser",
    label: "Orders (current user)",
    description: "Reads orders for the logged-in user",
    run: async () => {
      if (!currentUserId) {
        return { skipped: true, reason: "No authenticated user" };
      }
      const orders = await getOrdersByUser(currentUserId);
      return { count: orders.length };
    },
  },
];

export const runBackendHealthChecks = async (currentUserId) => {
  const results = await Promise.all(
    CHECKS(currentUserId).map(async (check) => {
      const startedAt = Date.now();
      try {
        const payload = await check.run();
        return {
          key: check.key,
          label: check.label,
          description: check.description,
          status: "healthy",
          duration: Date.now() - startedAt,
          details: payload,
        };
      } catch (error) {
        return {
          key: check.key,
          label: check.label,
          description: check.description,
          status: "unhealthy",
          duration: Date.now() - startedAt,
          error: error.message || String(error),
        };
      }
    })
  );

  return results;
};
