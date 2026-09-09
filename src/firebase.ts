import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey:
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
        "AIzaSyABcgmfp0ij_XhjYQmSxObY8mvZ058Ib5Y",
    authDomain:
        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
        "markdown-notes-app-36e97.firebaseapp.com",
    projectId:
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
        "markdown-notes-app-36e97",
    storageBucket:
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
        "markdown-notes-app-36e97.firebasestorage.app",
    messagingSenderId:
        process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
        "960998766770",
    appId:
        process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
        "1:960998766770:web:a0a390c7a3bf107d9331ab",
};

// Initialize Firebase only if it hasn't been initialized already
const app =
    getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
