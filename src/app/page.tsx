"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { ParticleField } from "@/components/landing/ParticleField";
import { SocialIcons } from "@/components/shared/SocialIcons";
import { WalletButton } from "@/components/auth/WalletButton";
import { LESSONS, STAGES, STAGE_GROUPS } from "@/lib/lessons";

const CA = "A4qQ4Rk42S4smtxD2fGGSFLxsoMPykDtQJXuioTMpump";

function CACopy() {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(CA);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      title={CA}
      style={{ display: "flex", alignItems: "center", gap: "5px", background: "var(--bg2)", border: "0.5px solid var(--bd2)", borderRadius: "4px", padding: "3px 8px", cursor: "pointer", transition: "border-color 0.15s" }}
    >
      <span style={{ fontSize: "9px", color: "var(--t4)", fontFamily: "var(--mono)", letterSpacing: "0.02em" }}>CA</span>
      <span style={{ fontSize: "9px", color: "var(--t3)", fontFamily: "var(--mono)" }}>
        {CA.slice(0, 12)}…{CA.slice(-8)}
      </span>
      <i className={`ti ${copied ? "ti-check" : "ti-copy"}`} style={{ fontSize: "9px", color: copied ? "var(--green)" : "var(--t4)" }} aria-hidden />
    </button>
  );
}

/* ── helpers ─────────────────────────────────────────────────── */
function useCountUp(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const tick = () => {
      start = Math.min(start + step, target);
      setCount(Math.round(start));
      if (start < target) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target, duration]);

  return { ref, count };
}

const fade   = (delay = 0) => ({ initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-80px" }, transition: { duration: 0.55, ease: "easeOut" as const, delay } });
const fadeIn = (delay = 0) => ({ initial: { opacity: 0 },        whileInView: { opacity: 1 },        viewport: { once: true, margin: "-60px" }, transition: { duration: 0.5, delay } });

/* ── section label ───────────────────────────────────────────── */
function Label({ children }: { children: string }) {
  return (
    <div style={{ fontSize: "10px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "var(--mono)", marginBottom: "16px" }}>
      {children}
    </div>
  );
}

/* ── stat counter card ───────────────────────────────────────── */
function StatCard({ target, suffix = "", label }: { target: number; suffix?: string; label: string }) {
  const { ref, count } = useCountUp(target);
  return (
    <div ref={ref} style={{ flex: "1 1 160px", minWidth: "140px", background: "var(--bg2)", border: "0.5px solid var(--bd2)", borderRadius: "8px", padding: "24px 20px" }}>
      <div style={{ fontSize: "40px", fontWeight: 500, color: "var(--t1)", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: "6px", fontFamily: "var(--sans)" }}>
        {count}{suffix}
      </div>
      <div style={{ fontSize: "11px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--mono)" }}>
        {label}
      </div>
    </div>
  );
}

/* ── feature card ────────────────────────────────────────────── */
function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div style={{ background: "var(--bg2)", border: "0.5px solid var(--bd2)", borderRadius: "8px", padding: "20px", flex: "1 1 220px", minWidth: "200px" }}>
      <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "var(--bg3)", border: "0.5px solid var(--bd2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
        <i className={`ti ${icon}`} style={{ fontSize: "16px", color: "var(--purple)" }} aria-hidden />
      </div>
      <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--t1)", marginBottom: "6px" }}>{title}</div>
      <div style={{ fontSize: "12px", color: "var(--t3)", lineHeight: 1.6 }}>{desc}</div>
    </div>
  );
}

/* ── main ────────────────────────────────────────────────────── */
export default function LandingPage() {
  const fundamentals   = STAGE_GROUPS["fundamentals"];
  const agentPatterns  = STAGE_GROUPS["agent-patterns"];
  const advancedReason = STAGE_GROUPS["advanced-reasoning"];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", overflow: "hidden" }}>

      {/* ──────────────────── SECTION 1 — HERO ──────────────────── */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Particle background */}
        <ParticleField />

        {/* Subtle grid overlay */}
        <div
          aria-hidden
          style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage: "linear-gradient(var(--bd) 1px, transparent 1px), linear-gradient(90deg, var(--bd) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            opacity: 0.25,
          }}
        />

        {/* Gradient orbs */}
        <div aria-hidden style={{ position: "absolute", top: "15%", right: "12%", width: "380px", height: "380px", borderRadius: "50%", background: "radial-gradient(circle, rgba(124,113,232,0.1) 0%, transparent 70%)", animation: "orb-drift 12s ease-in-out infinite", pointerEvents: "none" }} />
        <div aria-hidden style={{ position: "absolute", bottom: "20%", left: "8%",  width: "280px", height: "280px", borderRadius: "50%", background: "radial-gradient(circle, rgba(74,222,128,0.06) 0%, transparent 70%)", animation: "orb-drift 16s ease-in-out infinite reverse", pointerEvents: "none" }} />

        {/* TopNav — bigger, centered links */}
        <nav style={{ position: "relative", zIndex: 10, display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", padding: "0 32px", height: "60px", borderBottom: "0.5px solid var(--bd)" }}>
          {/* Left: logo + CA */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "9px", textDecoration: "none" }}>
              <Image src="/logo-agent.png" alt="logo" width={28} height={28} style={{ borderRadius: "4px" }} />
              <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--t1)", letterSpacing: "-0.02em" }}>agent</span>
            </Link>
            <CACopy />
          </div>
          {/* Center: primary navigation */}
          <div style={{ display: "flex", gap: "4px" }}>
            {[
              { href: "/learn", label: "Learn" },
              { href: "/agents", label: "My Agents" },
              { href: "/marketplace", label: "Marketplace" },
              { href: "/battle", label: "Battle" },
              { href: "/docs",  label: "Docs"    },
            ].map(l => (
              <Link key={l.href} href={l.href} style={{ fontSize: "13px", fontWeight: 500, color: "var(--t2)", textDecoration: "none", padding: "6px 14px", borderRadius: "5px", border: "0.5px solid transparent", transition: "color 0.15s" }}>
                {l.label}
              </Link>
            ))}
          </div>
          {/* Right: socials + wallet */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px" }}>
            <SocialIcons />
            <WalletButton />
          </div>
        </nav>

        {/* Hero content */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 32px 60px", position: "relative", zIndex: 5 }}>
          <div style={{ maxWidth: "680px", width: "100%", textAlign: "center" }}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "10px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "var(--mono)", padding: "4px 10px", border: "0.5px solid var(--bd2)", borderRadius: "20px", marginBottom: "28px" }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
                14-lesson node.js course
              </div>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.08, ease: "easeOut" as const }}
              style={{ fontSize: "clamp(44px, 7vw, 72px)", fontWeight: 500, color: "var(--t1)", letterSpacing: "-0.045em", lineHeight: 1.0, marginBottom: "22px" }}>
              Build the mind,<br />
              <span style={{ color: "var(--t3)" }}>not the framework.</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.18 }}
              style={{ fontSize: "16px", color: "var(--t2)", lineHeight: 1.75, maxWidth: "520px", margin: "0 auto 36px" }}>
              Most AI courses hand you LangChain and call it done. This one builds every agent pattern from raw model APIs — ReAct loops, memory, DAGs, tree search — so you actually understand what runs underneath.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.28 }}
              style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/learn" style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "14px", padding: "11px 24px", borderRadius: "6px", background: "var(--acc)", color: "#000", fontWeight: 500, textDecoration: "none" }}>
                <i className="ti ti-player-play" style={{ fontSize: "15px" }} aria-hidden />
                Start learning — free
              </Link>
              <Link href="/docs" style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "14px", padding: "11px 24px", borderRadius: "6px", background: "transparent", color: "var(--t2)", border: "0.5px solid var(--bd2)", textDecoration: "none" }}>
                <i className="ti ti-book" style={{ fontSize: "15px" }} aria-hidden />
                Read the docs
              </Link>
            </motion.div>

            {/* Mini stats row */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.42 }}
              style={{ display: "flex", gap: "24px", justifyContent: "center", flexWrap: "wrap", marginTop: "44px" }}>
              {[
                { icon: "ti-book",             val: "14 lessons" },
                { icon: "ti-clock",            val: "~6 hours"   },
                { icon: "ti-brand-javascript", val: "Node.js"    },
                { icon: "ti-cpu",              val: "local LLMs" },
              ].map(s => (
                <div key={s.val} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--t3)", fontFamily: "var(--mono)" }}>
                  <i className={`ti ${s.icon}`} style={{ fontSize: "12px" }} aria-hidden />
                  <span style={{ color: "var(--t2)" }}>{s.val}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Scroll hint */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.6 }}
          style={{ position: "relative", zIndex: 5, textAlign: "center", paddingBottom: "28px" }}>
          <div style={{ fontSize: "10px", color: "var(--t4)", fontFamily: "var(--mono)", letterSpacing: "0.08em" }}>scroll to explore</div>
          <div style={{ marginTop: "6px", fontSize: "14px", color: "var(--t4)" }}>↓</div>
        </motion.div>
      </section>

      {/* ──────────────────── SECTION 2 — METRICS ───────────────── */}
      <section style={{ padding: "80px 32px", borderTop: "0.5px solid var(--bd)", borderBottom: "0.5px solid var(--bd)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <motion.div {...fadeIn(0)}>
            <Label>by the numbers</Label>
          </motion.div>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            {[
              { target: 14,  suffix: "",  label: "Lessons total"        },
              { target: 6,   suffix: "h", label: "Estimated duration"   },
              { target: 3,   suffix: "",  label: "Learning stages"      },
              { target: 100, suffix: "%", label: "Framework-free"       },
              { target: 8,   suffix: "",  label: "Agent patterns built" },
            ].map((s, i) => (
              <motion.div key={s.label} {...fade(i * 0.08)} style={{ flex: "1 1 160px", minWidth: "140px" }}>
                <StatCard target={s.target} suffix={s.suffix} label={s.label} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────── SECTION 3 — WHY ───────────────────── */}
      <section style={{ padding: "100px 32px", borderBottom: "0.5px solid var(--bd)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "start" }}>

            <motion.div {...fade(0)}>
              <Label>the problem</Label>
              <h2 style={{ fontSize: "26px", fontWeight: 500, color: "var(--t1)", letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: "20px" }}>
                Frameworks hide<br />what you need to know.
              </h2>
              <p style={{ fontSize: "13px", color: "var(--t2)", lineHeight: 1.75, marginBottom: "20px", maxWidth: "440px" }}>
                LangChain, LlamaIndex, AutoGPT — they all abstract away the one thing you actually need to understand: how the model thinks, calls tools, and loops.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  "Black-box abstractions that version-break every release",
                  "No mental model of what's actually running",
                  "Can't debug it because you never built it",
                  "Lock-in to one provider's design decisions",
                ].map(t => (
                  <div key={t} style={{ display: "flex", gap: "10px", fontSize: "12px", color: "var(--t3)", alignItems: "flex-start" }}>
                    <span style={{ color: "#ef4444", flexShrink: 0, marginTop: "1px" }}>✗</span>
                    {t}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div {...fade(0.14)}>
              <Label>the solution</Label>
              <h2 style={{ fontSize: "26px", fontWeight: 500, color: "var(--t1)", letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: "20px" }}>
                Build it once<br />from the ground up.
              </h2>
              <p style={{ fontSize: "13px", color: "var(--t2)", lineHeight: 1.75, marginBottom: "20px", maxWidth: "440px" }}>
                14 lessons, each a standalone working implementation. You write the ReAct loop. You wire the tool caller. You build the memory system. Then you own it.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  "Node.js + raw model APIs — nothing hidden",
                  "Local LLMs (llama.cpp) + hosted APIs (OpenAI)",
                  "Every pattern is 100–200 lines, no fluff",
                  "Transfer the mental model to any provider or framework",
                ].map(t => (
                  <div key={t} style={{ display: "flex", gap: "10px", fontSize: "12px", color: "var(--t2)", alignItems: "flex-start" }}>
                    <span style={{ color: "var(--green)", flexShrink: 0, marginTop: "1px" }}>✓</span>
                    {t}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ──────────────────── SECTION 4 — WHAT YOU'LL BUILD ─────── */}
      <section style={{ padding: "100px 32px", borderBottom: "0.5px solid var(--bd)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <motion.div {...fade(0)} style={{ marginBottom: "40px" }}>
            <Label>what you&apos;ll build</Label>
            <h2 style={{ fontSize: "32px", fontWeight: 500, color: "var(--t1)", letterSpacing: "-0.03em", maxWidth: "480px", lineHeight: 1.1 }}>
              8 production-grade agent patterns
            </h2>
          </motion.div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {[
              { icon: "ti-tool",           title: "Function Calling",    desc: "JSON-schema tool definitions the model calls by name — the building block of all agents."         },
              { icon: "ti-refresh",        title: "ReAct Loop",          desc: "Reason → act → observe, iterated until the model decides it has a final answer."                   },
              { icon: "ti-database",       title: "Memory System",       desc: "Persist facts between sessions with keyword retrieval. Primer for vector embeddings."              },
              { icon: "ti-circuit-diode",  title: "DAG Executor",        desc: "Decompose a task into atomic ops, resolve dependencies, run in parallel where possible."           },
              { icon: "ti-git-branch",     title: "Tree of Thought",     desc: "Generate N reasoning branches, score deterministically, keep the best — beam search for LLMs."    },
              { icon: "ti-hierarchy-2",    title: "Graph of Thought",    desc: "Parallel extraction + conflict resolution before generation. For multi-source synthesis."           },
              { icon: "ti-list-check",     title: "Chain of Thought",    desc: "Sequential reasoning phases: facts → signals → policy → decision. Produces auditable traces."     },
              { icon: "ti-shield-check",   title: "Error Resilience",    desc: "Typed error taxonomy, exponential backoff with jitter, graceful degradation per failure mode."    },
            ].map((f, i) => (
              <motion.div key={f.title} {...fade(i * 0.06)} style={{ flex: "1 1 220px", minWidth: "200px" }}>
                <FeatureCard {...f} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────── SECTION 5 — LEARNING PATH ─────────── */}
      <section style={{ padding: "100px 32px", borderBottom: "0.5px solid var(--bd)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <motion.div {...fade(0)} style={{ marginBottom: "48px" }}>
            <Label>learning path</Label>
            <h2 style={{ fontSize: "32px", fontWeight: 500, color: "var(--t1)", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              Three stages.<br />14 lessons. Zero fluff.
            </h2>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            {[
              { stage: STAGES[0], lessons: fundamentals,   accent: "var(--t2)"    },
              { stage: STAGES[1], lessons: agentPatterns,  accent: "var(--purple)" },
              { stage: STAGES[2], lessons: advancedReason, accent: "var(--green)"  },
            ].map(({ stage, lessons, accent }, i) => (
              <motion.div key={stage.key} {...fade(i * 0.1)}>
                <div style={{ background: "var(--bg2)", border: "0.5px solid var(--bd2)", borderRadius: "8px", padding: "24px", height: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                    <span style={{ fontSize: "10px", fontFamily: "var(--mono)", color: "var(--t4)", background: "var(--bg3)", border: "0.5px solid var(--bd2)", padding: "2px 6px", borderRadius: "2px" }}>{stage.num}</span>
                    <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--t1)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{stage.label}</span>
                    <span style={{ fontSize: "10px", color: "var(--t3)", fontFamily: "var(--mono)", marginLeft: "auto" }}>{lessons.length} lessons</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {lessons.map(l => (
                      <Link key={l.id} href={`/learn/${l.folder}`} style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
                        <span style={{ fontSize: "9px", color: accent, fontFamily: "var(--mono)", minWidth: "20px" }}>{String(l.num).padStart(2, "0")}</span>
                        <span style={{ fontSize: "12px", color: "var(--t2)" }}>{l.title}</span>
                        <span style={{ fontSize: "9px", color: "var(--t4)", fontFamily: "var(--mono)", marginLeft: "auto" }}>{l.tag}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────── SECTION 6 — AI TUTOR ──────────────── */}
      <section style={{ padding: "100px 32px", borderBottom: "0.5px solid var(--bd)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "center" }}>

          <motion.div {...fade(0)}>
            <Label>built-in ai tutor</Label>
            <h2 style={{ fontSize: "32px", fontWeight: 500, color: "var(--t1)", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "18px" }}>
              An expert at your side for every lesson.
            </h2>
            <p style={{ fontSize: "13px", color: "var(--t2)", lineHeight: 1.75, marginBottom: "24px", maxWidth: "420px" }}>
              Each lesson page ships with a context-aware AI tutor powered by Mistral. The lesson concept and key patterns are injected into every conversation so answers stay grounded in exactly what you&apos;re learning.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { icon: "ti-brain",        text: "Asks questions? The tutor knows the lesson cold." },
                { icon: "ti-link",         text: "Surfaces connections to adjacent lessons automatically." },
                { icon: "ti-building",     text: "Production use cases — not just toy examples." },
                { icon: "ti-lock",         text: "API key stays server-side. Never in the browser." },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "12px", color: "var(--t2)" }}>
                  <i className={`ti ${icon}`} style={{ fontSize: "13px", color: "var(--purple)", flexShrink: 0, marginTop: "1px" }} aria-hidden />
                  {text}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Mock chat panel */}
          <motion.div {...fade(0.12)}>
            <div style={{ background: "var(--bg2)", border: "0.5px solid var(--bd2)", borderRadius: "8px", overflow: "hidden" }}>
              {/* Panel header */}
              <div style={{ display: "flex", alignItems: "center", gap: "7px", padding: "10px 14px", borderBottom: "0.5px solid var(--bd)" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--green)" }} />
                <span style={{ fontSize: "11.5px", fontWeight: 500, color: "var(--t1)" }}>AI tutor</span>
                <span style={{ fontSize: "10px", color: "var(--t3)", fontFamily: "var(--mono)", marginLeft: "4px" }}>react agent</span>
              </div>
              {/* Mock messages */}
              <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  { role: "user", text: "Why does ReAct need an observation loop?" },
                  { role: "ai",   text: "A single tool call can't solve multi-step problems — the model needs to see the result of each action before deciding the next one. The observation feeds back into context so the model can self-correct." },
                  { role: "user", text: "How does this connect to AoT?" },
                  { role: "ai",   text: "ReAct discovers its plan as it goes; AoT plans the entire dependency graph upfront before executing. Use ReAct when structure is unknown, AoT when it can be enumerated." },
                ].map((m, i) => (
                  <div key={i} style={{ fontSize: "11px", lineHeight: 1.6, padding: "7px 9px", borderRadius: "4px", maxWidth: "92%", alignSelf: m.role === "user" ? "flex-end" : "flex-start", background: m.role === "user" ? "#1e1a4a" : "var(--bg3)", color: m.role === "user" ? "#aba6f0" : "var(--t2)", border: `0.5px solid ${m.role === "user" ? "#3d3680" : "var(--bd2)"}` }}>
                    {m.text}
                  </div>
                ))}
              </div>
              {/* Input row */}
              <div style={{ display: "flex", gap: "6px", padding: "8px 12px", borderTop: "0.5px solid var(--bd)" }}>
                <div style={{ flex: 1, fontSize: "11px", padding: "5px 8px", borderRadius: "3px", border: "0.5px solid var(--bd2)", background: "var(--bg)", color: "var(--t3)", fontFamily: "var(--sans)" }}>
                  Ask anything…
                </div>
                <div style={{ width: "26px", height: "26px", borderRadius: "3px", background: "var(--acc)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <i className="ti ti-send" style={{ fontSize: "11px", color: "#000" }} aria-hidden />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ──────────────────── SECTION 7 — CTA ───────────────────── */}
      <section style={{ padding: "100px 32px", position: "relative", overflow: "hidden" }}>
        <div aria-hidden style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle, rgba(124,113,232,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: "640px", margin: "0 auto", textAlign: "center", position: "relative" }}>
          <motion.div {...fade(0)}>
            <Label>ready to build?</Label>
            <h2 style={{ fontSize: "40px", fontWeight: 500, color: "var(--t1)", letterSpacing: "-0.04em", lineHeight: 1.05, marginBottom: "18px" }}>
              Start with Lesson 1.<br />It takes 15 minutes.
            </h2>
            <p style={{ fontSize: "14px", color: "var(--t2)", lineHeight: 1.75, marginBottom: "36px" }}>
              Load a local model, run your first inference, and understand exactly what the rest of the course builds on.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/learn/01_intro" style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "14px", padding: "12px 28px", borderRadius: "6px", background: "var(--acc)", color: "#000", fontWeight: 500, textDecoration: "none" }}>
                <i className="ti ti-player-play" aria-hidden />
                Lesson 1 — Introduction
              </Link>
              <Link href="/learn" style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "14px", padding: "12px 28px", borderRadius: "6px", background: "transparent", color: "var(--t2)", border: "0.5px solid var(--bd2)", textDecoration: "none" }}>
                <i className="ti ti-git-branch" aria-hidden />
                View full roadmap
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "20px 32px", borderTop: "0.5px solid var(--bd)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Image src="/logo-agent.png" alt="logo" width={18} height={18} style={{ borderRadius: "2px" }} />
          <span style={{ fontSize: "11px", color: "var(--t3)", fontFamily: "var(--mono)" }}>agent</span>
        </div>
        <span style={{ fontSize: "11px", color: "var(--t4)", fontFamily: "var(--mono)" }}>14 lessons · 3 stages · MIT license</span>
      </footer>

    </div>
  );
}
