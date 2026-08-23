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
