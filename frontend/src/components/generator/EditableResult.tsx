import { CopyField } from "../ui/CopyField";
import { Button } from "../ui/Button";
import styles from "./EditableResult.module.css";

type Props = {
  publicUrl: string;
  editUrl: string;
  onAnother: () => void;
};

export function EditableResult({ publicUrl, editUrl, onAnother }: Props) {
  return (
    <div className={styles.panel}>
      <div className={styles.title}>Your editable code is live</div>
      <CopyField label="Public link (what the QR opens)" value={publicUrl} />
      <CopyField label="Private edit link — shown once, save it somewhere safe" value={editUrl} />
      <div className={styles.actions}>
        <Button to={editUrl.replace(/^https?:\/\/[^/]+/, "") || editUrl}>Open edit page</Button>
        <Button variant="secondary" onClick={onAnother}>Create another</Button>
      </div>
    </div>
  );
}
