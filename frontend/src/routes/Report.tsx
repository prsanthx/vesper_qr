import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageShell } from "../components/layout/PageShell";
import { Field } from "../components/ui/Field";
import { TextArea } from "../components/ui/TextArea";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";
import { Notice } from "../components/ui/Notice";
import { api } from "../lib/api";
import { usePageMeta } from "../hooks/usePageMeta";
import { APP_NAME } from "../config";

const REASONS = ["Phishing or scam", "Malware", "Illegal content", "Impersonation", "Other"];

export default function Report() {
  usePageMeta(`Report abuse · ${APP_NAME}`, "Report a code that breaks the terms.");
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: "", url: params.get("url") || "", reason: REASONS[0], details: "", website: "" });
  const [state, setState] = useState<"idle" | "submitting" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  if (state === "sent") {
    return (
      <PageShell narrow>
        <Notice tone="success">Report received. We review every report and disable codes that break the terms.</Notice>
      </PageShell>
    );
  }
  return (
    <PageShell narrow>
      <h1>Report abuse</h1>
      <p>If someone is in immediate danger, contact local authorities.</p>
      <form onSubmit={async (e) => {
        e.preventDefault();
        setState("submitting");
        try {
          await api.abuse({
            email: form.email,
            url: form.url,
            reason: `${form.reason}: ${form.details}`,
            website: form.website,
          });
          setState("sent");
        } catch (err: any) {
          setError(err.message || "Failed");
          setState("error");
        }
      }}>
        <Field label="Your email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Field label="URL of the code or page" required value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
        <Select label="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
          options={REASONS.map((r) => ({ value: r, label: r }))} />
        <TextArea label="Details" required value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} minLength={10} maxLength={3000} />
        <input className="sr-only" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} aria-hidden name="website" />
        {state === "error" ? <Notice tone="danger">{error}</Notice> : null}
        <Button type="submit" disabled={state === "submitting"}>{state === "submitting" ? "Sending…" : "Submit report"}</Button>
      </form>
    </PageShell>
  );
}
