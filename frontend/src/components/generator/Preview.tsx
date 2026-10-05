import { useEffect, useRef, useState } from "react";
import type { Design } from "../../lib/schemas/design";
import { renderQrSvg } from "../../lib/qr/render";
import { Button } from "../ui/Button";
import styles from "./Preview.module.css";

type Props = {
  data: string;
  design: Design;
  typeLabel: string;
  caption?: string;
  showEncodedToggle?: boolean;
};

export function Preview({ data, design, typeLabel, caption, showEncodedToggle }: Props) {
  const [layers, setLayers] = useState<[string | null, string | null]>([null, null]);
  const [active, setActive] = useState(0);
  const [showFull, setShowFull] = useState(false);
  const oldUrl = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const svg = await renderQrSvg(data || "https://example.com", design, 1000, { reuse: true });
        if (cancelled) return;
        const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
        const next = active === 0 ? 1 : 0;
        setLayers((prev) => {
          const copy: [string | null, string | null] = [...prev];
          copy[next] = url;
          return copy;
        });
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduced) {
          if (oldUrl.current) URL.revokeObjectURL(oldUrl.current);
          oldUrl.current = url;
          setActive(next);
        } else {
          requestAnimationFrame(() => setActive(next));
        }
      } catch {
        /* ignore render errors while typing invalid data */
      }
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [data, design]);

  return (
    <div>
      <div className={[styles.stage, design.background.transparent ? styles.checker : ""].join(" ")}>
        {[0, 1].map((i) =>
          layers[i] ? (
            <img
              key={i}
              className={[styles.img, active === i ? styles.visible : ""].join(" ")}
              src={layers[i]!}
              alt={`QR code preview for ${typeLabel}`}
              onTransitionEnd={() => {
                if (active === i && oldUrl.current && oldUrl.current !== layers[i]) {
                  URL.revokeObjectURL(oldUrl.current);
                }
                oldUrl.current = layers[i];
              }}
            />
          ) : null,
        )}
      </div>
      <div className={styles.caption} title={showFull ? caption : undefined}>
        {showFull ? caption : (caption || "").slice(0, 80)}
        {showEncodedToggle && caption && caption.length > 80 ? (
          <Button variant="quiet" className={styles.toggle} onClick={() => setShowFull((v) => !v)}>
            {showFull ? "Hide" : "Show"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function QrSample({ data, design }: { data: string; design: Design }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let revoked: string | null = null;
    renderQrSvg(data, design, 400).then((svg) => {
      const u = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      revoked = u;
      setUrl(u);
    });
    return () => {
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [data, design]);
  if (!url) return <div className={styles.stage} aria-hidden />;
  return <img src={url} alt="" className={styles.stage} style={{ objectFit: "contain", padding: 8 }} />;
}
