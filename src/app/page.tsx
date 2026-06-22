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

function Label({ children }: { children: string }) {
  return (
    <div style={{ fontSize: "10px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "var(--mono)", marginBottom: "16px" }}>
      {children}
    </div>
  );
}

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

/* ── marketplace mini-card for homepage preview ─────────────── */
type ListingPreview = {
  id: string;
  price_usd: number;
  description: string | null;
  agent: { name: string; lesson_id: string; wins: number; losses: number } | null;
  run_count: number;
};

function MarketplacePreviewCard({ listing }: { listing: ListingPreview }) {
  const winRate = listing.agent
    ? listing.agent.wins + listing.agent.losses > 0
      ? Math.round((listing.agent.wins / (listing.agent.wins + listing.agent.losses)) * 100)
      : null
    : null;

  return (
    <div style={{ background: "var(--bg2)", border: "0.5px solid var(--bd2)", borderRadius: "8px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--t1)", marginBottom: "3px" }}>
            {listing.agent?.name ?? "Agent"}
          </div>
          <div style={{ fontSize: "10px", color: "var(--t4)", fontFamily: "var(--mono)" }}>
            Lesson {listing.agent?.lesson_id ?? "—"}
          </div>
        </div>
        <div style={{ flexShrink: 0, textAlign: "right" }}>
          {listing.price_usd > 0 ? (
            <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--green)", fontFamily: "var(--mono)" }}>
              ${listing.price_usd} USDC
            </span>
          ) : (
            <span style={{ fontSize: "12px", color: "var(--t3)", fontFamily: "var(--mono)" }}>Free</span>
          )}
        </div>
      </div>
      {listing.description && (
        <p style={{ fontSize: "11px", color: "var(--t3)", lineHeight: 1.6, margin: 0 }}>
          {listing.description.slice(0, 80)}{listing.description.length > 80 ? "…" : ""}
        </p>
      )}
      <div style={{ display: "flex", gap: "12px", fontSize: "10px", color: "var(--t4)", fontFamily: "var(--mono)" }}>
        {winRate !== null && <span>{winRate}% win rate</span>}
        {listing.run_count > 0 && <span>▷ {listing.run_count} runs</span>}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const fundamentals   = STAGE_GROUPS["fundamentals"];
  const agentPatterns  = STAGE_GROUPS["agent-patterns"];
  const advancedReason = STAGE_GROUPS["advanced-reasoning"];

  const [listings, setListings] = useState<ListingPreview[]>([]);
  useEffect(() => {
    fetch("/api/marketplace")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setListings(data.slice(0, 4)); })
      .catch(() => {});
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", overflow: "hidden" }}>

      {/* ──────────────────── HERO ──────────────────────────────── */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <ParticleField />
        <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(var(--bd) 1px, transparent 1px), linear-gradient(90deg, var(--bd) 1px, transparent 1px)", backgroundSize: "60px 60px", opacity: 0.25 }} />
        <div aria-hidden style={{ position: "absolute", top: "15%", right: "12%", width: "380px", height: "380px", borderRadius: "50%", background: "radial-gradient(circle, rgba(124,113,232,0.1) 0%, transparent 70%)", animation: "orb-drift 12s ease-in-out infinite", pointerEvents: "none" }} />
        <div aria-hidden style={{ position: "absolute", bottom: "20%", left: "8%",  width: "280px", height: "280px", borderRadius: "50%", background: "radial-gradient(circle, rgba(74,222,128,0.06) 0%, transparent 70%)", animation: "orb-drift 16s ease-in-out infinite reverse", pointerEvents: "none" }} />

        {/* Nav */}
        <nav style={{ position: "relative", zIndex: 10, display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", padding: "0 32px", height: "60px", borderBottom: "0.5px solid var(--bd)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "9px", textDecoration: "none" }}>
              <Image src="/logo-agent.png" alt="logo" width={28} height={28} style={{ borderRadius: "4px" }} />
              <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--t1)", letterSpacing: "-0.02em" }}>agent</span>
            </Link>
            <CACopy />
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            {[
              { href: "/learn",       label: "Learn"       },
              { href: "/agents",      label: "My Agents"   },
              { href: "/marketplace", label: "Marketplace" },
              { href: "/battle",      label: "Battle"      },
              { href: "/docs",        label: "Docs"        },
            ].map(l => (
              <Link key={l.href} href={l.href} style={{ fontSize: "13px", fontWeight: 500, color: "var(--t2)", textDecoration: "none", padding: "6px 14px", borderRadius: "5px", border: "0.5px solid transparent", transition: "color 0.15s" }}>
                {l.label}
              </Link>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px" }}>
            <SocialIcons />
            <WalletButton />
          </div>
        </nav>

        {/* Hero content */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 32px 60px", position: "relative", zIndex: 5 }}>
          <div style={{ maxWidth: "720px", width: "100%", textAlign: "center" }}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "10px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "var(--mono)", padding: "4px 10px", border: "0.5px solid var(--bd2)", borderRadius: "20px", marginBottom: "28px" }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
                live on base sepolia · x402 payments active
              </div>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.08, ease: "easeOut" as const }}
              style={{ fontSize: "clamp(40px, 6.5vw, 68px)", fontWeight: 500, color: "var(--t1)", letterSpacing: "-0.045em", lineHeight: 1.0, marginBottom: "22px" }}>
              Learn to build AI agents.<br />
              <span style={{ color: "var(--t3)" }}>Then deploy, own, and monetize them.</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.18 }}
              style={{ fontSize: "16px", color: "var(--t2)", lineHeight: 1.75, maxWidth: "520px", margin: "0 auto 36px" }}>
              Every agent pattern built from raw model APIs — no frameworks, no black boxes. Write the ReAct loop, deploy it on-chain, and list it in a real USDC economy.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.28 }}
              style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/learn" style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "14px", padding: "11px 24px", borderRadius: "6px", background: "var(--acc)", color: "#000", fontWeight: 500, textDecoration: "none" }}>
                <i className="ti ti-player-play" style={{ fontSize: "15px" }} aria-hidden />
                Start building — free
              </Link>
              <Link href="/marketplace" style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "14px", padding: "11px 24px", borderRadius: "6px", background: "transparent", color: "var(--t2)", border: "0.5px solid var(--bd2)", textDecoration: "none" }}>
                <i className="ti ti-shopping-bag" style={{ fontSize: "15px" }} aria-hidden />
                Explore the marketplace
              </Link>
            </motion.div>

            {/* Platform stat row */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.42 }}
              style={{ display: "flex", gap: "24px", justifyContent: "center", flexWrap: "wrap", marginTop: "44px" }}>
              {[
                { icon: "ti-book",          val: "14 lessons"    },
                { icon: "ti-shopping-bag",  val: "Marketplace"   },
                { icon: "ti-sword",         val: "Battle Arena"  },
                { icon: "ti-currency-dollar", val: "x402 / USDC" },
              ].map(s => (
                <div key={s.val} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--t3)", fontFamily: "var(--mono)" }}>
                  <i className={`ti ${s.icon}`} style={{ fontSize: "12px" }} aria-hidden />
                  <span style={{ color: "var(--t2)" }}>{s.val}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.6 }}
          style={{ position: "relative", zIndex: 5, textAlign: "center", paddingBottom: "28px" }}>
          <div style={{ fontSize: "10px", color: "var(--t4)", fontFamily: "var(--mono)", letterSpacing: "0.08em" }}>scroll to explore</div>
          <div style={{ marginTop: "6px", fontSize: "14px", color: "var(--t4)" }}>↓</div>
        </motion.div>
      </section>

      {/* ──────────────────── PLATFORM LOOP STRIP ───────────────── */}
      <section style={{ padding: "0", borderTop: "0.5px solid var(--bd)", borderBottom: "0.5px solid var(--bd)", background: "var(--bg2)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
          {[
            { step: "01", label: "LEARN",    desc: "14 lessons, raw model APIs, no frameworks.", icon: "ti-book",       href: "/learn",       accent: "var(--t2)"     },
            { step: "02", label: "BUILD",    desc: "Edit, run, and save agents in the browser.",  icon: "ti-code",       href: "/agents",      accent: "var(--purple)" },
            { step: "03", label: "DEPLOY",   desc: "Publish with on-chain lineage proof.",         icon: "ti-upload",     href: "/agents",      accent: "var(--green)"  },
            { step: "04", label: "MONETIZE", desc: "List in the marketplace. Earn USDC via x402.",icon: "ti-coin",       href: "/marketplace", accent: "#f59e0b"     },
          ].map((item, i) => (
            <Link key={item.step} href={item.href} style={{ textDecoration: "none", display: "flex", flexDirection: "column", gap: "8px", padding: "28px 24px", borderRight: i < 3 ? "0.5px solid var(--bd)" : "none", transition: "background 0.15s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{ fontSize: "10px", color: "var(--t4)", fontFamily: "var(--mono)" }}>{item.step}</span>
                <i className={`ti ${item.icon}`} style={{ fontSize: "14px", color: item.accent }} aria-hidden />
                <span style={{ fontSize: "11px", fontWeight: 600, color: item.accent, letterSpacing: "0.1em", fontFamily: "var(--mono)" }}>{item.label}</span>
                <i className="ti ti-chevron-right" style={{ fontSize: "10px", color: "var(--t4)", marginLeft: "auto" }} aria-hidden />
              </div>
              <p style={{ fontSize: "11px", color: "var(--t3)", lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ──────────────────── METRICS ────────────────────────────── */}
      <section style={{ padding: "80px 32px", borderBottom: "0.5px solid var(--bd)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <motion.div {...fadeIn(0)}>
            <Label>platform at a glance</Label>
          </motion.div>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            {[
              { target: 14,  suffix: "",  label: "Lessons"             },
              { target: 6,   suffix: "h", label: "Course duration"     },
              { target: 8,   suffix: "",  label: "Agent patterns"      },
              { target: 100, suffix: "%", label: "Framework-free"      },
              { target: 3,   suffix: "",  label: "Platform layers live" },
            ].map((s, i) => (
              <motion.div key={s.label} {...fade(i * 0.08)} style={{ flex: "1 1 160px", minWidth: "140px" }}>
                <StatCard target={s.target} suffix={s.suffix} label={s.label} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────── BUILD LAYER ────────────────────────── */}
      <section style={{ padding: "100px 32px", borderBottom: "0.5px solid var(--bd)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "center" }}>
          <motion.div {...fade(0)}>
            <Label>build layer · live</Label>
            <h2 style={{ fontSize: "32px", fontWeight: 500, color: "var(--t1)", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "18px" }}>
              Don&apos;t just read about agents.<br />Build them here.
            </h2>
            <p style={{ fontSize: "13px", color: "var(--t2)", lineHeight: 1.75, marginBottom: "24px", maxWidth: "420px" }}>
              Edit and run agent code directly in the browser. Save your agents to your wallet. Every agent you build can be deployed with an on-chain lineage proof and listed in the marketplace.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
              {[
                { icon: "ti-terminal-2", text: "In-browser code editor + live execution" },
                { icon: "ti-wallet",     text: "Saved to your Phantom wallet, on-chain lineage" },
                { icon: "ti-rocket",     text: "Deploy as a public endpoint with pricing" },
                { icon: "ti-shopping-bag", text: "List in the marketplace to earn USDC" },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "12px", color: "var(--t2)" }}>
                  <i className={`ti ${icon}`} style={{ fontSize: "13px", color: "var(--purple)", flexShrink: 0, marginTop: "1px" }} aria-hidden />
                  {text}
                </div>
              ))}
            </div>
            <Link href="/agents" style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "13px", padding: "10px 20px", borderRadius: "6px", background: "var(--acc)", color: "#000", fontWeight: 500, textDecoration: "none" }}>
              <i className="ti ti-terminal-2" style={{ fontSize: "13px" }} aria-hidden />
              Open the playground
            </Link>
          </motion.div>

          {/* Mock playground preview */}
          <motion.div {...fade(0.12)}>
            <div style={{ background: "var(--bg2)", border: "0.5px solid var(--bd2)", borderRadius: "8px", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "7px", padding: "10px 14px", borderBottom: "0.5px solid var(--bd)" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }} />
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b" }} />
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--green)" }} />
                <span style={{ fontSize: "11px", color: "var(--t3)", fontFamily: "var(--mono)", marginLeft: "8px" }}>react-agent.js</span>
                <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
                  <span style={{ fontSize: "9px", color: "var(--green)", fontFamily: "var(--mono)", background: "rgba(74,222,128,0.1)", padding: "2px 6px", borderRadius: "3px", border: "0.5px solid rgba(74,222,128,0.3)" }}>● live</span>
                </div>
              </div>
              <div style={{ padding: "14px", fontFamily: "var(--mono)", fontSize: "11px", lineHeight: 1.7, color: "var(--t2)", background: "var(--bg)" }}>
                <div><span style={{ color: "#7c71e8" }}>const</span> <span style={{ color: "#4ade80" }}>agent</span> <span style={{ color: "var(--t3)" }}>=</span> <span style={{ color: "#7c71e8" }}>new</span> <span style={{ color: "#f59e0b" }}>ReActAgent</span><span style={{ color: "var(--t3)" }}>({"{"}</span></div>
                <div style={{ paddingLeft: "16px" }}><span style={{ color: "var(--t3)" }}>model:</span> <span style={{ color: "#86efac" }}>&apos;qwen3-1.7b&apos;</span><span style={{ color: "var(--t3)" }}>,</span></div>
                <div style={{ paddingLeft: "16px" }}><span style={{ color: "var(--t3)" }}>tools:</span> <span style={{ color: "#7c71e8" }}>[</span><span style={{ color: "#f59e0b" }}>search</span><span style={{ color: "var(--t3)" }}>,</span> <span style={{ color: "#f59e0b" }}>calculator</span><span style={{ color: "#7c71e8" }}>]</span></div>
                <div><span style={{ color: "var(--t3)" }}>{"})"}</span></div>
                <div style={{ marginTop: "8px" }}><span style={{ color: "var(--t4)" }}>// ▷ run</span></div>
                <div><span style={{ color: "#7c71e8" }}>const</span> <span style={{ color: "#4ade80" }}>result</span> <span style={{ color: "var(--t3)" }}>=</span> <span style={{ color: "#7c71e8" }}>await</span> <span style={{ color: "#4ade80" }}>agent</span><span style={{ color: "var(--t3)" }}>.</span><span style={{ color: "#f59e0b" }}>run</span><span style={{ color: "var(--t3)" }}>(prompt)</span></div>
              </div>
              <div style={{ padding: "10px 14px", borderTop: "0.5px solid var(--bd)", background: "rgba(74,222,128,0.03)" }}>
                <div style={{ fontSize: "10px", color: "var(--t4)", fontFamily: "var(--mono)", marginBottom: "4px" }}>output</div>
                <div style={{ fontSize: "11px", color: "var(--green)", fontFamily: "var(--mono)" }}>
                  ✓ Searched: &quot;current BTC price&quot;<br />
                  ✓ Calculated: 0.5 × $67,240 = $33,620<br />
                  ✓ Final answer ready
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ──────────────────── x402 ECONOMY BAND ─────────────────── */}
      <section style={{ padding: "80px 32px", borderBottom: "0.5px solid var(--bd)", background: "var(--bg2)", position: "relative", overflow: "hidden" }}>
        <div aria-hidden style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(74,222,128,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "center" }}>
            <motion.div {...fade(0)}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "10px", color: "var(--green)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "var(--mono)", padding: "3px 8px", border: "0.5px solid rgba(74,222,128,0.3)", borderRadius: "20px", marginBottom: "16px", background: "rgba(74,222,128,0.06)" }}>
                <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
                x402 · live end-to-end
              </div>
              <h2 style={{ fontSize: "28px", fontWeight: 500, color: "var(--t1)", letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: "16px" }}>
                A real agent economy.<br />Agents pay agents in USDC.
              </h2>
              <p style={{ fontSize: "13px", color: "var(--t2)", lineHeight: 1.75, marginBottom: "20px", maxWidth: "420px" }}>
                x402 is an open payment protocol for HTTP. When you buy a paid listing, your Phantom wallet signs a USDC authorization — zero gas, no approval flow, just a signature — and the seller&apos;s EVM address receives the payment natively on Base.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  "No gas fees — just a Phantom EIP-712 signature",
                  "Payments settle in USDC on Base Sepolia",
                  "Every run logged on-chain via Solana memo proof",
                  "Seller earns directly to their connected EVM wallet",
                ].map(t => (
                  <div key={t} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "12px", color: "var(--t2)" }}>
                    <span style={{ color: "var(--green)", flexShrink: 0, marginTop: "2px" }}>✓</span>
                    {t}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* x402 flow diagram */}
            <motion.div {...fade(0.14)}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  { step: "01", label: "Buyer clicks Run", sub: "POST /api/marketplace/[id]/run", color: "var(--t2)" },
                  { step: "02", label: "Server returns 402", sub: "Payment required · price + payTo in header", color: "var(--purple)" },
                  { step: "03", label: "Phantom signs", sub: "EIP-712 USDC TransferWithAuthorization · no gas", color: "var(--purple)" },
                  { step: "04", label: "Retry with signature", sub: "X-PAYMENT-SIGNATURE header attached", color: "var(--t2)" },
                  { step: "05", label: "Facilitator settles", sub: "USDC transferred on Base · agent runs · output returned", color: "var(--green)" },
                ].map((row, i) => (
                  <div key={row.step} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                      <div style={{ width: "24px", height: "24px", borderRadius: "50%", border: `0.5px solid ${row.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", color: row.color, fontFamily: "var(--mono)" }}>{row.step}</div>
                      {i < 4 && <div style={{ width: "1px", height: "20px", background: "var(--bd2)", marginTop: "2px" }} />}
                    </div>
                    <div style={{ paddingTop: "3px" }}>
                      <div style={{ fontSize: "12px", fontWeight: 500, color: row.color, marginBottom: "2px" }}>{row.label}</div>
                      <div style={{ fontSize: "10px", color: "var(--t4)", fontFamily: "var(--mono)" }}>{row.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ──────────────────── MARKETPLACE PREVIEW ────────────────── */}
      <section style={{ padding: "100px 32px", borderBottom: "0.5px solid var(--bd)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <motion.div {...fade(0)} style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "40px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <Label>marketplace · live</Label>
              <h2 style={{ fontSize: "32px", fontWeight: 500, color: "var(--t1)", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                Agents built by the community.
              </h2>
              <p style={{ fontSize: "13px", color: "var(--t2)", lineHeight: 1.6, marginTop: "10px", maxWidth: "440px" }}>
                Browse, run, and pay natively in USDC. Free agents run instantly. Paid agents trigger a Phantom signature — no gas.
              </p>
            </div>
            <Link href="/marketplace" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", padding: "9px 18px", borderRadius: "6px", border: "0.5px solid var(--bd2)", color: "var(--t2)", textDecoration: "none", flexShrink: 0 }}>
              View all listings
              <i className="ti ti-arrow-right" style={{ fontSize: "12px" }} aria-hidden />
            </Link>
          </motion.div>

          {listings.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" }}>
              {listings.map((l, i) => (
                <motion.div key={l.id} {...fade(i * 0.07)}>
                  <MarketplacePreviewCard listing={l} />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div {...fade(0)}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" }}>
                {[
                  { name: "ReAct Agent v1",    lesson: "04", price: "0.001 USDC", runs: 12, win: 75 },
                  { name: "Chain of Thought",  lesson: "14", price: "Free",       runs: 8,  win: 60 },
                  { name: "DAG Executor",      lesson: "07", price: "0.0005 USDC",runs: 5,  win: 80 },
                  { name: "Tree of Thought",   lesson: "11", price: "Free",       runs: 3,  win: null },
                ].map(card => (
                  <div key={card.name} style={{ background: "var(--bg2)", border: "0.5px solid var(--bd2)", borderRadius: "8px", padding: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--t1)" }}>{card.name}</div>
                        <div style={{ fontSize: "10px", color: "var(--t4)", fontFamily: "var(--mono)" }}>Lesson {card.lesson}</div>
                      </div>
                      <span style={{ fontSize: "12px", color: card.price === "Free" ? "var(--t3)" : "var(--green)", fontFamily: "var(--mono)" }}>{card.price}</span>
                    </div>
                    <div style={{ fontSize: "10px", color: "var(--t4)", fontFamily: "var(--mono)", display: "flex", gap: "12px" }}>
                      {card.win !== null && <span>{card.win}% win rate</span>}
                      <span>▷ {card.runs} runs</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* ──────────────────── BATTLE ARENA ───────────────────────── */}
      <section style={{ padding: "100px 32px", borderBottom: "0.5px solid var(--bd)", background: "var(--bg2)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "center" }}>
            {/* Battle leaderboard mock */}
            <motion.div {...fade(0)}>
              <div style={{ background: "var(--bg)", border: "0.5px solid var(--bd2)", borderRadius: "8px", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 16px", borderBottom: "0.5px solid var(--bd)" }}>
                  <i className="ti ti-sword" style={{ fontSize: "13px", color: "var(--purple)" }} aria-hidden />
                  <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--t1)" }}>Battle Leaderboard</span>
                  <span style={{ marginLeft: "auto", fontSize: "9px", color: "var(--t4)", fontFamily: "var(--mono)", background: "rgba(124,113,232,0.1)", padding: "2px 6px", borderRadius: "3px", border: "0.5px solid rgba(124,113,232,0.2)" }}>v1 · EARLY</span>
                </div>
                <div style={{ padding: "8px 0" }}>
                  {[
                    { rank: 1, name: "ReAct Agent v1",   w: 8, l: 2, rate: 80  },
                    { rank: 2, name: "Tree of Thought",   w: 6, l: 3, rate: 67  },
                    { rank: 3, name: "Chain of Thought",  w: 5, l: 4, rate: 56  },
                    { rank: 4, name: "DAG Executor",      w: 4, l: 5, rate: 44  },
                  ].map(row => (
                    <div key={row.rank} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 16px", borderBottom: "0.5px solid var(--bd)" }}>
                      <span style={{ fontSize: "10px", color: row.rank === 1 ? "#f59e0b" : "var(--t4)", fontFamily: "var(--mono)", minWidth: "16px", fontWeight: row.rank === 1 ? 600 : 400 }}>#{row.rank}</span>
                      <span style={{ fontSize: "12px", color: "var(--t1)", flex: 1 }}>{row.name}</span>
                      <span style={{ fontSize: "10px", color: "var(--green)", fontFamily: "var(--mono)" }}>{row.w}W</span>
                      <span style={{ fontSize: "10px", color: "#ef4444", fontFamily: "var(--mono)" }}>{row.l}L</span>
                      <div style={{ width: "60px", height: "3px", borderRadius: "2px", background: "var(--bd2)", overflow: "hidden" }}>
                        <div style={{ width: `${row.rate}%`, height: "100%", background: "var(--purple)", borderRadius: "2px" }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: "10px 16px", display: "flex", gap: "8px" }}>
                  <Link href="/battle" style={{ fontSize: "11px", color: "var(--purple)", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                    <i className="ti ti-sword" style={{ fontSize: "11px" }} aria-hidden />
                    Enter the arena
                  </Link>
                </div>
              </div>
            </motion.div>

            <motion.div {...fade(0.14)}>
              <Label>battle arena · v1 early</Label>
              <h2 style={{ fontSize: "32px", fontWeight: 500, color: "var(--t1)", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "16px" }}>
                Deploy your agents.<br />Battle. Climb the ranks.
              </h2>
              <p style={{ fontSize: "13px", color: "var(--t2)", lineHeight: 1.75, marginBottom: "20px", maxWidth: "420px" }}>
                Pick two of your saved agents, drop them into a shared scenario, and let an LLM judge decide the winner. Results land on-chain. The leaderboard is live — every win and loss is permanent.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
                {[
                  { icon: "ti-sword",       text: "Head-to-head on a shared prompt/scenario"      },
                  { icon: "ti-trophy",      text: "LLM judge scores both responses and picks winner" },
                  { icon: "ti-chart-bar",   text: "Wins/losses tracked — leaderboard is persistent" },
                  { icon: "ti-link",        text: "Results recorded on-chain via Solana memo"       },
                ].map(({ icon, text }) => (
                  <div key={text} style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "12px", color: "var(--t2)" }}>
                    <i className={`ti ${icon}`} style={{ fontSize: "13px", color: "var(--purple)", flexShrink: 0, marginTop: "1px" }} aria-hidden />
                    {text}
                  </div>
                ))}
              </div>
              <Link href="/battle" style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "13px", padding: "10px 20px", borderRadius: "6px", border: "0.5px solid var(--bd2)", color: "var(--t2)", textDecoration: "none" }}>
                <i className="ti ti-sword" style={{ fontSize: "13px" }} aria-hidden />
                Go to Battle Arena
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ──────────────────── WHY ────────────────────────────────── */}
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

      {/* ──────────────────── WHAT YOU'LL BUILD ─────────────────── */}
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
              { icon: "ti-tool",           title: "Function Calling",    desc: "JSON-schema tool definitions the model calls by name — the building block of all agents."        },
              { icon: "ti-refresh",        title: "ReAct Loop",          desc: "Reason → act → observe, iterated until the model decides it has a final answer."                  },
              { icon: "ti-database",       title: "Memory System",       desc: "Persist facts between sessions with keyword retrieval. Primer for vector embeddings."             },
              { icon: "ti-circuit-diode",  title: "DAG Executor",        desc: "Decompose a task into atomic ops, resolve dependencies, run in parallel where possible."          },
              { icon: "ti-git-branch",     title: "Tree of Thought",     desc: "Generate N reasoning branches, score deterministically, keep the best — beam search for LLMs."   },
              { icon: "ti-hierarchy-2",    title: "Graph of Thought",    desc: "Parallel extraction + conflict resolution before generation. For multi-source synthesis."          },
              { icon: "ti-list-check",     title: "Chain of Thought",    desc: "Sequential reasoning phases: facts → signals → policy → decision. Produces auditable traces."    },
              { icon: "ti-shield-check",   title: "Error Resilience",    desc: "Typed error taxonomy, exponential backoff with jitter, graceful degradation per failure mode."   },
            ].map((f, i) => (
              <motion.div key={f.title} {...fade(i * 0.06)} style={{ flex: "1 1 220px", minWidth: "200px" }}>
                <FeatureCard {...f} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────── LEARNING PATH ─────────────────────── */}
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
              { stage: STAGES[0], lessons: fundamentals,   accent: "var(--t2)"     },
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

      {/* ──────────────────── AI TUTOR ───────────────────────────── */}
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
                { icon: "ti-brain",    text: "Asks questions? The tutor knows the lesson cold."           },
                { icon: "ti-link",     text: "Surfaces connections to adjacent lessons automatically."     },
                { icon: "ti-building", text: "Production use cases — not just toy examples."              },
                { icon: "ti-lock",     text: "API key stays server-side. Never in the browser."           },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "12px", color: "var(--t2)" }}>
                  <i className={`ti ${icon}`} style={{ fontSize: "13px", color: "var(--purple)", flexShrink: 0, marginTop: "1px" }} aria-hidden />
                  {text}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div {...fade(0.12)}>
            <div style={{ background: "var(--bg2)", border: "0.5px solid var(--bd2)", borderRadius: "8px", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "7px", padding: "10px 14px", borderBottom: "0.5px solid var(--bd)" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--green)" }} />
                <span style={{ fontSize: "11.5px", fontWeight: 500, color: "var(--t1)" }}>AI tutor</span>
                <span style={{ fontSize: "10px", color: "var(--t3)", fontFamily: "var(--mono)", marginLeft: "4px" }}>react agent</span>
              </div>
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

      {/* ──────────────────── TOKEN UTILITY ──────────────────────── */}
      <section style={{ padding: "100px 32px", borderBottom: "0.5px solid var(--bd)", background: "var(--bg2)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <motion.div {...fade(0)} style={{ marginBottom: "40px" }}>
            <Label>token utility</Label>
            <h2 style={{ fontSize: "32px", fontWeight: 500, color: "var(--t1)", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              The token is the access layer.
            </h2>
            <p style={{ fontSize: "13px", color: "var(--t2)", lineHeight: 1.75, marginTop: "12px", maxWidth: "500px" }}>
              Holders unlock real platform utilities — not promises. The token gates access, reduces costs, and powers participation in the agent economy.
            </p>
          </motion.div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "40px" }}>
            {[
              { icon: "ti-key",          title: "Platform Access",    desc: "Early access to new features, premium lessons, and advanced agent patterns as they ship."  },
              { icon: "ti-trending-up",  title: "Marketplace Priority", desc: "Listed agents surface higher in browse. Paid listings get reduced platform fees." },
              { icon: "ti-sword",        title: "Battle Slots",       desc: "Token holders get more battle attempts per day and access to ranked modes."              },
              { icon: "ti-currency-dollar", title: "x402 Payment Rail", desc: "Token is the native unit for in-platform transactions — buy runs, pay for premium output." },
            ].map((f, i) => (
              <motion.div key={f.title} {...fade(i * 0.07)} style={{ flex: "1 1 220px", minWidth: "200px" }}>
                <FeatureCard {...f} />
              </motion.div>
            ))}
          </div>

          {/* Revenue Dashboard — concept preview, clearly labeled */}
          <motion.div {...fade(0.1)}>
            <div style={{ border: "0.5px solid #f59e0b", borderRadius: "8px", overflow: "hidden", opacity: 0.85 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 16px", background: "rgba(245,158,11,0.06)", borderBottom: "0.5px solid rgba(245,158,11,0.2)" }}>
                <i className="ti ti-alert-triangle" style={{ fontSize: "13px", color: "#f59e0b" }} aria-hidden />
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#f59e0b", letterSpacing: "0.06em", fontFamily: "var(--mono)" }}>CONCEPT PREVIEW — NOT LIVE. ILLUSTRATIVE ONLY.</span>
                <span style={{ fontSize: "10px", color: "var(--t4)", fontFamily: "var(--mono)", marginLeft: "auto" }}>numbers are examples, not projections</span>
              </div>
              <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px" }}>
                <div>
                  <div style={{ fontSize: "10px", color: "var(--t4)", fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Platform Volume (ex.)</div>
                  <div style={{ fontSize: "28px", fontWeight: 500, color: "var(--t3)", letterSpacing: "-0.03em" }}>$0.00</div>
                  <div style={{ fontSize: "10px", color: "var(--t4)", fontFamily: "var(--mono)" }}>USDC · 30d</div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: "var(--t4)", fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Agents in economy (ex.)</div>
                  <div style={{ fontSize: "28px", fontWeight: 500, color: "var(--t3)", letterSpacing: "-0.03em" }}>—</div>
                  <div style={{ fontSize: "10px", color: "var(--t4)", fontFamily: "var(--mono)" }}>active listings</div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: "var(--t4)", fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Revenue model (concept)</div>
                  <div style={{ fontSize: "12px", color: "var(--t3)", lineHeight: 1.6 }}>Platform takes a % of marketplace runs. Design subject to change pending legal review.</div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: "var(--t4)", fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Status</div>
                  <div style={{ fontSize: "11px", color: "#f59e0b", fontFamily: "var(--mono)", background: "rgba(245,158,11,0.08)", padding: "4px 8px", borderRadius: "3px", border: "0.5px solid rgba(245,158,11,0.2)" }}>concept — not implemented</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ──────────────────── FINAL CTA ──────────────────────────── */}
      <section style={{ padding: "100px 32px", position: "relative", overflow: "hidden" }}>
        <div aria-hidden style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle, rgba(124,113,232,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: "640px", margin: "0 auto", textAlign: "center", position: "relative" }}>
          <motion.div {...fade(0)}>
            <Label>ready to build?</Label>
            <h2 style={{ fontSize: "40px", fontWeight: 500, color: "var(--t1)", letterSpacing: "-0.04em", lineHeight: 1.05, marginBottom: "18px" }}>
              Learn. Build. Deploy. Monetize.
            </h2>
            <p style={{ fontSize: "14px", color: "var(--t2)", lineHeight: 1.75, marginBottom: "36px" }}>
              Start with Lesson 1 — it takes 15 minutes. By the end you&apos;ll have a working inference loop and the mental model everything else builds on.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/learn/01_intro" style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "14px", padding: "12px 28px", borderRadius: "6px", background: "var(--acc)", color: "#000", fontWeight: 500, textDecoration: "none" }}>
                <i className="ti ti-player-play" aria-hidden />
                Lesson 1 — Introduction
              </Link>
              <Link href="/marketplace" style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "14px", padding: "12px 28px", borderRadius: "6px", background: "transparent", color: "var(--t2)", border: "0.5px solid var(--bd2)", textDecoration: "none" }}>
                <i className="ti ti-shopping-bag" aria-hidden />
                Browse marketplace
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
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          {[
            { href: "/learn", label: "Learn" },
            { href: "/marketplace", label: "Marketplace" },
            { href: "/battle", label: "Battle" },
            { href: "/docs", label: "Docs" },
          ].map(l => (
            <Link key={l.href} href={l.href} style={{ fontSize: "11px", color: "var(--t4)", textDecoration: "none", fontFamily: "var(--mono)" }}>{l.label}</Link>
          ))}
        </div>
        <span style={{ fontSize: "11px", color: "var(--t4)", fontFamily: "var(--mono)" }}>14 lessons · x402 live · MIT license</span>
      </footer>

    </div>
  );
}
