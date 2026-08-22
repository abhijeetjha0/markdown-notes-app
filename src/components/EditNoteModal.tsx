"use client";

import { useRef, useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import ReactMarkdown from "react-markdown";
import { Note } from "./NoteCard";
import NoteEditor, { NoteEditorRef } from "./NoteEditor";

interface EditNoteModalProps {
    show: boolean;
    onHide: () => void;
    note: Note | null;
    onSave: (title: string, content: string, id?: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

export default function EditNoteModal({
    show,
    onHide,
    note,
    onSave,
    onDelete,
}: EditNoteModalProps) {
    // If note exists, open in preview mode by default; if new note, open in edit mode
    const [isEditing, setIsEditing] = useState<boolean>(!note);
    const editorRef = useRef<NoteEditorRef>(null);

    useEffect(() => {
        if (show) {
            setIsEditing(!note);
        }
    }, [show, note]);

    const handleHide = async () => {
        if (isEditing && editorRef.current) {
            await editorRef.current.saveAndClose();
        } else {
            onHide();
        }
    };

    return (
        <Modal
            show={show}
            onHide={handleHide}
            fullscreen
            contentClassName="border-0 shadow-lg"
            backdropClassName="opacity-50"
            dialogClassName="edit-note-modal m-0"
        >
            <Modal.Header className="border-0 pb-0" closeButton />
            <Modal.Body className="p-4 pt-0 d-flex flex-column flex-grow-1 overflow-hidden">
                {!isEditing && note ? (
                    <>
                        <div className="note-preview-view flex-grow-1 overflow-y-auto px-2">
                            {note.title && (
                                <h3 className="fw-bold mb-3 break-word">{note.title}</h3>
                            )}
                            <div className="markdown-preview fs-6 text-reset break-word">
                                <ReactMarkdown>{note.content}</ReactMarkdown>
                            </div>
                        </div>

                        {/* Floating Action Button for Edit */}
                        <Button
                            variant="primary"
                            className="position-fixed rounded-circle shadow-lg d-flex align-items-center justify-content-center p-0 fab-edit"
                            onClick={() => setIsEditing(true)}
                            title="Edit Note"
                        >
                            <span className="material-symbols-outlined fs-2">edit</span>
                        </Button>
                    </>
                ) : (
                    <NoteEditor
                        ref={editorRef}
                        key={note?.id || "new"}
                        initialNote={note || undefined}
                        onSave={onSave}
                        onDelete={onDelete}
                        onCancel={onHide}
                        isModal={true}
                    />
                )}
            </Modal.Body>
        </Modal>
    );
}
