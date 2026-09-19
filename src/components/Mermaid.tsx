"use client";

import { useEffect, useState, useRef } from "react";
import { useTheme } from "@/context/ThemeContext";

interface MermaidProps {
    chart: string;
}

export default function Mermaid({ chart }: MermaidProps) {
    const [svg, setSvg] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const { theme } = useTheme();
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    useEffect(() => {
        if (!chart || !chart.trim()) {
            setSvg("");
            setError(null);
            return;
        }

        let isCancelled = false;
        const uniqueId = `mermaid_${Math.random().toString(36).substring(2, 9)}`;

        const renderDiagram = async () => {
            try {
                const mermaidModule = await import("mermaid");
                const mermaid = mermaidModule.default;

                mermaid.initialize({
                    startOnLoad: false,
                    theme: theme === "dark" ? "dark" : "default",
                    securityLevel: "loose",
                    fontFamily: "inherit",
                });

                const { svg: renderedSvg } = await mermaid.render(
                    uniqueId,
                    chart.trim(),
                );

                if (!isCancelled && isMounted.current) {
                    setSvg(renderedSvg);
                    setError(null);
                }
            } catch (err: unknown) {
                if (!isCancelled && isMounted.current) {
                    const message =
                        err instanceof Error ? err.message : String(err);
                    setError(message);
                    setSvg("");
                }
                // Clean up any stray error element injected by mermaid into document.body
                const strayEl =
                    document.getElementById(`d${uniqueId}`) ||
                    document.getElementById(uniqueId);
                if (strayEl) {
                    strayEl.remove();
                }
            }
        };

        renderDiagram();

        return () => {
            isCancelled = true;
            const strayEl =
                document.getElementById(`d${uniqueId}`) ||
                document.getElementById(uniqueId);
            if (strayEl) {
                strayEl.remove();
            }
        };
    }, [chart, theme]);

    if (error) {
        return (
            <div className="mermaid-error my-2 p-2 border border-warning rounded">
                <div className="text-warning small fw-bold mb-1 d-flex align-items-center gap-1">
                    <span className="material-symbols-outlined fs-16">
                        warning
                    </span>
                    <span>Mermaid syntax error</span>
                </div>
                <pre className="mb-0 fs-12 text-muted overflow-x-auto">
                    <code>{chart}</code>
                </pre>
            </div>
        );
    }

    if (!chart || !chart.trim()) {
        return null;
    }

    if (!svg) {
        return (
            <div className="mermaid-loading my-2 text-muted fs-12 fst-italic">
                Rendering diagram...
            </div>
        );
    }

    return (
        <div
            className="mermaid-container my-3 d-flex justify-content-center overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
}
