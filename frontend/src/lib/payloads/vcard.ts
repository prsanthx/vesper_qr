function esc(v: string): string {
  return v.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

export type VcardInput = {
  firstName: string;
  lastName?: string;
  org?: string;
  title?: string;
  phones?: { kind: "cell" | "work" | "home"; number: string }[];
  email?: string;
  url?: string;
  street?: string;
  city?: string;
  region?: string;
  postcode?: string;
  country?: string;
};

export function encodeVcard(v: VcardInput): string {
  const lines = ["BEGIN:VCARD", "VERSION:3.0"];
  lines.push(`N:${esc(v.lastName || "")};${esc(v.firstName)};;;`);
  lines.push(`FN:${esc([v.firstName, v.lastName].filter(Boolean).join(" "))}`);
  if (v.org) lines.push(`ORG:${esc(v.org)}`);
  if (v.title) lines.push(`TITLE:${esc(v.title)}`);
  for (const p of v.phones || []) {
    lines.push(`TEL;TYPE=${p.kind.toUpperCase()}:${p.number.replace(/[\s\-()]/g, "")}`);
  }
  if (v.email) lines.push(`EMAIL:${esc(v.email)}`);
  if (v.url) lines.push(`URL:${esc(v.url)}`);
  if (v.street || v.city || v.region || v.postcode || v.country) {
    lines.push(`ADR;TYPE=WORK:;;${esc(v.street || "")};${esc(v.city || "")};${esc(v.region || "")};${esc(v.postcode || "")};${esc(v.country || "")}`);
  }
  lines.push("END:VCARD");
  return lines.join("\r\n");
}
