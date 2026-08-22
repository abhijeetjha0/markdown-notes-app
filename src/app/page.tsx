"use client";

import { useAuth } from "@/context/AuthContext";
import { Button, Container, Spinner } from "react-bootstrap";
import NotesDashboard from "@/components/NotesDashboard";

export default function Home() {
  const { user, loading, login, logout } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
        <div className="keep-card text-center p-5 shadow-sm">
          <h2 className="mb-4">Markdown Notes</h2>
          <p className="text-muted mb-4">Sign in to sync your notes across devices</p>
          <Button variant="primary" size="lg" onClick={login}>
            Sign in with Google
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="keep-header">
        <div className="keep-title flex-grow-1 fw-bold fs-4">Markdown Notes</div>
        <div className="d-flex align-items-center gap-3">
          <span className="text-muted small d-none d-md-inline">{user.email}</span>
          <Button variant="outline-secondary" size="sm" onClick={logout}>
            Sign Out
          </Button>
        </div>
      </header>
      
      <main>
        <NotesDashboard />
      </main>
    </>
  );
}
