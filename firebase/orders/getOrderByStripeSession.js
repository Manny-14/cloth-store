import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "../firebase";

export const getOrderByStripeSession = async (stripeSessionId) => {
  if (!stripeSessionId) return null;

  try {
    const ordersRef = collection(db, "orders");
    const orderQuery = query(
      ordersRef,
      where("stripeSessionId", "==", stripeSessionId),
      limit(1)
    );

    const snapshot = await getDocs(orderQuery);
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error("Failed to fetch order by stripe session", error);
    throw error;
  }
};
