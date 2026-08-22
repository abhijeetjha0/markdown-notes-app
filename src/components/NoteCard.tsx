"use client";

import { Card, Button } from "react-bootstrap";
import ReactMarkdown from "react-markdown";

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  userId: string;
}

interface NoteCardProps {
  note: Note;
  onDelete: (id: string) => Promise<void>;
}

export default function NoteCard({ note, onDelete }: NoteCardProps) {
  return (
    <Card className="keep-card mb-3 h-100">
      <Card.Body>
        {note.title && <Card.Title className="fw-bold mb-3">{note.title}</Card.Title>}
        <div className="markdown-preview text-muted" style={{ fontSize: "14px", overflowWrap: "break-word" }}>
          <ReactMarkdown>{note.content}</ReactMarkdown>
        </div>
      </Card.Body>
      <div className="px-3 pb-3 d-flex justify-content-end opacity-50" style={{ transition: "opacity 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}>
        <Button variant="light" size="sm" onClick={() => onDelete(note.id)}>
          Delete
        </Button>
      </div>
    </Card>
  );
}
