import { doc, setDoc } from "firebase/firestore"; 
import { db } from "../firebase";

export async function uploadProduct(productData) {
    try {
        await setDoc(doc(db, "products", ))
    } catch (error) {
        
    }
}