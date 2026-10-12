// Shared, browser-safe types for the isolated Plant Growth Risk feature.
// Nothing here is used by (or shared with) the crop / maize / wheat ML model pipeline.
import { z } from "zod";

const num = z.number().finite().nullable();
export const GrowthInputSchema = z.object({
  imageDataUrl: z
    .string()
    .max(9_000_000, "Image too large")
    .regex(/^data:image\/(jpeg|png|webp);base64,/, "Unsupported image"),
  species: z.string().max(80).nullable(),
  ageDays: num,
  heightCm: num,
  previousHeightCm: num,
  daysSincePrevious: num,
  temperatureC: num,
  humidityPct: num,
  sunlight: z.string().max(60).nullable(),
  watering: z.string().max(60).nullable(),
});
export type GrowthInput = z.infer<typeof GrowthInputSchema>;

export const GrowthAiSchema = z.object({
  image_is_plant: z.boolean(),
  visible_condition: z.string(),
  health_status: z.enum(["healthy", "mild_stress", "moderate_stress", "severe_stress", "uncertain"]),
  growth_stage: z.string(),
  stress_signs: z.array(z.string()),
  growth_risks: z.array(z.object({ risk: z.string(), severity: z.enum(["low", "medium", "high"]), evidence: z.string() })),
  recommendations: z.array(z.string()),
  estimated_height_cm: z.number().nullable(),
  height_estimate_basis: z.string().nullable(),
  future_growth: z.object({ days_ahead: z.number(), estimated_height_cm: z.number(), rationale: z.string() }).nullable(),
  data_limitations: z.array(z.string()),
  confidence_note: z.string(),
});
export type GrowthAi = z.infer<typeof GrowthAiSchema>;

/** Deterministic rate computed from the user's own measurements (not AI). */
export interface MeasuredRate { cmPerDay: number; deltaCm: number; days: number }

export type GrowthResult =
  | { ok: true; ai: GrowthAi; measured: MeasuredRate | null; model: string; analyzedAt: number }
  | { ok: false; status: number; message: string };
