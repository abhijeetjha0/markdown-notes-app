# `src/lib` — Agent Guidelines & Architecture

## Overview
The `src/lib` folder provides shared server-side utilities, SDK singletons, and static reference data.

## Key Files
- **`firebaseAdmin.ts`**: Firebase Admin SDK singleton initializer. Exports `adminDb` (Firestore) and `adminAuth` (Authentication).
- **`remarkTypographer.ts`**: Remark plugin that performs automated typographic replacements (`(c)` -> `©`, `(r)` -> `®`, `(tm)` -> `™`, `+-` -> `±`, `...` -> `…`, `---` -> `—`, `--` -> `–`) on AST text nodes.
- **`manualContent.json`**: Structured in-app user guide content consumed by `HelpModal.tsx`.

## Guidelines & Rules

### 1. Firebase Admin SDK Initialization (`firebaseAdmin.ts`)
- **Server-Only Code**: Never import `firebaseAdmin.ts` inside Client Components (`"use client"`). It must only be used in Server Actions (`"use server"`) or Server Components.
- **Dual Credentials Support**:
  - **Option 1**: Full JSON service account key string via `process.env.FIREBASE_SERVICE_ACCOUNT_KEY`.
  - **Option 2**: Individual environment variables: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` (handles `\n` escaping).
- **Singleton Guard**: Check `!getApps().length` before calling `initializeApp` to avoid duplicate app initialization crashes in Next.js Turbopack / HMR environments.

### 2. Static Manual Content (`manualContent.json`)
- Each manual entry follows the schema:
  ```json
  {
    "id": "unique-slug",
    "title": "Topic Title",
    "category": "Editor | Organization | Settings",
    "keywords": ["tag1", "tag2"],
    "content": "Markdown or plain-text explanation"
  }
  ```
- Keep entries searchable with diverse keywords to ensure optimal fuzzy matching in `HelpModal`.
