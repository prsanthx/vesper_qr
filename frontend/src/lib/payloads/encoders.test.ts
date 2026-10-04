import { describe, expect, it } from "vitest";
import { encodeEmail } from "./email";
import { encodeWifi } from "./wifi";
import { encodeVcard } from "./vcard";
import { encodeWhatsapp } from "./whatsapp";
import { encodePaypal } from "./paypal";
import { encodeBitcoin } from "./bitcoin";

describe("encoders", () => {
  it("email with subject+body containing spaces and &", () => {
    expect(encodeEmail("a@b.com", "Hello there", "A & B")).toBe(
      "mailto:a@b.com?subject=Hello%20there&body=A%20%26%20B",
    );
  });

  it("wifi WPA with ; in password", () => {
    expect(encodeWifi({ ssid: "Home", encryption: "WPA", password: "a;b" })).toBe(
      "WIFI:T:WPA;S:Home;P:a\\;b;;",
    );
  });

  it("wifi nopass hidden", () => {
    expect(encodeWifi({ ssid: "Open", encryption: "nopass", hidden: true })).toBe(
      "WIFI:T:nopass;S:Open;H:true;;",
    );
  });

  it("vcard with two phones", () => {
    const out = encodeVcard({
      firstName: "Ada",
      lastName: "Lovelace",
      phones: [
        { kind: "cell", number: "+15551212" },
        { kind: "work", number: "+15559999" },
      ],
    });
    expect(out).toContain("TEL;TYPE=CELL:+15551212");
    expect(out).toContain("TEL;TYPE=WORK:+15559999");
    expect(out.startsWith("BEGIN:VCARD")).toBe(true);
    expect(out.includes("\r\n")).toBe(true);
  });

  it("whatsapp with message", () => {
    expect(encodeWhatsapp("+441234", "hi there")).toBe(
      "https://wa.me/441234?text=hi%20there",
    );
  });

  it("paypal both modes", () => {
    expect(encodePaypal({ mode: "paypalme", username: "ada", amount: 5, currency: "USD" })).toBe(
      "https://www.paypal.me/ada/5USD",
    );
    expect(encodePaypal({ mode: "email", email: "a@b.com", amount: 10, currency: "EUR" })).toBe(
      "https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=a%40b.com&currency_code=EUR&amount=10",
    );
  });

  it("bitcoin with amount and label", () => {
    expect(encodeBitcoin("bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", 0.01, "Tip")).toBe(
      "bitcoin:bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh?amount=0.01&label=Tip",
    );
  });
});
