export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadSvg(svg: string, filename: string) {
  downloadBlob(new Blob([svg], { type: "image/svg+xml" }), filename);
}

function parseViewBox(svg: string): { w: number; h: number } {
  const m = /viewBox=["']0\s+0\s+([\d.]+)\s+([\d.]+)["']/.exec(svg);
  if (m) return { w: Number(m[1]), h: Number(m[2]) };
  return { w: 1000, h: 1000 };
}

export async function downloadPng(
  svg: string,
  sizePx: number,
  filename: string,
): Promise<void> {
  const { w, h } = parseViewBox(svg);
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = sizePx;
    canvas.height = Math.round((sizePx * h) / w);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No canvas");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const png = await new Promise<Blob | null>((res) =>
      canvas.toBlob((b) => res(b), "image/png"),
    );
    if (!png) throw new Error("PNG failed");
    downloadBlob(png, filename);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function exportFilename(type: string, ext: "png" | "svg"): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
  return `vesper-${type}-${stamp}.${ext}`;
}
