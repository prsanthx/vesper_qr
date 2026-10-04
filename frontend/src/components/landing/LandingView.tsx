import { useEffect, useMemo, useState } from "react";
import type { PublicDoc } from "../../lib/api";
import { api } from "../../lib/api";
import { detectDevice } from "../../lib/device";
import { buildIcs } from "../../lib/ics";
import { encodeVcard } from "../../lib/payloads/vcard";
import { Button } from "../ui/Button";
import { TextArea } from "../ui/TextArea";
import { LandingShell, landingStyles as styles } from "./LandingShell";

function assetUrl(doc: PublicDoc, id?: string) {
  if (!id) return undefined;
  return doc.assets.find((a) => a.id === id)?.url;
}

function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    const shorts = u.pathname.match(/\/shorts\/([^/]+)/);
    return shorts?.[1] || null;
  } catch { return null; }
}

export function LandingView({ doc }: { doc: PublicDoc }) {
  const p = doc.payload as Record<string, any>;
  const unfinished = (
    (doc.type === "pdf" && !p.pdfAssetId) ||
    (doc.type === "mp3" && !p.audioAssetId) ||
    (doc.type === "images" && !(p.imageAssetIds || []).length) ||
    (doc.type === "menu" && p.mode === "pdf" && !p.pdfAssetId)
  );
  if (unfinished) {
    return <LandingShell design={doc.design}><p>This page isn't finished yet.</p></LandingShell>;
  }

  switch (doc.type) {
    case "website":
      return <WebsiteLanding url={String(p.url)} />;
    case "app":
      return <AppLanding p={p} design={doc.design} />;
    case "social":
      return (
        <LandingShell design={doc.design}>
          {p.title ? <h1>{p.title}</h1> : null}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {(p.items || []).map((it: any, i: number) => (
              <a key={i} className={styles.btn + " " + styles.secondary} href={it.url} target="_blank" rel="noopener noreferrer">{it.network}</a>
            ))}
          </div>
        </LandingShell>
      );
    case "profile":
      return <ProfileLanding doc={doc} p={p} />;
    case "business":
      return <BusinessLanding p={p} design={doc.design} />;
    case "coupon":
      return <CouponLanding p={p} design={doc.design} />;
    case "feedback":
      return <FeedbackLanding slug={doc.slug} p={p} design={doc.design} />;
    case "video":
      return <VideoLanding p={p} design={doc.design} />;
    case "images":
      return <ImagesLanding doc={doc} p={p} />;
    case "pdf":
      return <PdfLanding doc={doc} p={p} />;
    case "links":
      return (
        <LandingShell design={doc.design}>
          <h1>{p.title}</h1>
          {p.description ? <p>{p.description}</p> : null}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(p.items || []).map((it: any, i: number) => (
              <a key={i} className={styles.btn} href={it.url} target="_blank" rel="noopener noreferrer">{it.label} →</a>
            ))}
          </div>
        </LandingShell>
      );
    case "event":
      return <EventLanding slug={doc.slug} p={p} design={doc.design} />;
    case "menu":
      return p.mode === "pdf" ? <PdfLanding doc={doc} p={p} /> : <MenuLanding p={p} design={doc.design} />;
    case "mp3":
      return <Mp3Landing doc={doc} p={p} />;
    default:
      return <LandingShell design={doc.design}><p>Unknown type.</p></LandingShell>;
  }
}

function WebsiteLanding({ url }: { url: string }) {
  useEffect(() => { window.location.replace(url); }, [url]);
  let host = url;
  try { host = new URL(url).hostname; } catch {}
  return (
    <LandingShell>
      <p>Opening {host}…</p>
      <a className={styles.btn} href={url}>Continue to {host}</a>
    </LandingShell>
  );
}

function AppLanding({ p, design }: { p: any; design: any }) {
  const device = detectDevice();
  useEffect(() => {
    if (device === "ios" && p.iosUrl) window.location.replace(p.iosUrl);
    else if (device === "android" && p.androidUrl) window.location.replace(p.androidUrl);
  }, [device, p.iosUrl, p.androidUrl]);
  return (
    <LandingShell design={design}>
      {p.name ? <h1>{p.name}</h1> : null}
      {p.iosUrl ? <a className={styles.btn + " " + styles.secondary} href={p.iosUrl} target="_blank" rel="noopener noreferrer">App Store</a> : null}
      {p.androidUrl ? <a className={styles.btn + " " + styles.secondary} href={p.androidUrl} target="_blank" rel="noopener noreferrer">Google Play</a> : null}
      <a className={styles.btn} href={p.fallbackUrl} target="_blank" rel="noopener noreferrer">Continue on the web</a>
    </LandingShell>
  );
}

function ProfileLanding({ doc, p }: { doc: PublicDoc; p: any }) {
  const photo = assetUrl(doc, p.photoAssetId);
  const save = () => {
    const vcf = encodeVcard({
      firstName: p.name,
      email: p.email,
      url: p.url,
      phones: p.phone ? [{ kind: "cell", number: p.phone }] : [],
    });
    const blob = new Blob([vcf], { type: "text/vcard" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${p.name}.vcf`;
    a.click();
  };
  return (
    <LandingShell design={doc.design}>
      <div style={{ textAlign: "center" }}>
        {photo ? <img src={photo} alt="" width={96} height={96} loading="lazy" style={{ borderRadius: "50%", objectFit: "cover", margin: "0 auto 12px" }} /> :
          <div style={{ width: 96, height: 96, borderRadius: "50%", background: "var(--accent-tint)", margin: "0 auto 12px", display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontSize: 32 }}>{String(p.name || "?").slice(0,1)}</div>}
        <h1>{p.name}</h1>
        {p.headline ? <p>{p.headline}</p> : null}
        {p.location ? <p style={{ fontSize: 14 }}>{p.location}</p> : null}
      </div>
      {p.email ? <a className={styles.btn + " " + styles.secondary} href={`mailto:${p.email}`}>Email</a> : null}
      {p.phone ? <a className={styles.btn + " " + styles.secondary} href={`tel:${p.phone}`}>Call</a> : null}
      {p.url ? <a className={styles.btn + " " + styles.secondary} href={p.url} target="_blank" rel="noopener noreferrer">Website</a> : null}
      <button type="button" className={styles.btn} onClick={save}>Save contact</button>
    </LandingShell>
  );
}

function BusinessLanding({ p, design }: { p: any; design: any }) {
  const openNow = useMemo(() => {
    const hours = p.hours || [];
    if (!hours.length) return null;
    const days = ["sun","mon","tue","wed","thu","fri","sat"];
    const now = new Date();
    const day = days[now.getDay()];
    const entry = hours.find((h: any) => h.day === day);
    if (!entry || entry.closed) return false;
    const [oh, om] = entry.open.split(":").map(Number);
    const [ch, cm] = entry.close.split(":").map(Number);
    const mins = now.getHours() * 60 + now.getMinutes();
    return mins >= oh * 60 + om && mins <= ch * 60 + cm;
  }, [p.hours]);
  return (
    <LandingShell design={design}>
      <h1>{p.name}</h1>
      {p.description ? <p>{p.description}</p> : null}
      {openNow != null ? <p style={{ color: openNow ? "var(--success)" : "var(--danger)" }}>{openNow ? "Open now" : "Closed now"}</p> : null}
      <p style={{ fontSize: 12 }}>Hours shown as entered by the business.</p>
      {p.phone ? <a className={styles.btn + " " + styles.secondary} href={`tel:${p.phone}`}>Call</a> : null}
      {p.email ? <a className={styles.btn + " " + styles.secondary} href={`mailto:${p.email}`}>Email</a> : null}
      {p.url ? <a className={styles.btn + " " + styles.secondary} href={p.url} target="_blank" rel="noopener noreferrer">Website</a> : null}
      {p.address ? <a className={styles.btn} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`} target="_blank" rel="noopener noreferrer">Directions</a> : null}
    </LandingShell>
  );
}

function CouponLanding({ p, design }: { p: any; design: any }) {
  const [copied, setCopied] = useState(false);
  const expired = p.expiresAt ? new Date(p.expiresAt + "T23:59:59Z").getTime() < Date.now() : false;
  return (
    <LandingShell design={design}>
      <h1>{p.title}</h1>
      {expired ? <p style={{ color: "var(--danger)" }}>Expired</p> : null}
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 28, opacity: expired ? 0.5 : 1, letterSpacing: 2 }}>{p.code}</div>
      <button type="button" className={styles.btn} onClick={async () => { await navigator.clipboard.writeText(p.code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>{copied ? "Copied" : "Copy code"}</button>
      {p.details ? <p>{p.details}</p> : null}
      {p.expiresAt && !expired ? <p>Valid until {p.expiresAt}</p> : null}
      {p.url ? <a className={styles.btn + " " + styles.secondary} href={p.url} target="_blank" rel="noopener noreferrer">Redeem online</a> : null}
    </LandingShell>
  );
}

function FeedbackLanding({ slug, p, design }: { slug: string; p: any; design: any }) {
  const key = `vesper.fb.${slug}`;
  const [sent, setSent] = useState(() => sessionStorage.getItem(key) === "1");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  if (sent) return <LandingShell design={design}><h1>{p.thankYou || "Thanks — your feedback was sent."}</h1></LandingShell>;
  return (
    <LandingShell design={design}>
      <h1>{p.prompt}</h1>
      <div role="radiogroup" aria-label="Rating" style={{ display: "flex", gap: 8 }}>
        {[1,2,3,4,5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n}
            onClick={() => setRating(n)}
            style={{ width: 40, height: 40, borderRadius: 6, border: "var(--border)", background: rating >= n ? "var(--accent)" : "var(--card)", color: rating >= n ? "var(--on-accent)" : "var(--ink)" }}>★</button>
        ))}
      </div>
      {p.allowComment !== false ? <TextArea label="Comment" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} /> : null}
      <button type="button" className={styles.btn} disabled={!rating || busy} onClick={async () => {
        setBusy(true);
        try {
          await api.submitFeedback(slug, { rating, comment: comment || undefined });
          sessionStorage.setItem(key, "1");
          setSent(true);
        } finally { setBusy(false); }
      }}>Submit</button>
    </LandingShell>
  );
}

function VideoLanding({ p, design }: { p: any; design: any }) {
  const id = youtubeId(String(p.url || ""));
  return (
    <LandingShell design={design}>
      {p.title ? <h1>{p.title}</h1> : null}
      {id ? (
        <div style={{ aspectRatio: "16/9" }}>
          <iframe title={p.title || "Video"} src={`https://www.youtube-nocookie.com/embed/${id}`} allow="fullscreen; picture-in-picture" loading="lazy" style={{ width: "100%", height: "100%", border: 0 }} />
        </div>
      ) : (
        <video controls playsInline preload="metadata" src={p.url} style={{ width: "100%" }} />
      )}
      {p.description ? <p>{p.description}</p> : null}
    </LandingShell>
  );
}

function ImagesLanding({ doc, p }: { doc: PublicDoc; p: any }) {
  const [open, setOpen] = useState<number | null>(null);
  const ids = p.imageAssetIds || [];
  return (
    <LandingShell design={doc.design}>
      {p.title ? <h1>{p.title}</h1> : null}
      {p.description ? <p>{p.description}</p> : null}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {ids.map((id: string, i: number) => {
          const url = assetUrl(doc, id);
          return url ? <button key={id} type="button" onClick={() => setOpen(i)} style={{ border: 0, padding: 0, background: "transparent" }}>
            <img src={url} alt={p.captions?.[i] || ""} loading="lazy" width={200} height={200} style={{ width: "100%", height: "auto", borderRadius: 6 }} />
          </button> : null;
        })}
      </div>
      {open != null ? (
        <dialog open onClose={() => setOpen(null)} style={{ border: "var(--border)", borderRadius: 6, padding: 16, maxWidth: 640 }}>
          <img src={assetUrl(doc, ids[open])} alt="" style={{ width: "100%" }} />
          {p.captions?.[open] ? <p>{p.captions[open]}</p> : null}
          <form method="dialog"><Button>Close</Button></form>
        </dialog>
      ) : null}
    </LandingShell>
  );
}

function PdfLanding({ doc, p }: { doc: PublicDoc; p: any }) {
  const asset = doc.assets.find((a) => a.id === p.pdfAssetId);
  return (
    <LandingShell design={doc.design}>
      <h1>{p.title}</h1>
      {p.description ? <p>{p.description}</p> : null}
      {asset ? (
        <>
          <p style={{ fontSize: 14 }}>{(asset.bytes / 1_000_000).toFixed(1)} MB</p>
          <a className={styles.btn} href={asset.url} target="_blank" rel="noopener noreferrer">Open PDF</a>
          <a className={styles.btn + " " + styles.secondary} href={`${asset.url}?download=1`}>Download</a>
        </>
      ) : <p>This page isn't finished yet.</p>}
    </LandingShell>
  );
}

function EventLanding({ slug, p, design }: { slug: string; p: any; design: any }) {
  const start = p.start ? new Date(p.start) : null;
  const end = p.end ? new Date(p.end) : null;
  const downloadIcs = () => {
    const ics = buildIcs({ slug, title: p.title, start: p.start, end: p.end, allDay: p.allDay, location: p.location, details: p.details, url: p.url });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = `${p.title}.ics`;
    a.click();
  };
  const gcal = () => {
    const fmt = (d: Date, allDay?: boolean) => allDay
      ? d.toISOString().slice(0,10).replace(/-/g,"")
      : d.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");
    if (!start) return "#";
    const dates = `${fmt(start, p.allDay)}/${fmt(end || start, p.allDay)}`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(p.title)}&dates=${dates}&details=${encodeURIComponent(p.details || "")}&location=${encodeURIComponent(p.location || "")}`;
  };
  return (
    <LandingShell design={design}>
      <h1>{p.title}</h1>
      {start ? <p>{start.toLocaleString()}{end ? ` – ${end.toLocaleString()}` : ""}</p> : null}
      <p style={{ fontSize: 12 }}>Times shown in your local zone.</p>
      {p.location ? <p>{p.location}</p> : null}
      {p.details ? <p>{p.details}</p> : null}
      <button type="button" className={styles.btn} onClick={downloadIcs}>Add to calendar</button>
      <a className={styles.btn + " " + styles.secondary} href={gcal()} target="_blank" rel="noopener noreferrer">Google Calendar</a>
      {p.url ? <a className={styles.btn + " " + styles.secondary} href={p.url} target="_blank" rel="noopener noreferrer">Event website</a> : null}
      {p.location ? <a className={styles.btn + " " + styles.secondary} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.location)}`} target="_blank" rel="noopener noreferrer">Directions</a> : null}
    </LandingShell>
  );
}

function MenuLanding({ p, design }: { p: any; design: any }) {
  return (
    <LandingShell design={design}>
      <h1>{p.title}</h1>
      {(p.sections || []).map((sec: any, i: number) => (
        <div key={i} style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: "1.25rem" }}>{sec.name}</h2>
          {(sec.items || []).map((it: any, j: number) => (
            <div key={j} style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 550 }}>{it.name}</div>
                {it.description ? <div style={{ fontSize: 14, color: "var(--ink-2)" }}>{it.description}</div> : null}
              </div>
              <div>{p.currency || "$"}{it.price}</div>
            </div>
          ))}
        </div>
      ))}
    </LandingShell>
  );
}

function Mp3Landing({ doc, p }: { doc: PublicDoc; p: any }) {
  const audio = assetUrl(doc, p.audioAssetId);
  const cover = assetUrl(doc, p.coverAssetId);
  return (
    <LandingShell design={doc.design}>
      {cover ? <img src={cover} alt="" width={240} height={240} loading="lazy" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 6 }} /> :
        <div style={{ aspectRatio: "1", background: "var(--accent-tint)", borderRadius: 6, display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontSize: 48 }}>{String(p.title || "M").slice(0,1)}</div>}
      <h1>{p.title}</h1>
      {p.artist ? <p>{p.artist}</p> : null}
      {audio ? <audio controls preload="metadata" src={audio} style={{ width: "100%" }} /> : <p>This page isn't finished yet.</p>}
      {audio ? <a className={styles.btn} href={`${audio}?download=1`}>Download</a> : null}
    </LandingShell>
  );
}
