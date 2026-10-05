import { useState } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "../components/layout/PageShell";
import { FAQ } from "../content/faq";
import { usePageMeta } from "../hooks/usePageMeta";
import { APP_NAME } from "../config";

export default function Faq() {
  usePageMeta(`FAQ · ${APP_NAME}`, "Common questions about Vesper.");
  const [open, setOpen] = useState<number | null>(0);
  return (
    <PageShell narrow>
      <h1>FAQ</h1>
      {FAQ.map((item, i) => (
        <div key={item.q} style={{ borderBottom: "var(--border)" }}>
          <h3 style={{ margin: 0 }}>
            <button type="button" aria-expanded={open === i}
              onClick={() => setOpen(open === i ? null : i)}
              style={{ width: "100%", textAlign: "left", background: "transparent", border: 0, padding: "16px 0", cursor: "pointer", font: "inherit", fontWeight: 550 }}>
              {item.q}
            </button>
          </h3>
          <div style={{ display: "grid", gridTemplateRows: open === i ? "1fr" : "0fr", transition: "grid-template-rows var(--dur) var(--ease)" }}>
            <div style={{ overflow: "hidden" }}>
              <p style={{ marginTop: 0 }}>{item.a}</p>
            </div>
          </div>
        </div>
      ))}
      <p style={{ marginTop: 24 }}>Still stuck? <Link to="/contact">Contact</Link>.</p>
    </PageShell>
  );
}
