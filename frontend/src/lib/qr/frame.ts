import type { Design } from "../schemas/design";
import { frameFontFace } from "./fonts";

function escXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripDecl(svg: string): string {
  return svg.replace(/<\?xml[^?]*\?>/i, "").trim();
}

export function composeFramed(qrSvg: string, design: Design): string {
  const inner = stripDecl(qrSvg);
  const style = design.frame.style;
  if (style === "none") {
    return inner.includes("xmlns=")
      ? inner
      : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">${inner}</svg>`;
  }

  const bg = design.background.transparent
    ? "none"
    : design.background.color;
  const fontCss = frameFontFace(design.frame.font);
  const fontFamily =
    design.frame.font === "Fraunces"
      ? "Fraunces, serif"
      : "Outfit, sans-serif";
  const text = escXml(design.frame.text || "Scan me");

  const nest = (x: number, y: number) => {
    const body = inner
      .replace(/^<svg[^>]*>/i, "")
      .replace(/<\/svg>\s*$/i, "");
    return `<svg x="${x}" y="${y}" width="1000" height="1000" viewBox="0 0 1000 1000">${body}</svg>`;
  };

  const defs = `<defs><style>${fontCss}</style></defs>`;

  if (style === "banner-bottom") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1300" width="1080" height="1300">${defs}
      <rect x="0" y="0" width="1080" height="1300" rx="24" fill="${design.frame.color}"/>
      <rect x="40" y="40" width="1000" height="1000" fill="${bg}"/>
      ${nest(40, 40)}
      <text x="540" y="1190" text-anchor="middle" font-family="${fontFamily}" font-size="110" font-weight="600" fill="${design.frame.textColor}">${text}</text>
    </svg>`;
  }
  if (style === "banner-top") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1300" width="1080" height="1300">${defs}
      <rect x="0" y="0" width="1080" height="1300" rx="24" fill="${design.frame.color}"/>
      <rect x="40" y="260" width="1000" height="1000" fill="${bg}"/>
      ${nest(40, 260)}
      <text x="540" y="150" text-anchor="middle" font-family="${fontFamily}" font-size="110" font-weight="600" fill="${design.frame.textColor}">${text}</text>
    </svg>`;
  }
  if (style === "ribbon") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1260" width="1200" height="1260">${defs}
      <rect x="100" y="0" width="1000" height="1000" fill="${bg}"/>
      ${nest(100, 0)}
      <polygon points="0,1040 60,1130 0,1220 1200,1220 1140,1130 1200,1040" fill="${design.frame.color}"/>
      <polygon points="0,1040 60,1130 0,1220" fill="#000" opacity="0.15"/>
      <polygon points="1200,1040 1140,1130 1200,1220" fill="#000" opacity="0.15"/>
      <text x="600" y="1160" text-anchor="middle" font-family="${fontFamily}" font-size="96" font-weight="600" fill="${design.frame.textColor}">${text}</text>
    </svg>`;
  }
  // ticket
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1420" width="1080" height="1420">${defs}
    <defs>
      <mask id="ticketMask">
        <rect x="20" y="20" width="1040" height="1380" rx="24" fill="white"/>
        <circle cx="20" cy="1110" r="40" fill="black"/>
        <circle cx="1060" cy="1110" r="40" fill="black"/>
      </mask>
    </defs>
    <rect x="20" y="20" width="1040" height="1380" rx="24" fill="${bg}" stroke="${design.frame.color}" stroke-width="16" mask="url(#ticketMask)"/>
    ${nest(40, 40)}
    <line x1="60" y1="1110" x2="1020" y2="1110" stroke="${design.frame.color}" stroke-width="8" stroke-dasharray="24 16"/>
    <text x="540" y="1290" text-anchor="middle" font-family="${fontFamily}" font-size="110" font-weight="600" fill="${design.frame.textColor}">${text}</text>
  </svg>`;
}
