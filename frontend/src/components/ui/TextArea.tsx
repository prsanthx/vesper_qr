import type { TextareaHTMLAttributes } from "react";
import styles from "./Field.module.css";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  helper?: string;
};

export function TextArea({ label, error, helper, id, ...rest }: Props) {
  const fid = id || rest.name || label.replace(/\s+/g, "-").toLowerCase();
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={fid}>{label}</label>
      <textarea id={fid} className={[styles.control, styles.textarea, error ? styles.errorBorder : ""].join(" ")} {...rest} />
      {error ? <div className={styles.error}>{error}</div> : helper ? <div className={styles.helper}>{helper}</div> : null}
    </div>
  );
}
