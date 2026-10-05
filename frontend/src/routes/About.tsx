import { Link } from "react-router-dom";
import { PageShell } from "../components/layout/PageShell";
import { usePageMeta } from "../hooks/usePageMeta";
import { APP_NAME } from "../config";

export default function About() {
  usePageMeta(`About · ${APP_NAME}`, "What Vesper is.");
  return (
    <PageShell narrow>
      <h1>About {APP_NAME}</h1>
      <p>{APP_NAME} makes static and editable QR codes with design controls, landing pages, and a simple API. It is free to use with no account.</p>
      <p>Optional sponsorship through Buy Me a Coffee funds hosting and spare-time maintenance. See <Link to="/sponsor">Sponsor</Link>.</p>
      <p>Static codes stay on your device. Editable codes store payload, design, files, and hashed edit tokens. Scans record time, optional country, device class, OS family, and a salted IP hash — no cookies, no third-party analytics.</p>
      <p>Feedback is welcome via <Link to="/contact">Contact</Link>.</p>
    </PageShell>
  );
}
