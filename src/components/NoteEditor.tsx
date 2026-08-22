"use client";

import { useState, useEffect, useMemo, useCallback, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Button, Card, Spinner } from "react-bootstrap";
import dynamic from "next/dynamic";
import { Note } from "./NoteCard";

const SimpleMdeReact = dynamic(() => import("react-simplemde-editor"), {
    ssr: false,
    loading: () => (
        <div className="text-muted p-2 min-h-100">
            Loading editor...
        </div>
    ),
});

/**
 * Strips markdown syntax and whitespace to check if content is truly empty.
 * Removes: headers (#), bold/italic (*_), code backticks, links, images,
 * blockquotes (>), list markers (- * + 1.), horizontal rules (---),
 * and all remaining whitespace.
 */
function isContentEmpty(text: string): boolean {
    const stripped = text
        .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1") // links & images
        .replace(/^#{1,6}\s*/gm, "") // headings
        .replace(/^>\s?/gm, "") // blockquotes
        .replace(/^[-*+]\s/gm, "") // unordered lists
        .replace(/^\d+\.\s/gm, "") // ordered lists
        .replace(/^[-*_]{3,}$/gm, "") // horizontal rules
        .replace(/\*{1,3}|_{1,3}/g, "") // bold/italic
        .replace(/~{2}/g, "") // strikethrough
        .replace(/`{1,3}[^`]*`{1,3}/g, "") // inline code
        .replace(/```[\s\S]*?```/g, "") // fenced code blocks
        .replace(/\|/g, "") // table pipes
        .trim();
    return stripped.length === 0;
}

interface NoteEditorProps {
    onSave: (title: string, content: string, id?: string) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    initialNote?: Note;
    onCancel?: () => void;
    isModal?: boolean;
}

export interface NoteEditorRef {
    saveAndClose: () => Promise<void>;
}

const NoteEditor = forwardRef<NoteEditorRef, NoteEditorProps>(({
    onSave,
    onDelete,
    initialNote,
    onCancel,
    isModal = false,
}, ref) => {
    const [title, setTitle] = useState(initialNote?.title || "");
    const [content, setContent] = useState(initialNote?.content || "");
    const [saving, setSaving] = useState(false);
    const titleRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
        saveAndClose: handleClose
    }));

    useEffect(() => {
        if (titleRef.current && !initialNote) {
            titleRef.current.focus();
        }
    }, [initialNote]);

    useEffect(() => {
        if (initialNote) {
            setTitle(initialNote.title);
            setContent(initialNote.content);
        }
    }, [initialNote]);

    // Warn on page navigation if modal is open with unsaved changes
    useEffect(() => {
        if (!isModal) return;
        const hasChanges =
            initialNote &&
            (title !== initialNote.title || content !== initialNote.content);

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasChanges) {
                e.preventDefault();
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () =>
            window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isModal, initialNote, title, content]);

    // Auto-save and close — skip empty notes, delete existing ones that become empty
    const handleClose = useCallback(async () => {
        const titleEmpty = isContentEmpty(title);
        const contentEmpty = isContentEmpty(content);
        const noteIsEmpty = titleEmpty && contentEmpty;

        const hasChanges = initialNote
            ? title !== initialNote.title || content !== initialNote.content
            : !noteIsEmpty;

        if (noteIsEmpty && initialNote?.id && onDelete) {
            // Existing note was emptied out — delete it
            setSaving(true);
            await onDelete(initialNote.id);
            setSaving(false);
        } else if (hasChanges && !noteIsEmpty) {
            setSaving(true);
            await onSave(title, content, initialNote?.id);
            setSaving(false);
        }

        if (!isModal && !initialNote) {
            setTitle("");
            setContent("");
        }
        if (onCancel) onCancel();
    }, [title, content, initialNote, isModal, onSave, onCancel, onDelete]);

    const simpleMdeOptions = useMemo(
        () => ({
            spellChecker: false,
            placeholder: "Add Notes...",
            status: false as const,
            toolbar: [
                "bold",
                "italic",
                "heading",
                "|",
                "code",
                "quote",
                "|",
                "unordered-list",
                "ordered-list",
                "table",
                "|",
                "link",
                "image",
                "|",
                "preview",
                "side-by-side",
            ] as EasyMDE.Options["toolbar"],
            minHeight: isModal ? "100%" : "80px",
            maxHeight: isModal ? "100%" : "300px",
            autoDownloadFontAwesome: true,
        }),
        [isModal],
    );
    return (
        <Card
            className={`keep-card mx-auto shadow d-flex flex-column ${isModal ? "border-0 shadow-none mb-0 w-100 h-100 bg-transparent text-reset" : "max-w-600 overflow-visible"}`}
        >
            <Card.Body
                className={`d-flex flex-column ${isModal ? "p-0 pb-2 flex-grow-1 overflow-hidden" : "overflow-visible"}`}
            >
                <Form className={`d-flex flex-column ${isModal ? "flex-grow-1 overflow-hidden" : ""}`}>
                    <Form.Control
                        ref={titleRef}
                        type="text"
                        placeholder="Title"
                        className={`border-0 fw-bold fs-5 shadow-none px-0 mb-2 flex-shrink-0 ${isModal ? "bg-transparent text-reset" : ""}`}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />

                    <div className={`editor-wrapper ${isModal ? "flex-grow-1 overflow-hidden d-flex flex-column" : ""}`}>
                        <SimpleMdeReact
                            value={content}
                            onChange={(val: string) => setContent(val)}
                            options={simpleMdeOptions}
                        />
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
});

export default NoteEditor;
