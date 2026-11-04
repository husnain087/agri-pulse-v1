import { describe, expect, it } from "vitest";
import { cropPhotoSchema, cropIdentificationSchema, cropHealthSchema } from "./other-crop";

describe("Other crop photo analysis", () => {
  it("accepts a JPEG photo and Urdu output choice", () => {
    expect(cropPhotoSchema.parse({ image: "data:image/jpeg;base64,/9j/", language: "ur" }).language).toBe("ur");
  });
  it("rejects external image URLs rather than fetching arbitrary locations", () => {
    expect(cropPhotoSchema.safeParse({ image: "https://example.com/crop.jpg", language: "en" }).success).toBe(false);
  });
  it("preserves uncertain identifications and possible alternative crops", () => {
    const result = cropIdentificationSchema.parse({ status: "uncertain", cropName: "Possible rice", scientificName: "", summary: "Leaf alone is ambiguous", visibleFeatures: ["Narrow leaf"], growingConditions: "", commonUses: "", care: [], alternatives: ["Wheat"], verification: "Upload the whole plant", health: { status: "uncertain", diseases: [], summary: "Leaf detail is insufficient", nextSteps: [] } });
    expect(result.status).toBe("uncertain");
    expect(result.alternatives).toEqual(["Wheat"]);
  });
  it("preserves a named rust finding and its visible evidence", () => {
    const rust = { name: "Suspected stripe rust", kind: "rust", evidence: ["Yellow pustules arranged in parallel stripes"] };
    const result = cropHealthSchema.parse({ status: "suspected_disease", diseases: [rust], summary: "Rust-like symptoms visible", nextSteps: ["Inspect both leaf surfaces"] });
    expect(result.diseases).toEqual([rust]);
    expect(cropHealthSchema.safeParse({ ...result, diseases: [] }).success).toBe(false);
  });
  it("preserves other named diseases only with visible evidence", () => {
    const result = { status: "suspected_disease", diseases: [{ name: "Suspected powdery mildew", kind: "other", evidence: ["White powdery patches on leaves"] }], summary: "Possible mildew", nextSteps: [] };
    expect(cropHealthSchema.parse(result).diseases[0]?.name).toBe("Suspected powdery mildew");
    expect(cropHealthSchema.safeParse({ ...result, diseases: [{ ...result.diseases[0], evidence: [] }] }).success).toBe(false);
  });
  it("marks no visible disease without contradictory disease findings", () => {
    const result = { status: "no_visible_disease", diseases: [], summary: "No visible disease signs in this photo", nextSteps: [] };
    expect(cropHealthSchema.parse(result).status).toBe("no_visible_disease");
    expect(cropHealthSchema.safeParse({ ...result, diseases: [{ name: "Rust", kind: "rust", evidence: ["Pustules"] }] }).success).toBe(false);
  });
  it("keeps uncertain or unassessable photos distinct from disease-free results", () => {
    for (const status of ["uncertain", "not_assessable"]) {
      expect(cropHealthSchema.parse({ status, diseases: [], summary: "Insufficient detail", nextSteps: [] }).status).toBe(status);
    }
    expect(cropIdentificationSchema.safeParse({ status: "not_crop", cropName: "No crop", scientificName: "", summary: "A rock", visibleFeatures: [], growingConditions: "", commonUses: "", care: [], alternatives: [], verification: "Upload a crop", health: { status: "no_visible_disease", diseases: [], summary: "No disease", nextSteps: [] } }).success).toBe(false);
  });
});