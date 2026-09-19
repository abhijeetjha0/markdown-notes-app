"use client";

import { Nav, ProgressBar } from "react-bootstrap";


export type ViewState = "notes" | "archive" | "trash";

interface SidebarProps {
    currentView: ViewState;
    onViewChange: (view: ViewState) => void;
    collapsed: boolean;
    onCloseSidebar: () => void;
    totalSizeInBytes?: number;
}

export default function Sidebar({
    currentView,
    onViewChange,
    collapsed,
    onCloseSidebar,
    totalSizeInBytes = 0,
}: SidebarProps) {
    const MAX_STORAGE_BYTES = 10 * 1024 * 1024; // 10MB
    const storagePercentage = Math.min((totalSizeInBytes / MAX_STORAGE_BYTES) * 100, 100);
    const storageMB = (totalSizeInBytes / (1024 * 1024)).toFixed(2);
    const maxMB = (MAX_STORAGE_BYTES / (1024 * 1024)).toFixed(0);

    const getVariant = () => {
        if (storagePercentage > 90) return "danger";
        if (storagePercentage > 75) return "warning";
        return "info";
    };

    const items = [
        { id: "notes" as ViewState, icon: "markdown", label: "Notes" },
        { id: "archive" as ViewState, icon: "archive", label: "Archive" },
        { id: "trash" as ViewState, icon: "delete", label: "Trash" },
    ];

    return (
        <>
            <div
                className={`sidebar-backdrop ${!collapsed ? "show" : ""}`}
                onClick={onCloseSidebar}
            />
            <div
                className={`d-flex flex-column pt-3 h-100 sidebar-container sidebar-overlay ${
                    collapsed ? "sidebar-collapsed" : "sidebar-expanded open"
                }`}
            >
                <Nav className="flex-column gap-1">
                    {items.map((item) => (
                        <Nav.Link
                            key={item.id}
                            onClick={() => {
                                onViewChange(item.id);
                                onCloseSidebar();
                            }}
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
                                className={`material-symbols-outlined ${
                                    collapsed ? "" : "me-4"
                                } ${
                                    currentView === item.id
                                        ? "icon-fill-1"
                                        : "icon-fill-0"
                                }`}
                            >
                                {item.icon}
                            </span>
                            {!collapsed && (
                                <span className="fs-6">{item.label}</span>
                            )}
                        </Nav.Link>
                    ))}
                </Nav>

                {!collapsed && (
                    <div className="mt-auto p-4 mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="fs-6 text-muted"><small>Storage</small></span>
                            <span className="fs-6 text-muted"><small>{storageMB} MB / {maxMB} MB</small></span>
                        </div>
                        <ProgressBar 
                            now={storagePercentage} 
                            variant={getVariant()} 
                            style={{ height: "6px" }}
                        />
                    </div>
                )}
            </div>
        </>
    );
}
