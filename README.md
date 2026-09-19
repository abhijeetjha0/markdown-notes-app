# Markdown Notes App

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-brightgreen?style=flat&logo=vercel&logoColor=white)](https://markdown-notes-app-abhijeetjha0.vercel.app/)
[![Code Coverage](https://abhijeetjha0.github.io/markdown-notes-app/coverage/badge.svg)](https://abhijeetjha0.github.io/markdown-notes-app/coverage/)
[![Deploy Firestore Rules](https://github.com/abhijeetjha0/markdown-notes-app/actions/workflows/deploy-firestore-rules.yml/badge.svg)](https://github.com/abhijeetjha0/markdown-notes-app/actions/workflows/deploy-firestore-rules.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

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

### Prerequisites

- **Node.js**: `v24.18.0` (Use [nvm](https://github.com/nvm-sh/nvm): `nvm use`)
- **npm**: `v10+` or `v12+`
- **Firebase Account**: Access to [Firebase Console](https://console.firebase.google.com/)

---

### 1. Firebase Project Setup

1. **Create a Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. **Enable Google Authentication**:
   - Navigate to **Build > Authentication > Sign-in method**.
   - Enable the **Google** provider and configure your support email.
   - Under **Authorized domains**, ensure `localhost` is listed.
3. **Create Cloud Firestore Database**:
   - Navigate to **Build > Firestore Database** and click **Create database**.
   - *Note:* Security rules in [`firestore.rules`](./firestore.rules) are deployed automatically via GitHub Actions (see Step 6).
4. **Create Composite Index**:
   - Firestore requires a composite index to sort notes by creation time for each user.
   - Collection ID: `notes`
   - Fields:
     - `userId` (Ascending)
     - `createdAt` (Descending)
   *(Alternatively, clicking the link in the browser console upon the first query error will automatically configure this index for you).*
5. **Generate Service Account Key (Admin SDK)**:
   - Go to **Project Settings > Service accounts**.
   - Click **Generate new private key** and download the JSON file.
6. **Automate Firestore Rules Deployment (GitHub Actions)**:
   - To enable automatic deployment of your Firestore rules on push, go to your GitHub repository > **Settings** > **Secrets and variables** > **Actions**.
   - Create a new repository secret named `FIREBASE_SERVICE_ACCOUNT_KEY` and paste the contents of your downloaded service account JSON file.

---

### 2. Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
2. Open `.env.local` and configure your credentials:
   - **Client Firebase Config**: Add your web app credentials from Project Settings > General > Your apps.
   - **Admin SDK**: Paste the contents of your downloaded service account JSON file as a single-line string into `FIREBASE_SERVICE_ACCOUNT_KEY`:
     ```env
     FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
     ```

---

### 3. Installation & Run

1. **Switch to required Node version and install dependencies**:
   ```bash
   nvm use
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Open the app**:
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.
