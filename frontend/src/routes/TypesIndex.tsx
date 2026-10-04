import { Link } from "react-router-dom";
import { PageShell } from "../components/layout/PageShell";
import { TYPE_COPY } from "../content/types";
import { STATIC_META, DYNAMIC_META } from "../content/typeMeta";
import { usePageMeta } from "../hooks/usePageMeta";
import { APP_NAME } from "../config";

function Grid({ items }: { items: { slug: string; label: string }[] }) {
  return (
    <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", marginBottom: 48 }}>
      {items.map((t) => {
        const copy = TYPE_COPY[t.slug];
        return (
          <Link key={t.slug} to={`/types/${t.slug}`} style={{ border: "var(--border)", borderRadius: 6, padding: 16, textDecoration: "none", color: "var(--ink)", background: "var(--card)" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--hairline-strong)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--hairline)")}>
            <div style={{ fontWeight: 550, marginBottom: 6 }}>{t.label}</div>
            <div style={{ color: "var(--ink-2)", fontSize: 14 }}>{copy?.short}</div>
          </Link>
        );
      })}
    </div>
  );
}

export default function TypesIndex() {
  usePageMeta(`Types · ${APP_NAME}`, "Every QR type in one place.");
  return (
    <PageShell>
      <h1>Every type, one place.</h1>
      <h2>Instant (static)</h2>
      <Grid items={STATIC_META} />
      <h2>Editable (dynamic)</h2>
      <Grid items={DYNAMIC_META} />
    </PageShell>
  );
}
