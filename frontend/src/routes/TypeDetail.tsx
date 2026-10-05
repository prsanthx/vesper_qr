import { Link, useParams } from "react-router-dom";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/Button";
import { QrSample } from "../components/generator/Preview";
import { TYPE_COPY } from "../content/types";
import { encodeStatic } from "../lib/payloads";
import { DEFAULT_DESIGN } from "../lib/schemas/design";
import { isStaticType } from "../config";
import { usePageMeta } from "../hooks/usePageMeta";
import { APP_NAME } from "../config";
import NotFound from "./NotFound";

export default function TypeDetail() {
  const { slug = "" } = useParams();
  const copy = TYPE_COPY[slug];
  usePageMeta(copy ? `${copy.name} QR code · ${APP_NAME}` : `Not found · ${APP_NAME}`, copy?.lead || "");
  if (!copy) return <NotFound />;
  const sampleData = isStaticType(slug)
    ? encodeStatic(slug, copy.example)
    : `${typeof location !== "undefined" ? location.origin : ""}/r/preview`;
  return (
    <PageShell>
      <nav style={{ fontSize: 14, color: "var(--ink-2)", marginBottom: 12 }}>
        <Link to="/types">Types</Link> / {copy.name}
      </nav>
      <div style={{ display: "inline-block", border: "var(--border)", borderRadius: 6, padding: "2px 8px", fontSize: 12, marginBottom: 12 }}>
        {copy.kind === "static" ? "Static" : "Editable"}
      </div>
      <h1>{copy.name} QR code</h1>
      <p>{copy.lead}</p>
      <div style={{ display: "grid", gap: 32, gridTemplateColumns: "minmax(0,1fr)", marginTop: 24 }}>
        <div style={{ display: "grid", gap: 24, gridTemplateColumns: "minmax(0,1fr) minmax(0,280px)" }}>
          <div>
            <h2>What it does</h2>
            {copy.body.map((p) => <p key={p}>{p}</p>)}
          </div>
          <QrSample data={sampleData || "https://example.com"} design={DEFAULT_DESIGN} />
        </div>
      </div>
      <h2>Tips</h2>
      <ul>{copy.tips.map((t) => <li key={t}>{t}</li>)}</ul>
      <Button to={`/?type=${slug}`}>Create a {copy.name} code</Button>
      <p style={{ marginTop: 24 }}>Related: {copy.related.map((r) => <Link key={r} to={`/types/${r}`} style={{ marginRight: 12 }}>{TYPE_COPY[r]?.name || r}</Link>)}</p>
    </PageShell>
  );
}
