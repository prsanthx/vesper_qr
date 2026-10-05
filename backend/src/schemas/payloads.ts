import { z } from "zod";

const httpUrl = z
  .string()
  .trim()
  .transform((v) => {
    if (!/^https?:\/\//i.test(v)) return `https://${v}`;
    return v;
  })
  .refine((v) => {
    try {
      const u = new URL(v);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }, "Enter a full web address, like https://example.com.")
  .refine((v) => {
    const lower = v.toLowerCase();
    return (
      !lower.startsWith("javascript:") &&
      !lower.startsWith("data:") &&
      !lower.startsWith("file:")
    );
  }, "Unsupported URL scheme");

export function rejectOwnRedirect(url: string, publicBase?: string): boolean {
  try {
    const u = new URL(url);
    if (publicBase) {
      const base = new URL(publicBase);
      if (u.origin === base.origin && /^\/r\//.test(u.pathname)) return false;
    }
    if (/^\/r\//.test(u.pathname) && !u.host) return false;
    return true;
  } catch {
    return false;
  }
}

const e164 = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s\-()]/g, ""))
  .refine((v) => /^\+[1-9]\d{6,14}$/.test(v), {
    message: "Use international format, starting with +.",
  });

const socialNetwork = z.enum([
  "instagram",
  "facebook",
  "x",
  "tiktok",
  "youtube",
  "linkedin",
  "threads",
  "mastodon",
  "bluesky",
  "pinterest",
  "snapchat",
  "github",
  "website",
]);

const socialItem = z.object({
  network: socialNetwork,
  url: httpUrl,
});

const dayEnum = z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);

export const DYNAMIC_TYPES = [
  "website",
  "app",
  "social",
  "profile",
  "business",
  "coupon",
  "feedback",
  "video",
  "images",
  "pdf",
  "links",
  "event",
  "menu",
  "mp3",
] as const;

export type DynamicType = (typeof DYNAMIC_TYPES)[number];

export const websitePayload = z.object({
  url: httpUrl,
});

const optionalAppStoreUrl = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((v) => v || "")
  .superRefine((v, ctx) => {
    if (!v) return;
    try {
      const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`;
      const u = new URL(withScheme);
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a full web address, like https://example.com." });
        return;
      }
      if (!u.href.includes("apps.apple.com")) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Must be an App Store URL" });
      }
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a full web address, like https://example.com." });
    }
  });

const optionalPlayUrl = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((v) => v || "")
  .superRefine((v, ctx) => {
    if (!v) return;
    try {
      const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`;
      const u = new URL(withScheme);
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a full web address, like https://example.com." });
        return;
      }
      if (!u.href.includes("play.google.com")) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Must be a Play Store URL" });
      }
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a full web address, like https://example.com." });
    }
  });

export const appPayload = z.object({
  name: z.string().trim().max(60).optional().or(z.literal("")),
  iosUrl: optionalAppStoreUrl,
  androidUrl: optionalPlayUrl,
  fallbackUrl: httpUrl,
});

export const socialPayload = z.object({
  title: z.string().trim().max(60).optional().or(z.literal("")),
  items: z.array(socialItem).min(1).max(12),
});

export const profilePayload = z.object({
  name: z.string().trim().min(1).max(80),
  headline: z.string().trim().max(120).optional().or(z.literal("")),
  photoAssetId: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: e164.optional().or(z.literal("")),
  url: httpUrl.optional().or(z.literal("")),
  location: z.string().trim().max(80).optional().or(z.literal("")),
  socials: z.array(socialItem).max(8).optional().default([]),
});

export const businessPayload = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(600).optional().or(z.literal("")),
  phone: e164.optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  url: httpUrl.optional().or(z.literal("")),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  hours: z
    .array(
      z.object({
        day: dayEnum,
        open: z.string().regex(/^\d{2}:\d{2}$/),
        close: z.string().regex(/^\d{2}:\d{2}$/),
        closed: z.boolean(),
      }),
    )
    .max(7)
    .optional()
    .default([]),
  socials: z.array(socialItem).max(8).optional().default([]),
});

export const couponPayload = z.object({
  title: z.string().trim().min(1).max(80),
  code: z.string().trim().min(1).max(40),
  details: z.string().trim().max(600).optional().or(z.literal("")),
  expiresAt: z.string().optional().or(z.literal("")),
  url: httpUrl.optional().or(z.literal("")),
});

export const feedbackPayload = z.object({
  title: z.string().trim().max(80).optional().or(z.literal("")),
  prompt: z.string().trim().min(1).max(200),
  allowComment: z.boolean().default(true),
  thankYou: z
    .string()
    .trim()
    .max(200)
    .default("Thanks — your feedback was sent."),
});

const youtubeOrMp4 = z
  .string()
  .trim()
  .refine((v) => {
    try {
      const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
      if (u.protocol !== "http:" && u.protocol !== "https:") return false;
      const host = u.hostname.replace(/^www\./, "");
      if (
        host === "youtube.com" ||
        host === "youtu.be" ||
        host === "m.youtube.com"
      )
        return true;
      if (u.pathname.toLowerCase().endsWith(".mp4")) return true;
      return false;
    } catch {
      return false;
    }
  }, "Enter a YouTube or direct .mp4 URL");

export const videoPayload = z.object({
  title: z.string().trim().max(80).optional().or(z.literal("")),
  url: youtubeOrMp4,
  description: z.string().trim().max(600).optional().or(z.literal("")),
});

export const imagesPayload = z.object({
  title: z.string().trim().max(80).optional().or(z.literal("")),
  description: z.string().trim().max(600).optional().or(z.literal("")),
  imageAssetIds: z.array(z.string()).max(8).default([]),
  captions: z.array(z.string().max(120)).default([]),
});

export const pdfPayload = z.object({
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().max(600).optional().or(z.literal("")),
  pdfAssetId: z.string().optional(),
});

export const linksPayload = z.object({
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  items: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(60),
        url: httpUrl,
      }),
    )
    .min(1)
    .max(20),
});

export const eventPayload = z
  .object({
    title: z.string().trim().min(1).max(80),
    start: z.string().min(1),
    end: z.string().optional().or(z.literal("")),
    allDay: z.boolean().default(false),
    location: z.string().trim().max(200).optional().or(z.literal("")),
    details: z.string().trim().max(1000).optional().or(z.literal("")),
    url: httpUrl.optional().or(z.literal("")),
  })
  .superRefine((v, ctx) => {
    if (v.end && v.start && new Date(v.end) < new Date(v.start)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End must be after start",
        path: ["end"],
      });
    }
  });

const menuItem = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(200).optional().or(z.literal("")),
  price: z.string().trim().max(12),
});

export const menuPayload = z
  .object({
    title: z.string().trim().min(1).max(80),
    mode: z.enum(["sections", "pdf"]),
    currency: z.string().trim().max(3).default("$"),
    sections: z
      .array(
        z.object({
          name: z.string().trim().min(1).max(80),
          items: z.array(menuItem).min(1).max(50),
        }),
      )
      .max(20)
      .optional(),
    pdfAssetId: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.mode === "sections") {
      if (!v.sections || v.sections.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Add at least one section",
          path: ["sections"],
        });
      }
    }
  });

export const mp3Payload = z.object({
  title: z.string().trim().min(1).max(80),
  artist: z.string().trim().max(80).optional().or(z.literal("")),
  audioAssetId: z.string().optional(),
  coverAssetId: z.string().optional(),
});

export const payloadSchemas: Record<DynamicType, z.ZodTypeAny> = {
  website: websitePayload,
  app: appPayload,
  social: socialPayload,
  profile: profilePayload,
  business: businessPayload,
  coupon: couponPayload,
  feedback: feedbackPayload,
  video: videoPayload,
  images: imagesPayload,
  pdf: pdfPayload,
  links: linksPayload,
  event: eventPayload,
  menu: menuPayload,
  mp3: mp3Payload,
};

export function parsePayload(type: DynamicType, payload: unknown) {
  return payloadSchemas[type].parse(payload);
}

export function deriveTitle(type: DynamicType, payload: Record<string, unknown>): string {
  switch (type) {
    case "website": {
      try {
        return new URL(String(payload.url)).hostname;
      } catch {
        return "Website";
      }
    }
    case "app":
      return String(payload.name || "App");
    case "social":
      return String(payload.title || "Social");
    case "profile":
      return String(payload.name || "Profile");
    case "business":
      return String(payload.name || "Business");
    case "coupon":
      return String(payload.title || "Coupon");
    case "feedback":
      return String(payload.title || payload.prompt || "Feedback");
    case "video":
      return String(payload.title || "Video");
    case "images":
      return String(payload.title || "Images");
    case "pdf":
      return String(payload.title || "PDF");
    case "links":
      return String(payload.title || "Links");
    case "event":
      return String(payload.title || "Event");
    case "menu":
      return String(payload.title || "Menu");
    case "mp3":
      return String(payload.title || "MP3");
    default:
      return "Code";
  }
}

export { httpUrl, e164, socialNetwork };
