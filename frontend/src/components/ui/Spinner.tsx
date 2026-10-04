import styles from "./Spinner.module.css";
export function Spinner({ label = "Loading" }: { label?: string }) {
  return <div className={styles.spin} role="status" aria-label={label} />;
}
