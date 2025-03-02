import { updateProfile } from "firebase/auth";
import { auth, db } from "../firebase"
import { doc, updateDoc } from "firebase/firestore";

export const updateDisplayName = async( displayName ) => {
    try {
        const user = auth.currentUser;

        if (!user) {
            throw new Error("User not found")
        }
        await updateProfile(user, { displayName });

        await updateDoc(doc(db, "users", user.uid), {
            displayName
        });
    } catch (error) {
        console.error("Error updating display name:", error.code, error.message);
        throw new Error("Error updating display name");
    }
}