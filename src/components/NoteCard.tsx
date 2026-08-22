"use client";

import { Card, Button } from "react-bootstrap";
import ReactMarkdown from "react-markdown";

export interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: number;
    userId: string;
    status?: "active" | "archived" | "trashed";
    isPinned?: boolean;
    expiresAt?: number;
}

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

    return (
        <Card
            className="keep-card mb-0 position-relative overflow-hidden h-200"
        >
            <Card.Body
                onClick={() => {
                    if (status !== "trashed" && onEdit) onEdit(note);
                }}
                className={`overflow-hidden pb-48 ${status !== "trashed" ? "cursor-pointer" : "cursor-default"}`}
            >
                {note.title && (
                    <Card.Title className="fw-bold mb-3 pe-4 text-truncate">
                        {note.title}
                    </Card.Title>
                )}
                <div
                    className="markdown-preview text-muted fs-14 break-word"
                >
                    <ReactMarkdown>{note.content}</ReactMarkdown>
                </div>
            </Card.Body>

            {/* Bottom action bar — always visible */}
            <div
                className="position-absolute bottom-0 start-0 end-0 px-3 py-2 d-flex align-items-center justify-content-between bg-inherit"
            >
                {/* Left side: Pin */}
                <div className="d-flex gap-1">
                    {status !== "trashed" && onPin && (
                        <Button
                            variant="link"
                            className="p-1 text-muted text-decoration-none rounded-circle icon-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                onPin(note.id, !isPinned);
                            }}
                            title={isPinned ? "Unpin" : "Pin"}
                        >
                            <span
                                className={`material-symbols-outlined fs-20 ${isPinned ? "icon-fill-1" : "icon-fill-0"}`}
                            >
                                push_pin
                            </span>
                        </Button>
                    )}
                </div>

                {/* Right side: Archive / Trash / Restore / Delete */}
                <div className="d-flex gap-1">
                    {status === "trashed" ? (
                        <>
                            {onChangeStatus && (
                                <Button
                                    variant="link"
                                    className="p-1 text-muted text-decoration-none rounded-circle icon-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onChangeStatus(note.id, "active");
                                    }}
                                    title="Restore"
                                >
                                    <span
                                        className="material-symbols-outlined fs-20"
                                    >
                                        restore_from_trash
                                    </span>
                                </Button>
                            )}
                            {onDeleteForever && (
                                <Button
                                    variant="link"
                                    className="p-1 text-muted text-decoration-none rounded-circle icon-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteForever(note.id);
                                    }}
                                    title="Delete forever"
                                >
                                    <span
                                        className="material-symbols-outlined fs-20"
                                    >
                                        delete_forever
                                    </span>
                                </Button>
                            )}
                        </>
                    ) : (
                        <>
                            {onChangeStatus && status === "active" && (
                                <Button
                                    variant="link"
                                    className="p-1 text-muted text-decoration-none rounded-circle icon-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onChangeStatus(note.id, "archived");
                                    }}
                                    title="Archive"
                                >
                                    <span
                                        className="material-symbols-outlined fs-20"
                                    >
                                        archive
                                    </span>
                                </Button>
                            )}
                            {onChangeStatus && status === "archived" && (
                                <Button
                                    variant="link"
                                    className="p-1 text-muted text-decoration-none rounded-circle icon-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onChangeStatus(note.id, "active");
                                    }}
                                    title="Unarchive"
                                >
                                    <span
                                        className="material-symbols-outlined fs-20"
                                    >
                                        unarchive
                                    </span>
                                </Button>
                            )}
                            {onChangeStatus && (
                                <Button
                                    variant="link"
                                    className="p-1 text-muted text-decoration-none rounded-circle icon-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onChangeStatus(note.id, "trashed");
                                    }}
                                    title="Trash"
                                >
                                    <span
                                        className="material-symbols-outlined fs-20"
                                    >
                                        delete
                                    </span>
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </Card>
    );
}
