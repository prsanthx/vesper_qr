import { Segmented } from "../ui/Segmented";
import { Button } from "../ui/Button";
import styles from "./DownloadBar.module.css";

type Props = {
  mode: "static" | "dynamic-create" | "dynamic-ready";
  size: 512 | 1024 | 2048;
  onSize: (s: 512 | 1024 | 2048) => void;
  onPng: () => void;
  onSvg: () => void;
  onCreate?: () => void;
  onMakeEditable?: () => void;
  creating?: boolean;
  showSponsor?: boolean;
  onDismissSponsor?: () => void;
  stickyThumb?: string | null;
  stickyVisible?: boolean;
};

export function DownloadBar({
  mode,
  size,
  onSize,
  onPng,
  onSvg,
  onCreate,
  onMakeEditable,
  creating,
  showSponsor,
  onDismissSponsor,
  stickyThumb,
  stickyVisible,
}: Props) {
  return (
    <>
      <div className={styles.bar} id="download-bar">
        {mode !== "dynamic-create" ? (
          <Segmented
            ariaLabel="PNG size"
            value={size}
            onChange={onSize}
            options={[
              { value: 512, label: "512" },
              { value: 1024, label: "1024" },
              { value: 2048, label: "2048" },
            ]}
          />
        ) : null}
        {mode === "dynamic-create" ? (
          <Button onClick={onCreate} disabled={creating}>
            {creating ? "Creating…" : "Create editable code"}
          </Button>
        ) : (
          <>
            <Button onClick={onPng}>Download PNG</Button>
            <Button variant="secondary" onClick={onSvg}>Download SVG</Button>
          </>
        )}
        {onMakeEditable ? (
          <Button variant="quiet" onClick={onMakeEditable}>Make this editable</Button>
        ) : null}
      </div>
      {showSponsor ? (
        <div className={styles.sponsor}>
          <span>
            Downloaded. If Vesper saved you time, you can{" "}
            <a href="/sponsor">buy the maker a coffee</a>.
          </span>
          <Button variant="quiet" aria-label="Dismiss" onClick={onDismissSponsor}>×</Button>
        </div>
      ) : null}
      <div className={[styles.sticky, stickyVisible ? styles.stickyVisible : ""].join(" ")}>
        {stickyThumb ? <img className={styles.thumb} src={stickyThumb} alt="" /> : <div className={styles.thumb} />}
        {mode === "dynamic-create" ? (
          <Button onClick={onCreate} disabled={creating}>{creating ? "Creating…" : "Create editable code"}</Button>
        ) : (
          <Button onClick={onPng}>Download PNG</Button>
        )}
      </div>
    </>
  );
}
