import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyB1zLQ67MzxcG8cN0oCos2gXf35dfKZv_U",
    authDomain: "cloth-store-12.firebaseapp.com",
    projectId: "cloth-store-12",
    storageBucket: "cloth-store-12.firebasestorage.app",
    messagingSenderId: "32116142917",
    appId: "1:32116142917:web:ef4143efe68db80df4842c",
    measurementId: "G-PX8HQV89W9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const auth = getAuth();

export { app, auth };