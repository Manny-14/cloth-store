import { collection, doc, setDoc } from "firebase/firestore"; 
import { db } from "../firebase";

export async function uploadProduct(productData) {
    try {
        // New document reference with auto ID in 'prodcuts' collection
        const newProductRef = doc(collection(db, "products"));

        await setDoc(newProductRef, productData);

        return newProductRef.id;
    } catch (error) {
        console.error("Error uploading product:", error);
        throw error;
    }
}