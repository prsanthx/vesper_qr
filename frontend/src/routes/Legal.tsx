import { useLocation } from "react-router-dom";
import { PageShell } from "../components/layout/PageShell";
import { privacy, terms, disclaimer, LEGAL_UPDATED } from "../content/legal";
import { usePageMeta } from "../hooks/usePageMeta";
import { APP_NAME } from "../config";

const MAP = {
  "/privacy": privacy,
  "/terms": terms,
  "/disclaimer": disclaimer,
} as const;

export default function Legal() {
  const { pathname } = useLocation();
  const doc = MAP[pathname as keyof typeof MAP] || privacy;
  usePageMeta(`${doc.title} · ${APP_NAME}`, doc.title);
  return (
    <PageShell narrow>
      <h1>{doc.title}</h1>
      <p style={{ fontSize: 14, color: "var(--ink-3)" }}>Last updated {LEGAL_UPDATED}</p>
      {doc.body.map((p) => (
        <p key={p}>{p}</p>
      ))}
    </PageShell>
  );
}
