export function PageHero({
  badge,
  title,
  subtitle,
}: {
  badge: string;
  title: React.ReactNode;
  subtitle: React.ReactNode;
}) {
  return (
    <section
      className="panel"
      style={{
        marginTop: "1rem",
        padding: "2rem 2rem 2.25rem",
        background:
          "radial-gradient(ellipse at top right, rgba(0,255,163,0.08), transparent 60%), var(--panel)",
      }}
    >
      <span
        className="tag"
        style={{
          fontSize: "0.6875rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--accent)",
          borderColor: "var(--accent)",
          background: "rgba(0,255,163,0.05)",
        }}
      >
        {badge}
      </span>
      <h1
        style={{
          fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
          fontWeight: 800,
          lineHeight: 1.1,
          marginTop: "0.875rem",
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </h1>
      <p
        style={{
          marginTop: "0.875rem",
          fontSize: "1rem",
          color: "var(--muted)",
          maxWidth: "640px",
          lineHeight: 1.6,
        }}
      >
        {subtitle}
      </p>
    </section>
  );
}
