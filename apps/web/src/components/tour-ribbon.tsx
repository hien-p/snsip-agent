import Link from "next/link";
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import { neighbors, tourStep, type TourStep } from "@/lib/tour";

export function TourRibbon({ slug }: { slug: TourStep["slug"] }) {
  const step = tourStep(slug);
  const { prev, next } = neighbors(slug);

  return (
    <div
      style={{
        marginTop: "1rem",
        padding: "0.625rem 1rem",
        background: "var(--text)",
        color: "#fafafa",
        borderRadius: "var(--radius-md)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.875rem",
        flexWrap: "wrap",
        fontSize: "0.8125rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", minWidth: 0 }}>
        <MapPin size={14} style={{ color: "var(--accent)", flexShrink: 0 }} />
        <span
          style={{
            background: "var(--accent)",
            color: "var(--text)",
            padding: "0.125rem 0.5rem",
            borderRadius: "999px",
            fontSize: "0.6875rem",
            fontWeight: 700,
            letterSpacing: "0.04em",
            flexShrink: 0,
          }}
        >
          STEP {step.index} / {step.total}
        </span>
        <span style={{ fontWeight: 600, flexShrink: 0 }}>{step.theme}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        {prev ? (
          <Link
            href={prev.href}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
              color: "rgba(250,250,250,0.7)",
              fontSize: "0.75rem",
            }}
          >
            <ArrowLeft size={12} /> {prev.theme}
          </Link>
        ) : (
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
              color: "rgba(250,250,250,0.7)",
              fontSize: "0.75rem",
            }}
          >
            <ArrowLeft size={12} /> Home
          </Link>
        )}
        {next && (
          <Link
            href={next.href}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
              color: "var(--accent)",
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
          >
            Next: {next.theme} <ArrowRight size={12} />
          </Link>
        )}
      </div>
    </div>
  );
}

export function TourFooter({ slug }: { slug: TourStep["slug"] }) {
  const step = tourStep(slug);
  const { prev, next } = neighbors(slug);
  return (
    <section
      className="panel"
      style={{
        marginTop: "1.5rem",
        padding: "1.5rem 1.75rem",
        background: "var(--accent-bg)",
        borderColor: "#cfe39b",
        display: "grid",
        gap: "0.875rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap" }}>
        <strong style={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-2)" }}>
          What this proves
        </strong>
        <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{step.theme}</span>
      </div>
      <p style={{ margin: 0, fontSize: "0.9375rem", lineHeight: 1.6 }}>{step.whyItMatters}</p>
      <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted-2)", fontStyle: "italic" }}>
        Bounty text addressed: <span style={{ color: "var(--text)" }}>“{step.bountyAnchor}”</span>
      </p>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
        {prev ? (
          <Link href={prev.href} className="btn-ghost" style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", textDecoration: "none" }}>
            ← Step {prev.index}: {prev.theme}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={next.href} className="btn-accent" style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", textDecoration: "none" }}>
            Next → Step {next.index}: {next.theme}
          </Link>
        ) : (
          <Link href="/" className="btn-accent" style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", textDecoration: "none" }}>
            Tour complete — back to home
          </Link>
        )}
      </div>
    </section>
  );
}
