"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

interface Props { children: string; }

/* Fenced code block with a copy button in the top-right corner. */
function CodeBlock({ children }: { children?: React.ReactNode }) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    const text = ref.current?.innerText ?? "";
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={copy}
        aria-label="Copy code"
        style={{
          position: "absolute", top: "8px", right: "8px", zIndex: 1,
          display: "flex", alignItems: "center", gap: "4px",
          fontSize: "10px", fontFamily: "var(--mono)", color: copied ? "var(--green)" : "var(--t3)",
          background: "var(--bg2)", border: "0.5px solid var(--bd2)", borderRadius: "4px",
          padding: "3px 7px", cursor: "pointer", transition: "color 0.15s, border-color 0.15s",
        }}
      >
        <i className={`ti ${copied ? "ti-check" : "ti-copy"}`} style={{ fontSize: "11px" }} aria-hidden />
        {copied ? "Copied" : "Copy"}
      </button>
      <pre ref={ref}>{children}</pre>
    </div>
  );
}

export function MarkdownRenderer({ children }: Props) {
  return (
    <div className="prose-md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{ pre: CodeBlock }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
