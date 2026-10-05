export type DeviceKind = "ios" | "android" | "desktop";

export function detectDevice(ua = navigator.userAgent): DeviceKind {
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}
