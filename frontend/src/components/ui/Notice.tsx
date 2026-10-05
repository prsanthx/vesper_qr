import type { ReactNode } from "react";
import styles from "./Notice.module.css";

export function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "success" | "danger" }) {
  return <div className={[styles.notice, tone !== "info" ? styles[tone] : ""].join(" ")} role="status">{children}</div>;
}
