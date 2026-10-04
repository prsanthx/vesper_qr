import { Link } from "react-router-dom";
import { PageShell } from "../components/layout/PageShell";
import { Section } from "../components/layout/Section";
import { Button } from "../components/ui/Button";
import { QrSample } from "../components/generator/Preview";
import { DEFAULT_DESIGN } from "../lib/schemas/design";
import { STATIC_META } from "../content/typeMeta";
import { usePageMeta } from "../hooks/usePageMeta";
import { APP_NAME } from "../config";

export default function StaticExplainer() {
  usePageMeta(`Static codes · ${APP_NAME}`, "Static QR codes bake content into the pattern.");
  return (
    <PageShell>
      <h1>Static codes: the content is the code.</h1>
      <p>Static means the data is baked into the pattern. It works forever, cannot be changed later, has no scan stats, and is generated on your device.</p>
      <Section title="How it works">
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
          {["Choose a type", "Fill it in", "Download"].map((label, i) => (
            <div key={label} style={{ border: "var(--border)", borderRadius: 6, padding: 16 }}>
              <div style={{ fontWeight: 550, marginBottom: 8 }}>{i + 1}. {label}</div>
              <QrSample data="https://example.com" design={DEFAULT_DESIGN} />
            </div>
          ))}
        </div>
      </Section>
      <Section title="Good for">
        <ul><li>Wi-Fi at home</li><li>A business card vCard</li><li>A fixed URL printed once</li><li>A phone number</li></ul>
      </Section>
      <Section title="Not good for">
        <p>Anything you may need to change after printing. Use <Link to="/dynamic">editable codes</Link> instead.</p>
      </Section>
      <Section title="Instant types">
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))" }}>
          {STATIC_META.map((t) => <Link key={t.slug} to={`/types/${t.slug}`} style={{ border: "var(--border)", borderRadius: 6, padding: 12, textDecoration: "none", color: "var(--ink)" }}>{t.label}</Link>)}
        </div>
      </Section>
      <Button to="/?type=link">Create a static code</Button>
    </PageShell>
  );
}
