"use client";

import Link from "next/link";
import { motion, useMotionValue, useSpring } from "motion/react";
import { useRef } from "react";
import { ArrowDownRight, ArrowRight, KeyRound, ShieldCheck, Settings2, Sparkles } from "lucide-react";
import { WalletButton } from "@/components/wallet-button";
import { SnsExplorer } from "@/components/sns-explorer";
import { LiveAgentsPreview } from "@/components/live-agents-preview";

const ease = [0.23, 1, 0.32, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export default function Home() {
  return (
    <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "1.5rem" }}>
      <Header />
      <Hero />
      <StatsBar />
      <Section delay={0.05}>
        <JudgeTourEntry />
      </Section>
      <Section delay={0.1}>
        <HowItWorks />
      </Section>
      <Section delay={0.15}>
        <LiveAgentsPreview />
      </Section>
      <Section delay={0.2}>
        <div style={{ display: "grid", gap: "1rem" }}>
          <SnsExplorer />
        </div>
      </Section>
      <Section delay={0.1}>
        <WhyItMatters />
      </Section>
      <Footer />
    </main>
  );
}

function Section({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      style={{ marginTop: "3rem" }}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease, delay }}
    >
      {children}
    </motion.div>
  );
}

function Header() {
  return (
    <motion.header
      initial={{ y: -32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease }}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.875rem 1.25rem",
        flexWrap: "wrap",
        gap: "0.75rem",
        borderRadius: "999px",
        background: "var(--panel)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
        marginTop: "0.5rem",
      }}
    >
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", color: "var(--text)" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "1.625rem",
            height: "1.625rem",
            borderRadius: "999px",
            background: "var(--accent)",
            color: "var(--text)",
            fontSize: "0.875rem",
            fontWeight: 700,
          }}
        >
          ✦
        </span>
        <strong style={{ letterSpacing: "-0.01em" }}>SNSIP-Agent</strong>
        <span className="tag" style={{ marginLeft: "0.5rem" }}>devnet</span>
      </Link>
      <nav style={{ display: "flex", gap: "0.875rem", alignItems: "center", flexWrap: "wrap", fontSize: "0.875rem" }}>
        <Link href="/mcp" style={{ color: "var(--accent-2)", fontWeight: 600 }}>MCP</Link>
        <Link href="/agents" style={{ color: "var(--muted)" }}>Agents</Link>
        <Link href="/login-demo" style={{ color: "var(--muted)" }}>Sign-in</Link>
        <Link href="/airdrop-demo" style={{ color: "var(--muted)" }}>Airdrop</Link>
        <Link href="/swap-demo" style={{ color: "var(--muted)" }}>Swap</Link>
        <Link href="/playground/handshake" style={{ color: "var(--muted)" }}>Handshake</Link>
        <WalletButton />
      </nav>
    </motion.header>
  );
}

function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const x = useSpring(mouseX, { damping: 25, stiffness: 150 });
  const y = useSpring(mouseY, { damping: 25, stiffness: 150 });

  const onMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!sectionRef.current || window.innerWidth < 850) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    mouseX.set(((e.clientX - cx) / (rect.width / 2)) * 45);
    mouseY.set(((e.clientY - cy) / (rect.height / 2)) * 45);
  };
  const onLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <section
      ref={sectionRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        marginTop: "1.25rem",
        padding: "5rem 2.5rem 5.5rem",
        position: "relative",
        textAlign: "center",
        overflow: "hidden",
        borderRadius: "var(--radius-3xl)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-lg)",
        backgroundColor: "#ffffff",
      }}
    >
      {/* Solana-themed mesh gradient with parallax + slow ambient zoom */}
      <motion.div
        aria-hidden="true"
        className="solana-mesh hero-bg-zoom"
        style={{
          position: "absolute",
          inset: "-40px",
          x,
          y,
          zIndex: 0,
          filter: "saturate(1.05)",
        }}
      />
      {/* Light grain pattern over the mesh for texture */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          zIndex: 1,
          mixBlendMode: "multiply",
        }}
      />
      {/* Very light white scrim — just enough for text legibility */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.45) 100%)",
          zIndex: 2,
        }}
      />
      <div style={{ position: "relative", zIndex: 3 }}>
      <motion.div
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.12, delayChildren: 0.1 }}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}
      >
        <motion.span
          variants={fadeUp}
          transition={{ duration: 0.7, ease }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.4rem 0.9rem",
            borderRadius: "999px",
            border: "1px solid var(--border)",
            background: "var(--panel)",
            color: "var(--muted-2)",
            fontSize: "0.75rem",
            fontWeight: 500,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <Sparkles size={12} style={{ color: "var(--accent-2)" }} />
          SNS Identity Track · Colosseum Frontier
        </motion.span>

        <motion.h1
          variants={fadeUp}
          transition={{ duration: 0.8, ease }}
          style={{
            fontSize: "clamp(2.75rem, 7vw, 5.5rem)",
            fontWeight: 600,
            lineHeight: 1.04,
            letterSpacing: "-0.03em",
            margin: 0,
            maxWidth: "920px",
            color: "var(--text)",
          }}
        >
          Give your AI agent a{" "}
          <span className="serif-italic" style={{ color: "var(--accent-2)" }}>verifiable</span>
          <br />
          <span style={{ color: "var(--accent-2)" }}>.sol</span> identity.
        </motion.h1>

        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.8, ease }}
          style={{
            fontSize: "1.0625rem",
            color: "var(--muted-2)",
            maxWidth: "640px",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          SNSIP-Agent makes a <code>.sol</code> name the verifiable, revocable identity for any AI agent on Solana —
          on-chain signing keys, structured permissions, real reputation. Open standard. Real Ed25519. Live demo below.
        </motion.p>

        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.8, ease }}
          style={{ display: "flex", gap: "0.875rem", flexWrap: "wrap", justifyContent: "center", marginTop: "0.5rem" }}
        >
          <Link href="/agents" style={{ textDecoration: "none" }}>
            <motion.div
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "stretch",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  background: "var(--text)",
                  color: "#fafafa",
                  padding: "1rem 1.625rem",
                  borderRadius: "var(--radius-md) 0 0 var(--radius-md)",
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                }}
              >
                See live agents
              </span>
              <span
                style={{
                  background: "var(--accent)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "3rem",
                  borderRadius: "0 var(--radius-md) var(--radius-md) 0",
                  color: "var(--text)",
                }}
              >
                <ArrowDownRight size={16} />
              </span>
            </motion.div>
          </Link>
          <Link href="/playground/handshake" style={{ textDecoration: "none" }}>
            <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} className="btn-ghost">
              Run the handshake demo
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>
      </div>
    </section>
  );
}

function StatsBar() {
  const stats = [
    { value: "5", label: "agents on-chain" },
    { value: "25", label: "records v2 written" },
    { value: "38", label: "tests passing" },
    { value: "1", label: "draft SNSIP" },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease, delay: 0.5 }}
      className="panel"
      style={{
        marginTop: "1rem",
        padding: "1.125rem 1.5rem",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: "0.75rem",
      }}
    >
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 + i * 0.08, duration: 0.4 }}
          style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", justifyContent: "center" }}
        >
          <strong style={{ fontSize: "1.75rem", color: "var(--text)", fontFamily: "monospace", letterSpacing: "-0.02em" }}>
            {s.value}
          </strong>
          <span style={{ color: "var(--muted)", fontSize: "0.8125rem" }}>{s.label}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

function JudgeTourEntry() {
  const stops = [
    { num: 1, theme: "Social Identity", href: "/login-demo" },
    { num: 2, theme: "Sybil resistance", href: "/airdrop-demo" },
    { num: 3, theme: "Agent Identity", href: "/swap-demo" },
    { num: 4, theme: "MCP integration", href: "/mcp" },
  ];
  return (
    <section
      className="panel"
      style={{
        padding: "1.75rem 2rem",
        background: "var(--accent-bg)",
        borderColor: "#cfe39b",
        display: "grid",
        gap: "1rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
        <div style={{ display: "grid", gap: "0.25rem" }}>
          <span
            className="tag"
            style={{
              background: "var(--text)",
              color: "var(--accent)",
              borderColor: "var(--text)",
              alignSelf: "start",
              fontSize: "0.6875rem",
              letterSpacing: "0.08em",
            }}
          >
            JUDGING? START HERE
          </span>
          <h2 style={{ margin: 0, fontSize: "1.375rem", fontWeight: 700, letterSpacing: "-0.01em" }}>
            The 3-minute guided tour
          </h2>
          <p style={{ margin: 0, fontSize: "0.9375rem", color: "var(--muted-2)", maxWidth: "640px" }}>
            Four stops. Each one answers a specific line from the SNS Identity Track bounty. End at the
            MCP demo where Claude Desktop reads <code>swap-bot.sol</code>'s permission live and refuses
            an over-cap swap in its own voice.
          </p>
        </div>
        <Link href="/login-demo" style={{ textDecoration: "none" }}>
          <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} className="btn-accent">
            Start the tour <ArrowRight size={14} />
          </motion.button>
        </Link>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "0.625rem",
        }}
      >
        {stops.map((s) => (
          <Link
            key={s.num}
            href={s.href}
            style={{
              textDecoration: "none",
              padding: "0.875rem 1rem",
              background: "var(--panel)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "var(--text)",
              fontSize: "0.8125rem",
            }}
          >
            <span
              style={{
                background: "var(--accent)",
                color: "var(--text)",
                width: "1.5rem",
                height: "1.5rem",
                borderRadius: "999px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.75rem",
                flexShrink: 0,
              }}
            >
              {s.num}
            </span>
            <span style={{ fontWeight: 500 }}>{s.theme}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      Icon: KeyRound,
      title: "Register",
      body: "Pick a subdomain like myagent.alice.sol. One transaction creates the SNS subdomain and writes the agent's signing key + endpoint into records v2.",
      cta: { label: "Try the wizard", href: "#wizard" },
    },
    {
      Icon: ShieldCheck,
      title: "Verify",
      body: "Anyone issues a fresh nonce; the agent signs it; the signature is checked against the on-chain agent.signing-pubkey. Tamper a byte → instant ✗.",
      cta: { label: "Watch the handshake", href: "/playground/handshake" },
    },
    {
      Icon: Settings2,
      title: "Permission",
      body: "Structured grants on-chain: target program, spend cap per period, expiry. Burn the parent .sol → every sub-agent loses authority in the same block.",
      cta: { label: "See permission editor", href: "/agents/?domain=snsip-test-001.sol" },
    },
  ];
  return (
    <section style={{ display: "grid", gap: "1.5rem" }}>
      <header>
        <h2 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 600, margin: 0, letterSpacing: "-0.025em" }}>
          How it{" "}
          <span className="serif-italic" style={{ color: "var(--accent-2)" }}>works</span>
        </h2>
        <p style={{ fontSize: "1rem", color: "var(--muted-2)", marginTop: "0.5rem", maxWidth: "640px" }}>
          Three primitives. Every record lives on Solana — no off-chain database, no signed-message theater.
        </p>
      </header>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
        {steps.map((s, i) => (
          <motion.div
            key={s.title}
            whileHover={{ y: -4, boxShadow: "var(--shadow-md)" }}
            transition={{ duration: 0.2 }}
            className="panel"
            style={{ display: "grid", gap: "0.875rem", cursor: "default" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "2.5rem",
                  height: "2.5rem",
                  borderRadius: "999px",
                  background: "var(--accent)",
                  color: "var(--text)",
                }}
              >
                <s.Icon size={18} />
              </span>
              <span style={{ color: "var(--muted)", fontFamily: "monospace", fontSize: "0.75rem", marginLeft: "auto" }}>
                0{i + 1}
              </span>
            </div>
            <strong style={{ fontSize: "1.25rem", letterSpacing: "-0.015em", color: "var(--text)" }}>{s.title}</strong>
            <p style={{ fontSize: "0.9375rem", color: "var(--muted-2)", margin: 0, lineHeight: 1.55 }}>{s.body}</p>
            <Link
              href={s.cta.href}
              style={{
                color: "var(--text)",
                fontSize: "0.875rem",
                fontWeight: 500,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                marginTop: "auto",
              }}
            >
              {s.cta.label} <ArrowRight size={14} />
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function WhyItMatters() {
  return (
    <section
      style={{
        background: "var(--accent-bg)",
        padding: "2rem 2.25rem",
        display: "grid",
        gap: "1rem",
        borderRadius: "var(--radius-2xl)",
        border: "1px solid #d8e8a8",
      }}
    >
      <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 600, margin: 0, letterSpacing: "-0.02em", color: "var(--text)" }}>
        Why this <span className="serif-italic">matters</span>
      </h2>
      <p style={{ fontSize: "0.9375rem", color: "var(--muted-2)", lineHeight: 1.65, margin: 0 }}>
        Every AI agent on Solana today is just a private key. No name. No rules. No audit trail. If
        that key gets compromised, there is no on-chain way to stop the agent. SNSIP-Agent is the
        identity layer that fixes this — a <code>.sol</code> name carries the agent&apos;s signing key,
        endpoint, structured permissions (target program, spend cap, period, expiry), and reputation
        events. Anchor programs for Identity / Reputation / Validation are sketched in the repo; the{" "}
        <a href="https://docs.magicblock.gg/" target="_blank" rel="noreferrer" style={{ color: "var(--text)", fontWeight: 600 }}>
          MagicBlock Ephemeral Rollups
        </a>{" "}
        integration handles sub-50ms agent-to-agent settlement.
      </p>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <span className="tag" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>SNS records v2</span>
        <span className="tag" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>Anchor 0.30</span>
        <span className="tag" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>MagicBlock ER</span>
        <span className="tag" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>x402-compatible</span>
        <span className="tag" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>ERC-8004 port</span>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer
      style={{
        marginTop: "3.5rem",
        padding: "2rem 0 1.5rem",
        color: "var(--muted)",
        fontSize: "0.875rem",
        borderTop: "1px solid var(--border)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "0.75rem",
      }}
    >
      <div>
        Submission for the{" "}
        <strong style={{ color: "var(--text)" }}>SNS Identity Track</strong>
        {" — Colosseum Hackathon (Frontier)"}
      </div>
      <div style={{ display: "flex", gap: "1rem" }}>
        <a href="https://github.com/" target="_blank" rel="noreferrer" style={{ color: "var(--text)", fontWeight: 600 }}>
          Repo
        </a>
        <Link href="/spec" style={{ color: "var(--text)", fontWeight: 600 }}>Read the spec</Link>
      </div>
    </footer>
  );
}
