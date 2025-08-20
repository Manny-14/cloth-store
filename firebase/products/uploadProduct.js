import { collection, doc, setDoc } from "firebase/firestore"; 
import { db } from "../firebase";

export async function uploadProduct(productData) {
    try {
        // New document reference with auto ID in 'products' collection
        const newProductRef = doc(collection(db, "products"));

        // Add timestamp field
        const productWithTimestamp = {
            ...productData,
            timestamp: new Date().toISOString(),
        };

        await setDoc(newProductRef, productWithTimestamp);

        return newProductRef.id;
    } catch (error) {
        console.error("Error uploading product:", error);
        throw error;
    }
}