import type { ReactNode } from "react";
import styles from "./Section.module.css";

export function Section({ title, lead, children }: { title?: string; lead?: string; children?: ReactNode }) {
  return (
    <section className={styles.section}>
      {title ? <h2>{title}</h2> : null}
      {lead ? <p className={styles.lead}>{lead}</p> : null}
      {children}
    </section>
  );
}
