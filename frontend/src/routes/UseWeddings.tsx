import { PageShell } from "../components/layout/PageShell";
import { Section } from "../components/layout/Section";
import { Button } from "../components/ui/Button";
import { QrSample } from "../components/generator/Preview";
import { weddings } from "../content/usecases/weddings";
import { DEFAULT_DESIGN } from "../lib/schemas/design";
import { usePageMeta } from "../hooks/usePageMeta";
import { APP_NAME } from "../config";

const printDesign = {
  ...DEFAULT_DESIGN,
  frame: { ...DEFAULT_DESIGN.frame, style: "ticket" as const, text: "Scan for details", font: "Fraunces" as const },
};

export default function UseWeddings() {
  usePageMeta(`Weddings · ${APP_NAME}`, weddings.lead);
  return (
    <PageShell>
      <h1>{weddings.title}</h1>
      <p>{weddings.lead}</p>
      <Section title="Ideas">
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
          {weddings.ideas.map((idea) => (
            <div key={idea.title} style={{ border: "var(--border)", borderRadius: 6, padding: 16 }}>
              <h3 style={{ fontSize: "1.1rem" }}>{idea.title}</h3>
              <p>{idea.body}</p>
              <Button to={`/?type=${idea.type}${idea.preset ? `&preset=${idea.preset}` : ""}`}>Use this</Button>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Styling that suits print" lead="Ink on paper colors with a ticket frame and Fraunces frame text.">
        <div style={{ maxWidth: 280 }}><QrSample data="https://example.com/wedding" design={printDesign} /></div>
      </Section>
      <Section title="Print checklist">
        <ul>{weddings.checklist.map((c) => <li key={c}>{c}</li>)}</ul>
      </Section>
      <Button to="/?type=links&preset=wedding">Make a wedding code</Button>
    </PageShell>
  );
}
