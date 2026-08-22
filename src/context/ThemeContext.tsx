"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "./AuthContext";

type Theme = "light" | "dark";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>("light");
    const { user } = useAuth();

    // Load preference from Firebase when user logs in
    useEffect(() => {
        if (!user) {
            setTheme("light");
            document.documentElement.setAttribute("data-bs-theme", "light");
            return;
        }

        const loadPreference = async () => {
            try {
                const prefDoc = await getDoc(
                    doc(db, "userPreferences", user.uid),
                );
                if (prefDoc.exists() && prefDoc.data().theme) {
                    const saved = prefDoc.data().theme as Theme;
                    setTheme(saved);
                    document.documentElement.setAttribute(
                        "data-bs-theme",
                        saved,
                    );
                }
            } catch (error) {
                console.error("Error loading theme preference:", error);
            }
        };

        loadPreference();
    }, [user]);

    const toggleTheme = async () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        document.documentElement.setAttribute("data-bs-theme", newTheme);

        if (user) {
            try {
                await setDoc(
                    doc(db, "userPreferences", user.uid),
                    { theme: newTheme },
                    { merge: true },
                );
            } catch (error) {
                console.error("Error saving theme preference:", error);
            }
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
