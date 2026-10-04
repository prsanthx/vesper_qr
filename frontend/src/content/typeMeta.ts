import type { DynamicType, QrType, StaticType } from "../config";

export const STATIC_META: { slug: StaticType; label: string }[] = [
  { slug: "link", label: "Link" },
  { slug: "text", label: "Text" },
  { slug: "email", label: "Email" },
  { slug: "call", label: "Call" },
  { slug: "sms", label: "SMS" },
  { slug: "whatsapp", label: "WhatsApp" },
  { slug: "wifi", label: "Wi-Fi" },
  { slug: "vcard", label: "vCard" },
  { slug: "bitcoin", label: "Bitcoin" },
  { slug: "paypal", label: "PayPal" },
];

export const DYNAMIC_META: { slug: DynamicType; label: string }[] = [
  { slug: "website", label: "Website" },
  { slug: "app", label: "App" },
  { slug: "social", label: "Social" },
  { slug: "profile", label: "Profile" },
  { slug: "business", label: "Business" },
  { slug: "coupon", label: "Coupon" },
  { slug: "feedback", label: "Feedback" },
  { slug: "video", label: "Video" },
  { slug: "images", label: "Images" },
  { slug: "pdf", label: "PDF" },
  { slug: "links", label: "Links" },
  { slug: "event", label: "Event" },
  { slug: "menu", label: "Menu" },
  { slug: "mp3", label: "MP3" },
];

export function typeLabel(slug: QrType): string {
  return (
    STATIC_META.find((t) => t.slug === slug)?.label ||
    DYNAMIC_META.find((t) => t.slug === slug)?.label ||
    slug
  );
}
