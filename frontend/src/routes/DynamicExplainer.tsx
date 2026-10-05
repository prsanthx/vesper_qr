import { Link } from "react-router-dom";
import { PageShell } from "../components/layout/PageShell";
import { Section } from "../components/layout/Section";
import { Button } from "../components/ui/Button";
import { DYNAMIC_META } from "../content/typeMeta";
import { usePageMeta } from "../hooks/usePageMeta";
import { APP_NAME } from "../config";

export default function DynamicExplainer() {
  usePageMeta(`Editable codes · ${APP_NAME}`, "Print once, change later with editable QR codes.");
  return (
    <PageShell>
      <h1>Editable codes: print once, change later.</h1>
      <p>Editable codes encode a short link on Vesper. You can change what they open, host a landing page, and see scan counts — without an account.</p>
      <Section title="How editing works without an account">
        <ol>
          <li>You create a code.</li>
          <li>You get a public link and a private edit link.</li>
          <li>The edit link is your key.</li>
          <li>We keep a copy in this browser under My codes.</li>
          <li>Anyone with the edit link can change the code, so keep it private.</li>
        </ol>
      </Section>
      <Section title="What gets counted">
        <p>Each recorded scan stores time, country if available, device class, OS family, and a salted hash of the IP — never the raw IP. No cookies, no third-party analytics.</p>
      </Section>
      <Section title="Editable types">
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))" }}>
          {DYNAMIC_META.map((t) => <Link key={t.slug} to={`/types/${t.slug}`} style={{ border: "var(--border)", borderRadius: 6, padding: 12, textDecoration: "none", color: "var(--ink)" }}>{t.label}</Link>)}
        </div>
      </Section>
      <Section title="Static vs Editable">
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead><tr><th align="left"></th><th align="left">Static</th><th align="left">Editable</th></tr></thead>
          <tbody>
            {[
              ["Changes after printing", "No", "Yes"],
              ["Scan counts", "No", "Yes"],
              ["Landing page", "No", "Often"],
              ["Works offline to create", "Yes", "No"],
              ["Needs our server to resolve", "No", "Yes"],
              ["File uploads", "Logo only (local)", "Yes"],
            ].map(([r, a, b]) => (
              <tr key={r} style={{ borderTop: "var(--border)" }}>
                <td style={{ padding: "8px 0" }}>{r}</td><td>{a}</td><td>{b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
      <Button to="/?type=website">Create an editable code</Button>
    </PageShell>
  );
}
