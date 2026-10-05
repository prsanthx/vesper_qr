import styles from "./Segmented.module.css";

type Props<T extends string | number> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
};

export function Segmented<T extends string | number>({ options, value, onChange, ariaLabel }: Props<T>) {
  return (
    <div className={styles.wrap} role="group" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          className={[styles.btn, o.value === value ? styles.active : ""].join(" ")}
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
