import { useMemo, useState } from "react";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/Button";
import { CopyField } from "../components/ui/CopyField";
import { Notice } from "../components/ui/Notice";
import { API_DOCS } from "../content/apiDocs";
import { api } from "../lib/api";
import { usePageMeta } from "../hooks/usePageMeta";
import { APP_NAME } from "../config";

export default function ApiDocs() {
  usePageMeta(`API · ${APP_NAME}`, "Create editable codes with an API key.");
  const origin = useMemo(() => (typeof window !== "undefined" ? window.location.origin : ""), []);
  const [keys, setKeys] = useState<{ apiKey: string; manageToken: string } | null>(null);
  const [err, setErr] = useState("");
  return (
    <PageShell>
      <h1>API</h1>
      <p>Base URL: <code>{origin}</code></p>
      <div style={{ display: "grid", gap: 32, gridTemplateColumns: "200px minmax(0,1fr)" }}>
        <nav style={{ position: "sticky", top: 72, alignSelf: "start" }}>
          {API_DOCS.map((s) => <a key={s.id} href={`#${s.id}`} style={{ display: "block", fontSize: 14, marginBottom: 8, color: "var(--ink-2)", textDecoration: "none" }}>{s.title}</a>)}
        </nav>
        <div>
          <Button onClick={async () => {
            try {
              setErr("");
              const k = await api.createKey();
              setKeys({ apiKey: k.apiKey, manageToken: k.manageToken });
            } catch (e: any) { setErr(e.message || "Failed"); }
          }}>Get an API key</Button>
          {err ? <Notice tone="danger">{err}</Notice> : null}
          {keys ? (
            <div style={{ margin: "16px 0" }}>
              <Notice tone="success">Shown once. We only store a hash.</Notice>
              <CopyField label="API key" value={keys.apiKey} />
              <CopyField label="Manage token (lets you revoke the key)" value={keys.manageToken} />
            </div>
          ) : null}
          {API_DOCS.map((s) => (
            <section key={s.id} id={s.id} style={{ marginTop: 32 }}>
              <h2>{s.title}</h2>
              <p>{s.prose}</p>
              {s.curl ? (
                <pre style={{ background: "var(--card)", border: "var(--border)", borderRadius: 6, padding: 12, overflow: "auto", fontSize: 12 }}>
                  <code>{s.curl.replaceAll("$ORIGIN", origin)}</code>
                </pre>
              ) : null}
              {s.response ? (
                <pre style={{ background: "var(--card)", border: "var(--border)", borderRadius: 6, padding: 12, overflow: "auto", fontSize: 12 }}>
                  <code>{s.response}</code>
                </pre>
              ) : null}
            </section>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
