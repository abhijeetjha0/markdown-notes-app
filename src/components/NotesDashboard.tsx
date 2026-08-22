"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/context/AuthContext";
import NoteEditor from "./NoteEditor";
import NoteCard, { Note } from "./NoteCard";
import Masonry from "react-masonry-css";
import { Container, Spinner } from "react-bootstrap";

const breakpointColumnsObj = {
  default: 4,
  1100: 3,
  700: 2,
  500: 1
};

export default function NotesDashboard() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "notes"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Note[];
      setNotes(fetchedNotes);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching notes:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSaveNote = async (title: string, content: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "notes"), {
        title,
        content,
        userId: user.uid,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteDoc(doc(db, "notes", id));
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="secondary" />
      </Container>
    );
  }

  return (
    <Container fluid className="py-4 px-md-5">
      <div className="mb-5">
        <NoteEditor onSave={handleSaveNote} />
      </div>

      {notes.length === 0 ? (
        <div className="text-center text-muted mt-5">
          <h5>No notes yet</h5>
          <p>Your notes will appear here.</p>
        </div>
      ) : (
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="masonry-grid"
          columnClassName="masonry-grid_column"
        >
          {notes.map(note => (
            <NoteCard key={note.id} note={note} onDelete={handleDeleteNote} />
          ))}
        </Masonry>
      )}
    </Container>
  );
}
