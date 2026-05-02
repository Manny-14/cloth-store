import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

export const getAllOrders = async () => {
  try {
    const ordersRef = collection(db, "orders");
    const ordersQuery = query(ordersRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(ordersQuery);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Failed to fetch orders", error);
    throw error;
  }
};
