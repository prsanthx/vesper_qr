import { UAParser } from "ua-parser-js";

export type DeviceClass = "mobile" | "tablet" | "desktop" | "other";

const OS_MAP: Record<string, string> = {
  iOS: "iOS",
  iPadOS: "iOS",
  Android: "Android",
  Windows: "Windows",
  "Mac OS": "macOS",
  macOS: "macOS",
  Linux: "Linux",
  "Chrome OS": "ChromeOS",
};

export function parseUa(ua: string | undefined): {
  device: DeviceClass;
  os: string;
} {
  const parser = new UAParser(ua || "");
  const result = parser.getResult();
  const deviceType = result.device.type;
  let device: DeviceClass;
  if (deviceType === "mobile") device = "mobile";
  else if (deviceType === "tablet") device = "tablet";
  else if (!deviceType && result.os.name) device = "desktop";
  else device = "other";

  const osName = result.os.name || "";
  const os = OS_MAP[osName] || "Other";
  return { device, os };
}

export const BOT_UA =
  /bot|crawl|spider|preview|facebookexternalhit|slackbot|whatsapp|telegram|discord|curl|wget/i;

export function isBotUa(ua: string | undefined): boolean {
  return !!ua && BOT_UA.test(ua);
}
