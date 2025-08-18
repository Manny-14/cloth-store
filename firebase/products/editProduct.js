import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

// Update a product in Firestore by ID
export const editProduct = async (productId, updatedFields) => {
  try {
    const productRef = doc(db, "products", productId);
    await updateDoc(productRef, updatedFields);
    return true;
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};
