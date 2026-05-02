import { getDocs, collection, query, where } from "firebase/firestore";
import { db } from "../firebase";

// Fetch filtered products from Firestore
// Pass an object with filter fields, e.g. { category: "men", type: "bottomwear" }
export const getFilteredProducts = async (filters = {}) => {
  try {
    let q = collection(db, "products");
    const filterKeys = Object.keys(filters);
    if (filterKeys.length > 0) {
      // Build query with multiple where clauses
      q = query(
        q,
        ...filterKeys.map((key) => where(key, "==", filters[key]))
      );
    }
    const productsSnapshot = await getDocs(q);
    const products = productsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return products;
  } catch (error) {
    console.error("Error fetching filtered products:", error);
    throw error;
  }
};
