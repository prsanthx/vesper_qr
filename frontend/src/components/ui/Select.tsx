import type { SelectHTMLAttributes } from "react";
import styles from "./Field.module.css";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
};

export function Select({ label, error, options, id, ...rest }: Props) {
  const fid = id || rest.name || label.replace(/\s+/g, "-").toLowerCase();
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={fid}>{label}</label>
      <select id={fid} className={[styles.control, error ? styles.errorBorder : ""].join(" ")} {...rest}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error ? <div className={styles.error}>{error}</div> : null}
    </div>
  );
}
