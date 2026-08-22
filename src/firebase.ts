import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyABcgmfp0ij_XhjYQmSxObY8mvZ058Ib5Y",
  authDomain: "markdown-notes-app-36e97.firebaseapp.com",
  projectId: "markdown-notes-app-36e97",
  storageBucket: "markdown-notes-app-36e97.firebasestorage.app",
  messagingSenderId: "960998766770",
  appId: "1:960998766770:web:a0a390c7a3bf107d9331ab"
};

// Initialize Firebase only if it hasn't been initialized already
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
