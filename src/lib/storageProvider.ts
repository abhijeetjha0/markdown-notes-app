import { Note } from "@/components/NoteCard";

export interface StorageProvider {
    /**
     * Subscribe to notes updates.
     * @param userId The user's ID
     * @param onNotesUpdate Callback triggered when notes change
     * @param onError Callback triggered on error
     * @returns A function to unsubscribe from the listener
     */
    subscribeToNotes: (
        userId: string,
        onNotesUpdate: (notes: Note[]) => void,
        onError: (error: any) => void
    ) => () => void;

    /**
     * Save a note (create or update).
     * @param token Authorization token (Firebase ID token or Google Drive OAuth token)
     * @param content The markdown content
     * @param id The note ID (if updating)
     */
    saveNote: (
        token: string,
        content: string,
        id?: string
    ) => Promise<{ success: boolean; error?: string; id?: string }>;

    /**
     * Delete a note.
     * @param token Authorization token
     * @param id The note ID
     */
    deleteNote: (
        token: string,
        id: string
    ) => Promise<{ success: boolean; error?: string }>;

    /**
     * Change note metadata (status, pin).
     * @param token Authorization token
     * @param id The note ID
     * @param updates The fields to update
     */
    changeNoteStatus: (
        token: string,
        id: string,
        updates: { status?: "active" | "archived" | "trashed"; isPinned?: boolean; expiresAt?: string | null }
    ) => Promise<{ success: boolean; error?: string }>;
}
