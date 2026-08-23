"use client";

import React, { useState, useMemo } from "react";
import { Modal, Form, Button } from "react-bootstrap";
import manualContent from "@/lib/manualContent.json";

interface HelpModalProps {
    show: boolean;
    onHide: () => void;
}

export default function HelpModal({ show, onHide }: HelpModalProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredContent = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return manualContent;

        return manualContent.filter((section) => {
            const inTitle = section.title.toLowerCase().includes(query);
            const inDesc = section.description.toLowerCase().includes(query);
            const inSteps = section.steps.some(step => step.toLowerCase().includes(query));
            
            return inTitle || inDesc || inSteps;
        });
    }, [searchQuery]);

    return (
        <Modal
            show={show}
            onHide={onHide}
            size="lg"
            centered
            contentClassName="keep-modal border-0 shadow-lg help-modal"
            scrollable
        >
            <Modal.Header className="border-0 pb-0 pt-4 px-4 d-flex flex-column align-items-start">
                <div className="d-flex w-100 justify-content-between align-items-center mb-3">
                    <Modal.Title className="fw-bold d-flex align-items-center gap-2">
                        <span className="material-symbols-outlined fs-4 icon-fill-1 text-primary">help</span>
                        Help & Manual
                    </Modal.Title>
                    <Button
                        variant="link"
                        className="text-muted p-0 text-decoration-none"
                        onClick={onHide}
                        title="Close"
                    >
                        <span className="material-symbols-outlined fs-5">close</span>
                    </Button>
                </div>
                
                <div className="w-100 position-relative mb-2">
                    <span className="material-symbols-outlined position-absolute text-muted pos-search-icon fs-20">
                        search
                    </span>
                    <Form.Control
                        type="text"
                        placeholder="Search for help topics..."
                        className="search-input ps-5 pe-4 py-2 border rounded-pill shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                </div>
            </Modal.Header>

            <Modal.Body className="px-4 py-4">
                {filteredContent.length === 0 ? (
                    <div className="text-center text-muted py-5">
                        <span className="material-symbols-outlined fs-1 mb-2 opacity-50">search_off</span>
                        <p>No help topics found for "{searchQuery}"</p>
                    </div>
                ) : (
                    <div className="d-flex flex-column gap-4">
                        {filteredContent.map((section) => (
                            <section key={section.id} id={section.id} className="help-section">
                                <h5 className="fw-bold mb-2">{section.title}</h5>
                                <p className="text-muted small mb-3">{section.description}</p>
                                <ol className="ps-3 mb-0" style={{ listStyleType: "decimal" }}>
                                    {section.steps.map((step, index) => (
                                        <li key={index} className="mb-2 lh-base">
                                            {step}
                                        </li>
                                    ))}
                                </ol>
                            </section>
                        ))}
                    </div>
                )}
            </Modal.Body>
        </Modal>
    );
}
