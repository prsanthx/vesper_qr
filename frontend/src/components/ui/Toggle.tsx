import styles from "./Toggle.module.css";

type Props = { label: string; checked: boolean; onChange: (v: boolean) => void; id?: string };

export function Toggle({ label, checked, onChange, id }: Props) {
  return (
    <div className={styles.row}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        className={styles.switch}
        onClick={() => onChange(!checked)}
      >
        <span className={styles.knob} />
      </button>
      <label className={styles.label} htmlFor={id}>{label}</label>
    </div>
  );
}
