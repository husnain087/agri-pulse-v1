import { describe, expect, it } from "vitest";
import { buildGrowthForm } from "./growth-api";

describe("growth API form", () => {
  it("sends the exact multipart field names the FastAPI model expects", () => {
    const fd = buildGrowthForm(new File(["x"], "p.jpg", { type: "image/jpeg" }), {
      plant_species: "Tomato", plant_variety: "Roma", plant_age_days: 30, current_height_cm: 25,
      temperature_c: 26, humidity_percent: 60, sunlight_hours_per_day: 6, watering_frequency_days: 2,
    });
    expect([...fd.keys()].sort()).toEqual([
      "current_height_cm", "humidity_percent", "image", "plant_age_days", "plant_species",
      "plant_variety", "sunlight_hours_per_day", "temperature_c", "watering_frequency_days",
    ]);
    expect(fd.get("plant_age_days")).toBe("30");
  });
});
