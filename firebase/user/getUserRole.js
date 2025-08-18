import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export async function getUserRole(userId) {
    console.log("Hi")
    try {
        const docRef = doc(db, "users", userId);
        const user = await getDoc(docRef);

        return user.data().role;
    } catch (error) {
        console.error("Error getting user role:", error.code, error.message);
    }
}