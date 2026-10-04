import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageShell } from "../components/layout/PageShell";
import { TypeForm, type FormValues } from "../components/generator/TypeForm";
import { DesignPanel } from "../components/generator/DesignPanel";
import { Preview } from "../components/generator/Preview";
import { Tabs, TabPanel } from "../components/ui/Tabs";
import { Button } from "../components/ui/Button";
import { Field } from "../components/ui/Field";
import { CopyField } from "../components/ui/CopyField";
import { Notice } from "../components/ui/Notice";
import { Spinner } from "../components/ui/Spinner";
import { api, type CodeDoc } from "../lib/api";
import { add as addMine, list, remove, update } from "../lib/mine";
import { downloadPng, downloadSvg, exportFilename } from "../lib/qr/export";
import { renderQrSvg } from "../lib/qr/render";
import { DEFAULT_DESIGN, type Design } from "../lib/schemas/design";
import { usePageMeta } from "../hooks/usePageMeta";
import { APP_NAME, type DynamicType } from "../config";
import { typeLabel } from "../content/typeMeta";

export default function EditCode() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<CodeDoc | null>(null);
  const [missing, setMissing] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [tab, setTab] = useState("content");
  const [values, setValues] = useState<FormValues>({});
  const [design, setDesign] = useState<Design>(DEFAULT_DESIGN);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [feedback, setFeedback] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  usePageMeta(`Edit code · ${APP_NAME}`, "Edit an editable QR code.", { noindex: true });

  useEffect(() => {
    (async () => {
      try {
        const d = await api.getCode(token);
        setDoc(d);
        setValues(d.payload);
        setDesign(d.design);
        setTitle(d.title);
        if (!list().some((e) => e.slug === d.slug)) {
          addMine({
            slug: d.slug,
            editToken: token,
            type: d.type as DynamicType,
            title: d.title,
            publicUrl: d.publicUrl,
            editUrl: `${location.origin}/e/${token}`,
            createdAt: d.createdAt,
            design: d.design,
          });
          setSavedNotice(true);
        }
      } catch {
        setMissing(true);
      }
    })();
  }, [token]);

  useEffect(() => {
    if (tab === "scans" && token) api.stats(token).then(setStats).catch(() => {});
    if (tab === "feedback" && token) api.feedbackList(token).then(setFeedback).catch(() => {});
  }, [tab, token]);

  const tabs = useMemo(() => {
    const base = [
      { id: "content", label: "Content" },
      { id: "design", label: "Design" },
      { id: "scans", label: "Scans" },
    ];
    if (doc?.type === "feedback") base.push({ id: "feedback", label: "Feedback" });
    base.push({ id: "settings", label: "Settings" });
    return base;
  }, [doc?.type]);

  if (missing) {
    return (
      <PageShell>
        <Notice tone="danger">This edit link doesn't match any code. It may have been deleted, or the link was copied incompletely.</Notice>
        <Link to="/mine">My codes</Link>
      </PageShell>
    );
  }
  if (!doc) return <PageShell><Spinner /></PageShell>;

  const saveContent = async () => {
    setSaving(true);
    try {
      const patchPayload = { ...values };
      for (const k of Object.keys(patchPayload)) {
        if (k.startsWith("_") || k.endsWith("Local")) delete patchPayload[k];
      }
      const updated = await api.patchCode(token, { title, payload: patchPayload });
      setDoc(updated);
      update(doc.slug, { title: updated.title });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } catch (e: any) {
      setErrors({ _form: e.message || "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  const saveDesign = async () => {
    setSaving(true);
    try {
      const d = structuredClone(design);
      if (d.logo.kind === "upload") {
        const { dataUrl: _, ...rest } = d.logo;
        d.logo = rest;
      }
      const updated = await api.patchCode(token, { design: d });
      setDoc(updated);
      update(doc.slug, { design: updated.design, title: updated.title });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } catch (e: any) {
      setErrors({ _form: e.message || "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell>
      {savedNotice ? <Notice>Saved to My codes on this browser</Notice> : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "space-between" }}>
        <div style={{ flex: "1 1 320px" }}>
          <Field label="Title" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} />
          <div style={{ display: "inline-block", border: "var(--border)", borderRadius: 6, padding: "2px 8px", fontSize: 12, marginBottom: 12 }}>
            {typeLabel(doc.type as never)}
          </div>
          <CopyField label="Public link" value={doc.publicUrl} />
          <p style={{ fontSize: 14, color: "var(--ink-2)" }}>
            Created {new Date(doc.createdAt).toLocaleString()} · Updated {new Date(doc.updatedAt).toLocaleString()}
          </p>
        </div>
        <div style={{ width: 220 }}>
          <Preview data={doc.publicUrl} design={design} typeLabel={doc.type} />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <Button variant="secondary" onClick={async () => {
              const svg = await renderQrSvg(doc.publicUrl, design);
              await downloadPng(svg, 1024, exportFilename(doc.type, "png"));
            }}>PNG</Button>
            <Button variant="secondary" onClick={async () => {
              const svg = await renderQrSvg(doc.publicUrl, design);
              downloadSvg(svg, exportFilename(doc.type, "svg"));
            }}>SVG</Button>
          </div>
        </div>
      </div>

      <Tabs tabs={tabs} value={tab} onChange={setTab} />
      {savedFlash ? <Notice tone="success">Saved ✓</Notice> : null}
      {errors._form ? <Notice tone="danger">{errors._form}</Notice> : null}

      <TabPanel id="content" value={tab}>
        <Notice>Your printed code keeps working — only what it opens changes.</Notice>
        <TypeForm type={doc.type as never} values={values} errors={errors} onChange={setValues} />
        <Button onClick={() => void saveContent()} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
      </TabPanel>

      <TabPanel id="design" value={tab}>
        <div style={{ display: "grid", gap: 24, gridTemplateColumns: "minmax(0,1fr) 280px" }}>
          <DesignPanel design={design} onChange={setDesign} />
          <Preview data={doc.publicUrl} design={design} typeLabel={doc.type} />
        </div>
        <Button onClick={() => void saveDesign()} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
      </TabPanel>

      <TabPanel id="scans" value={tab}>
        {!stats ? <Spinner /> : (
          <>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-4xl)" }}>{stats.total}</div>
            <p>Total scans · last 30 days below</p>
            <svg viewBox="0 0 300 60" width="100%" height="60" role="img" aria-label="Scans last 30 days">
              {(stats.last30Days as { date: string; count: number }[]).map((d, i) => {
                const max = Math.max(1, ...stats.last30Days.map((x: any) => x.count));
                const h = d.count === 0 ? 1 : Math.max(2, (d.count / max) * 50);
                return (
                  <rect key={d.date} x={i * 10} y={60 - h} width={8} height={h}
                    fill={d.count === 0 ? "var(--hairline)" : "var(--accent)"}>
                    <title>{`${d.date}: ${d.count}`}</title>
                  </rect>
                );
              })}
            </svg>
            <p style={{ fontSize: 14, color: "var(--ink-3)" }}>Country appears when the server runs behind a proxy that provides it.</p>
            <h3>Recent</h3>
            {!stats.recent.length ? <p>No scans yet. Scan your code with a phone to test it.</p> : (
              <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
                <thead><tr><th align="left">Time</th><th align="left">Country</th><th align="left">Device</th><th align="left">OS</th></tr></thead>
                <tbody>
                  {stats.recent.map((r: any, i: number) => (
                    <tr key={i} style={{ borderTop: "var(--border)" }}>
                      <td style={{ padding: "6px 0" }}>{new Date(r.ts).toLocaleString()}</td>
                      <td>{r.country || "—"}</td>
                      <td>{r.device}</td>
                      <td>{r.os}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </TabPanel>

      <TabPanel id="feedback" value={tab}>
        {!feedback ? <Spinner /> : (
          <>
            <p>Average: {feedback.average ?? "—"} · {feedback.count} responses</p>
            <ul>
              {[1, 2, 3, 4, 5].map((n) => (
                <li key={n}>{n}★ — {feedback.distribution?.[n] || 0}</li>
              ))}
            </ul>
            {(feedback.items || []).map((it: any, i: number) => (
              <div key={i} style={{ borderTop: "var(--border)", padding: "8px 0" }}>
                <strong>{it.rating}★</strong> {it.comment || ""}
                <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{new Date(it.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </>
        )}
      </TabPanel>

      <TabPanel id="settings" value={tab}>
        <Button variant="secondary" onClick={() => window.open(`/r/${doc.slug}?preview=1`, "_blank")}>Preview landing page</Button>
        <div style={{ marginTop: 32, border: "1px solid var(--danger)", borderRadius: 6, padding: 16 }}>
          <h3 style={{ color: "var(--danger)" }}>Danger zone</h3>
          <p>Delete this code. Type the slug <code>{doc.slug}</code> to confirm.</p>
          <Field label="Slug" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} />
          <Button
            variant="dangerConfirm"
            disabled={deleteConfirm !== doc.slug}
            onClick={async () => {
              await api.deleteCode(token);
              remove(doc.slug);
              navigate("/mine");
            }}
          >
            Delete this code
          </Button>
        </div>
      </TabPanel>
    </PageShell>
  );
}
