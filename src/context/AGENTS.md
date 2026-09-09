# `src/context` — Agent Guidelines & Architecture

## Overview
The `src/context` folder contains React Context providers managing global application state: Authentication and UI Theme.

## Key Files
- **`AuthContext.tsx`**: Manages Firebase client authentication state (`User | null`, `loading`), providing `login()`, `logout()`, and `switchAccount()` methods.
- **`ThemeContext.tsx`**: Manages light/dark theme toggles, updates HTML attribute `data-bs-theme`, and persists preferences in Firestore.

## Guidelines & Rules

### 1. Authentication Lifecycle (`AuthContext.tsx`)
- Must use `"use client"`.
- Uses `onAuthStateChanged(auth, ...)` to maintain user session.
- `switchAccount()` forces Google prompt:
  ```ts
  googleProvider.setCustomParameters({ prompt: "select_account" });
  ```
- Always export a type-safe hook (`useAuth()`) that asserts the context is defined.

### 2. Theme Persistence (`ThemeContext.tsx`)
- Coordinates between React state and the DOM:
  - Updates `document.documentElement.setAttribute("data-bs-theme", theme)`.
  - On user login, asynchronously reads `userPreferences/{uid}` from Firestore to restore the saved theme.
  - When toggling theme, optimistically updates the DOM and local state, then writes to `userPreferences/{uid}` with `{ merge: true }`.
- Always defaults to `"light"` if unauthenticated or when initial document loads.
