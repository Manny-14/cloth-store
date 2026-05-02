import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export const createOrder = async (orderData) => {
  try {
    const ordersRef = collection(db, "orders");
    const payload = {
      ...orderData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const orderDoc = await addDoc(ordersRef, payload);
    return orderDoc.id;
  } catch (error) {
    console.error("Failed to create order", error);
    throw error;
  }
};
