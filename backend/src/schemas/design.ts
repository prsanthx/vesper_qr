import { z } from "zod";

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Color must be #rrggbb");

export const designSchema = z
  .object({
    v: z.literal(1),
    dots: z.object({
      type: z.enum([
        "square",
        "dots",
        "rounded",
        "extra-rounded",
        "classy",
        "classy-rounded",
      ]),
      color: hexColor,
      gradient: z
        .object({
          from: hexColor,
          to: hexColor,
          rotation: z.number().min(0).max(360),
        })
        .nullable(),
    }),
    cornersSquare: z.object({
      type: z.enum(["square", "dot", "extra-rounded"]),
      color: hexColor,
    }),
    cornersDot: z.object({
      type: z.enum(["square", "dot"]),
      color: hexColor,
    }),
    background: z.object({
      color: hexColor,
      transparent: z.boolean(),
    }),
    frame: z.object({
      style: z.enum([
        "none",
        "banner-bottom",
        "banner-top",
        "ribbon",
        "ticket",
      ]),
      text: z.string().max(24),
      color: hexColor,
      textColor: hexColor,
      font: z.enum(["Outfit", "Fraunces"]),
    }),
    logo: z.discriminatedUnion("kind", [
      z.object({ kind: z.literal("none") }),
      z.object({
        kind: z.literal("icon"),
        icon: z.enum([
          "link",
          "mail",
          "phone",
          "wifi",
          "location",
          "calendar",
          "menu",
          "play",
        ]),
      }),
      z.object({
        kind: z.literal("upload"),
        assetId: z.string().optional(),
        dataUrl: z.string().optional(),
      }),
    ]),
    margin: z.number().int().min(0).max(8),
  })
  .transform((d) => {
    if (d.logo.kind === "upload") {
      const { dataUrl: _d, ...rest } = d.logo;
      return { ...d, logo: rest };
    }
    return d;
  });

export type Design = z.infer<typeof designSchema>;

export const DEFAULT_DESIGN: Design = {
  v: 1,
  dots: { type: "rounded", color: "#141210", gradient: null },
  cornersSquare: { type: "extra-rounded", color: "#141210" },
  cornersDot: { type: "dot", color: "#8c5a32" },
  background: { color: "#fffdf8", transparent: false },
  frame: {
    style: "none",
    text: "Scan me",
    color: "#141210",
    textColor: "#fffdf8",
    font: "Outfit",
  },
  logo: { kind: "none" },
  margin: 2,
};

export function deepMergeDesign(
  base: Design,
  patch?: Partial<Design> | null,
): Design {
  if (!patch) return structuredClone(base);
  const merged = {
    ...base,
    ...patch,
    dots: { ...base.dots, ...patch.dots },
    cornersSquare: { ...base.cornersSquare, ...patch.cornersSquare },
    cornersDot: { ...base.cornersDot, ...patch.cornersDot },
    background: { ...base.background, ...patch.background },
    frame: { ...base.frame, ...patch.frame },
    logo: patch.logo ?? base.logo,
  };
  return designSchema.parse(merged);
}
