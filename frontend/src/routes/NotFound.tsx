import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/Button";
import { usePageMeta } from "../hooks/usePageMeta";
import { APP_NAME } from "../config";

export default function NotFound() {
  usePageMeta(`Not found · ${APP_NAME}`, "Nothing at this address.");
  return (
    <PageShell>
      <h1>Nothing at this address.</h1>
      <Button to="/">Back to the generator</Button>
    </PageShell>
  );
}
