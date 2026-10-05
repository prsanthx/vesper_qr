import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api, type PublicDoc } from "../lib/api";
import { LandingView } from "../components/landing/LandingView";
import { Spinner } from "../components/ui/Spinner";
import { usePageMeta } from "../hooks/usePageMeta";
import { APP_NAME } from "../config";

export default function Resolve() {
  const { slug = "" } = useParams();
  const [params] = useSearchParams();
  const preview = params.get("preview") === "1";
  const [doc, setDoc] = useState<PublicDoc | null>(null);
  const [error, setError] = useState<"not_found" | "retired" | null>(null);
  const [showSpin, setShowSpin] = useState(false);

  usePageMeta(`Code · ${APP_NAME}`, "Opening a Vesper code.", { noindex: true });

  useEffect(() => {
    const t = setTimeout(() => setShowSpin(true), 300);
    (async () => {
      try {
        const d = preview ? await api.public(slug) : await api.scan(slug);
        setDoc(d);
      } catch (e: any) {
        setError(e?.status === 410 || e?.code === "retired" ? "retired" : "not_found");
      }
    })();
    return () => clearTimeout(t);
  }, [slug, preview]);

  if (error === "not_found") {
    return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div><h1>This code doesn't exist.</h1><Link to="/">Back to the generator</Link></div>
    </div>;
  }
  if (error === "retired") {
    return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div><h1>This code was retired by its owner.</h1><Link to="/">Back to the generator</Link></div>
    </div>;
  }
  if (!doc) return <div style={{ minHeight: "100vh" }}>{showSpin ? <Spinner /> : null}</div>;
  return <LandingView doc={doc} />;
}
