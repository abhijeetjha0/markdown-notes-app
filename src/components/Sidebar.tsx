"use client";

import { Nav } from "react-bootstrap";
import React from "react";

export type ViewState = "notes" | "archive" | "trash";

interface SidebarProps {
    currentView: ViewState;
    onViewChange: (view: ViewState) => void;
    collapsed: boolean;
}

export default function Sidebar({
    currentView,
    onViewChange,
    collapsed,
}: SidebarProps) {
    const items = [
        { id: "notes" as ViewState, icon: "lightbulb", label: "Notes" },
        { id: "archive" as ViewState, icon: "archive", label: "Archive" },
        { id: "trash" as ViewState, icon: "delete", label: "Trash" },
    ];

    return (
        <div
            className={`d-flex flex-column pt-3 h-100 sidebar-container ${collapsed ? "sidebar-collapsed" : "sidebar-expanded"}`}
        >
            <Nav className="flex-column gap-1">
                {items.map((item) => (
                    <Nav.Link
                        key={item.id}
                        onClick={() => onViewChange(item.id)}
                        className={`d-flex align-items-center text-dark nav-link-custom ${
                            collapsed
                                ? "rounded-circle mx-auto justify-content-center nav-link-collapsed"
                                : "rounded-end-pill px-4"
                        } py-3 ${
                            currentView === item.id
                                ? "bg-primary text-primary bg-opacity-10 fw-bold"
                                : ""
                        }`}
                        title={collapsed ? item.label : undefined}
                    >
                        <span
                            className={`material-symbols-outlined ${collapsed ? "" : "me-4"} ${currentView === item.id ? "icon-fill-1" : "icon-fill-0"}`}
                        >
                            {item.icon}
                        </span>
                        {!collapsed && (
                            <span className="fs-6">{item.label}</span>
                        )}
                    </Nav.Link>
                ))}
            </Nav>
        </div>
    );
}
