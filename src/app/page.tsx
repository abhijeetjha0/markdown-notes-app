"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Button, Form, Spinner } from "react-bootstrap";
import NotesDashboard from "@/components/NotesDashboard";
import UserMenu from "@/components/UserMenu";
import HelpModal from "@/components/HelpModal";

export type LayoutView = "list" | "grid";

export default function Home() {
    const { user, loading, login } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [searchQuery, setSearchQuery] = useState("");
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [layoutView, setLayoutView] = useState<LayoutView>("list");
    const [showHelpModal, setShowHelpModal] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 768) {
                setSidebarCollapsed(true);
            }
        };
        // Initial check
        handleResize();
        
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        if (!user) return;
        const loadPref = async () => {
            try {
                const prefDoc = await getDoc(doc(db, "userPreferences", user.uid));
                if (prefDoc.exists() && prefDoc.data().layoutView) {
                    setLayoutView(prefDoc.data().layoutView as LayoutView);
                }
            } catch (error) {
                console.error("Error loading layout view:", error);
            }
        };
        loadPref();
    }, [user]);

    const handleToggleLayout = async (newLayout: LayoutView) => {
        setLayoutView(newLayout);
        if (user) {
            try {
                await setDoc(doc(db, "userPreferences", user.uid), { layoutView: newLayout }, { merge: true });
            } catch (error) {
                console.error("Error saving layout view:", error);
            }
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    if (!user) {
        return (
            <>
                <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light position-relative">
                    <Button
                        variant="link"
                        className="position-absolute top-0 end-0 m-4 p-2 text-muted text-decoration-none icon-btn rounded-circle"
                        onClick={() => setShowHelpModal(true)}
                        title="Help"
                    >
                        <span className="material-symbols-outlined fs-4">help</span>
                    </Button>
                    <div className="keep-card text-center p-5 shadow-sm login-card">
                        <h2 className="mb-4">Markdown Notes</h2>
                        <p className="text-muted mb-4">
                            Sign in to sync your notes across devices
                        </p>
                        <Button variant="primary" size="lg" onClick={login}>
                            Sign in with Google
                        </Button>
                    </div>
                </div>
                <HelpModal show={showHelpModal} onHide={() => setShowHelpModal(false)} />
            </>
        );
    }

    return (
        <>
            <header className="keep-header">
                {/* Hamburger */}
                <Button
                    variant="link"
                    className="p-1 me-2 text-muted text-decoration-none icon-btn rounded-circle"
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    aria-label="Toggle sidebar"
                >
                    <span className="material-symbols-outlined">menu</span>
                </Button>

                {/* App Title */}
                <div className="keep-title flex-shrink-0 me-4">
                    <span
                        className="material-symbols-outlined me-2 align-middle fs-28 color-google-yellow icon-fill-1"
                    >
                        markdown
                    </span>
                    <span className="fw-bold fs-5 align-middle keep-title-text">
                        Markdown Notes
                    </span>
                </div>

                {/* Search Bar */}
                <div
                    className="flex-grow-1 mx-3 max-w-720 header-search"
                >
                    <div className="position-relative">
                        <span
                            className="material-symbols-outlined position-absolute text-muted pos-search-icon fs-20"
                        >
                            search
                        </span>
                        <Form.Control
                            type="text"
                            placeholder="Search notes..."
                            className="search-input ps-5 pe-5 border-0 shadow-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <Button
                                variant="link"
                                className="position-absolute text-muted text-decoration-none p-0 pos-search-clear"
                                onClick={() => setSearchQuery("")}
                            >
                                <span
                                    className="material-symbols-outlined fs-20"
                                >
                                    close
                                </span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Right side actions */}
                <div className="d-flex align-items-center gap-2 flex-shrink-0 ms-auto">
                    {/* List / Grid View Toggle */}
                    <Button
                        variant="link"
                        className="p-1 text-muted text-decoration-none icon-btn rounded-circle"
                        onClick={() =>
                            handleToggleLayout(
                                layoutView === "list" ? "grid" : "list"
                            )
                        }
                        title={
                            layoutView === "list"
                                ? "Switch to grid view"
                                : "Switch to list view"
                        }
                    >
                        <span className="material-symbols-outlined">
                            {layoutView === "list"
                                ? "grid_view"
                                : "view_agenda"}
                        </span>
                    </Button>

                    {/* Dark Mode Toggle */}
                    <Button
                        variant="link"
                        className="p-1 text-muted text-decoration-none icon-btn rounded-circle"
                        onClick={toggleTheme}
                        title={
                            theme === "light"
                                ? "Switch to dark mode"
                                : "Switch to light mode"
                        }
                    >
                        <span className="material-symbols-outlined">
                            {theme === "light" ? "dark_mode" : "light_mode"}
                        </span>
                    </Button>

                    {/* Help Button */}
                    <Button
                        variant="link"
                        className="p-1 text-muted text-decoration-none icon-btn rounded-circle"
                        onClick={() => setShowHelpModal(true)}
                        title="Help"
                    >
                        <span className="material-symbols-outlined">help</span>
                    </Button>

                    {/* User Menu */}
                    <UserMenu />
                </div>
            </header>

            <main>
                <NotesDashboard
                    searchQuery={searchQuery}
                    sidebarCollapsed={sidebarCollapsed}
                    setSidebarCollapsed={setSidebarCollapsed}
                    layoutView={layoutView}
                />
            </main>

            <HelpModal show={showHelpModal} onHide={() => setShowHelpModal(false)} />
        </>
    );
}
