import { deleteField, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export const restoreProduct = async (productId) => {
  if (!productId) {
    throw new Error("Product ID is required to restore a product");
  }

  try {
    const productRef = doc(db, "products", productId);
    await updateDoc(productRef, {
      status: "active",
      archivedAt: deleteField(),
      restoredAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error("Error restoring product:", error);
    throw error;
  }
};
