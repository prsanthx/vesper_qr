
const ICONS: Record<string, string> = {
  link: `<path d="M10 13a5 5 0 0 0 7.54.54l1.5-1.5a5 5 0 0 0-7.07-7.07l-.86.86"/><path d="M14 11a5 5 0 0 0-7.54-.54l-1.5 1.5a5 5 0 0 0 7.07 7.07l.86-.86"/>`,
  mail: `<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>`,
  phone: `<path d="M6 3h3l2 5-2 1a12 12 0 0 0 5 5l1-2 5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2z"/>`,
  wifi: `<path d="M5 12.5a9 9 0 0 1 14 0"/><path d="M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="20" r="1"/>`,
  location: `<path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>`,
  calendar: `<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/>`,
  menu: `<path d="M4 7h16M4 12h16M4 17h16"/>`,
  play: `<path d="M8 5v14l11-7z"/>`,
};

export function logoIconSvg(
  icon: keyof typeof ICONS,
  stroke: string,
  bg: string,
): string {
  const paths = ICONS[icon] || ICONS.link;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <circle cx="64" cy="64" r="60" fill="${bg}"/>
  <g transform="translate(40 40) scale(2)" fill="none" stroke="${stroke}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${paths}</g>
</svg>`;
}

export function iconToDataUrl(
  icon: keyof typeof ICONS,
  stroke: string,
  bg: string,
): string {
  const svg = logoIconSvg(icon, stroke, bg);
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
