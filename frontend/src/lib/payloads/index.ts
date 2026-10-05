import type { StaticType } from "../../config";
import { encodeLink } from "./link";
import { encodeText } from "./text";
import { encodeEmail } from "./email";
import { encodeCall } from "./call";
import { encodeSms } from "./sms";
import { encodeWhatsapp } from "./whatsapp";
import { encodeWifi } from "./wifi";
import { encodeVcard } from "./vcard";
import { encodeBitcoin } from "./bitcoin";
import { encodePaypal } from "./paypal";

export * from "./link";
export * from "./text";
export * from "./email";
export * from "./call";
export * from "./sms";
export * from "./whatsapp";
export * from "./wifi";
export * from "./vcard";
export * from "./bitcoin";
export * from "./paypal";

export function encodeStatic(type: StaticType, values: Record<string, unknown>): string {
  switch (type) {
    case "link": return encodeLink(String(values.url || ""));
    case "text": return encodeText(String(values.message || ""));
    case "email": return encodeEmail(String(values.to || ""), String(values.subject || ""), String(values.body || ""));
    case "call": return encodeCall(String(values.tel || ""));
    case "sms": return encodeSms(String(values.tel || ""), String(values.message || ""));
    case "whatsapp": return encodeWhatsapp(String(values.tel || ""), String(values.message || ""));
    case "wifi": return encodeWifi({
      ssid: String(values.ssid || ""),
      encryption: (values.encryption as "WPA" | "WEP" | "nopass") || "WPA",
      password: String(values.password || ""),
      hidden: Boolean(values.hidden),
    });
    case "vcard": return encodeVcard(values as never);
    case "bitcoin": return encodeBitcoin(String(values.address || ""), values.amount as number | undefined, String(values.label || "") || undefined);
    case "paypal": return encodePaypal(values as never);
  }
}
