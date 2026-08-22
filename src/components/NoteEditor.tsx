"use client";

import { useState } from "react";
import { Form, Button, Card } from "react-bootstrap";
import ReactMarkdown from "react-markdown";

interface NoteEditorProps {
  onSave: (title: string, content: string) => Promise<void>;
}

export default function NoteEditor({ onSave }: NoteEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) {
      setIsExpanded(false);
      return;
    }
    setLoading(true);
    await onSave(title, content);
    setTitle("");
    setContent("");
    setIsExpanded(false);
    setShowPreview(false);
    setLoading(false);
  };

  if (!isExpanded) {
    return (
      <Card className="keep-card mx-auto shadow-sm" style={{ maxWidth: "600px", cursor: "text" }} onClick={() => setIsExpanded(true)}>
        <Card.Body className="p-3">
          <div className="text-muted">Take a note...</div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="keep-card mx-auto shadow" style={{ maxWidth: "600px" }}>
      <Card.Body>
        <Form>
          <Form.Control
            type="text"
            placeholder="Title"
            className="border-0 fw-bold fs-5 shadow-none px-0 mb-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          
          {showPreview ? (
            <div className="markdown-preview py-2" style={{ minHeight: "100px" }}>
              <ReactMarkdown>{content || "*Nothing to preview*"}</ReactMarkdown>
            </div>
          ) : (
            <Form.Control
              as="textarea"
              placeholder="Take a note (Markdown supported)..."
              className="border-0 shadow-none px-0"
              style={{ resize: "none", overflow: "hidden", minHeight: "100px" }}
              value={content}
              onChange={(e) => {
                e.target.style.height = 'inherit';
                e.target.style.height = `${e.target.scrollHeight}px`; 
                setContent(e.target.value);
              }}
            />
          )}
        </Form>
      </Card.Body>
      <Card.Footer className="bg-white border-0 d-flex justify-content-between">
        <Button variant="light" size="sm" onClick={() => setShowPreview(!showPreview)}>
          {showPreview ? "Edit" : "Preview"}
        </Button>
        <div>
          <Button variant="light" className="me-2" onClick={() => setIsExpanded(false)} disabled={loading}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </Card.Footer>
    </Card>
  );
}
