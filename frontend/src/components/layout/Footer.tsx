import { Link } from "react-router-dom";
import { APP_NAME } from "../../config";
import styles from "./Footer.module.css";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <div className={styles.grid}>
        <div className={styles.col}>
          <h3>Product</h3>
          <Link to="/">Create</Link>
          <Link to="/static">Static codes</Link>
          <Link to="/dynamic">Dynamic codes</Link>
          <Link to="/types">All types</Link>
          <Link to="/features">Features</Link>
          <Link to="/use/weddings">Weddings</Link>
        </div>
        <div className={styles.col}>
          <h3>Help</h3>
          <Link to="/faq">FAQ</Link>
          <Link to="/api">API</Link>
          <Link to="/status">Status</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/report">Report abuse</Link>
        </div>
        <div className={styles.col}>
          <h3>Project</h3>
          <Link to="/about">About</Link>
          <Link to="/sponsor">Sponsor</Link>
          <Link to="/mine">My codes</Link>
        </div>
        <div className={styles.col}>
          <h3>Legal</h3>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/disclaimer">Disclaimer</Link>
        </div>
      </div>
      <div className={styles.bottom}>
        © {year} {APP_NAME} · Free to use · <Link to="/sponsor">Buy the maker a coffee</Link>
      </div>
    </footer>
  );
}
