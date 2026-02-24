import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export async function getUserRole(userId) {
    try {
        if (!userId) return "GENERAL";

        const docRef = doc(db, "users", userId);
        const user = await getDoc(docRef);

        if (!user.exists()) {
            return "GENERAL";
        }

        return user.data()?.role || "GENERAL";
    } catch (error) {
        console.error("Error getting user role:", error.code, error.message);
        return "GENERAL";
    }
}