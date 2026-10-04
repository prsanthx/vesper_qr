import styles from "./Field.module.css";
import cstyles from "./ColorInput.module.css";

type Props = { label: string; value: string; onChange: (v: string) => void; disabled?: boolean };

export function ColorInput({ label, value, onChange, disabled }: Props) {
  const id = label.replace(/\s+/g, "-").toLowerCase();
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>{label}</label>
      <div className={cstyles.row}>
        <input type="color" className={cstyles.swatch} value={value} disabled={disabled}
          onChange={(e) => onChange(e.target.value)} aria-label={`${label} picker`} />
        <input id={id} className={[styles.control, cstyles.hex].join(" ")} value={value} disabled={disabled}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v.length === 7 ? v : v);
            else if (/^[0-9a-fA-F]{6}$/.test(v)) onChange("#" + v);
          }} />
      </div>
    </div>
  );
}
