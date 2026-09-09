# `src/components` — Agent Guidelines & Architecture

## Overview
The `src/components` directory contains client-side React UI components engineered around Google Keep's minimalist design philosophy.

## Key Files
- **`NoteCard.tsx`**: Note presentation card for grid and list views. Renders markdown preview via `<ReactMarkdown remarkPlugins={[remarkGfm]}>`. Always exposes actions (Pin, Archive, Trash/Restore, Delete Forever).
- **`NoteEditor.tsx`**: Dual-mode component with live markdown preview or `react-simplemde-editor` (EasyMDE). Exposes `saveAndClose()` via `forwardRef`/`useImperativeHandle`.
- **`EditNoteModal.tsx`**: Fullscreen modal container for `NoteEditor`. Opens existing notes in preview mode and new notes in edit mode.
- **`NotesDashboard.tsx`**: Core notes view controller. Subscribes to Firestore real-time queries (`onSnapshot`), handles search filtering, view switching (`grid` vs `list`), and client-side cleanup of expired trash notes.
- **`Mermaid.tsx`**: Client-side component that dynamically imports `mermaid` to render flowcharts, sequence diagrams, and architecture graphs. Automatically synchronizes with the active light/dark theme and catches syntax errors gracefully without crashing the UI.
- **`Sidebar.tsx`**: Expandable/collapsible navigation drawer managing tab views (Notes, Archive, Trash) and displaying storage quota usage.
- **`UserMenu.tsx`**: Account avatar dropdown with Google identity details, account switching, and logout.
- **`HelpModal.tsx`**: Accessible in-app documentation modal with real-time keyword search across `manualContent.json`.

## Guidelines & Rules

### 1. Markdown Rendering, GFM, Typographer, Emoji, Superscript/Subscript, Inserted/Marked, Syntax Highlighting & Mermaid
- **Always Pass `remarkPlugins` and `rehypePlugins`**: When using `ReactMarkdown`, always include `remarkPlugins={[[remarkGfm, { singleTilde: false }], [remarkEmoji, { emoticon: true }], remarkTypographer, remarkSupersub, remarkInsMark]}` and `rehypePlugins={[rehypeHighlight]}` so GFM tables, strikethrough, task lists, typographic symbols (`(c)` -> `©`, `(r)` -> `®`, `(tm)` -> `™`, `+-` -> `±`), emoji shortcodes (`:wink:`, `:laughing:`, `:yum:`), emoticons (`:-)`, `:-(`, `8-)`, `;)`), superscript (`19^th^` -> 19<sup>th</sup>), subscript (`H~2~O` -> H<sub>2</sub>O), inserted text (`++text++` -> `<ins>text</ins>`), marked text (`==text==` -> `<mark>text</mark>`), and code block syntax highlighting render accurately.
- **Code Syntax Highlighting**: Fenced code blocks with language identifiers (e.g. ````js`, ````typescript`, ````python`, ````css`) use `rehype-highlight` tokens (`.hljs-*`), styled with harmonious palettes in both light and dark modes. Plain blocks (` ``` ` without language) render as formatted monospace text without guessing.
- **Table & Diagram Responsiveness**: Tables and `.mermaid-container` elements must use `display: block; max-width: 100%; overflow-x: auto;` to prevent breaking grid and modal layouts.
- **External Links in New Tab**: Always supply a custom `a` component to `ReactMarkdown` with `target="_blank"` and `rel="noopener noreferrer"`. In `NoteCard`, call `e.stopPropagation()` so clicking a link does not trigger the note edit modal.
- **Mermaid Diagrams**: In `ReactMarkdown`, intercept code blocks matching `language-mermaid`. Unwrap `<pre>` tags when child is mermaid to avoid outer box styling, and render `<Mermaid chart={code} />`.


### 2. Styling & Google Keep Principles
- **Strictly No Inline Styles**: Do not use `style={{ ... }}` objects. Use utility classes and variables from `src/app/globals.scss`.
- **Google Keep Aesthetic**: Solid, flat cards with subtle shadows. NO glassmorphism, translucency, or heavy backdrop filters.
- **Bootstrap Collision Isolation**:
  - Scoped rule for EasyMDE: `.editor-toolbar button.table { width: auto !important; margin-bottom: 0 !important; }` to prevent Bootstrap's `.table` from expanding toolbar buttons to 100% width.

### 3. Editor Lifecycle & Modal UX
- **Action Buttons**: Floating Action Buttons at the bottom right provide Save & Close (`fab-action-1`), Preview/Edit toggle (`fab-action-2`), and Back/Discard (`fab-action-3`).
- **Discard Flow**: The Back button (`fab-action-3`) exits without saving. If modifications are detected (`hasChanges`), a confirmation dialog prompts to discard or keep editing.
- **Empty Note Handling**: Use `isContentEmpty(text)` to strip formatting and whitespace. If a note is empty on creation, do not save it. If an existing note is emptied, delete it.
