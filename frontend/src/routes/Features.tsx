import { PageShell } from "../components/layout/PageShell";
import { Section } from "../components/layout/Section";
import { Button } from "../components/ui/Button";
import { QrSample } from "../components/generator/Preview";
import { DEFAULT_DESIGN, type Design } from "../lib/schemas/design";
import { DYNAMIC_META } from "../content/typeMeta";
import { usePageMeta } from "../hooks/usePageMeta";
import { APP_NAME } from "../config";
import { Link } from "react-router-dom";

const samples: Design[] = [
  DEFAULT_DESIGN,
  { ...DEFAULT_DESIGN, dots: { ...DEFAULT_DESIGN.dots, color: "#6f4524" }, cornersDot: { ...DEFAULT_DESIGN.cornersDot, color: "#6f4524" } },
  { ...DEFAULT_DESIGN, dots: { ...DEFAULT_DESIGN.dots, type: "classy", color: "#2f6f4e" }, cornersSquare: { ...DEFAULT_DESIGN.cornersSquare, color: "#2f6f4e" }, cornersDot: { ...DEFAULT_DESIGN.cornersDot, color: "#2f6f4e" } },
  { ...DEFAULT_DESIGN, frame: { ...DEFAULT_DESIGN.frame, style: "banner-bottom", text: "Scan me" }, background: { color: "#fffdf8", transparent: false } },
];

export default function Features() {
  usePageMeta(`Features · ${APP_NAME}`, "What Vesper includes.");
  return (
    <PageShell>
      <h1>What you get</h1>
      <Section title="Downloads without a gate" lead="PNG up to 2048px and SVG vectors. No email wall between you and the file." />
      <Section title="Made on your device" lead="Static codes never leave the browser. You can style and download them offline." />
      <Section title="Design controls" lead="Patterns, corners, colors, gradient, frames, and logos — shown here on the same URL.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12 }}>
          {samples.map((d, i) => <QrSample key={i} data="https://example.com" design={d} />)}
        </div>
      </Section>
      <Section title="Editable codes and landing pages" lead={`Fourteen editable types: ${DYNAMIC_META.map((t) => t.label).join(", ")}.`} />
      <Section title="Honest scan counts" lead="No cookies and no third-party scripts. Counts come only from scans of editable codes." />
      <Section title="Simple API" lead="Keys you can get in one click."><Link to="/api">Open the API docs</Link></Section>
      <Section title="Free, sponsored by people who find it useful" lead="No plans. Optional coffee keeps the lights on."><Link to="/sponsor">Sponsor</Link></Section>
      <Button to="/">Start creating</Button>
    </PageShell>
  );
}
