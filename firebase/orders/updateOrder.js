import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export const updateOrder = async (orderId, updatedFields) => {
  if (!orderId) {
    throw new Error("orderId is required");
  }

  try {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
      ...updatedFields,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Failed to update order", error);
    throw error;
  }
};
