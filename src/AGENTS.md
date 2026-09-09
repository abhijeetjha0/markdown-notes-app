# `src` — Source Architecture & Module Map

## Overview
The `src` directory houses the entire application source code for the Markdown Notes App. It divides responsibilities into distinct presentation, state, routing, and backend layers.

## Directory Map

| Directory | Purpose | Detailed Guide |
|---|---|---|
| [`src/app`](./app) | App Router layout, page entry points, and global SCSS tokens | [`src/app/AGENTS.md`](./app/AGENTS.md) |
| [`src/app/actions`](./app/actions) | Next.js Server Actions using Firebase Admin SDK | [`src/app/actions/AGENTS.md`](./app/actions/AGENTS.md) |
| [`src/components`](./components) | Google Keep-styled React UI components and markdown editors | [`src/components/AGENTS.md`](./components/AGENTS.md) |
| [`src/context`](./context) | React Contexts for authentication and persistent theme | [`src/context/AGENTS.md`](./context/AGENTS.md) |
| [`src/lib`](./lib) | Server-side Firebase Admin singleton and user guide content | [`src/lib/AGENTS.md`](./lib/AGENTS.md) |

## Key Shared Files
- **`firebase.ts`**: Client-side Firebase SDK configuration. Initializes Firebase Auth and Firestore with fallbacks to environment variables (`NEXT_PUBLIC_FIREBASE_*`).

## Data Flow & Architecture
```
Client UI (Components)
   │
   ├── Realtime Queries (onSnapshot) ───────────────► Firebase Firestore
   ├── Theme / Layout Preference Saves (setDoc) ────► Firebase Firestore
   │
   └── Note Mutations (create/update/delete/status)
         │
         ▼
     Server Actions (`src/app/actions/notesActions.ts`)
         │ (Token verification + 10MB quota check in transaction)
         ▼
     Firebase Admin SDK (`src/lib/firebaseAdmin.ts`)
         │
         ▼
     Cloud Firestore (`notes`, `userStats`)
```
