export const APP_NAME = "Vesper";
// OWNER: set this to your real Buy Me a Coffee username before launch.
export const BMC_USERNAME = "vesper";
export const BMC_URL = `https://www.buymeacoffee.com/${BMC_USERNAME}`;
export const LIMITS = {
  logoBytes: 1_000_000,
  imageBytes: 5_000_000,
  pdfBytes: 15_000_000,
  audioBytes: 20_000_000,
  maxImages: 8,
};

export const STATIC_TYPES = [
  "link",
  "text",
  "email",
  "call",
  "sms",
  "whatsapp",
  "wifi",
  "vcard",
  "bitcoin",
  "paypal",
] as const;

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

export type StaticType = (typeof STATIC_TYPES)[number];
export type DynamicType = (typeof DYNAMIC_TYPES)[number];
export type QrType = StaticType | DynamicType;

export function isDynamicType(t: string): t is DynamicType {
  return (DYNAMIC_TYPES as readonly string[]).includes(t);
}

export function isStaticType(t: string): t is StaticType {
  return (STATIC_TYPES as readonly string[]).includes(t);
}
