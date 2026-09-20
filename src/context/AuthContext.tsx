"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
    User,
    onAuthStateChanged,
    signInWithPopup,
    signOut,
    GoogleAuthProvider
} from "firebase/auth";
import { auth, googleProvider } from "@/firebase";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: () => Promise<void>;
    logout: () => Promise<void>;
    switchAccount: () => Promise<void>;
    driveToken: string | null;
    getFreshDriveToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [driveToken, setDriveToken] = useState<string | null>(null);

    // Initialize google provider with Drive scope
    useEffect(() => {
        googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (!currentUser) {
                setDriveToken(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const getFreshDriveToken = async () => {
        if (!user) return null;
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            if (credential?.accessToken) {
                setDriveToken(credential.accessToken);
                return credential.accessToken;
            }
        } catch (e) {
            console.error("Failed to get drive permissions", e);
        }
        return null;
    };

    const login = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            if (credential?.accessToken) {
                setDriveToken(credential.accessToken);
            }
        } catch (error) {
            console.error("Error signing in with Google", error);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setDriveToken(null);
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    const switchAccount = async () => {
        try {
            await signOut(auth);
            googleProvider.setCustomParameters({
                prompt: "select_account",
            });
            const result = await signInWithPopup(auth, googleProvider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            if (credential?.accessToken) {
                setDriveToken(credential.accessToken);
            }
        } catch (error) {
            console.error("Error switching account", error);
        }
    };

    return (
        <AuthContext.Provider
            value={{ 
                user, 
                loading, 
                login, 
                logout, 
                switchAccount, 
                driveToken, 
                getFreshDriveToken
            }}
        >
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
