import { useEffect, useState } from "react";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/Button";
import { Field } from "../components/ui/Field";
import { Notice } from "../components/ui/Notice";
import { list, remove, add, exportJson, importJson, isStorageBlocked, type MineEntry } from "../lib/mine";
import { api } from "../lib/api";
import { usePageMeta } from "../hooks/usePageMeta";
import { APP_NAME } from "../config";

export default function Mine() {
  usePageMeta(`My codes · ${APP_NAME}`, "Editable codes saved in this browser.");
  const [items, setItems] = useState<MineEntry[]>([]);
  const [token, setToken] = useState("");
  const [confirmSlug, setConfirmSlug] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const refresh = () => setItems(list());
  useEffect(() => { refresh(); }, []);

  return (
    <PageShell>
      <h1>My codes</h1>
      <p>Editable codes you created in this browser. Clearing site data removes this list, but the edit links keep working if you saved them elsewhere.</p>
      {isStorageBlocked() ? <Notice tone="danger">This browser isn't letting us save your list. Copy your edit links somewhere safe.</Notice> : null}
      {msg ? <Notice>{msg}</Notice> : null}
      {!items.length ? (
        <div>
          <p>Nothing here yet. Editable codes you create on this browser will appear here.</p>
          <Button to="/?type=website">Create an editable code</Button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((e) => (
            <div key={e.slug} style={{ border: "var(--border)", borderRadius: 6, padding: 16, background: "var(--card)" }}>
              <div style={{ fontWeight: 550 }}>{e.title || e.type}</div>
              <div style={{ fontSize: 14, color: "var(--ink-2)" }}>{e.type} · {new Date(e.createdAt).toLocaleString()}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                <Button to={`/e/${e.editToken}`}>Edit</Button>
                <Button variant="secondary" onClick={async () => { await navigator.clipboard.writeText(e.editUrl); setMsg("Copied edit link"); }}>Copy edit link</Button>
                <Button variant="secondary" onClick={async () => { await navigator.clipboard.writeText(e.publicUrl); setMsg("Copied public link"); }}>Copy public link</Button>
                {confirmSlug === e.slug ? (
                  <Button variant="dangerConfirm" onClick={() => { remove(e.slug); setConfirmSlug(null); refresh(); setMsg("Removed from this list only — the code still exists on the server."); }}>Confirm remove from list</Button>
                ) : (
                  <Button variant="danger" onClick={() => setConfirmSlug(e.slug)}>Remove from list</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop: 32, maxWidth: 480 }}>
        <h2>Add an edit link</h2>
        <Field label="Edit URL or token" value={token} onChange={(e) => setToken(e.target.value)} />
        <Button onClick={async () => {
          const m = token.match(/vqe_[A-Za-z0-9_-]+/);
          const t = m?.[0] || token.trim();
          try {
            const doc = await api.getCode(t);
            add({
              slug: doc.slug,
              editToken: t,
              type: doc.type as any,
              title: doc.title,
              publicUrl: doc.publicUrl,
              editUrl: `${location.origin}/e/${t}`,
              createdAt: doc.createdAt,
              design: doc.design,
            });
            setToken("");
            refresh();
          } catch {
            setMsg("Could not find that edit link.");
          }
        }}>Add</Button>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <Button variant="secondary" onClick={() => {
          const blob = new Blob([exportJson()], { type: "application/json" });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "vesper-my-codes.json";
          a.click();
        }}>Export list</Button>
        <label style={{ display: "inline-flex" }}>
          <Button variant="secondary" onClick={() => document.getElementById("import-mine")?.click()}>Import list</Button>
          <input id="import-mine" type="file" accept="application/json" hidden onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            importJson(await f.text());
            refresh();
          }} />
        </label>
      </div>
    </PageShell>
  );
}
