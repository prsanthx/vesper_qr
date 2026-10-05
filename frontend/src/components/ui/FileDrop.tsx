import { useRef, useState } from "react";
import styles from "./FileDrop.module.css";

type Props = {
  label: string;
  accept: string;
  maxBytes: number;
  kindLabel: string;
  onFile: (file: File) => void;
};

function formatBytes(n: number) {
  if (n < 1000) return `${n} B`;
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)} KB`;
  return `${(n / 1_000_000).toFixed(1)} MB`;
}

export function FileDrop({ label, accept, maxBytes, kindLabel, onFile }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [active, setActive] = useState(false);

  const handle = (file: File | undefined) => {
    if (!file) return;
    if (file.size > maxBytes) {
      setError(`That file is ${formatBytes(file.size)}. The limit for ${kindLabel} is ${formatBytes(maxBytes)}.`);
      return;
    }
    setError("");
    onFile(file);
  };

  return (
    <div>
      <div
        className={[styles.drop, active ? styles.active : ""].join(" ")}
        role="button"
        tabIndex={0}
        onClick={() => ref.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") ref.current?.click(); }}
        onDragOver={(e) => { e.preventDefault(); setActive(true); }}
        onDragLeave={() => setActive(false)}
        onDrop={(e) => { e.preventDefault(); setActive(false); handle(e.dataTransfer.files[0]); }}
      >
        {label}
        <input ref={ref} className={styles.input} type="file" accept={accept}
          onChange={(e) => handle(e.target.files?.[0])} />
      </div>
      {error ? <div className={styles.error}>{error}</div> : null}
    </div>
  );
}
