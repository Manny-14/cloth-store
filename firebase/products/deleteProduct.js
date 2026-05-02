import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export const deleteProduct = async (productId) => {
  if (!productId) {
    throw new Error("Product ID is required to delete a product");
  }

  try {
    const productRef = doc(db, "products", productId);
    await updateDoc(productRef, {
      status: "inactive",
      archivedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
};
