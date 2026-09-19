"use client";

import { useState } from "react";
import { Card, Button, OverlayTrigger, Tooltip, Spinner } from "react-bootstrap";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkEmoji from "remark-emoji";
import remarkSupersub from "remark-supersub";
import rehypeHighlight from "rehype-highlight";
import Mermaid from "./Mermaid";
import { remarkTypographer } from "@/lib/remarkTypographer";
import { remarkInsMark } from "@/lib/remarkInsMark";

export interface Note {
    id: string;
    content: string;
    createdAt: number;
    userId: string;
    status?: "active" | "archived" | "trashed";
    isPinned?: boolean;
    expiresAt?: any;
}

export type NoteAction = "pin" | "archive" | "unarchive" | "trash" | "restore" | "delete_forever";

interface NoteCardProps {
    note: Note;
    onEdit?: (note: Note) => void;
    onPin?: (id: string, isPinned: boolean) => Promise<void>;
    onChangeStatus?: (
        id: string,
        status: "active" | "archived" | "trashed",
    ) => Promise<void>;
    onDeleteForever?: (id: string) => Promise<void>;
}

export default function NoteCard({
    note,
    onEdit,
    onPin,
    onChangeStatus,
    onDeleteForever,
}: NoteCardProps) {
    const status = note.status || "active";
    const isPinned = note.isPinned || false;
    const [loadingAction, setLoadingAction] = useState<NoteAction | null>(null);

    const runAction = async (action: NoteAction, fn: () => Promise<void>) => {
        setLoadingAction(action);
        try {
            await fn();
        } catch (err) {
            console.error("Action failed:", err);
        } finally {
            setLoadingAction(null);
        }
    };

    const ActionButton = ({
        icon,
        title,
        onClick,
        iconClass = "fs-20",
        action,
    }: {
        icon: string;
        title: string;
        onClick: (e: React.MouseEvent) => void;
        iconClass?: string;
        action: NoteAction;
    }) => {
        const isLoading = loadingAction === action;
        const isDisabled = loadingAction !== null;

        return (
            <OverlayTrigger
                placement="bottom"
                overlay={<Tooltip id={`tooltip-${title.replace(/\s+/g, "-").toLowerCase()}`}>{title}</Tooltip>}
            >
                <Button
                    variant="link"
                    className="p-1 text-muted text-decoration-none rounded-circle icon-btn"
                    onClick={onClick}
                    aria-label={title}
                    disabled={isDisabled}
                >
                    {isLoading ? (
                        <Spinner animation="border" size="sm" className="text-muted" />
                    ) : (
                        <span className={`material-symbols-outlined ${iconClass}`}>
                            {icon}
                        </span>
                    )}
                </Button>
            </OverlayTrigger>
        );
    };

    return (
        <Card
            className="keep-card position-relative overflow-hidden h-200"
        >
            <Card.Body
                onClick={() => {
                    if (status !== "trashed" && onEdit) onEdit(note);
                }}
                className={`overflow-hidden pb-48 ${status !== "trashed" ? "cursor-pointer" : "cursor-default"}`}
            >
                <div
                    className="markdown-preview text-muted fs-14 break-word"
                >
                    <ReactMarkdown
                        remarkPlugins={[
                            [remarkGfm, { singleTilde: false }],
                            [remarkEmoji, { emoticon: true }],
                            remarkTypographer,
                            remarkSupersub,
                            remarkInsMark,
                        ]}
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                            a: ({ node, ...props }) => (
                                <a
                                    {...props}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ),
                            pre: ({ children, ...props }) => {
                                const child = Array.isArray(children) ? children[0] : children;
                                if (
                                    child &&
                                    typeof child === "object" &&
                                    "props" in child &&
                                    (child.props as { className?: string })?.className?.includes("language-mermaid")
                                ) {
                                    return <>{children}</>;
                                }
                                return <pre {...props}>{children}</pre>;
                            },
                            code: ({ node, className, children, ...props }) => {
                                const match = /language-(\w+)/.exec(className || "");
                                if (match && match[1] === "mermaid") {
                                    const chartText = typeof children === "string"
                                        ? children
                                        : Array.isArray(children)
                                        ? children.map((c) => (typeof c === "string" ? c : "")).join("")
                                        : String(children || "");
                                    return (
                                        <Mermaid
                                            chart={chartText.replace(/\n$/, "")}
                                        />
                                    );
                                }
                                return (
                                    <code className={className} {...props}>
                                        {children}
                                    </code>
                                );
                            },
                        }}
                    >
                        {note.content}
                    </ReactMarkdown>
                </div>
            </Card.Body>

            {/* Bottom action bar — always visible */}
            <div
                className="position-absolute bottom-0 start-0 end-0 px-3 py-2 d-flex align-items-center justify-content-between bg-inherit"
            >
                <div className="d-flex gap-1">
                    {status !== "trashed" && onPin && (
                        <ActionButton
                            icon="push_pin"
                            title={isPinned ? "Unpin" : "Pin"}
                            iconClass={`fs-20 ${isPinned ? "icon-fill-1" : "icon-fill-0"}`}
                            action="pin"
                            onClick={(e) => {
                                e.stopPropagation();
                                runAction("pin", () => onPin(note.id, !isPinned));
                            }}
                        />
                    )}
                </div>

                {/* Right side: Archive / Trash / Restore / Delete */}
                <div className="d-flex gap-1">
                    {status === "trashed" ? (
                        <>
                            {onChangeStatus && (
                                <ActionButton
                                    icon="restore_from_trash"
                                    title="Restore"
                                    action="restore"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        runAction("restore", () => onChangeStatus(note.id, "active"));
                                    }}
                                />
                            )}
                            {onDeleteForever && (
                                <ActionButton
                                    icon="delete_forever"
                                    title="Delete forever"
                                    action="delete_forever"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        runAction("delete_forever", () => onDeleteForever(note.id));
                                    }}
                                />
                            )}
                        </>
                    ) : (
                        <>
                            {onChangeStatus && status === "active" && (
                                <ActionButton
                                    icon="archive"
                                    title="Archive"
                                    action="archive"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        runAction("archive", () => onChangeStatus(note.id, "archived"));
                                    }}
                                />
                            )}
                            {onChangeStatus && status === "archived" && (
                                <ActionButton
                                    icon="unarchive"
                                    title="Unarchive"
                                    action="unarchive"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        runAction("unarchive", () => onChangeStatus(note.id, "active"));
                                    }}
                                />
                            )}
                            {onChangeStatus && (
                                <ActionButton
                                    icon="delete"
                                    title="Trash"
                                    action="trash"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        runAction("trash", () => onChangeStatus(note.id, "trashed"));
                                    }}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </Card>
    );
}
