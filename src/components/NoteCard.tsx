"use client";

import { Card, Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import ReactMarkdown from "react-markdown";

export interface Note {
    id: string;
    content: string;
    createdAt: number;
    userId: string;
    status?: "active" | "archived" | "trashed";
    isPinned?: boolean;
    expiresAt?: any;
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

    const ActionButton = ({
        icon,
        title,
        onClick,
        iconClass = "fs-20",
    }: {
        icon: string;
        title: string;
        onClick: (e: React.MouseEvent) => void;
        iconClass?: string;
    }) => (
        <OverlayTrigger
            placement="bottom"
            overlay={<Tooltip id={`tooltip-${title.replace(/\s+/g, "-").toLowerCase()}`}>{title}</Tooltip>}
        >
            <Button
                variant="link"
                className="p-1 text-muted text-decoration-none rounded-circle icon-btn"
                onClick={onClick}
                aria-label={title}
            >
                <span className={`material-symbols-outlined ${iconClass}`}>
                    {icon}
                </span>
            </Button>
        </OverlayTrigger>
    );

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
                    <ReactMarkdown>{note.content}</ReactMarkdown>
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
                            onClick={(e) => {
                                e.stopPropagation();
                                onPin(note.id, !isPinned);
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
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onChangeStatus(note.id, "active");
                                    }}
                                />
                            )}
                            {onDeleteForever && (
                                <ActionButton
                                    icon="delete_forever"
                                    title="Delete forever"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteForever(note.id);
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
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onChangeStatus(note.id, "archived");
                                    }}
                                />
                            )}
                            {onChangeStatus && status === "archived" && (
                                <ActionButton
                                    icon="unarchive"
                                    title="Unarchive"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onChangeStatus(note.id, "active");
                                    }}
                                />
                            )}
                            {onChangeStatus && (
                                <ActionButton
                                    icon="delete"
                                    title="Trash"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onChangeStatus(note.id, "trashed");
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
