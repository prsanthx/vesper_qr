import type { ReactNode } from "react";
import styles from "./Tabs.module.css";

type Tab = { id: string; label: string };

export function Tabs({ tabs, value, onChange }: { tabs: Tab[]; value: string; onChange: (id: string) => void }) {
  return (
    <div className={styles.list} role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" type="button" aria-selected={t.id === value}
          className={[styles.tab, t.id === value ? styles.active : ""].join(" ")}
          onClick={() => onChange(t.id)}>{t.label}</button>
      ))}
    </div>
  );
}

export function TabPanel({ id, value, children }: { id: string; value: string; children: ReactNode }) {
  if (id !== value) return null;
  return <div role="tabpanel">{children}</div>;
}
