"use client";

// ReputationGauge: 0–10000 horizontal bar with animated fill + sparkline.
// Designed to be the visual anchor of the latency theatre — every successful
// "tap" bumps it up, and the user feels the difference between L1 and ER taps
// as a visible fill rate.
export function ReputationGauge({
  score,
  history,
  label,
  accentColor,
}: {
  score: number;
  history: number[]; // last N scores, oldest first
  label: string;
  accentColor: string;
}) {
  const pct = Math.max(0, Math.min(100, (score / 10_000) * 100));

  return (
    <div className="panel" style={{ background: "var(--panel-2)", padding: "1rem", display: "grid", gap: "0.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <strong style={{ fontSize: "0.875rem", color: "var(--muted)" }}>{label}</strong>
        <span style={{ fontFamily: "monospace", fontSize: "1.125rem" }}>{score.toLocaleString()} / 10000</span>
      </div>

      <div style={{ height: "0.5rem", background: "var(--bg)", borderRadius: "999px", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: accentColor,
            transition: "width 120ms ease-out",
          }}
        />
      </div>

      <Sparkline values={history} accentColor={accentColor} />
    </div>
  );
}

function Sparkline({ values, accentColor }: { values: number[]; accentColor: string }) {
  if (values.length < 2) {
    return <div style={{ height: "32px", color: "var(--muted)", fontSize: "0.75rem" }}>(no history yet)</div>;
  }
  const w = 200;
  const h = 32;
  const max = Math.max(...values, 1);
  const stepX = w / (values.length - 1);
  const points = values
    .map((v, i) => `${i * stepX},${h - (v / max) * h}`)
    .join(" ");

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <polyline
        points={points}
        fill="none"
        stroke={accentColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
