import { StorageProvider } from "./storageProvider";
import { Note } from "@/components/NoteCard";
import matter from "gray-matter";
import { openDB, DBSchema, IDBPDatabase } from "idb";

export interface DriveNote extends Note {
    updatedAt?: number;
}

interface DriveNotesDB extends DBSchema {
    notes: {
        key: string;
        value: DriveNote;
        indexes: {
            "by-userid": string;
            "by-updated": number;
        };
    };
}

let dbPromise: Promise<IDBPDatabase<DriveNotesDB>> | null = null;

function getDB() {
    if (typeof window === "undefined") return null;
    if (!dbPromise) {
        dbPromise = openDB<DriveNotesDB>("drive-notes-db", 1, {
            upgrade(db) {
                const store = db.createObjectStore("notes", { keyPath: "id" });
                store.createIndex("by-userid", "userId");
                store.createIndex("by-updated", "updatedAt");
            },
        });
    }
    return dbPromise;
}

// Drive API Helpers
const DRIVE_API_URL = "https://www.googleapis.com/drive/v3/files";
const UPLOAD_API_URL = "https://www.googleapis.com/upload/drive/v3/files";
const APP_FOLDER_NAME = "Markdown Notes App";

let appFolderId: string | null = null;

async function getOrCreateAppFolder(token: string): Promise<string> {
    if (appFolderId) return appFolderId;
    
    // Check if folder exists
    const q = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${APP_FOLDER_NAME}' and trashed=false`);
    const response = await fetch(`${DRIVE_API_URL}?q=${q}&fields=files(id)`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error("Failed to search for app folder");
    const data = await response.json();
    
    if (data.files && data.files.length > 0) {
        appFolderId = data.files[0].id;
        return appFolderId!;
    }
    
    // Create folder
    const metadata = {
        name: APP_FOLDER_NAME,
        mimeType: "application/vnd.google-apps.folder"
    };
    const createRes = await fetch(DRIVE_API_URL, {
        method: "POST",
        headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(metadata)
    });
    
    if (!createRes.ok) throw new Error("Failed to create app folder");
    const createData = await createRes.json();
    appFolderId = createData.id;
    return appFolderId!;
}

async function fetchDriveFiles(token: string, folderId: string) {
    const q = encodeURIComponent(`'${folderId}' in parents and mimeType='text/markdown' and trashed=false`);
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,modifiedTime)`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
        const errText = await response.text();
        console.error("Drive API fetch failed:", errText);
        throw new Error(`Failed to fetch drive files: ${errText}`);
    }
    return response.json();
}

async function readDriveFile(token: string, fileId: string) {
    const response = await fetch(`${DRIVE_API_URL}/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Failed to read drive file");
    return response.text();
}

async function createDriveFile(token: string, name: string, content: string, folderId: string) {
    const metadata = {
        name,
        mimeType: "text/markdown",
        parents: [folderId]
    };
    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    form.append("file", new Blob([content], { type: "text/markdown" }));

    const response = await fetch(`${UPLOAD_API_URL}?uploadType=multipart`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Create drive file failed: ${errText}`);
    }
    return await response.json();
}

async function updateDriveFile(token: string, fileId: string, content: string) {
    const response = await fetch(`${UPLOAD_API_URL}/${fileId}?uploadType=media`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "text/markdown"
        },
        body: content
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Update drive file failed: ${errText}`);
    }
    return await response.json();
}

async function deleteDriveFileReq(token: string, fileId: string) {
    const response = await fetch(`${DRIVE_API_URL}/${fileId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Delete drive file failed: ${errText}`);
    }
    return true;
}

// Data parser
function parseNoteContent(rawContent: string, fileId: string, userId: string, driveModifiedTime: string): Note {
    const parsed = matter(rawContent);
    const data = parsed.data;
    
    // Parse timestamp safely
    let createdAtValue = data.createdAt;
    if (typeof createdAtValue === 'string') {
        createdAtValue = new Date(createdAtValue);
    } else if (typeof createdAtValue === 'number') {
        createdAtValue = new Date(createdAtValue);
    }

    let expiresAtValue = data.expiresAt;
    if (typeof expiresAtValue === 'string') {
        expiresAtValue = new Date(expiresAtValue);
    } else if (typeof expiresAtValue === 'number') {
        expiresAtValue = new Date(expiresAtValue);
    }

    return {
        id: fileId,
        userId: userId,
        content: parsed.content,
        isPinned: data.isPinned || false,
        status: data.status || "active",
        createdAt: createdAtValue || new Date(driveModifiedTime),
        expiresAt: expiresAtValue || null,
    } as unknown as Note; 
    // Note: Our Firebase app uses Timestamp for dates, so we might need to mock Timestamp or just use JS Dates and fix the UI
}

function stringifyNoteContent(note: Partial<Note>, content: string) {
    const data: any = {
        isPinned: note.isPinned || false,
        status: note.status || "active",
    };
    
    // Convert Timestamps/Dates to ISO strings for YAML
    if (note.createdAt) {
        data.createdAt = (note.createdAt as any).toDate ? (note.createdAt as any).toDate().toISOString() : new Date(note.createdAt as any).toISOString();
    } else {
        data.createdAt = new Date().toISOString();
    }
    
    if (note.expiresAt) {
         data.expiresAt = (note.expiresAt as any).toDate ? (note.expiresAt as any).toDate().toISOString() : new Date(note.expiresAt as any).toISOString();
    }

    return matter.stringify(content, data);
}

// Global active subscriptions
const subscriptions: Record<string, ((notes: Note[]) => void)[]> = {};

async function notifySubscribers(userId: string) {
    const db = await getDB();
    if (!db) return;
    const notes = await db.getAllFromIndex("notes", "by-userid", userId);
    notes.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
        return timeB - timeA;
    });
    const subs = subscriptions[userId] || [];
    subs.forEach(cb => cb(notes));
}

let isSyncing = false;
const syncStatusSubscriptions: ((isSyncing: boolean) => void)[] = [];

function setSyncing(status: boolean) {
    if (isSyncing !== status) {
        isSyncing = status;
        syncStatusSubscriptions.forEach(cb => cb(isSyncing));
    }
}

export function subscribeToSyncStatus(cb: (isSyncing: boolean) => void) {
    syncStatusSubscriptions.push(cb);
    cb(isSyncing); // initial trigger
    return () => {
        const idx = syncStatusSubscriptions.indexOf(cb);
        if (idx > -1) syncStatusSubscriptions.splice(idx, 1);
    };
}
async function syncFromDrive(token: string, userId: string) {
    if (isSyncing || !token) return;
    setSyncing(true);
    try {
        const folderId = await getOrCreateAppFolder(token);
        const data = await fetchDriveFiles(token, folderId);
        const files = data.files || [];
        const db = await getDB();
        if (!db) return;
        
        let hasChanges = false;
        // Basic sync: fetch all file contents that are newer or missing locally
        // In a real app, you'd use Drive Sync Tokens, but this is a naive sync for now
        for (const file of files) {
            const localNote = await db.get("notes", file.id);
            const driveModified = new Date(file.modifiedTime).getTime();
            const localModified = localNote?.updatedAt ? new Date(localNote.updatedAt).getTime() : 0;
            
            if (!localNote || driveModified > localModified) {
                const rawContent = await readDriveFile(token, file.id);
                const note = parseNoteContent(rawContent, file.id, userId, file.modifiedTime);
                await db.put("notes", note);
                hasChanges = true;
            }
        }
        
        // Handle deletions (files in local DB but not in Drive)
        const localNotes = await db.getAllFromIndex("notes", "by-userid", userId);
        const driveIds = new Set(files.map((f: any) => f.id));
        for (const local of localNotes) {
            if (!driveIds.has(local.id)) {
                await db.delete("notes", local.id);
                hasChanges = true;
            }
        }

        if (hasChanges) {
            await notifySubscribers(userId);
        }
    } catch (e) {
        console.error("Drive sync error", e);
    } finally {
        setSyncing(false);
    }
}

export const driveStorage: StorageProvider = {
    subscribeToNotes: (userId, onNotesUpdate, onError) => {
        if (!subscriptions[userId]) {
            subscriptions[userId] = [];
        }
        subscriptions[userId].push(onNotesUpdate);

        // Initial push from IDB
        notifySubscribers(userId).catch(onError);

        // We can't immediately sync without a token here, so the consumer must ensure
        // sync happens when they pass a token to saveNote etc.
        // Wait, how do we trigger sync initially?
        // We will expose a method or assume AuthContext triggers sync

        return () => {
            subscriptions[userId] = subscriptions[userId].filter(cb => cb !== onNotesUpdate);
        };
    },

    saveNote: async (token, content, id) => {
        try {
            const db = await getDB();
            let noteToSave: Partial<DriveNote>;
            let fileId = id;
            const now = new Date();
            
            const activeUserId = Object.keys(subscriptions)[0] || "currentUser";
            
            if (id && db) {
                const existing = await db.get("notes", id);
                noteToSave = {
                    ...existing,
                    content,
                    updatedAt: now.getTime()
                };
            } else {
                noteToSave = {
                    userId: activeUserId,
                    isPinned: false,
                    status: "active",
                    createdAt: now.getTime(),
                    updatedAt: now.getTime(),
                };
            }

            const rawContent = stringifyNoteContent(noteToSave, content);

            if (fileId) {
                // Update
                await updateDriveFile(token, fileId, rawContent);
            } else {
                // Create
                const folderId = await getOrCreateAppFolder(token);
                const fileName = `Note - ${now.toISOString().split('T')[0]}.md`;
                const result = await createDriveFile(token, fileName, rawContent, folderId);
                fileId = result.id;
            }

            // Optimistic local update
            if (db && fileId) {
                await db.put("notes", { ...noteToSave, id: fileId, content, userId: activeUserId } as DriveNote);
                await notifySubscribers(activeUserId);
            }

            // Sync after save to get canonical metadata in background
            syncFromDrive(token, activeUserId);
            
            return { success: true, id: fileId };
        } catch (error: any) {
            return { success: false, error: error.message || "Failed to save note to Google Drive" };
        }
    },

    deleteNote: async (token, id) => {
        try {
            await deleteDriveFileReq(token, id);
            // Optimistic local delete
            const db = await getDB();
            if (db) {
                await db.delete("notes", id);
                // Need userId to notify, assume subscriptions handle it or notify all
                for (const userId in subscriptions) {
                     notifySubscribers(userId);
                }
            }
            return { success: true };
        } catch (error: any) {
             return { success: false, error: error.message || "Failed to delete note from Google Drive" };
        }
    },

    changeNoteStatus: async (token, id, updates) => {
        try {
            const db = await getDB();
            if (!db) return { success: false, error: "IDB not ready" };
            
            const existing = await db.get("notes", id);
            if (!existing) return { success: false, error: "Note not found locally" };
            
            const noteToSave = {
                ...existing,
                ...updates,
                updatedAt: new Date().getTime()
            };
            
            const rawContent = stringifyNoteContent(noteToSave, existing.content);
            
            // Optimistic local update
            await db.put("notes", noteToSave as DriveNote);
            await notifySubscribers(existing.userId);
            
            // Then sync to cloud
            await updateDriveFile(token, id, rawContent);
            syncFromDrive(token, existing.userId); // background sync
            
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message || "Failed to update note status in Google Drive" };
        }
    }
};

export { syncFromDrive };
