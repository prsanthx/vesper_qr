import { useId, useState, type KeyboardEvent } from "react";
import type { QrType } from "../../config";
import { DYNAMIC_META, STATIC_META } from "../../content/typeMeta";
import { Button } from "../ui/Button";
import styles from "./TypePicker.module.css";

const ICONS: Record<string, string> = {
  link: "M10 13a5 5 0 007.54.54l1.5-1.5a5 5 0 00-7.07-7.07",
  text: "M4 6h16M4 12h10M4 18h14",
  email: "M3 7l9 6 9-6M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z",
  call: "M6 3h3l2 5-2 1a12 12 0 005 5l1-2 5 2v3a2 2 0 01-2 2A16 16 0 014 5a2 2 0 012-2z",
  sms: "M21 12a8 8 0 11-3-6.3L21 6v6z",
  whatsapp: "M5 19l1.5-4A7.5 7.5 0 1112 19.5L5 19z",
  wifi: "M5 12.5a9 9 0 0114 0M8.5 16a5 5 0 017 0M12 20h.01",
  vcard: "M4 5h16v14H4zM8 9h8M8 13h5",
  bitcoin: "M12 3v18M8 7h5a3 3 0 010 6H8m0 0h5.5a3 3 0 010 6H8",
  paypal: "M7 6h7a4 4 0 010 8H9l-1 6H5l3-14zm8 0h2a4 4 0 010 8h-1",
  website: "M12 3a9 9 0 100 18 9 9 0 000-18zm-9 9h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18",
  app: "M7 3h10v18H7zM10 18h4",
  social: "M8 12a3 3 0 106 0 3 3 0 00-6 0zm8-5a2 2 0 104 0 2 2 0 00-4 0zM5 17a2 2 0 104 0 2 2 0 00-4 0z",
  profile: "M12 12a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 0114 0",
  business: "M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6",
  coupon: "M4 8a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2a2 2 0 100-4V8z",
  feedback: "M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3z",
  video: "M5 6h10v12H5zM15 10l5-3v10l-5-3",
  images: "M4 5h16v14H4zM8 11l3 3 5-6",
  pdf: "M7 3h7l5 5v13H7zM14 3v5h5",
  links: "M8 12h8M7 8h10M9 16h6",
  event: "M4 6h16v14H4zM8 3v4M16 3v4M4 11h16",
  menu: "M4 7h16M4 12h16M4 17h16",
  mp3: "M9 18V6l10-2v12M9 18a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zm10-2a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z",
};

function Icon({ name }: { name: string }) {
  const d = ICONS[name] || ICONS.link;
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Props = { value: QrType; onChange: (t: QrType) => void };

export function TypePicker({ value, onChange }: Props) {
  const [showAll, setShowAll] = useState(false);
  const gid = useId();
  const all = [...STATIC_META.map((t) => t.slug), ...DYNAMIC_META.map((t) => t.slug)];

  const onKey = (e: KeyboardEvent, current: QrType) => {
    const i = all.indexOf(current);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      onChange(all[(i + 1) % all.length]!);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      onChange(all[(i - 1 + all.length) % all.length]!);
    }
  };

  const tile = (slug: QrType, label: string) => (
    <button
      key={slug}
      type="button"
      role="radio"
      aria-checked={value === slug}
      className={[styles.tile, value === slug ? styles.selected : ""].join(" ")}
      onClick={() => onChange(slug)}
      onKeyDown={(e) => onKey(e, slug)}
    >
      <Icon name={slug} />
      {label}
    </button>
  );

  return (
    <div className={styles.picker}>
      <div role="radiogroup" aria-labelledby={`${gid}-instant`}>
        <div className={styles.groupLabel} id={`${gid}-instant`}>Instant</div>
        <div className={styles.grid}>
          {STATIC_META.map((t) => tile(t.slug, t.label))}
        </div>
      </div>
      <div role="radiogroup" aria-labelledby={`${gid}-editable`}>
        <div className={styles.groupLabel} id={`${gid}-editable`}>Editable</div>
        <div className={[styles.grid, showAll ? "" : styles.collapsed].join(" ")}>
          {DYNAMIC_META.map((t) => tile(t.slug, t.label))}
        </div>
        {!showAll ? (
          <Button variant="quiet" onClick={() => setShowAll(true)}>Show all 14</Button>
        ) : null}
      </div>
    </div>
  );
}
