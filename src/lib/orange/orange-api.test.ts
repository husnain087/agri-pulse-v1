import { describe, expect, it } from "vitest";
import { parseOrange, buildReport } from "./orange-api";

const raw = { filename: "o.jpg", predicted_disease: "Black spot", confidence: 48.82, predictions: { "Black spot": 48.82, Canker: 44.54, Greening: 2.81, Scab: 1.81, healthy: 2.02 }, note: "n" };

describe("orange api", () => {
  it("keeps percentages as returned (no x100)", () => {
    expect(parseOrange(raw).confidence).toBe(48.82);
  });
  it("sorts all five classes descending", () => {
    expect(parseOrange(raw).predictions.map((p) => p.label)).toEqual(["Black spot", "Canker", "Greening", "healthy", "Scab"]);
  });
  it("report includes filename and every class", () => {
    const t = buildReport(parseOrange(raw), new Date());
    expect(t).toContain("o.jpg");
    expect(t).toContain("Scab: 1.81%");
  });
});
