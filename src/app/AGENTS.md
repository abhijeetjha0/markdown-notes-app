# `src/app` — Agent Guidelines & Architecture

## Overview
The `src/app` directory implements the Next.js App Router root layout, dashboard page orchestrator, and global style tokens.

## Key Files
- **`layout.tsx`**: Root HTML document and font definitions (`Geist`, `Geist_Mono`, `Material Symbols Outlined`). Wraps the app in `AuthProvider` and `ThemeProvider`.
- **`page.tsx`**: Main client page managing sidebar open/close state, search queries, layout views (`grid` vs `list`), and note modal interactions.
- **`globals.scss`**: Central SCSS entry point importing Bootstrap and modular style partials.
- **`styles/`**: Modular SCSS partials:
  - `_base.scss`: Reset, typography, body, header, search input.
  - `_layout.scss`: Masonry grid, content area, sidebar, and nav links.
  - `_components.scss`: Keep cards, icon buttons, modals, FABs, and dropdowns.
  - `_utilities.scss`: Utility classes (spacing, dimensions, font sizes, positioning).
  - `_editor.scss`: EasyMDE, CodeMirror overrides, and editor wrapper sizing.
  - `_markdown.scss`: Note preview container, markdown elements, and tables.
  - `_dark.scss`: Comprehensive `[data-bs-theme="dark"]` theme overrides.
  - `_responsive.scss`: Media queries for tablet and mobile viewports.
- **`actions/`**: Server Actions for note mutations and storage quotas (see [`actions/AGENTS.md`](./actions/AGENTS.md)).

## Guidelines & Rules

### 1. Flexbox & Masonry Layout Integrity
- **Sidebar Shrink**: `.sidebar-container` must maintain `flex-shrink: 0` so collapsing and expanding does not distort the dashboard grid.
- **Content Area Constrainment**: `.content-area` must set `min-width: 0` to permit nested flex and masonry containers to shrink below intrinsic content size, avoiding horizontal layout blowout on long code blocks or tables.

### 2. Styling Standards
- Import Bootstrap SCSS at top of `globals.scss`: `@import "bootstrap/scss/bootstrap";`.
- All custom components must use predefined utility classes (`fs-14`, `fs-20`, `keep-card`, `icon-btn`, etc.) rather than inline styles.
- Dark mode styles must be scoped under `[data-bs-theme="dark"]`.

### 3. SEO & Semantics
- Ensure a single `<h1>` element exists per page for clear heading hierarchy.
- Include accessible `aria-label` attributes on icon-only buttons (such as search, theme switch, and action buttons).

### 4. Mobile Header & Expandable Search (Google Keep Pattern)
- On mobile viewports (`≤576px`), the desktop inline search bar is hidden (`d-none d-sm-block`) and replaced by a mobile search icon button (`d-sm-none`) in the header actions.
- Tapping the search icon activates `isSearchExpanded`, which renders `.header-search-expanded` covering the entire sticky header.
- The expanded overlay includes a Back button (`arrow_back`), autofocus text input (`ps-3 pe-5`), and a Clear button (`close`).
- Closing search (via Back arrow or `Escape`) resets `searchQuery` and collapses the overlay.
- Solid background colors (`#ffffff` light, `#202124` dark) prevent underlying header elements from showing through.

