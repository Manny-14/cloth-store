import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

export const deleteProduct = async (productId) => {
  if (!productId) {
    throw new Error("Product ID is required to delete a product");
  }

  try {
    const productRef = doc(db, "products", productId);
    await deleteDoc(productRef);
    return true;
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
};
