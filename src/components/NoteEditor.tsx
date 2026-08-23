"use client";

import { useState, useEffect, useMemo, useCallback, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Button, Card, Spinner } from "react-bootstrap";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
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
    onSave: (content: string, id?: string) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    initialNote?: Note;
    onCancel?: () => void;
    isModal?: boolean;
    defaultPreview?: boolean;
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
    defaultPreview = false,
}, ref) => {
    const [content, setContent] = useState(initialNote ? initialNote.content : "# Title\n\n");
    const [isPreview, setIsPreview] = useState(defaultPreview);
    const [saving, setSaving] = useState(false);

    useImperativeHandle(ref, () => ({
        saveAndClose: handleClose
    }));

    useEffect(() => {
        if (initialNote) {
            setContent(initialNote.content);
        }
    }, [initialNote]);

    // Warn on page navigation if modal is open with unsaved changes
    useEffect(() => {
        if (!isModal) return;
        const hasChanges =
            initialNote &&
            (content !== initialNote.content);

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasChanges) {
                e.preventDefault();
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () =>
            window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isModal, initialNote, content]);

    // Auto-save and close — skip empty notes, delete existing ones that become empty
    const handleClose = useCallback(async () => {
        const contentEmpty = isContentEmpty(content);
        const noteIsEmpty = contentEmpty;

        const hasChanges = initialNote
            ? content !== initialNote.content
            : content !== "# Title\n\n" && !noteIsEmpty;

        if (noteIsEmpty && initialNote?.id && onDelete) {
            // Existing note was emptied out — delete it
            setSaving(true);
            await onDelete(initialNote.id);
            setSaving(false);
        } else if (hasChanges && !noteIsEmpty) {
            setSaving(true);
            await onSave(content, initialNote?.id);
            setSaving(false);
        }

        if (!isModal && !initialNote) {
            setContent("# Title\n\n");
        }
        if (onCancel) onCancel();
    }, [content, initialNote, isModal, onSave, onCancel, onDelete]);

    const simpleMdeOptions = useMemo(
        () => ({
            spellChecker: false,
            placeholder: "Add Notes...",
            status: false as const,
            toolbar: [
                "undo",
                "redo",
                "|",
                "bold",
                "italic",
                "strikethrough",
                "|",
                "heading",
                "|",
                "code",
                "quote",
                "clean-block",
                "|",
                "unordered-list",
                "ordered-list",
                "horizontal-rule",
                "table",
                "|",
                "link",
                "image",
                "|",
                "guide",
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
                    {isPreview ? (
                        <div className="note-preview-view flex-grow-1 overflow-y-auto px-2">
                            <div className="markdown-preview fs-6 text-reset break-word">
                                <ReactMarkdown>{content}</ReactMarkdown>
                            </div>
                        </div>
                    ) : (
                        <div className={`editor-wrapper ${isModal ? "flex-grow-1 overflow-hidden d-flex flex-column" : ""}`}>
                            <SimpleMdeReact
                                value={content}
                                onChange={(val: string) => setContent(val)}
                                options={simpleMdeOptions}
                            />
                        </div>
                    )}
                </Form>
            </Card.Body>

            {isModal && (
                <>
                    {/* Action 1: Save & Close */}
                    <Button
                        variant="primary"
                        className="position-fixed rounded-circle shadow-lg d-flex align-items-center justify-content-center p-0 fab-action-1"
                        onClick={handleClose}
                        title="Save & Close"
                    >
                        <span className="material-symbols-outlined fs-2">save</span>
                    </Button>

                    {/* Action 2: Toggle Preview/Edit */}
                    <Button
                        variant="secondary"
                        className="position-fixed rounded-circle shadow-lg d-flex align-items-center justify-content-center p-0 fab-action-2 bg-white"
                        onClick={() => setIsPreview(!isPreview)}
                        title={isPreview ? "Edit" : "Preview"}
                    >
                        <span className="material-symbols-outlined fs-2">{isPreview ? "edit" : "visibility"}</span>
                    </Button>
                </>
            )}
        </Card>
    );
});

export default NoteEditor;
