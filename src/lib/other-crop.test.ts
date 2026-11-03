import { describe, expect, it } from "vitest";
import { cropPhotoSchema, cropIdentificationSchema } from "./other-crop";

describe("Other crop photo analysis", () => {
  it("accepts a JPEG photo and Urdu output choice", () => {
    expect(cropPhotoSchema.parse({ image: "data:image/jpeg;base64,/9j/", language: "ur" }).language).toBe("ur");
  });
  it("rejects external image URLs rather than fetching arbitrary locations", () => {
    expect(cropPhotoSchema.safeParse({ image: "https://example.com/crop.jpg", language: "en" }).success).toBe(false);
  });
  it("preserves uncertain identifications and possible alternative crops", () => {
    const result = cropIdentificationSchema.parse({ status: "uncertain", cropName: "Possible rice", scientificName: "", summary: "Leaf alone is ambiguous", visibleFeatures: ["Narrow leaf"], growingConditions: "", commonUses: "", care: [], alternatives: ["Wheat"], verification: "Upload the whole plant" });
    expect(result.status).toBe("uncertain");
    expect(result.alternatives).toEqual(["Wheat"]);
  });
});