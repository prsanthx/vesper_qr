import outfitWoff2 from "@fontsource/outfit/files/outfit-latin-600-normal.woff2?inline";
import frauncesWoff2 from "@fontsource/fraunces/files/fraunces-latin-600-normal.woff2?inline";

function toBase64(dataUrl: string): string {
  const idx = dataUrl.indexOf(",");
  return idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl;
}

export function frameFontFace(font: "Outfit" | "Fraunces"): string {
  const b64 =
    font === "Fraunces" ? toBase64(frauncesWoff2) : toBase64(outfitWoff2);
  return `@font-face{font-family:"${font}";font-weight:600;font-style:normal;src:url(data:font/woff2;base64,${b64}) format("woff2");}`;
}
