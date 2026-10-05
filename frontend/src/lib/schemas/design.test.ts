import { describe, expect, it } from "vitest";
import { contrastRatio, DEFAULT_DESIGN, designSchema } from "./design";

describe("design", () => {
  it("defaults parse", () => {
    expect(designSchema.parse(DEFAULT_DESIGN).margin).toBe(2);
  });
  it("contrast helper", () => {
    expect(contrastRatio("#141210", "#fffdf8")).toBeGreaterThan(3);
    expect(contrastRatio("#eeeeee", "#ffffff")).toBeLessThan(3);
  });
});
