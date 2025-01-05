import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

export const createEmailAndPasswordUser = async (email, password) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("User created:", user);
        return user;
    } catch (error) {
        console.error("Error creating user:", error.code, error.message);
        throw error; 
    }
};