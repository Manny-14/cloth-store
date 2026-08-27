import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const requiredConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missingConfig = Object.entries(requiredConfig)
    .filter(([, value]) => !String(value || "").trim())
    .map(([key]) => `VITE_FIREBASE_${key.replace(/([A-Z])/g, "_$1").toUpperCase()}`);

if (missingConfig.length) {
    throw new Error(`Missing Firebase configuration: ${missingConfig.join(", ")}`);
}

const firebaseConfig = {
    ...requiredConfig,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

if (firebaseConfig.measurementId) {
    getAnalytics(app);
}

const auth = getAuth();

export { app, auth, db };
