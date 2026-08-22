"use client";

import { useState, useRef, useEffect } from "react";
import { Dropdown } from "react-bootstrap";
import { useAuth } from "@/context/AuthContext";

export default function UserMenu() {
    const { user, logout, switchAccount } = useAuth();
    const [show, setShow] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(e.target as Node)
            ) {
                setShow(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!user) return null;

    return (
        <div className="position-relative" ref={menuRef}>
            <button
                className="btn btn-link p-0 border-0 d-flex align-items-center line-height-0"
                onClick={() => setShow(!show)}
                aria-label="User menu"
            >
                {user.photoURL ? (
                    <img
                        src={user.photoURL}
                        alt={user.displayName || "User"}
                        width={32}
                        height={32}
                        className="rounded-circle"
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <span
                        className="material-symbols-outlined fs-32 color-gray-dark"
                    >
                        account_circle
                    </span>
                )}
            </button>

            {show && (
                <div
                    className="position-absolute end-0 mt-2 bg-white rounded-4 shadow-lg p-4 user-menu-dropdown"
                >
                    <div className="d-flex flex-column align-items-center text-center mb-3">
                        {user.photoURL ? (
                            <img
                                src={user.photoURL}
                                alt={user.displayName || "User"}
                                width={64}
                                height={64}
                                className="rounded-circle mb-2"
                                referrerPolicy="no-referrer"
                            />
                        ) : (
                            <span
                                className="material-symbols-outlined mb-2 fs-64 color-gray-dark"
                            >
                                account_circle
                            </span>
                        )}
                        <div className="fw-bold">
                            {user.displayName || "User"}
                        </div>
                        <div className="text-muted small">{user.email}</div>
                    </div>

                    <hr className="my-2" />

                    <button
                        className="btn btn-outline-secondary w-100 mb-2 d-flex align-items-center justify-content-center gap-2"
                        onClick={() => {
                            setShow(false);
                            switchAccount();
                        }}
                    >
                        <span className="material-symbols-outlined fs-6">
                            switch_account
                        </span>
                        Switch Account
                    </button>

                    <button
                        className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2"
                        onClick={() => {
                            setShow(false);
                            logout();
                        }}
                    >
                        <span className="material-symbols-outlined fs-6">
                            logout
                        </span>
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
}
