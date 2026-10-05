import { useEffect, useState } from "react";
import { PageShell } from "../components/layout/PageShell";
import { api } from "../lib/api";
import { usePageMeta } from "../hooks/usePageMeta";
import { APP_NAME } from "../config";

function humanize(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h}h ${m}m ${s}s`;
}

export default function Status() {
  usePageMeta(`Status · ${APP_NAME}`, "Service status.");
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState(false);
  const [checked, setChecked] = useState<Date | null>(null);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      if (document.hidden) return;
      try {
        const h = await api.health();
        if (!alive) return;
        setData(h);
        setErr(false);
        setChecked(new Date());
      } catch {
        if (!alive) return;
        setErr(true);
        setChecked(new Date());
      }
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  return (
    <PageShell narrow>
      <h1>Status</h1>
      {!checked ? <p style={{ color: "var(--ink-3)" }}>Checking…</p> :
        err ? <p><span style={{ color: "var(--danger)" }}>●</span> The service is not responding</p> :
        <p><span style={{ color: "var(--success)" }}>●</span> All systems operational</p>}
      <div style={{ display: "grid", gap: 8, marginTop: 24 }}>
        <div>API: {err ? "down" : "ok"}</div>
        <div>Database: {data?.db ?? "—"}</div>
        <div>Version: {data?.version ?? "—"}</div>
        <div>Uptime: {data ? humanize(data.uptimeSec) : "—"}</div>
        <div>Last checked: {checked ? checked.toLocaleTimeString() : "—"}</div>
      </div>
      <p style={{ marginTop: 24 }}>Static codes are created in your browser and keep working even when the service is down. Editable codes need the service to redirect.</p>
    </PageShell>
  );
}
