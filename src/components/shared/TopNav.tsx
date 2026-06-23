"use client";

import Link from "next/link";
import Image from "next/image";
import { SocialIcons } from "./SocialIcons";

interface TopNavProps {
  crumb?: React.ReactNode;
  progress?: number;
  total?: number;
  backHref?: string;
  backLabel?: string;
}

export function TopNav({ crumb, progress, total = 14, backHref, backLabel }: TopNavProps) {
  const pct = progress !== undefined ? `${progress}/${total}` : `0/${total}`;

  return (
    <nav
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        padding: "0 24px",
        height: "56px",
        borderBottom: "0.5px solid var(--bd)",
        background: "var(--bg)",
        flexShrink: 0,
      }}
    >
      {/* Left: logo + breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
          <Image src="/logo-agent.png" alt="logo" width={28} height={28} style={{ borderRadius: "4px" }} />
          <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--t1)", letterSpacing: "-0.02em" }}>
            agent
          </span>
        </Link>
        {crumb && (
          <>
            <div style={{ width: "0.5px", height: "16px", background: "var(--bd2)" }} />
            <div style={{ fontSize: "12px", color: "var(--t3)", fontFamily: "var(--mono)" }}>{crumb}</div>
          </>
        )}
      </div>

      {/* Center: nav links */}
      <div style={{ display: "flex", gap: "4px" }}>
        {[
          { href: "/learn", label: "Learn" },
          { href: "/agents", label: "My Agents" },
          { href: "/marketplace", label: "Marketplace" },
          { href: "/missions", label: "Missions" },
          { href: "/battle", label: "Battle" },
          { href: "/docs",  label: "Docs"    },
        ].map(l => (
          <Link key={l.href} href={l.href} style={{ fontSize: "13px", fontWeight: 500, color: "var(--t2)", textDecoration: "none", padding: "5px 12px", borderRadius: "4px" }}>
            {l.label}
          </Link>
        ))}
      </div>

      {/* Right: back + progress pills */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end" }}>
        <SocialIcons />
        {backHref && (
          <Link href={backHref} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "var(--t2)", padding: "4px 10px", borderRadius: "4px", border: "0.5px solid var(--bd2)", background: "transparent", textDecoration: "none" }}>
            ← {backLabel ?? "back"}
          </Link>
        )}
        <div style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "3px", background: "var(--bg3)", border: "0.5px solid var(--bd2)", color: "var(--t3)", fontFamily: "var(--mono)" }}>
          {pct}
        </div>
        <div style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "3px", color: "var(--green)", background: "#0a1f0f", border: "0.5px solid #166534", fontFamily: "var(--mono)" }}>
          ● ready
        </div>
      </div>
    </nav>
  );
}
