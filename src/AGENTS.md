# `src` — Source Architecture & Module Map

## Overview
The `src` directory houses the entire application source code for the Markdown Notes App. It divides responsibilities into distinct presentation, state, routing, and backend layers.

## Directory Map

| Directory | Purpose | Detailed Guide |
|---|---|---|
| [`src/app`](./app) | App Router layout, page entry points, and global SCSS tokens | [`src/app/AGENTS.md`](./app/AGENTS.md) |
| [`src/components`](./components) | Google Keep-styled React UI components and markdown editors | [`src/components/AGENTS.md`](./components/AGENTS.md) |
| [`src/context`](./context) | React Contexts for authentication and persistent theme | [`src/context/AGENTS.md`](./context/AGENTS.md) |
| [`src/lib`](./lib) | Google Drive storage provider, documentation data, and other utilities | [`src/lib/AGENTS.md`](./lib/AGENTS.md) |

## Key Shared Files
- **`firebase.ts`**: Client-side Firebase SDK configuration. Initializes Firebase Auth and Firestore for user preferences.

## Data Flow & Architecture
```
Client UI (Components)
   │
   ├── Background Sync ─────────────────────────────► Google Drive API
   ├── Theme / Layout Preference Saves (setDoc) ────► Firebase Firestore
   │
   └── Note Mutations (create/update/delete/status)
         │
         ▼
     Google Drive API (`src/lib/driveStorage.ts`)
         │ 
         ▼
     Google Drive Folder ("Markdown Notes App")
```
