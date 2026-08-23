"use client";

import { useEffect, useState } from "react";
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    updateDoc,
    Timestamp,
} from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/context/AuthContext";
import NoteEditor from "./NoteEditor";
import NoteCard, { Note } from "./NoteCard";
import { Container, Spinner, Button } from "react-bootstrap";
import Sidebar, { ViewState } from "./Sidebar";
import EditNoteModal from "./EditNoteModal";
import Masonry from "react-masonry-css";
import { LayoutView } from "@/app/page";
import {
    createNoteAction,
    updateNoteAction,
    deleteNoteAction,
    changeNoteStatusAction
} from "@/app/actions/notesActions";

const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 2,
};

interface NotesDashboardProps {
    searchQuery: string;
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;
    layoutView: LayoutView;
}

export default function NotesDashboard({
    searchQuery,
    sidebarCollapsed,
    setSidebarCollapsed,
    layoutView,
}: NotesDashboardProps) {
    const { user } = useAuth();
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentView, setCurrentView] = useState<ViewState>("notes");
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [isCreatingNewNote, setIsCreatingNewNote] = useState(false);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "notes"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc"),
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const fetchedNotes = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Note[];
                setNotes(fetchedNotes);
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching notes:", error);
                setLoading(false);
            },
        );

        return () => unsubscribe();
    }, [user]);

    // Lazy client-side cleanup of expired notes
    useEffect(() => {
        if (!user || notes.length === 0) return;

        const cleanup = async () => {
            const now = new Date();
            const expiredNotes = notes.filter(n =>
                n.status === "trashed" &&
                n.expiresAt &&
                typeof n.expiresAt.toDate === "function" &&
                n.expiresAt.toDate() < now
            );

            if (expiredNotes.length > 0) {
                const token = await user.getIdToken();
                for (const note of expiredNotes) {
                    try {
                        await deleteNoteAction(token, note.id);
                    } catch (error) {
                        console.error("Error cleaning up expired note:", error);
                    }
                }
            }
        };

        cleanup();
    }, [notes, user]);

    const handleSaveNote = async (
        content: string,
        id?: string,
    ) => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            let result;

            if (id) {
                result = await updateNoteAction(token, id, content);
                if (result.success) setEditingNote(null);
            } else {
                result = await createNoteAction(token, content);
            }

            if (!result.success) {
                alert(result.error); // Fallback to alert if toast not set up yet
            }
        } catch (error) {
            console.error("Error saving document: ", error);
        }
    };

    const handlePinNote = async (id: string, isPinned: boolean) => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            await changeNoteStatusAction(token, id, { isPinned });
        } catch (error) {
            console.error("Error pinning document: ", error);
        }
    };

    const handleChangeStatus = async (
        id: string,
        status: "active" | "archived" | "trashed",
    ) => {
        if (!user) return;
        try {
            const updateData: any = { status };
            if (status === "trashed") {
                updateData.isPinned = false;
                // Note: Server Action will serialize this, we should pass Date.now() instead of Timestamp for the API
                updateData.expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
            } else {
                updateData.expiresAt = null;
            }
            const token = await user.getIdToken();
            await changeNoteStatusAction(token, id, updateData);
        } catch (error) {
            console.error("Error changing status: ", error);
        }
    };

    const handleDeleteForever = async (id: string) => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            await deleteNoteAction(token, id);
        } catch (error) {
            console.error("Error deleting document: ", error);
        }
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="secondary" />
            </Container>
        );
    }

    // Calculate total size for UI progress bar
    const totalSizeInBytes = notes.reduce((acc, note) => {
        return acc + new Blob([note.content || ""], { type: "text/plain" }).size;
    }, 0);

    // Filter notes based on current view
    let filteredNotes = notes.filter((note) => {
        const status = note.status || "active";
        if (currentView === "notes") return status === "active";
        if (currentView === "archive") return status === "archived";
        if (currentView === "trash") return status === "trashed";
        return true;
    });

    // Apply search filter — only on active notes (non-archive, non-trash)
    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const activeNotes = notes.filter(
            (n) => (n.status || "active") === "active",
        );
        filteredNotes = activeNotes.filter(
            (note) =>
                note.content.toLowerCase().includes(q),
        );
    }

    const pinnedNotes = filteredNotes.filter((n) => n.isPinned);
    const unpinnedNotes = filteredNotes.filter((n) => !n.isPinned);

    const renderNotesList = (notesList: Note[]) => {
        if (layoutView === "grid") {
            return (
                <Masonry
                    breakpointCols={breakpointColumnsObj}
                    className="masonry-grid"
                    columnClassName="masonry-grid_column"
                >
                    {notesList.map((note) => (
                        <NoteCard
                            key={note.id}
                            note={note}
                            onEdit={setEditingNote}
                            onPin={handlePinNote}
                            onChangeStatus={handleChangeStatus}
                            onDeleteForever={handleDeleteForever}
                        />
                    ))}
                </Masonry>
            );
        }

        return (
            <div
                className="d-flex flex-column gap-2 mx-auto note-list-container"
            >
                {notesList.map((note) => (
                    <NoteCard
                        key={note.id}
                        note={note}
                        onEdit={setEditingNote}
                        onPin={handlePinNote}
                        onChangeStatus={handleChangeStatus}
                        onDeleteForever={handleDeleteForever}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="d-flex min-h-main">
            <Sidebar
                currentView={currentView}
                onViewChange={setCurrentView}
                collapsed={sidebarCollapsed}
                onCloseSidebar={() => {
                    if (typeof window !== "undefined" && window.innerWidth <= 768) {
                        setSidebarCollapsed(true);
                    }
                }}
                totalSizeInBytes={totalSizeInBytes}
            />

            <div className="flex-grow-1 content-area p-4">
                {filteredNotes.length === 0 ? (
                    <div className="text-center text-muted mt-5">
                        <span className="material-symbols-outlined fs-1 mb-3 opacity-50">
                            {searchQuery.trim()
                                ? "search_off"
                                : currentView === "notes"
                                    ? "markdown"
                                    : currentView === "archive"
                                        ? "archive"
                                        : "delete"}
                        </span>
                        <h5>
                            {searchQuery.trim()
                                ? "No matching notes"
                                : "No notes here"}
                        </h5>
                    </div>
                ) : (
                    <>
                        {pinnedNotes.length > 0 && (
                            <div className="mb-4">
                                <div
                                    className={`text-muted small fw-bold mb-3 max-w-600 ${layoutView === "list" ? "ms-auto me-auto" : "ms-4"}`}
                                >
                                    PINNED
                                </div>
                                {renderNotesList(pinnedNotes)}
                            </div>
                        )}

                        {pinnedNotes.length > 0 &&
                            unpinnedNotes.length > 0 && (
                                <div
                                    className={`text-muted small fw-bold mb-3 max-w-600 ${layoutView === "list" ? "ms-auto me-auto" : "ms-4"}`}
                                >
                                    OTHERS
                                </div>
                            )}

                        {unpinnedNotes.length > 0 &&
                            renderNotesList(unpinnedNotes)}
                    </>
                )}
            </div>

            <EditNoteModal
                show={!!editingNote || isCreatingNewNote}
                onHide={() => {
                    setEditingNote(null);
                    setIsCreatingNewNote(false);
                }}
                note={editingNote}
                onSave={handleSaveNote}
                onDelete={handleDeleteForever}
            />

            {/* Floating Action Button */}
            {currentView === "notes" && (
                <Button
                    variant="primary"
                    className="position-fixed rounded-circle shadow-lg d-flex align-items-center justify-content-center p-0 fab-add"
                    onClick={() => setIsCreatingNewNote(true)}
                    title="Add Note"
                >
                    <span className="material-symbols-outlined fs-2">add</span>
                </Button>
            )}
        </div>
    );
}
