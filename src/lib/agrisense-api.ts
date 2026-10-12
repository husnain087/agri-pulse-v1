// Central config + typed clients for the three AgriSense FastAPI backends.
// Response shapes verified against each backend's /openapi.json and live /predict.

export const API = {
  crop: {
    name: "Crop Identifier",
    base: import.meta.env["VITE_CROP_API_URL"] ?? "https://agrisense-crop-identifier-api.fastapicloud.dev",
  },
  maize: {
    name: "Maize Disease AI",
    base: import.meta.env["VITE_MAIZE_API_URL"] ?? "https://agrisense-maize.fastapicloud.dev",
  },
  wheat: {
    name: "Wheat Disease AI",
    base: import.meta.env["VITE_WHEAT_API_URL"] ?? "https://agrisenseai-backend.fastapicloud.dev",
  },
} as const;

export type ApiKey = keyof typeof API;
export type Crop = "Maize" | "Wheat";

export class ApiError extends Error {}
export class CancelledError extends Error {}

const TIMEOUT_MS = 120_000;

async function request(url: string, init?: RequestInit, timeout = TIMEOUT_MS, signal?: AbortSignal): Promise<unknown> {
  const ctrl = new AbortController();
  if (signal) {
    if (signal.aborted) throw new CancelledError("Cancelled");
    signal.addEventListener("abort", () => ctrl.abort(), { once: true });
  }
  const t = setTimeout(() => ctrl.abort(), timeout);
  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: ctrl.signal });
  } catch (e) {
    if (signal?.aborted) throw new CancelledError("Cancelled");
    if ((e as Error).name === "AbortError") throw new ApiError("The request timed out. The server may be waking up — please retry.");
    throw new ApiError("Network or CORS error — the service could not be reached.");
  } finally {
    clearTimeout(t);
  }
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new ApiError(`Server returned an invalid response (HTTP ${res.status}).`);
  }
  if (!res.ok) {
    const detail = (data as { detail?: unknown })?.detail;
    throw new ApiError(`HTTP ${res.status}: ${typeof detail === "string" ? detail : "request failed"}`);
  }
  return data;
}

function upload(base: string, file: File, signal?: AbortSignal) {
  const fd = new FormData();
  fd.append("file", file); // field name documented as "file" on all three backends
  return request(`${base}/predict`, { method: "POST", body: fd }, TIMEOUT_MS, signal);
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

export interface CropResult {
  rawLabel: string;
  crop: Crop | null;
  confidencePct?: number | undefined;
  probabilities?: Record<string, number> | undefined; // percent
}

export function normalizeCrop(label: string): Crop | null {
  const l = label.trim().toLowerCase();
  if (["maize", "corn", "zea mays"].includes(l)) return "Maize";
  if (["wheat", "triticum"].includes(l)) return "Wheat";
  return null;
}

export async function identifyCrop(file: File, signal?: AbortSignal): Promise<CropResult> {
  const d = (await upload(API.crop.base, file, signal)) as any;
  const label = d?.predicted_crop;
  if (typeof label !== "string") throw new ApiError("Crop Identifier returned an unexpected response.");
  const unitPct = d.confidence_unit === "percent";
  const c = num(d.confidence);
  const probs = d.class_probabilities as Record<string, number> | undefined;
  return {
    rawLabel: label,
    crop: normalizeCrop(label),
    confidencePct: c === undefined ? undefined : unitPct ? c : c * 100,
    probabilities: probs && typeof probs === "object" ? (unitPct ? probs : scale(probs)) : undefined,
  };
}

const scale = (p: Record<string, number>) => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v * 100]));

export interface DiseaseResult {
  disease: string;
  confidencePct?: number | undefined;
  probabilities?: Record<string, number> | undefined; // percent
  heatmap?: string | undefined;
  overlay?: string | undefined;
  heatmapNote?: string | undefined;
  heatmapMethod?: string | undefined;
}

export async function detectDisease(crop: Crop, file: File, signal?: AbortSignal): Promise<DiseaseResult> {
  const base = crop === "Maize" ? API.maize.base : API.wheat.base;
  const d = (await upload(base, file, signal)) as any;
  const disease = d?.predicted_disease ?? d?.predicted_class;
  if (typeof disease !== "string") throw new ApiError(`${crop} Disease AI returned an unexpected response.`);
  const pct = num(d.confidence_percent) ?? (num(d.confidence) !== undefined ? num(d.confidence)! * 100 : undefined);
  const probs = d.probabilities as Record<string, number> | undefined;
  const img = (v: unknown) => (typeof v === "string" && (v.startsWith("data:image") || v.startsWith("http")) ? v : undefined);
  return {
    disease,
    confidencePct: pct,
    probabilities: probs && typeof probs === "object" ? scale(probs) : undefined,
    heatmap: img(d.heatmap_image) ?? img(d.heatmap) ?? img(d.gradcam_heatmap),
    overlay: img(d.overlay_image) ?? img(d.gradcam_overlay) ?? img(d.overlay) ?? img(d.gradcam_image),
    heatmapNote: typeof d.heatmap_note === "string" ? d.heatmap_note : undefined,
    heatmapMethod: typeof d.heatmap_method === "string" ? d.heatmap_method : undefined,
  };
}

export type Health = "checking" | "online" | "offline";
export async function checkHealth(key: ApiKey): Promise<Health> {
  try {
    const d = (await request(`${API[key].base}/health`, undefined, 20_000)) as { status?: string };
    return d?.status === "healthy" || d?.status === "ok" ? "online" : "offline";
  } catch {
    return "offline";
  }
}

export const prettyLabel = (s: string) => s.replace(/_/g, " ");
