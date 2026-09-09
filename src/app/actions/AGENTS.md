# `src/app/actions` — Agent Guidelines & Architecture

## Overview
The `src/app/actions` directory contains Next.js Server Actions executed on the Node.js server with privileged Firebase Admin SDK access.

## Key Files
- **`notesActions.ts`**: Implements all note mutation operations (`createNoteAction`, `updateNoteAction`, `deleteNoteAction`, `changeNoteStatusAction`, `getUserStatsAction`) and enforces storage quotas.

## Guidelines & Rules

### 1. Mandatory Directives & Security
- Must begin with `"use server"`.
- **Token Verification**: Every action must accept an `idToken: string` as its first parameter and verify it using:
  ```ts
  const decodedToken = await adminAuth.verifyIdToken(idToken);
  const uid = decodedToken.uid;
  ```
  Never rely on unverified client-provided user IDs.

### 2. Storage Quota & Transactions
- **Max Storage Limit**: 10 MB per user (`MAX_STORAGE_BYTES = 10 * 1024 * 1024`).
- Sizing is calculated on raw UTF-8 string bytes: `Buffer.byteLength(content, 'utf8')`.
- All size-altering operations (create, update, delete) MUST execute inside an atomic Firestore transaction (`adminDb.runTransaction`) updating `userStats/{uid}`:
  - If `currentStorage + sizeDelta > MAX_STORAGE_BYTES`, throw `STORAGE_LIMIT_EXCEEDED`.
  - Update `userStats/{uid}` field `storageUsedInBytes` and `updatedAt`.
- Note creation creates the document in `notes/{noteId}` with `createdAt: FieldValue.serverTimestamp()`, `status: "active"`, and `isPinned: false`.

### 3. Error Handling & Return Types
- Actions must return a standardized status object:
  ```ts
  { success: true, noteId?: string } | { success: false, error: string }
  ```
- Catch errors internally and avoid leaking sensitive backend stack traces to the frontend.
