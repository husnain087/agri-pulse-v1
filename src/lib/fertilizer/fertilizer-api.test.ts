import { describe, expect, it } from "vitest";
import { toFertInput } from "./fertilizer-api";

const good = {
  Temperature: "26", Humidity: "60", Soil_Moisture: "30", Nitrogen_Level: "40", Phosphorus_Level: "30", Potassium_Level: "35",
  Soil_pH: "6.5", Organic_Carbon: "0.8", Electrical_Conductivity: "1.2", Rainfall: "800", Fertilizer_Used_Last_Season: "100", Yield_Last_Season: "3",
  Soil_Type: "Loamy", Crop_Type: "Wheat", Crop_Growth_Stage: "Vegetative", Season: "Rabi", Irrigation_Type: "Canal", Previous_Crop: "Rice", Region: "North",
};

describe("fertilizer input", () => {
  it("builds all 19 fields the API requires, numbers as numbers", () => {
    const r = toFertInput(good);
    expect(r.ok).toBe(true);
    if (r.ok) { expect(Object.keys(r.body)).toHaveLength(19); expect(r.body.Nitrogen_Level).toBe(40); }
  });
  it("rejects humidity above 100 and unknown soil types", () => {
    const r = toFertInput({ ...good, Humidity: "120", Soil_Type: "Rocky" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["Humidity", "Soil_Type"]);
  });
});
