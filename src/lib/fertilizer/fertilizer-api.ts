// Client for the AgriPulse fertilizer FastAPI model (JSON POST /predict), relayed same-origin because the API sends no CORS headers.
export const FERT_OPTIONS = {
  Soil_Type: ["Clay", "Loamy", "Sandy", "Silt"],
  Crop_Type: ["Cotton", "Maize", "Potato", "Rice", "Sugarcane", "Tomato", "Wheat"],
  Crop_Growth_Stage: ["Flowering", "Harvest", "Sowing", "Vegetative"],
  Season: ["Kharif", "Rabi", "Zaid"],
  Irrigation_Type: ["Canal", "Drip", "Rainfed", "Sprinkler"],
  Previous_Crop: ["Cotton", "Maize", "Potato", "Rice", "Sugarcane", "Tomato", "Wheat"],
  Region: ["Central", "East", "North", "South", "West"],
} as const;
export type SelectKey = keyof typeof FERT_OPTIONS;

export const NUM_FIELDS = [
  { k: "Temperature", label: "Temperature (°C)", min: -10, max: 60, main: true },
  { k: "Humidity", label: "Humidity (%)", min: 0, max: 100, main: true },
  { k: "Soil_Moisture", label: "Moisture (%)", min: 0, max: 100, main: true },
  { k: "Nitrogen_Level", label: "Nitrogen (N)", min: 0, max: 500, main: true },
  { k: "Phosphorus_Level", label: "Phosphorus (P)", min: 0, max: 500, main: true },
  { k: "Potassium_Level", label: "Potassium (K)", min: 0, max: 500, main: true },
  { k: "Soil_pH", label: "Soil pH", min: 0, max: 14, main: false },
  { k: "Organic_Carbon", label: "Organic Carbon (%)", min: 0, max: 10, main: false },
  { k: "Electrical_Conductivity", label: "Electrical Conductivity (dS/m)", min: 0, max: 20, main: false },
  { k: "Rainfall", label: "Rainfall (mm)", min: 0, max: 5000, main: false },
  { k: "Fertilizer_Used_Last_Season", label: "Fertilizer Used Last Season (kg)", min: 0, max: 10000, main: false },
  { k: "Yield_Last_Season", label: "Yield Last Season (t/ha)", min: 0, max: 200, main: false },
] as const;
export type NumKey = (typeof NUM_FIELDS)[number]["k"];
export type FertInput = Record<NumKey, number> & Record<SelectKey, string>;

export interface FertPrediction {
  success: boolean;
  predicted_fertilizer?: string;
  model_probabilities?: { fertilizer: string; probability_percent: number }[];
  notice?: string;
}

/** Validates raw form strings into the exact JSON body; returns per-field errors otherwise. */
export function toFertInput(raw: Record<string, string>): { ok: true; body: FertInput } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const body: Record<string, number | string> = {};
  for (const f of NUM_FIELDS) {
    const v = (raw[f.k] ?? "").trim();
    const n = Number(v);
    if (v === "" || !Number.isFinite(n)) errors[f.k] = "Enter a number.";
    else if (n < f.min || n > f.max) errors[f.k] = `Must be between ${f.min} and ${f.max}.`;
    else body[f.k] = n;
  }
  for (const k of Object.keys(FERT_OPTIONS) as SelectKey[]) {
    const v = raw[k] ?? "";
    if (!(FERT_OPTIONS[k] as readonly string[]).includes(v)) errors[k] = "Choose an option.";
    else body[k] = v;
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, body: body as FertInput };
}

export async function predictFertilizer(body: FertInput, signal?: AbortSignal): Promise<FertPrediction> {
  let r: Response;
  try {
    r = await fetch("/api/public/fertilizer-predict", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: signal ?? null });
  } catch {
    throw new Error("Could not reach the fertilizer model. Please check your connection and retry.");
  }
  let j: unknown = null;
  try { j = await r.json(); } catch { /* non-JSON */ }
  const d = (j as { detail?: unknown })?.detail;
  const msg = typeof d === "string" ? d : Array.isArray(d) ? d.map((x) => (x as { msg?: string }).msg).join("; ") : null;
  if (!r.ok) throw new Error(msg || `The model returned an error (HTTP ${r.status}).`);
  const data = j as FertPrediction;
  if (!data?.success || !data.predicted_fertilizer) throw new Error(msg || "The model did not return a recommendation.");
  return data;
}
