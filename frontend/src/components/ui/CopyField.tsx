import { useState } from "react";
import { Button } from "./Button";
import styles from "./CopyField.module.css";

type Props = { label: string; value: string };

export function CopyField({ label, value }: Props) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <div className={styles.label}>{label}</div>
      <div className={styles.wrap}>
        <input className={styles.input} readOnly value={value} aria-label={label} />
        <Button variant="secondary" onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}>{copied ? "Copied" : "Copy"}</Button>
      </div>
    </div>
  );
}
