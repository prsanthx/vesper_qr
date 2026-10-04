import type { InputHTMLAttributes, ReactNode } from "react";
import styles from "./Field.module.css";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  helper?: string;
  hint?: ReactNode;
};

export function Field({ label, error, helper, hint, id, className, ...rest }: Props) {
  const fid = id || rest.name || label.replace(/\s+/g, "-").toLowerCase();
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={fid}>{label}</label>
      <input id={fid} className={[styles.control, error ? styles.errorBorder : "", className].join(" ")} {...rest} />
      {error ? <div className={styles.error}>{error}</div> : helper ? <div className={styles.helper}>{helper}</div> : null}
      {hint}
    </div>
  );
}
