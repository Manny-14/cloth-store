import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { auth, db } from "./firebase";
import ROLE from "../src/helper/role";
import { doc, setDoc } from "firebase/firestore";

export const doCreateUserWithEmailAndPassword = async (email, password, name) => { // custom function to create user with email and password
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password); // firebase function to create user with email and password
        const user = userCredential.user;

        await updateProfile(user, {displayName : name }); // updates the user's display name in firebase authentication
        // this is different from the user's name in the users collection although they are linked by the same uid
        
        await setDoc(doc(db, "users", user.uid), {
            userName : name,
            email : email,
            role : ROLE.GENERAL
        }); // create a new document in the users collection with the user's uid
    } catch (error) {
        if(error.code === "auth/email-already-in-use") {
            throw new Error("User with this email already exists");
        }
        console.error("Error creating user:", error.code, error.message);
        throw new Error('Error creating user');
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
            throw new Error("User email or password is incorrect");
        }
        throw new Error('Error signing in user');
    }
}

export const signOutUser = async () => {
    signOut(auth).then(() => {
        // Sign-out successful.
    }).catch((error) => {
        console.error("Error signing out user:", error.code, error.message);
    });
}