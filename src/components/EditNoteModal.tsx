"use client";

import { useRef, useEffect } from "react";
import { Modal } from "react-bootstrap";
import { Note } from "./NoteCard";
import NoteEditor, { NoteEditorRef } from "./NoteEditor";

interface EditNoteModalProps {
    show: boolean;
    onHide: () => void;
    note: Note | null;
    onSave: (content: string, id?: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

export default function EditNoteModal({
    show,
    onHide,
    note,
    onSave,
    onDelete,
}: EditNoteModalProps) {
    const editorRef = useRef<NoteEditorRef>(null);
    const scrollYRef = useRef(0);

    // Save/restore scroll position to counteract body position:fixed scroll lock
    useEffect(() => {
        if (show) {
            scrollYRef.current = window.scrollY;
            document.body.style.top = `-${scrollYRef.current}px`;
        } else {
            document.body.style.top = "";
            window.scrollTo(0, scrollYRef.current);
        }
    }, [show]);

    const handleHide = async () => {
        if (editorRef.current) {
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
            <Modal.Body className="p-3 p-md-4 d-flex flex-column flex-grow-1 overflow-hidden">
                <NoteEditor
                    ref={editorRef}
                    key={note?.id || "new"}
                    initialNote={note || undefined}
                    defaultPreview={!!note}
                    onSave={onSave}
                    onDelete={onDelete}
                    onCancel={onHide}
                    isModal={true}
                />
            </Modal.Body>
        </Modal>
    );
}

