import { z } from "zod";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const designSchema = z.object({
  v: z.literal(1),
  dots: z.object({
    type: z.enum(["square", "dots", "rounded", "extra-rounded", "classy", "classy-rounded"]),
    color: hexColor,
    gradient: z.object({ from: hexColor, to: hexColor, rotation: z.number().min(0).max(360) }).nullable(),
  }),
  cornersSquare: z.object({ type: z.enum(["square", "dot", "extra-rounded"]), color: hexColor }),
  cornersDot: z.object({ type: z.enum(["square", "dot"]), color: hexColor }),
  background: z.object({ color: hexColor, transparent: z.boolean() }),
  frame: z.object({
    style: z.enum(["none", "banner-bottom", "banner-top", "ribbon", "ticket"]),
    text: z.string().max(24),
    color: hexColor,
    textColor: hexColor,
    font: z.enum(["Outfit", "Fraunces"]),
  }),
  logo: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("none") }),
    z.object({ kind: z.literal("icon"), icon: z.enum(["link", "mail", "phone", "wifi", "location", "calendar", "menu", "play"]) }),
    z.object({ kind: z.literal("upload"), assetId: z.string().optional(), dataUrl: z.string().optional() }),
  ]),
  margin: z.number().int().min(0).max(8),
});

export type Design = z.infer<typeof designSchema>;

export const DEFAULT_DESIGN: Design = {
  v: 1,
  dots: { type: "rounded", color: "#141210", gradient: null },
  cornersSquare: { type: "extra-rounded", color: "#141210" },
  cornersDot: { type: "dot", color: "#8c5a32" },
  background: { color: "#fffdf8", transparent: false },
  frame: { style: "none", text: "Scan me", color: "#141210", textColor: "#fffdf8", font: "Outfit" },
  logo: { kind: "none" },
  margin: 2,
};

export function contrastRatio(fg: string, bg: string): number {
  const lum = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    const s = [n >> 16, (n >> 8) & 255, n & 255].map((c) => {
      const v = c / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * s[0]! + 0.7152 * s[1]! + 0.0722 * s[2]!;
  };
  const L1 = lum(fg);
  const L2 = lum(bg);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function contrastWarnings(design: Design): string[] {
  const bg = design.background.transparent ? "#ffffff" : design.background.color;
  const colors = [design.dots.color];
  if (design.dots.gradient) colors.push(design.dots.gradient.from, design.dots.gradient.to);
  const warnings: string[] = [];
  for (const c of colors) {
    if (contrastRatio(c, bg) < 3) {
      warnings.push("Low contrast — some phones may not scan this.");
      break;
    }
  }
  // Foreground closer to white than background → light-on-dark
  if (contrastRatio(design.dots.color, "#ffffff") < contrastRatio(bg, "#ffffff")) {
    warnings.push("Light-on-dark codes don't scan on every reader.");
  }
  return warnings;
}
