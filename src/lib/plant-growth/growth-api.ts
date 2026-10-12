// Client for the AgriSense FastAPI growth prediction model (Random Forest).
export const GROWTH_API_URL =
  (import.meta.env["VITE_GROWTH_API_URL"] as string | undefined) ?? "https://agrisense-growth-api.fastapicloud.dev";

export interface GrowthFields {
  plant_species: string;
  plant_variety: string;
  plant_age_days: number;
  current_height_cm: number;
  temperature_c: number;
  humidity_percent: number;
  sunlight_hours_per_day: number;
  watering_frequency_days: number;
}

export interface GrowthPrediction {
  success: boolean;
  project?: string;
  model_name?: string;
  plant_details?: { species?: string; variety?: string; age_days?: number; current_height_cm?: number };
  prediction?: {
    growth_rate_cm_per_day?: number;
    growth_status?: string;
    future_height_cm?: Record<string, number>;
  };
  environment?: Record<string, number>;
  uploaded_image?: { filename?: string; format?: string; width_px?: number; height_px?: number; used_for_prediction?: boolean };
  chart_data?: { day: number; estimated_height_cm: number }[];
  warnings?: string[];
  [k: string]: unknown;
}

export type GrowthResult = { ok: true; data: GrowthPrediction; at: number } | { ok: false; status: number; message: string };

/** Builds the exact multipart body the API expects. */
export function buildGrowthForm(image: File, f: GrowthFields): FormData {
  const fd = new FormData();
  fd.append("image", image, image.name);
  (Object.keys(f) as (keyof GrowthFields)[]).forEach((k) => fd.append(k, String(f[k])));
  return fd;
}

async function withTimeout(url: string, init: RequestInit, ms: number, signal?: AbortSignal) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  signal?.addEventListener("abort", () => ctrl.abort());
  try { return await fetch(url, { ...init, signal: ctrl.signal }); } finally { clearTimeout(t); }
}

export async function checkGrowthHealth(signal?: AbortSignal): Promise<boolean> {
  try {
    const r = await withTimeout(`${GROWTH_API_URL}/health`, {}, 20000, signal);
    if (!r.ok) return false;
    const j = (await r.json()) as { status?: string };
    return j.status === "healthy";
  } catch { return false; }
}

function detail(j: unknown): string | null {
  const d = (j as { detail?: unknown })?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((x) => (x as { msg?: string }).msg).filter(Boolean).join("; ") || null;
  return null;
}

export async function predictGrowth(image: File, f: GrowthFields, signal?: AbortSignal): Promise<GrowthResult> {
  let r: Response;
  try {
    r = await withTimeout(`${GROWTH_API_URL}/predict`, { method: "POST", body: buildGrowthForm(image, f) }, 60000, signal);
  } catch {
    return { ok: false, status: 0, message: "Could not reach the growth prediction service. Please try again." };
  }
  let j: unknown = null;
  try { j = await r.json(); } catch { /* non-JSON */ }
  if (!r.ok) return { ok: false, status: r.status, message: detail(j) ?? `Prediction failed (HTTP ${r.status}).` };
  const data = j as GrowthPrediction;
  if (!data || data.success === false) return { ok: false, status: r.status, message: detail(j) ?? "The model could not produce a prediction." };
  return { ok: true, data, at: Date.now() };
}
