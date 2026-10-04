import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import styles from "./PageShell.module.css";

export function PageShell({ children, narrow, bare }: { children: ReactNode; narrow?: boolean; bare?: boolean }) {
  if (bare) return <div className={styles.bare}>{children}</div>;
  return (
    <div className={styles.shell}>
      <Header />
      <main className={[styles.main, narrow ? styles.narrow : ""].join(" ")}>{children}</main>
      <Footer />
    </div>
  );
}
