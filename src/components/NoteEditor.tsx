"use client";

import { useState, useEffect, useMemo, useCallback, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Button, Card, Spinner, Modal } from "react-bootstrap";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkEmoji from "remark-emoji";
import remarkSupersub from "remark-supersub";
import rehypeHighlight from "rehype-highlight";
import { Note } from "./NoteCard";
import Mermaid from "./Mermaid";
import { remarkTypographer } from "@/lib/remarkTypographer";
import { remarkInsMark } from "@/lib/remarkInsMark";

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
        .replace(/\+{2}/g, "") // ins markers
        .replace(/={2}/g, "") // mark markers
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
    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

    const hasChanges = useMemo(() => {
        if (initialNote) {
            return content !== initialNote.content;
        }
        return content !== "# Title\n\n" && !isContentEmpty(content);
    }, [content, initialNote]);

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

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasChanges) {
                e.preventDefault();
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () =>
            window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isModal, hasChanges]);

    // Back / Discard action
    const handleBackClick = () => {
        if (hasChanges) {
            setShowDiscardConfirm(true);
        } else {
            if (onCancel) onCancel();
        }
    };

    const confirmDiscard = () => {
        setShowDiscardConfirm(false);
        if (!isModal && !initialNote) {
            setContent("# Title\n\n");
        }
        if (onCancel) onCancel();
    };

    // Auto-save and close — skip empty notes, delete existing ones that become empty
    const handleClose = useCallback(async () => {
        const contentEmpty = isContentEmpty(content);
        const noteIsEmpty = contentEmpty;

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
    }, [content, initialNote, isModal, hasChanges, onSave, onCancel, onDelete]);

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
                                    {content}
                                </ReactMarkdown>
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
                        aria-label="Save and close note"
                        disabled={saving}
                    >
                        {saving ? (
                            <Spinner animation="border" size="sm" />
                        ) : (
                            <span className="material-symbols-outlined fs-2">save</span>
                        )}
                    </Button>

                    {/* Action 2: Toggle Preview/Edit */}
                    <Button
                        variant="light"
                        className="position-fixed rounded-circle shadow-lg d-flex align-items-center justify-content-center p-0 fab-action-2"
                        onClick={() => setIsPreview(!isPreview)}
                        title={isPreview ? "Edit" : "Preview"}
                        aria-label={isPreview ? "Edit note" : "Preview note"}
                    >
                        <span className="material-symbols-outlined fs-2">{isPreview ? "edit" : "visibility"}</span>
                    </Button>

                    {/* Action 3: Back (Discard & Exit) */}
                    <Button
                        variant="light"
                        className="position-fixed rounded-circle shadow-lg d-flex align-items-center justify-content-center p-0 fab-action-3"
                        onClick={handleBackClick}
                        title="Back (don't save)"
                        aria-label="Back without saving changes"
                        disabled={saving}
                    >
                        <span className="material-symbols-outlined fs-2">arrow_back</span>
                    </Button>

                    {/* Discard Changes Confirmation Modal */}
                    <Modal
                        show={showDiscardConfirm}
                        onHide={() => setShowDiscardConfirm(false)}
                        centered
                        size="sm"
                        backdrop="static"
                        contentClassName="shadow-lg border-0"
                    >
                        <Modal.Header closeButton className="border-0 pb-0">
                            <Modal.Title className="fs-6 fw-bold">Discard changes?</Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="text-muted pt-2 pb-3">
                            You have unsaved changes. Are you sure you want to discard them and go back?
                        </Modal.Body>
                        <Modal.Footer className="border-0 pt-0 d-flex justify-content-end gap-2">
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => setShowDiscardConfirm(false)}
                            >
                                Keep Editing
                            </Button>
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={confirmDiscard}
                            >
                                Discard
                            </Button>
                        </Modal.Footer>
                    </Modal>
                </>
            )}
        </Card>
    );
});

export default NoteEditor;
