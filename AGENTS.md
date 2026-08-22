<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Markdown Notes App — Agent Guidelines & Learnings

## 1. UI & Styling Principles
- **No Inline Styles:** Always use SCSS classes and variables in `src/app/globals.scss` or component stylesheets. Avoid `style={{ ... }}` objects.
- **Google Keep Aesthetic (No Glassmorphism):** Adhere strictly to clean, solid, minimalist Google Keep styling. Do not use blur/glass/translucent cards.
- **Consistent Backgrounds & Palette:**
  - **Light Mode:** Body background `#f0f2f5`, cards `#ffffff`, borders `#e0e0e0`.
  - **Dark Mode:** Body background `#202124`, cards and modal `#303134`, borders `#5f6368`.
  - Prevent nested background/border artifacts inside modals (`bg-transparent text-reset` and `border-0`).
- **Bootstrap & EasyMDE Class Collisions:**
  - EasyMDE uses class names that collide with Bootstrap (e.g., `<button class="table">`).
  - Bootstrap's global `.table` rule sets `width: 100%`, breaking toolbar button layouts.
  - Always scope overrides: `.editor-toolbar button.table { width: auto !important; margin-bottom: 0 !important; }`.
- **Markdown Preview Opacity:**
  - The markdown preview container must have an opaque background (`#ffffff` light, `#303134` dark) so raw editor text underneath does not show through.
- **CodeMirror & Flexbox Scrolling:**
  - In full-height flex containers, ensure all intermediate flex containers (`.editor-wrapper`, `EasyMDEContainer`, `CodeMirror`) have `min-height: 0` or `height: 100%` so `CodeMirror-scroll` enables its internal scrollbar when note content is long.

## 2. Note Lifecycle & Modal UX
- **Creation Flow:**
  - Note creation is triggered by the bottom-right **Floating Action Button (FAB)** instead of an inline dashboard input card.
  - New notes open directly in **Edit Mode** with the WYSIWYG editor focused.
- **Viewing & Editing Existing Notes:**
  - Clicking an existing note opens `EditNoteModal` in **Preview Mode** by default (rendered via `react-markdown`).
  - An **Edit button** (pen icon) in the bottom sticky footer of the modal switches the note into the **WYSIWYG Markdown Editor** (`NoteEditor`).
- **Saving & Dismissal:**
  - There is no bottom "Close" button in the editor footer.
  - Dismissal is handled via the top-right close ("X") button or clicking outside the modal.
  - Dismissal in Edit Mode triggers `editorRef.current.saveAndClose()` which saves changes to Firestore before closing.
  - **Empty Notes:** If both title and markdown content are empty (stripping whitespace and markdown syntax via `isContentEmpty`), the note is not saved; if an existing note is emptied, it is deleted.

## 3. Persistence & State Management
- **User Preferences:**
  - Dark mode and Layout view (`grid` vs `list`) are persisted in Firestore under `userPreferences/{uid}` for authenticated users.
- **Note Actions:**
  - Note cards keep actions (Pin, Archive, Trash/Restore, Delete Forever) readily visible and accessible.

