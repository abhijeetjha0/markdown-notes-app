<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Markdown Notes App — Agent Guidelines & Learnings

## Folder-Level Architecture Guides
For specialized rules, design patterns, and gotchas scoped to individual modules, refer to:
- **[`src/AGENTS.md`](./src/AGENTS.md)**: Source tree map and high-level client-server data flow.
- **[`src/app/AGENTS.md`](./src/app/AGENTS.md)**: Next.js App Router, layout, global typography, and SCSS architecture.
- **[`src/app/actions/AGENTS.md`](./src/app/actions/AGENTS.md)**: Server Actions, Firebase token verification, and quota transactions.
- **[`src/components/AGENTS.md`](./src/components/AGENTS.md)**: UI components, Google Keep aesthetic, and markdown editors.
- **[`src/context/AGENTS.md`](./src/context/AGENTS.md)**: React Contexts for authentication and Firestore-backed themes.
- **[`src/lib/AGENTS.md`](./src/lib/AGENTS.md)**: Shared libraries, Firebase Admin singleton, and documentation data.

---

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
- **Markdown Rendering, GFM, Typographer, Emoji, Superscript/Subscript, Inserted/Marked & Syntax Highlighting:**
  - `react-markdown` strictly supports standard CommonMark by default. Always include `remarkPlugins={[[remarkGfm, { singleTilde: false }], [remarkEmoji, { emoticon: true }], remarkTypographer, remarkSupersub, remarkInsMark]}` and `rehypePlugins={[rehypeHighlight]}` so tables (`| col |`), strikethrough (`~~text~~`), task lists, typographer symbols (`(c)` -> `©`, `(r)` -> `®`, `(tm)` -> `™`, `+-` -> `±`, `...` -> `…`, `---` -> `—`, `--` -> `–`), emoji shortcodes (`:wink:` -> 😉, `:laughing:` -> 😆, `:yum:` -> 😋), emoticons (`:-)` -> 😃, `:-(` -> 😦, `8-)` -> 😎, `;)` -> 😉), superscript (`19^th^` -> 19<sup>th</sup>), subscript (`H~2~O` -> H<sub>2</sub>O), inserted text (`++text++` -> `<ins>text</ins>`), marked text (`==text==` -> `<mark>text</mark>`), and code syntax highlighting render correctly. Note that `singleTilde: false` on `remarkGfm` ensures single tildes are dedicated to subscripts without conflicting with double-tilde strikethrough.
  - **Syntax Highlighting**: Fenced code blocks (e.g. ````js`) are automatically highlighted via `rehype-highlight` with tokens styled for both Light (GitHub light palette) and Dark (`[data-bs-theme="dark"]` GitHub dark palette) themes. Code blocks inside `.markdown-preview pre` feature soft recessed backgrounds (`#f6f8fa` light, `#202124` dark) and clean monospace typography with horizontal scroll.
  - Markdown tables in `.markdown-preview` must use `display: block; max-width: 100%; overflow-x: auto;` so wide tables scroll horizontally without breaking masonry or modal layouts.
  - Markdown links (`<a>` tags) in preview mode must open in a new tab via `target="_blank"` and `rel="noopener noreferrer"`. In `NoteCard`, also call `e.stopPropagation()` so clicking a link does not trigger the note modal.
  - **Mermaid Diagram Support**: Code blocks with `language-mermaid` are intercepted and dynamically rendered by `<Mermaid>` (`src/components/Mermaid.tsx`). Diagrams auto-theme (`dark` vs `default`), handle syntax errors gracefully, and are wrapped in `.mermaid-container` with `overflow-x: auto`.
- **Markdown Preview Opacity:**
  - The markdown preview container must have an opaque background (`#ffffff` light, `#303134` dark) so raw editor text underneath does not show through.
- **CodeMirror & Flexbox Scrolling:**
  - In full-height flex containers, ensure all intermediate flex containers (`.editor-wrapper`, `EasyMDEContainer`, `CodeMirror`) have `min-height: 0` or `height: 100%` so `CodeMirror-scroll` enables its internal scrollbar when note content is long.
- **Flexbox Grid Overflow Prevention:**
  - When rendering markdown/code inside a masonry grid, unbroken strings (like `<pre>` blocks) will force the flex container `.content-area` to expand infinitely.
  - To fix this without breaking the responsive sidebar:
    1. The fixed-width `.sidebar-container` must have `flex-shrink: 0`.
    2. The `.content-area` flex container must have `min-width: 0` so it is permitted to shrink below its intrinsic content size, forcing nested content to wrap or scroll (`overflow-x: auto`).

---

## 2. Note Lifecycle & Modal UX
- **Creation Flow:**
  - Note creation is triggered by the bottom-right **Floating Action Button (FAB)** instead of an inline dashboard input card.
  - New notes open directly in **Edit Mode** with the WYSIWYG editor focused.
- **Viewing & Editing Existing Notes:**
  - Clicking an existing note opens `EditNoteModal` in **Preview Mode** by default (rendered via `react-markdown`).
  - An **Edit button** (pen icon) in the bottom sticky footer of the modal switches the note into the **WYSIWYG Markdown Editor** (`NoteEditor`).
- **Saving & Dismissal:**
  - Dismissal via the bottom-right Save FAB (`fab-action-1`) or clicking outside the modal triggers `editorRef.current.saveAndClose()`, saving changes via Server Actions before closing.
  - **Back Button (Discard Changes):** A dedicated Back FAB (`fab-action-3` with `arrow_back` icon) allows exiting without saving. If there are unsaved changes, a confirmation dialog ("Discard changes?") protects against accidental data loss before discarding edits.
  - **Empty Notes:** If both title and markdown content are empty (stripping whitespace and markdown syntax via `isContentEmpty`), the note is not saved; if an existing note is emptied, it is deleted.

---

## 3. Persistence, Quotas & State Management
- **User Preferences:**
  - Dark mode and Layout view (`grid` vs `list`) are persisted in Firestore under `userPreferences/{uid}` for authenticated users.
- **Note Actions:**
  - Note cards keep actions (Pin, Archive, Trash/Restore, Delete Forever) readily visible and accessible.
- **Note Storage (Google Drive Exclusive):**
  - All notes are stored directly as markdown files in the user's Google Drive inside a dedicated "Markdown Notes App" folder.
  - No server actions or Firebase Admin SDK operations are used for note mutations. Everything happens locally via the Google Drive REST API.
  - Since notes are stored on Drive, there is no application-level 10MB quota limit. Users are limited only by their Google account's free space.
- **Lazy Client-Side Background Cleanup (No-Cost TTL):**
  - To avoid requiring a Firebase Blaze billing plan for Cloud Functions or automated TTL policies, expired trashed notes are deleted via the frontend.
  - On mount, `NotesDashboard` silently queries the local `notes` array for any trashed note where `expiresAt` < current time, issuing `deleteNoteAction` commands in the background.
