import { useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { APP_NAME } from "../../config";
import { list } from "../../lib/mine";
import { Button } from "../ui/Button";
import styles from "./Header.module.css";

const LINKS = [
  { to: "/", label: "Create", end: true },
  { to: "/types", label: "Types" },
  { to: "/dynamic", label: "Dynamic" },
  { to: "/api", label: "API" },
  { to: "/sponsor", label: "Sponsor" },
];

export function Header() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const sync = () => setCount(list().length);
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("vesper-mine", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("vesper-mine", sync);
    };
  }, []);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    [styles.link, isActive ? styles.active : ""].join(" ");

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.brand}>{APP_NAME}</Link>
      <nav className={styles.nav} aria-label="Primary">
        {LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>{l.label}</NavLink>
        ))}
      </nav>
      <div className={styles.actions}>
        <Button variant="secondary" to="/mine">
          My codes{count > 0 ? <span className={styles.badge}>{count}</span> : null}
        </Button>
        <Button variant="quiet" className={styles.menuBtn} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          Menu
        </Button>
      </div>
      <div className={[styles.panel, open ? styles.panelOpen : ""].join(" ")}>
        {LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={linkClass} onClick={() => setOpen(false)}>{l.label}</NavLink>
        ))}
      </div>
    </header>
  );
}
