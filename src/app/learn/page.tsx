"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { LESSONS, STAGES, STAGE_GROUPS } from "@/lib/lessons";
import { getCompleted } from "@/lib/progress";
import { CircuitBackground } from "@/components/roadmap/CircuitBackground";
import { SocialIcons } from "@/components/shared/SocialIcons";
import { badgeImageForLesson } from "@/lib/badgeAssets";

function NodeCard({ lesson, completed, unlocked, hasBadge }: { lesson: (typeof LESSONS)[0]; completed: boolean; unlocked: boolean; hasBadge: boolean }) {
  const base: React.CSSProperties = {
    width: "88px", flexShrink: 0, border: "0.5px solid var(--bd2)", borderRadius: "6px",
    background: "var(--bg2)", padding: "12px 10px 10px", display: "flex", flexDirection: "column",
    alignItems: "center", gap: "6px", position: "relative",
    opacity: unlocked ? 1 : 0.45,
    cursor: unlocked ? "pointer" : "not-allowed",
    transition: "border-color 0.15s, background 0.15s",
  };

  const inner = (
    <div style={base}>
      {/* Skill badge marker — mastery earned + anchored on-chain (distinct from the plain "done" check) */}
      {hasBadge && (
        <div title="Skill badge earned" style={{ position: "absolute", top: 2, left: 2, width: "18px", height: "18px" }}>
          <Image src={badgeImageForLesson(lesson.num)} alt="" width={18} height={18} />
        </div>
      )}

      {/* State badge */}
      {completed && (
        <div style={{ position: "absolute", top: 5, right: 5, width: "14px", height: "14px", borderRadius: "50%", background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <i className="ti ti-check" style={{ fontSize: "8px", color: "#000" }} aria-hidden />
        </div>
      )}
      {!unlocked && (
        <div style={{ position: "absolute", top: 5, right: 5 }}>
          <i className="ti ti-lock" style={{ fontSize: "10px", color: "var(--t4)" }} aria-hidden />
        </div>
      )}

      <div style={{
        width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
        background: completed ? "#0d2b14" : "var(--bg3)",
        border: `0.5px solid ${completed ? "#1a4a24" : "var(--bd2)"}`,
      }}>
        <i className={`ti ${lesson.icon}`} style={{ fontSize: "15px", color: completed ? "var(--green)" : "var(--t3)" }} aria-hidden />
      </div>
      <div style={{ fontSize: "10px", fontFamily: "var(--mono)", color: completed ? "var(--green)" : "var(--t3)" }}>
        {String(lesson.num).padStart(2, "0")}
      </div>
      <div style={{ fontSize: "10.5px", color: completed ? "var(--green)" : "var(--t2)", textAlign: "center", lineHeight: 1.3 }}>
        {lesson.title}
      </div>
      <div style={{ fontSize: "9px", color: "var(--t4)", fontFamily: "var(--mono)", textAlign: "center", marginTop: "2px" }}>
        {lesson.tag}
      </div>
    </div>
  );

  if (!unlocked) {
    return (
      <div title={`Complete Lesson ${lesson.num - 1} first`} style={{ cursor: "not-allowed" }}>
        {inner}
      </div>
    );
  }

  return <Link href={`/learn/${lesson.folder}`} style={{ textDecoration: "none" }}>{inner}</Link>;
}

function NodeConnector({ done }: { done: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "0 4px", paddingTop: "2px" }}>
      <div style={{ width: "16px", height: "0.5px", background: done ? "#166534" : "var(--bd2)" }} />
      <div style={{ width: 0, height: 0, borderTop: "3px solid transparent", borderBottom: "3px solid transparent", borderLeft: `4px solid ${done ? "#166534" : "var(--bd2)"}` }} />
    </div>
  );
}

export default function BranchPage() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [badges, setBadges] = useState<Set<string>>(new Set());

  useEffect(() => {
    getCompleted().then(setCompleted);
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    if (token) {
      fetch("/api/badges", { headers: { Authorization: `Bearer ${token}` } })
        .then(res => (res.ok ? res.json() : []))
        .then(rows => Array.isArray(rows) && setBadges(new Set(rows.map((r: { lesson_id: string }) => r.lesson_id))))
        .catch(() => {});
    }
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", position: "relative" }}>
      <CircuitBackground />

      {/* Bigger shared nav — z-index above circuit canvas */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", height: "56px", borderBottom: "0.5px solid var(--bd)", background: "rgba(10,10,10,0.85)", backdropFilter: "blur(8px)", flexShrink: 0, position: "relative", zIndex: 10 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
          <Image src="/logo-agent.png" alt="logo" width={28} height={28} style={{ borderRadius: "4px" }} />
          <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--t1)", letterSpacing: "-0.01em" }}>agent</span>
        </Link>
        <div style={{ display: "flex", gap: "28px" }}>
          {[{ href: "/learn", label: "Learn" }, { href: "/agents", label: "My Agents" }, { href: "/marketplace", label: "Marketplace" }, { href: "/missions", label: "Missions" }, { href: "/battle", label: "Battle" }, { href: "/docs", label: "Docs" }].map(l => (
            <Link key={l.href} href={l.href} style={{ fontSize: "13px", fontWeight: 500, color: "var(--t1)", textDecoration: "none" }}>{l.label}</Link>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <SocialIcons />
          <div style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "3px", background: "var(--bg3)", border: "0.5px solid var(--bd2)", color: "var(--t3)", fontFamily: "var(--mono)" }}>
            {completed.size}/14
          </div>
          <div style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "3px", color: "var(--green)", background: "#0a1f0f", border: "0.5px solid #166534", fontFamily: "var(--mono)" }}>
            ● ready
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ padding: "32px 32px 24px", borderBottom: "0.5px solid var(--bd)", position: "relative", zIndex: 1, background: "rgba(10,10,10,0.6)", backdropFilter: "blur(2px)" }}>
        <div style={{ fontSize: "10px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--mono)", marginBottom: "8px" }}>learning path</div>
        <h1 style={{ fontSize: "26px", fontWeight: 500, color: "var(--t1)", letterSpacing: "-0.03em", lineHeight: 1.1 }}>AI agents from scratch</h1>
        <p style={{ fontSize: "13px", color: "var(--t2)", marginTop: "8px", lineHeight: 1.65, maxWidth: "460px" }}>
          14 lessons, 3 stages. Complete each lesson in order to unlock the next.
        </p>
        <div style={{ display: "flex", gap: "16px", marginTop: "14px" }}>
          {[{ icon: "ti-book", val: "14 lessons" }, { icon: "ti-clock", val: "~6 hours" }, { icon: "ti-brand-javascript", val: "Node.js" }, { icon: "ti-cpu", val: "local LLMs" }].map(s => (
            <div key={s.val} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--t3)", fontFamily: "var(--mono)" }}>
              <i className={`ti ${s.icon}`} style={{ fontSize: "13px" }} aria-hidden />
              <span style={{ color: "var(--t2)" }}>{s.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Skill tree */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px", position: "relative", zIndex: 1 }}>
        {STAGES.map(stage => {
          const lessons = STAGE_GROUPS[stage.key as keyof typeof STAGE_GROUPS];
          return (
            <div key={stage.key} style={{ marginBottom: "36px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <span style={{ fontSize: "10px", fontFamily: "var(--mono)", color: "var(--t3)", background: "var(--bg3)", border: "0.5px solid var(--bd2)", padding: "2px 6px", borderRadius: "2px" }}>{stage.num}</span>
                <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--t2)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{stage.label}</span>
                <div style={{ flex: 1, height: "0.5px", background: "var(--bd)" }} />
                <span style={{ fontSize: "10px", color: "var(--t4)", fontFamily: "var(--mono)" }}>
                  {lessons.filter(l => completed.has(l.folder)).length}/{lessons.length} done
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "stretch", flexWrap: "wrap" }}>
                {lessons.map((lesson, i) => {
                  const done = completed.has(lesson.folder);
                  const unlockedFinal = true;

                  return (
                    <div key={lesson.id} style={{ display: "flex", alignItems: "center" }}>
                      <NodeCard lesson={lesson} completed={done} unlocked={unlockedFinal} hasBadge={badges.has(lesson.folder)} />
                      {i < lessons.length - 1 && <NodeConnector done={done && completed.has(lessons[i + 1]?.folder ?? "")} />}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <Link
          href={`/learn/${LESSONS[0].folder}`}
          style={{ marginTop: "24px", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", padding: "8px 18px", borderRadius: "5px", background: "var(--acc)", color: "#000", fontWeight: 500, textDecoration: "none" }}
        >
          <i className="ti ti-player-play" style={{ fontSize: "14px" }} aria-hidden />
          {completed.size > 0 ? "Continue learning" : "Start learning"}
        </Link>
      </div>
    </div>
  );
}
