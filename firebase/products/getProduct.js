import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

// Fetch a single product from the 'products' collection in Firestore
export const getProduct = async (productId) => {
  try {
    const productRef = doc(db, "products", productId);
    const productSnap = await getDoc(productRef);

    if (productSnap.exists()) {
      return { id: productSnap.id, ...productSnap.data() };
    } else {
      console.log("No such document!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching product:", error);
    throw error;
  }
};
