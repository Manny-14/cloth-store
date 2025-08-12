import { getDocs, collection } from "firebase/firestore";
import { db } from "../firebase";

// Fetch all products from the 'products' collection in Firestore
export const getAllProducts = async () => {
  try {
    const productsCol = collection(db, "products");
    const productsSnapshot = await getDocs(productsCol);
    const products = productsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};
