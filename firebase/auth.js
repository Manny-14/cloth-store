import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { auth, db } from "./firebase";
import ROLE from "../src/helper/role";
import { doc, setDoc } from "firebase/firestore";

export const doCreateUserWithEmailAndPassword = async (email, password, name) => { // custom function to create user with email and password
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password); // firebase function to create user with email and password
        const user = userCredential.user;

        await updateProfile(user, {displayName : name }); // updates the user's display name in firebase authentication
        
        await setDoc(doc(db, "users", user.uid), {
            displayName : name,
            email : email,
            role : ROLE.GENERAL
        }); // create a new document in the users collection with the user's uid
    } catch (error) {
        if(error.code === "auth/email-already-in-use") {
            throw new Error("An account with this email already exists. Please sign in instead.");
        }
        if(error.code === "auth/weak-password") {
            throw new Error("Please choose a stronger password with at least 6 characters.");
        }
        if(error.code === "auth/invalid-email") {
            throw new Error("Please enter a valid email address.");
        }
        console.error("Error creating user:", error.code, error.message);
        throw new Error("We couldn't create your account right now. Please try again.");
    }
};

export const doSignInWithEmailAndPassword = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        return user;
    } catch (error) {
        console.error("Error signing in user:", error.code, error.message);
        if(error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential"){
            throw new Error("Email or password is incorrect. Please check your details and try again.");
        }
        if(error.code === "auth/invalid-email") {
            throw new Error("Please enter a valid email address.");
        }
        if(error.code === "auth/too-many-requests") {
            throw new Error("Too many sign-in attempts. Please wait a moment and try again.");
        }
        throw new Error("We couldn't sign you in right now. Please try again.");
    }
}

export const signOutUser = async () => {
    signOut(auth).then(() => {
        // Sign-out successful.
    }).catch((error) => {
        console.error("Error signing out user:", error.code, error.message);
    });
}
