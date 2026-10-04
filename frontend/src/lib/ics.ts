function esc(v: string): string {
  return v.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

function toUtc(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
}

function toDate(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}`;
}

export function buildIcs(opts: {
  slug: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  location?: string;
  details?: string;
  url?: string;
}): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Vesper//EN",
    "BEGIN:VEVENT",
    `UID:${opts.slug}@vesper`,
    `DTSTAMP:${toUtc(new Date().toISOString())}`,
  ];
  if (opts.allDay) {
    lines.push(`DTSTART;VALUE=DATE:${toDate(opts.start)}`);
    if (opts.end) lines.push(`DTEND;VALUE=DATE:${toDate(opts.end)}`);
  } else {
    lines.push(`DTSTART:${toUtc(opts.start)}`);
    if (opts.end) lines.push(`DTEND:${toUtc(opts.end)}`);
  }
  lines.push(`SUMMARY:${esc(opts.title)}`);
  if (opts.location) lines.push(`LOCATION:${esc(opts.location)}`);
  if (opts.details) lines.push(`DESCRIPTION:${esc(opts.details)}`);
  if (opts.url) lines.push(`URL:${opts.url}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}
