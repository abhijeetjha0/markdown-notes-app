# Markdown Notes App

Google Keep met with Markdowns that is built with Next.js, React, and Firebase.

## Features

- **Rich Markdown & WYSIWYG Editor**:
  - **Preview Mode by Default**: Open existing notes in formatted Markdown preview with support for headings, lists, tables, code blocks, blockquotes, and links.
  - **Full-Screen WYSIWYG Editor**: Switch to the editor mode with a single click to edit raw Markdown with live syntax highlighting and toolbar formatting.
  - **Smart Auto-Save**: Seamlessly saves changes upon closing the modal. Empty notes are automatically cleaned up.
- **Quick Note Creation**: Bottom-right Floating Action Button (FAB) opens directly into edit mode for immediate note-taking.
- **Real-time Sync**: Notes and state changes sync instantly via Firebase Firestore.
- **Organization & Lifecycle**:
  - **Pin**: Keep important notes fixed at the top of your dashboard.
  - **Archive**: Hide inactive notes from the main dashboard without deleting them.
  - **Trash / Recycle Bin**: Safely discard notes with one-click restore or permanent deletion, featuring an automated background cleanup for notes older than 3 days.
- **Customizable Layout & Theme**:
  - **Grid & List Views**: Toggle between a responsive masonry grid and a single-column list view.
  - **Dark & Light Modes**: Cohesive Google Keep theme palette tailored for both light and dark preferences.
  - **User Preferences Sync**: Theme and layout preferences are automatically persisted in Firestore under `userPreferences/{uid}`.
- **Google Authentication**: Sign in securely with Google Auth.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org) (App Router)
- **UI Library**: React & React Bootstrap
- **Markdown**: React Markdown, EasyMDE & CodeMirror
- **Database & Auth**: Firebase (Firestore & Firebase Auth)
- **Styling**: SCSS (Vanilla SCSS with curated design tokens)
- **Icons**: Google Material Symbols

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
