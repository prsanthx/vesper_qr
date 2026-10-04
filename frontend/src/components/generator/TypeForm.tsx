import type { ReactNode } from "react";
import type { QrType } from "../../config";
import { Field } from "../ui/Field";
import { TextArea } from "../ui/TextArea";
import { Select } from "../ui/Select";
import { Toggle } from "../ui/Toggle";
import { Button } from "../ui/Button";
import { FileDrop } from "../ui/FileDrop";
import { LIMITS } from "../../config";

export type FormValues = Record<string, unknown>;

type Props = {
  type: QrType;
  values: FormValues;
  errors: Record<string, string>;
  onChange: (next: FormValues) => void;
  onBlurField?: (name: string) => void;
};

function set(values: FormValues, onChange: Props["onChange"], key: string, value: unknown) {
  onChange({ ...values, [key]: value });
}

function ListEditor({
  items,
  onChange,
  render,
  addLabel,
}: {
  items: unknown[];
  onChange: (items: unknown[]) => void;
  render: (item: unknown, i: number) => ReactNode;
  addLabel: string;
}) {
  return (
    <div>
      {items.map((item, i) => (
        <div key={i} style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr auto", marginBottom: 12 }}>
          <div>{render(item, i)}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Button variant="quiet" aria-label="Move up" onClick={() => {
              if (i === 0) return;
              const next = [...items];
              [next[i - 1], next[i]] = [next[i], next[i - 1]];
              onChange(next);
            }}>↑</Button>
            <Button variant="quiet" aria-label="Move down" onClick={() => {
              if (i >= items.length - 1) return;
              const next = [...items];
              [next[i + 1], next[i]] = [next[i], next[i + 1]];
              onChange(next);
            }}>↓</Button>
            <Button variant="quiet" aria-label="Remove" onClick={() => onChange(items.filter((_, j) => j !== i))}>×</Button>
          </div>
        </div>
      ))}
      <Button variant="quiet" onClick={() => onChange([...items, {}])}>{addLabel}</Button>
    </div>
  );
}

export function TypeForm({ type, values, errors, onChange, onBlurField }: Props) {
  const blur = (name: string) => () => onBlurField?.(name);
  const phoneHelper = "Include country code, e.g. +44 20 7946 0958";

  switch (type) {
    case "link":
    case "website":
      return (
        <Field label="URL" name="url" value={String(values.url || "")} error={errors.url}
          onChange={(e) => set(values, onChange, "url", e.target.value)} onBlur={blur("url")}
          helper="Enter a full web address, like https://example.com." />
      );
    case "text":
      return (
        <TextArea label="Message" name="message" value={String(values.message || "")} error={errors.message}
          onChange={(e) => set(values, onChange, "message", e.target.value)} onBlur={blur("message")} maxLength={1500} />
      );
    case "email":
      return (
        <>
          <Field label="To" name="to" value={String(values.to || "")} error={errors.to}
            onChange={(e) => set(values, onChange, "to", e.target.value)} onBlur={blur("to")} />
          <Field label="Subject" name="subject" value={String(values.subject || "")}
            onChange={(e) => set(values, onChange, "subject", e.target.value)} maxLength={200} />
          <TextArea label="Body" name="body" value={String(values.body || "")}
            onChange={(e) => set(values, onChange, "body", e.target.value)} maxLength={1000} />
        </>
      );
    case "call":
      return (
        <Field label="Phone" name="tel" value={String(values.tel || "")} error={errors.tel} helper={phoneHelper}
          onChange={(e) => set(values, onChange, "tel", e.target.value)} onBlur={blur("tel")} />
      );
    case "sms":
    case "whatsapp":
      return (
        <>
          <Field label="Phone" name="tel" value={String(values.tel || "")} error={errors.tel} helper={phoneHelper}
            onChange={(e) => set(values, onChange, "tel", e.target.value)} onBlur={blur("tel")} />
          <TextArea label="Message" name="message" value={String(values.message || "")}
            onChange={(e) => set(values, onChange, "message", e.target.value)} maxLength={500} />
        </>
      );
    case "wifi":
      return (
        <>
          <Field label="Network name (SSID)" name="ssid" value={String(values.ssid || "")} error={errors.ssid}
            onChange={(e) => set(values, onChange, "ssid", e.target.value)} onBlur={blur("ssid")} maxLength={32} />
          <Select label="Encryption" name="encryption" value={String(values.encryption || "WPA")}
            onChange={(e) => set(values, onChange, "encryption", e.target.value)}
            options={[{ value: "WPA", label: "WPA/WPA2" }, { value: "WEP", label: "WEP" }, { value: "nopass", label: "None" }]} />
          {values.encryption !== "nopass" ? (
            <Field label="Password" name="password" type="text" value={String(values.password || "")} error={errors.password}
              onChange={(e) => set(values, onChange, "password", e.target.value)} onBlur={blur("password")} maxLength={63} />
          ) : null}
          <Toggle label="Hidden network" checked={Boolean(values.hidden)}
            onChange={(v) => set(values, onChange, "hidden", v)} />
        </>
      );
    case "vcard":
      return (
        <>
          <Field label="First name" name="firstName" value={String(values.firstName || "")} error={errors.firstName}
            onChange={(e) => set(values, onChange, "firstName", e.target.value)} onBlur={blur("firstName")} />
          <Field label="Last name" name="lastName" value={String(values.lastName || "")}
            onChange={(e) => set(values, onChange, "lastName", e.target.value)} />
          <Field label="Organization" name="org" value={String(values.org || "")}
            onChange={(e) => set(values, onChange, "org", e.target.value)} />
          <Field label="Title" name="title" value={String(values.title || "")}
            onChange={(e) => set(values, onChange, "title", e.target.value)} />
          <Field label="Email" name="email" value={String(values.email || "")}
            onChange={(e) => set(values, onChange, "email", e.target.value)} />
          <Field label="Website" name="url" value={String(values.url || "")}
            onChange={(e) => set(values, onChange, "url", e.target.value)} />
          <Field label="Phone 1" name="phone1" value={String((values.phones as {number?:string}[])?.[0]?.number || "")} helper={phoneHelper}
            onChange={(e) => {
              const phones = [...((values.phones as object[]) || [{ kind: "cell", number: "" }])];
              phones[0] = { kind: "cell", number: e.target.value };
              set(values, onChange, "phones", phones);
            }} />
          <Field label="Phone 2" name="phone2" value={String((values.phones as {number?:string}[])?.[1]?.number || "")} helper={phoneHelper}
            onChange={(e) => {
              const phones = [...((values.phones as object[]) || [])];
              while (phones.length < 2) phones.push({ kind: "work", number: "" });
              phones[1] = { kind: "work", number: e.target.value };
              set(values, onChange, "phones", phones);
            }} />
        </>
      );
    case "bitcoin":
      return (
        <>
          <Field label="Address" name="address" value={String(values.address || "")} error={errors.address}
            onChange={(e) => set(values, onChange, "address", e.target.value)} onBlur={blur("address")} />
          <Field label="Amount (BTC)" name="amount" value={String(values.amount ?? "")}
            onChange={(e) => set(values, onChange, "amount", e.target.value)} />
          <Field label="Label" name="label" value={String(values.label || "")} maxLength={60}
            onChange={(e) => set(values, onChange, "label", e.target.value)} />
        </>
      );
    case "paypal":
      return (
        <>
          <Select label="Mode" name="mode" value={String(values.mode || "paypalme")}
            onChange={(e) => set(values, onChange, "mode", e.target.value)}
            options={[{ value: "paypalme", label: "PayPal.Me" }, { value: "email", label: "Email" }]} />
          {values.mode === "email" ? (
            <Field label="Email" name="email" value={String(values.email || "")} error={errors.email}
              onChange={(e) => set(values, onChange, "email", e.target.value)} onBlur={blur("email")} />
          ) : (
            <Field label="Username" name="username" value={String(values.username || "")} error={errors.username}
              onChange={(e) => set(values, onChange, "username", e.target.value)} onBlur={blur("username")} />
          )}
          <Field label="Amount" name="amount" value={String(values.amount ?? "")}
            onChange={(e) => set(values, onChange, "amount", e.target.value)} />
          <Select label="Currency" name="currency" value={String(values.currency || "USD")}
            onChange={(e) => set(values, onChange, "currency", e.target.value)}
            options={["USD", "EUR", "GBP", "CAD", "AUD"].map((c) => ({ value: c, label: c }))} />
        </>
      );
    case "app":
      return (
        <>
          <Field label="App name" name="name" value={String(values.name || "")} maxLength={60}
            onChange={(e) => set(values, onChange, "name", e.target.value)} />
          <Field label="App Store URL" name="iosUrl" value={String(values.iosUrl || "")}
            onChange={(e) => set(values, onChange, "iosUrl", e.target.value)} />
          <Field label="Play Store URL" name="androidUrl" value={String(values.androidUrl || "")}
            onChange={(e) => set(values, onChange, "androidUrl", e.target.value)} />
          <Field label="Fallback URL" name="fallbackUrl" value={String(values.fallbackUrl || "")} error={errors.fallbackUrl}
            onChange={(e) => set(values, onChange, "fallbackUrl", e.target.value)} onBlur={blur("fallbackUrl")} />
        </>
      );
    case "social":
      return (
        <>
          <Field label="Title" name="title" value={String(values.title || "")} maxLength={60}
            onChange={(e) => set(values, onChange, "title", e.target.value)} />
          <ListEditor
            items={(values.items as unknown[]) || [{ network: "instagram", url: "" }]}
            addLabel="Add link"
            onChange={(items) => set(values, onChange, "items", items)}
            render={(item, i) => {
              const it = item as { network?: string; url?: string };
              return (
                <>
                  <Select label="Network" value={it.network || "instagram"}
                    onChange={(e) => {
                      const items = [...((values.items as object[]) || [])];
                      items[i] = { ...it, network: e.target.value };
                      set(values, onChange, "items", items);
                    }}
                    options={["instagram","facebook","x","tiktok","youtube","linkedin","threads","mastodon","bluesky","pinterest","snapchat","github","website"].map((n) => ({ value: n, label: n }))} />
                  <Field label="URL" value={it.url || ""}
                    onChange={(e) => {
                      const items = [...((values.items as object[]) || [])];
                      items[i] = { ...it, url: e.target.value };
                      set(values, onChange, "items", items);
                    }} />
                </>
              );
            }}
          />
        </>
      );
    case "profile":
      return (
        <>
          <Field label="Name" name="name" value={String(values.name || "")} error={errors.name}
            onChange={(e) => set(values, onChange, "name", e.target.value)} onBlur={blur("name")} />
          <Field label="Headline" name="headline" value={String(values.headline || "")} maxLength={120}
            onChange={(e) => set(values, onChange, "headline", e.target.value)} />
          <Field label="Email" name="email" value={String(values.email || "")}
            onChange={(e) => set(values, onChange, "email", e.target.value)} />
          <Field label="Phone" name="phone" value={String(values.phone || "")} helper={phoneHelper}
            onChange={(e) => set(values, onChange, "phone", e.target.value)} />
          <Field label="Website" name="url" value={String(values.url || "")}
            onChange={(e) => set(values, onChange, "url", e.target.value)} />
          <Field label="Location" name="location" value={String(values.location || "")} maxLength={80}
            onChange={(e) => set(values, onChange, "location", e.target.value)} />
          <FileDrop label="Add profile photo" accept="image/png,image/jpeg,image/webp" maxBytes={LIMITS.imageBytes} kindLabel="image"
            onFile={(file) => set(values, onChange, "_photoFile", file)} />
        </>
      );
    case "business":
      return (
        <>
          <Field label="Name" name="name" value={String(values.name || "")} error={errors.name}
            onChange={(e) => set(values, onChange, "name", e.target.value)} onBlur={blur("name")} />
          <TextArea label="Description" name="description" value={String(values.description || "")} maxLength={600}
            onChange={(e) => set(values, onChange, "description", e.target.value)} />
          <Field label="Phone" name="phone" value={String(values.phone || "")} helper={phoneHelper}
            onChange={(e) => set(values, onChange, "phone", e.target.value)} />
          <Field label="Email" name="email" value={String(values.email || "")}
            onChange={(e) => set(values, onChange, "email", e.target.value)} />
          <Field label="Website" name="url" value={String(values.url || "")}
            onChange={(e) => set(values, onChange, "url", e.target.value)} />
          <Field label="Address" name="address" value={String(values.address || "")} maxLength={200}
            onChange={(e) => set(values, onChange, "address", e.target.value)} />
        </>
      );
    case "coupon":
      return (
        <>
          <Field label="Title" name="title" value={String(values.title || "")} error={errors.title}
            onChange={(e) => set(values, onChange, "title", e.target.value)} onBlur={blur("title")} maxLength={80} />
          <Field label="Code" name="code" value={String(values.code || "")} error={errors.code}
            onChange={(e) => set(values, onChange, "code", e.target.value)} onBlur={blur("code")} maxLength={40} />
          <TextArea label="Details" name="details" value={String(values.details || "")} maxLength={600}
            onChange={(e) => set(values, onChange, "details", e.target.value)} />
          <Field label="Expires (YYYY-MM-DD)" name="expiresAt" value={String(values.expiresAt || "")}
            onChange={(e) => set(values, onChange, "expiresAt", e.target.value)} />
          <Field label="Redeem URL" name="url" value={String(values.url || "")}
            onChange={(e) => set(values, onChange, "url", e.target.value)} />
        </>
      );
    case "feedback":
      return (
        <>
          <Field label="Title" name="title" value={String(values.title || "")} maxLength={80}
            onChange={(e) => set(values, onChange, "title", e.target.value)} />
          <Field label="Prompt" name="prompt" value={String(values.prompt || "")} error={errors.prompt}
            onChange={(e) => set(values, onChange, "prompt", e.target.value)} onBlur={blur("prompt")} maxLength={200} />
          <Toggle label="Allow comments" checked={values.allowComment !== false}
            onChange={(v) => set(values, onChange, "allowComment", v)} />
          <Field label="Thank-you message" name="thankYou" value={String(values.thankYou || "Thanks — your feedback was sent.")}
            onChange={(e) => set(values, onChange, "thankYou", e.target.value)} maxLength={200} />
        </>
      );
    case "video":
      return (
        <>
          <Field label="Title" name="title" value={String(values.title || "")} maxLength={80}
            onChange={(e) => set(values, onChange, "title", e.target.value)} />
          <Field label="Video URL" name="url" value={String(values.url || "")} error={errors.url}
            helper={detectVideo(String(values.url || ""))}
            onChange={(e) => set(values, onChange, "url", e.target.value)} onBlur={blur("url")} />
          <TextArea label="Description" name="description" value={String(values.description || "")} maxLength={600}
            onChange={(e) => set(values, onChange, "description", e.target.value)} />
        </>
      );
    case "images":
      return (
        <>
          <Field label="Title" name="title" value={String(values.title || "")} maxLength={80}
            onChange={(e) => set(values, onChange, "title", e.target.value)} />
          <TextArea label="Description" name="description" value={String(values.description || "")} maxLength={600}
            onChange={(e) => set(values, onChange, "description", e.target.value)} />
          <FileDrop label="Add images (up to 8)" accept="image/png,image/jpeg,image/webp,image/gif" maxBytes={LIMITS.imageBytes} kindLabel="image"
            onFile={(file) => {
              const files = [...((values._imageFiles as File[]) || [])];
              if (files.length >= 8) return;
              files.push(file);
              set(values, onChange, "_imageFiles", files);
            }} />
          {((values._imageFiles as File[]) || []).map((f, i) => (
            <div key={i} style={{ fontSize: 14, color: "var(--ink-2)" }}>{f.name}</div>
          ))}
        </>
      );
    case "pdf":
      return (
        <>
          <Field label="Title" name="title" value={String(values.title || "")} error={errors.title}
            onChange={(e) => set(values, onChange, "title", e.target.value)} onBlur={blur("title")} maxLength={80} />
          <TextArea label="Description" name="description" value={String(values.description || "")} maxLength={600}
            onChange={(e) => set(values, onChange, "description", e.target.value)} />
          <FileDrop label="Add PDF" accept="application/pdf" maxBytes={LIMITS.pdfBytes} kindLabel="PDF"
            onFile={(file) => set(values, onChange, "_pdfFile", file)} />
          {values._pdfFile ? <div style={{ fontSize: 14 }}>{(values._pdfFile as File).name}</div> : null}
        </>
      );
    case "links":
      return (
        <>
          <Field label="Title" name="title" value={String(values.title || "")} error={errors.title}
            onChange={(e) => set(values, onChange, "title", e.target.value)} onBlur={blur("title")} maxLength={80} />
          <TextArea label="Description" name="description" value={String(values.description || "")} maxLength={300}
            onChange={(e) => set(values, onChange, "description", e.target.value)} />
          <ListEditor
            items={(values.items as unknown[]) || [{ label: "", url: "" }]}
            addLabel="Add link"
            onChange={(items) => set(values, onChange, "items", items)}
            render={(item, i) => {
              const it = item as { label?: string; url?: string };
              return (
                <>
                  <Field label="Label" value={it.label || ""} maxLength={60}
                    onChange={(e) => {
                      const items = [...((values.items as object[]) || [])];
                      items[i] = { ...it, label: e.target.value };
                      set(values, onChange, "items", items);
                    }} />
                  <Field label="URL" value={it.url || ""}
                    onChange={(e) => {
                      const items = [...((values.items as object[]) || [])];
                      items[i] = { ...it, url: e.target.value };
                      set(values, onChange, "items", items);
                    }} />
                </>
              );
            }}
          />
        </>
      );
    case "event":
      return (
        <>
          <Field label="Title" name="title" value={String(values.title || "")} error={errors.title}
            onChange={(e) => set(values, onChange, "title", e.target.value)} onBlur={blur("title")} />
          <Field label="Start" name="start" type="datetime-local" value={String(values.startLocal || "")} error={errors.start}
            onChange={(e) => {
              const local = e.target.value;
              const iso = local ? new Date(local).toISOString() : "";
              onChange({ ...values, startLocal: local, start: iso });
            }} />
          <Field label="End" name="end" type="datetime-local" value={String(values.endLocal || "")}
            onChange={(e) => {
              const local = e.target.value;
              const iso = local ? new Date(local).toISOString() : "";
              onChange({ ...values, endLocal: local, end: iso });
            }} />
          <Toggle label="All day" checked={Boolean(values.allDay)} onChange={(v) => set(values, onChange, "allDay", v)} />
          <Field label="Location" name="location" value={String(values.location || "")} maxLength={200}
            onChange={(e) => set(values, onChange, "location", e.target.value)} />
          <TextArea label="Details" name="details" value={String(values.details || "")} maxLength={1000}
            onChange={(e) => set(values, onChange, "details", e.target.value)} />
          <Field label="Event URL" name="url" value={String(values.url || "")}
            onChange={(e) => set(values, onChange, "url", e.target.value)} />
          <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</div>
        </>
      );
    case "menu":
      return (
        <>
          <Field label="Title" name="title" value={String(values.title || "")} error={errors.title}
            onChange={(e) => set(values, onChange, "title", e.target.value)} onBlur={blur("title")} />
          <Select label="Mode" name="mode" value={String(values.mode || "sections")}
            onChange={(e) => set(values, onChange, "mode", e.target.value)}
            options={[{ value: "sections", label: "Sections" }, { value: "pdf", label: "PDF" }]} />
          {values.mode === "pdf" ? (
            <FileDrop label="Add menu PDF" accept="application/pdf" maxBytes={LIMITS.pdfBytes} kindLabel="PDF"
              onFile={(file) => set(values, onChange, "_pdfFile", file)} />
          ) : (
            <>
              <Field label="Currency" name="currency" value={String(values.currency || "$")} maxLength={3}
                onChange={(e) => set(values, onChange, "currency", e.target.value)} />
              <ListEditor
                items={(values.sections as unknown[]) || [{ name: "Mains", items: [{ name: "", description: "", price: "" }] }]}
                addLabel="Add section"
                onChange={(sections) => set(values, onChange, "sections", sections)}
                render={(item, i) => {
                  const sec = item as { name?: string; items?: { name: string; description: string; price: string }[] };
                  return (
                    <>
                      <Field label="Section name" value={sec.name || ""}
                        onChange={(e) => {
                          const sections = [...((values.sections as object[]) || [])];
                          sections[i] = { ...sec, name: e.target.value };
                          set(values, onChange, "sections", sections);
                        }} />
                      <Field label="First item" value={sec.items?.[0]?.name || ""}
                        onChange={(e) => {
                          const sections = [...((values.sections as {name?:string;items?:{name:string;description:string;price:string}[]}[]) || [])];
                          const items = [...(sections[i]?.items || [{ name: "", description: "", price: "" }])];
                          items[0] = { ...items[0]!, name: e.target.value };
                          sections[i] = { ...sec, items };
                          set(values, onChange, "sections", sections);
                        }} />
                      <Field label="Price" value={sec.items?.[0]?.price || ""}
                        onChange={(e) => {
                          const sections = [...((values.sections as {name?:string;items?:{name:string;description:string;price:string}[]}[]) || [])];
                          const items = [...(sections[i]?.items || [{ name: "", description: "", price: "" }])];
                          items[0] = { ...items[0]!, price: e.target.value };
                          sections[i] = { ...sec, items };
                          set(values, onChange, "sections", sections);
                        }} />
                    </>
                  );
                }}
              />
            </>
          )}
        </>
      );
    case "mp3":
      return (
        <>
          <Field label="Title" name="title" value={String(values.title || "")} error={errors.title}
            onChange={(e) => set(values, onChange, "title", e.target.value)} onBlur={blur("title")} maxLength={80} />
          <Field label="Artist" name="artist" value={String(values.artist || "")} maxLength={80}
            onChange={(e) => set(values, onChange, "artist", e.target.value)} />
          <FileDrop label="Add MP3" accept="audio/mpeg,.mp3" maxBytes={LIMITS.audioBytes} kindLabel="audio"
            onFile={(file) => set(values, onChange, "_audioFile", file)} />
          <FileDrop label="Add cover image (optional)" accept="image/png,image/jpeg,image/webp" maxBytes={LIMITS.imageBytes} kindLabel="image"
            onFile={(file) => set(values, onChange, "_coverFile", file)} />
        </>
      );
    default:
      return null;
  }
}

function detectVideo(url: string): string {
  if (!url) return "YouTube or direct .mp4 URL";
  if (/youtu\.?be|youtube\.com/i.test(url)) return "YouTube video";
  if (/\\.mp4(\\?|$)/i.test(url)) return "MP4 file";
  return "Unsupported link";
}

export function defaultValues(type: QrType, preset?: string | null): FormValues {
  if (type === "wifi") return { encryption: "WPA", hidden: false };
  if (type === "paypal") return { mode: "paypalme", currency: "USD" };
  if (type === "feedback") return { allowComment: true, thankYou: "Thanks — your feedback was sent." };
  if (type === "menu") return { mode: "sections", currency: "$", sections: [{ name: "Mains", items: [{ name: "", description: "", price: "" }] }] };
  if (type === "links" && preset === "wedding") {
    return {
      title: "Our wedding",
      items: [
        { label: "Schedule", url: "" },
        { label: "RSVP", url: "" },
        { label: "Photos", url: "" },
      ],
    };
  }
  if (type === "social") return { items: [{ network: "instagram", url: "" }] };
  if (type === "links") return { items: [{ label: "", url: "" }] };
  if (type === "vcard") return { phones: [{ kind: "cell", number: "" }] };
  return {};
}
