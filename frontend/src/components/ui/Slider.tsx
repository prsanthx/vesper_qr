import styles from "./Field.module.css";

type Props = { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void };

export function Slider({ label, value, min, max, step = 1, onChange }: Props) {
  const id = label.replace(/\s+/g, "-").toLowerCase();
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>{label} ({value})</label>
      <input id={id} type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}
