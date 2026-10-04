import { describe, expect, it } from "vitest";
import { DEFAULT_DESIGN } from "../schemas/design";
import { buildQrOptions } from "./render";

describe("buildQrOptions", () => {
  it("uses Q without logo and H with logo", () => {
    const q = buildQrOptions("https://example.com", DEFAULT_DESIGN);
    expect(q.qrOptions.errorCorrectionLevel).toBe("Q");
    const h = buildQrOptions("https://example.com", {
      ...DEFAULT_DESIGN,
      logo: { kind: "icon", icon: "link" },
    });
    expect(h.qrOptions.errorCorrectionLevel).toBe("H");
  });
});
