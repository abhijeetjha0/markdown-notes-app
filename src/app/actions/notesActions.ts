"use server";

import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { FieldValue, Transaction } from "firebase-admin/firestore";

const MAX_STORAGE_BYTES = 10 * 1024 * 1024; // 10MB

// Helper to verify auth and return uid
async function verifyAuth(idToken: string) {
    if (!idToken) throw new Error("Unauthorized: No token provided");
    try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        return decodedToken.uid;
    } catch (error) {
        console.error("Token verification failed", error);
        throw new Error("Unauthorized: Invalid token");
    }
}

export async function createNoteAction(idToken: string, content: string) {
    const uid = await verifyAuth(idToken);
    const newSize = Buffer.byteLength(content, 'utf8');

    const userStatsRef = adminDb.collection("userStats").doc(uid);
    const newNoteRef = adminDb.collection("notes").doc();

    try {
        await adminDb.runTransaction(async (transaction: Transaction) => {
            const statsDoc = await transaction.get(userStatsRef);
            let currentStorage = 0;
            if (statsDoc.exists) {
                currentStorage = statsDoc.data()?.storageUsedInBytes || 0;
            }

            if (currentStorage + newSize > MAX_STORAGE_BYTES) {
                throw new Error("STORAGE_LIMIT_EXCEEDED");
            }

            // Create note
            transaction.set(newNoteRef, {
                content,
                userId: uid,
                createdAt: FieldValue.serverTimestamp(),
                status: "active",
                isPinned: false,
            });

            // Update stats
            transaction.set(userStatsRef, {
                storageUsedInBytes: currentStorage + newSize,
                updatedAt: FieldValue.serverTimestamp(),
            }, { merge: true });
        });
        return { success: true, noteId: newNoteRef.id };
    } catch (error: any) {
        if (error.message === "STORAGE_LIMIT_EXCEEDED") {
            return { success: false, error: "Storage limit exceeded! You can store up to 10MB of notes." };
        }
        console.error("Transaction failed:", error);
        return { success: false, error: "An error occurred while creating the note." };
    }
}

export async function updateNoteAction(idToken: string, noteId: string, newContent: string) {
    const uid = await verifyAuth(idToken);
    const userStatsRef = adminDb.collection("userStats").doc(uid);
    const noteRef = adminDb.collection("notes").doc(noteId);

    try {
        await adminDb.runTransaction(async (transaction: Transaction) => {
            const [statsDoc, noteDoc] = await Promise.all([
                transaction.get(userStatsRef),
                transaction.get(noteRef)
            ]);

            if (!noteDoc.exists) throw new Error("Note not found");
            if (noteDoc.data()?.userId !== uid) throw new Error("Unauthorized access to note");

            let currentStorage = statsDoc.exists ? (statsDoc.data()?.storageUsedInBytes || 0) : 0;
            const oldContent = noteDoc.data()?.content || "";
            
            const oldSize = Buffer.byteLength(oldContent, 'utf8');
            const newSize = Buffer.byteLength(newContent, 'utf8');
            const sizeDifference = newSize - oldSize;

            if (currentStorage + sizeDifference > MAX_STORAGE_BYTES) {
                throw new Error("STORAGE_LIMIT_EXCEEDED");
            }

            transaction.update(noteRef, { content: newContent });
            
            if (sizeDifference !== 0) {
                transaction.set(userStatsRef, {
                    storageUsedInBytes: currentStorage + sizeDifference,
                    updatedAt: FieldValue.serverTimestamp(),
                }, { merge: true });
            }
        });
        return { success: true };
    } catch (error: any) {
        if (error.message === "STORAGE_LIMIT_EXCEEDED") {
            return { success: false, error: "Storage limit exceeded! You can store up to 10MB of notes." };
        }
        console.error("Transaction failed:", error);
        return { success: false, error: "An error occurred while updating the note." };
    }
}

export async function deleteNoteAction(idToken: string, noteId: string) {
    const uid = await verifyAuth(idToken);
    const userStatsRef = adminDb.collection("userStats").doc(uid);
    const noteRef = adminDb.collection("notes").doc(noteId);

    try {
        await adminDb.runTransaction(async (transaction: Transaction) => {
            const [statsDoc, noteDoc] = await Promise.all([
                transaction.get(userStatsRef),
                transaction.get(noteRef)
            ]);

            if (!noteDoc.exists) return; // Already deleted
            if (noteDoc.data()?.userId !== uid) throw new Error("Unauthorized access to note");

            const oldContent = noteDoc.data()?.content || "";
            const oldSize = Buffer.byteLength(oldContent, 'utf8');
            let currentStorage = statsDoc.exists ? (statsDoc.data()?.storageUsedInBytes || 0) : 0;
            
            let newStorage = currentStorage - oldSize;
            if (newStorage < 0) newStorage = 0; // Sanity check

            transaction.delete(noteRef);
            transaction.set(userStatsRef, {
                storageUsedInBytes: newStorage,
                updatedAt: FieldValue.serverTimestamp(),
            }, { merge: true });
        });
        return { success: true };
    } catch (error: any) {
        console.error("Transaction failed:", error);
        return { success: false, error: "An error occurred while deleting the note." };
    }
}

export async function changeNoteStatusAction(idToken: string, noteId: string, updates: any) {
    const uid = await verifyAuth(idToken);
    const noteRef = adminDb.collection("notes").doc(noteId);

    try {
        const docSnap = await noteRef.get();
        if (!docSnap.exists) throw new Error("Note not found");
        if (docSnap.data()?.userId !== uid) throw new Error("Unauthorized access to note");

        // Status updates don't change content size, so no transaction needed for quota
        await noteRef.update(updates);
        return { success: true };
    } catch (error: any) {
        console.error("Status update failed:", error);
        return { success: false, error: "An error occurred while updating the note status." };
    }
}

export async function getUserStorageStatsAction(idToken: string) {
    const uid = await verifyAuth(idToken);
    try {
        const statsDoc = await adminDb.collection("userStats").doc(uid).get();
        return { 
            success: true, 
            storageUsedInBytes: statsDoc.exists ? (statsDoc.data()?.storageUsedInBytes || 0) : 0,
            maxStorageBytes: MAX_STORAGE_BYTES
        };
    } catch (error) {
        return { success: false, error: "Failed to fetch storage stats" };
    }
}
