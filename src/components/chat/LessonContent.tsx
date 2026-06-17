"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { PlaygroundShell } from "@/components/agent/PlaygroundShell";
import { markComplete, getCompleted } from "@/lib/progress";
import type { Lesson } from "@/lib/lessons";

interface Props {
  lesson: Lesson;
  concept: string;
  code: string;
  prev: Lesson | null;
  next: Lesson | null;
}

const TABS = [
  { key: "concept", label: "Overview" },
  { key: "code",    label: "Code" },
] as const;

type Tab = "concept" | "code";

export function LessonContent({ lesson, concept, code, prev, next }: Props) {
  const [tab, setTab] = useState<Tab>("concept");
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const isDone = completed.has(lesson.folder);

  useEffect(() => {
    getCompleted().then(setCompleted);
  }, []);

  /* Keyboard navigation: ← prev lesson, → next lesson */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft"  && prev) window.location.href = `/learn/${prev.folder}`;
      if (e.key === "ArrowRight" && next) window.location.href = `/learn/${next.folder}`;
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next]);

  const handleComplete = useCallback(() => {
    markComplete(lesson.folder).then(updated => setCompleted(new Set(updated)));
  }, [lesson.folder]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Tab bar — only longhand border props to avoid React style conflict */}
      <div style={{ display: "flex", padding: "0 26px", borderBottom: "0.5px solid var(--bd)", flexShrink: 0 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              fontSize: "12px",
              padding: "9px 10px",
              cursor: "pointer",
              color: tab === t.key ? "var(--t1)" : "var(--t3)",
              marginBottom: "-0.5px",
              background: "transparent",
              /* Use only longhand border — avoids shorthand/longhand conflict */
              borderTopWidth: 0,
              borderRightWidth: 0,
              borderLeftWidth: 0,
              borderBottomWidth: 1,
              borderBottomStyle: "solid",
              borderBottomColor: tab === t.key ? "var(--t1)" : "transparent",
              letterSpacing: "0.01em",
              fontFamily: "var(--sans)",
              transition: "color 0.1s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 26px" }}>
        {tab === "concept" && (
          <MarkdownRenderer>
            {concept || `## ${lesson.title}\n\n${lesson.desc}\n\nKey concepts: ${lesson.keys.join(", ")}`}
          </MarkdownRenderer>
        )}
        {tab === "code" && (
          <PlaygroundShell
            lesson={lesson}
            baseCode={code || '// No code available'}
            onSave={(code) => {
              // Save logic handled inside PlaygroundShell
              console.log('Save from playground:', code);
            }}
          />
        )}

        {/* Mark complete + nav */}
        <div style={{ marginTop: "28px", paddingTop: "16px", borderTop: "0.5px solid var(--bd)" }}>

          {!isDone ? (
            <button
              onClick={handleComplete}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                fontSize: "12px", padding: "7px 16px", borderRadius: "5px",
                background: "transparent", border: "0.5px solid var(--green2)",
                color: "var(--green)", cursor: "pointer", fontFamily: "var(--sans)",
                marginBottom: "14px",
              }}
            >
              <i className="ti ti-check" style={{ fontSize: "13px" }} aria-hidden />
              Mark as complete
            </button>
          ) : (
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--green)", marginBottom: "14px", padding: "7px 16px", background: "#0a1f0f", border: "0.5px solid var(--green2)", borderRadius: "5px" }}>
              <i className="ti ti-check" style={{ fontSize: "13px" }} aria-hidden />
              Lesson complete
            </div>
          )}

          <div style={{ display: "flex", gap: "7px", flexWrap: "wrap" }}>
            {prev ? (
              <Link href={`/learn/${prev.folder}`} style={{ fontSize: "11.5px", padding: "5px 12px", border: "0.5px solid var(--bd2)", borderRadius: "4px", background: "transparent", color: "var(--t2)", textDecoration: "none" }}>
                ← {prev.title}
              </Link>
            ) : (
              <Link href="/learn" style={{ fontSize: "11.5px", padding: "5px 12px", border: "0.5px solid var(--bd2)", borderRadius: "4px", background: "transparent", color: "var(--t2)", textDecoration: "none" }}>
                ← roadmap
              </Link>
            )}
            {next && (
              <Link href={`/learn/${next.folder}`} style={{ fontSize: "11.5px", padding: "5px 12px", border: "0.5px solid var(--acc)", borderRadius: "4px", background: "var(--acc)", color: "#000", textDecoration: "none" }}>
                {next.title} →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
