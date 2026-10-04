import { useState } from "react";
import { PageShell } from "../components/layout/PageShell";
import { Field } from "../components/ui/Field";
import { TextArea } from "../components/ui/TextArea";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";
import { Notice } from "../components/ui/Notice";
import { api } from "../lib/api";
import { usePageMeta } from "../hooks/usePageMeta";
import { APP_NAME } from "../config";

export default function Contact() {
  usePageMeta(`Contact · ${APP_NAME}`, "Send a message to the maker.");
  const [form, setForm] = useState({ name: "", email: "", subject: "Question", message: "", website: "" });
  const [state, setState] = useState<"idle" | "submitting" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  if (state === "sent") {
    return (
      <PageShell narrow>
        <div style={{ border: "1px solid var(--success)", borderRadius: 6, padding: 24 }}>
          <h1 style={{ fontSize: "1.5rem" }}>Message received.</h1>
          <p>We read everything; replies come from a real person when there is something to reply to.</p>
          <Button onClick={() => { setState("idle"); setForm({ name: "", email: "", subject: "Question", message: "", website: "" }); }}>Send another</Button>
        </div>
      </PageShell>
    );
  }
  return (
    <PageShell narrow>
      <h1>Contact</h1>
      <p>Messages are stored on our server. There is no mailing list.</p>
      <form onSubmit={async (e) => {
        e.preventDefault();
        setState("submitting");
        try {
          await api.contact(form);
          setState("sent");
        } catch (err: any) {
          setError(err.message || "Failed");
          setState("error");
        }
      }}>
        <Field label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={100} />
        <Field label="Email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={200} />
        <Select label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
          options={["Question","Bug","Idea","Other"].map((s) => ({ value: s, label: s }))} />
        <TextArea label="Message" required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} minLength={10} maxLength={5000} />
        <input className="sr-only" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} aria-hidden name="website" />
        {state === "error" ? <Notice tone="danger">{error}</Notice> : null}
        <Button type="submit" disabled={state === "submitting"}>{state === "submitting" ? "Sending…" : "Send"}</Button>
      </form>
    </PageShell>
  );
}
