import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { APP_NAME } from "../../config";
import { contrastRatio, type Design } from "../../lib/schemas/design";
import styles from "./LandingShell.module.css";

export function landingAccent(design?: Design): string {
  const c = design?.dots.color || "#8c5a32";
  return contrastRatio(c, "#fffdf8") >= 4.5 ? c : "#8c5a32";
}

export function LandingShell({ children, design }: { children: ReactNode; design?: Design }) {
  const accent = landingAccent(design);
  return (
    <div className={styles.shell} style={{ ["--accent" as string]: accent }}>
      <div className={styles.card}>{children}</div>
      <div className={styles.footer}>
        <Link to="/">Made with {APP_NAME}</Link>
        <Link to={`/report?url=${encodeURIComponent(location.href)}`}>Report this page</Link>
      </div>
    </div>
  );
}

export { styles as landingStyles };
