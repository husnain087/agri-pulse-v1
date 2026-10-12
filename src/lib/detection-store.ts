// Global, auto-starting detection pipeline. Driven only by real API responses;
// the only artificial timing is holding the analysis view for >= MIN_MS before showing results.
import { useSyncExternalStore } from "react";
import { identifyCrop, detectDisease, ApiError, CancelledError, type CropResult, type DiseaseResult } from "./agrisense-api";
import { addRecord, makeThumbnail, type PredictionRecord } from "./history-store";

export const MIN_MS = 7000;
export type Phase = "idle" | "init" | "identifying" | "routing" | "diagnosing" | "finishing" | "done" | "unknown" | "error";
export interface DetectionState {
  phase: Phase;
  file: File | null;
  preview: string | null;
  crop: CropResult | null;
  disease: DiseaseResult | null;
  error: { msg: string; stage: "crop" | "disease" } | null;
  record: PredictionRecord | null;
}

const initial: DetectionState = { phase: "idle", file: null, preview: null, crop: null, disease: null, error: null, record: null };
let state = initial;
const listeners = new Set<() => void>();
const set = (p: Partial<DetectionState>) => { state = { ...state, ...p }; listeners.forEach((l) => l()); };

let runId = 0;
let ctrl: AbortController | null = null;
let lastSig = "";
const sig = (f: File) => `${f.name}|${f.size}|${f.lastModified}`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export const isBusy = (p: Phase) => p === "init" || p === "identifying" || p === "routing" || p === "diagnosing" || p === "finishing";

export function startDetection(file: File, force = false) {
  if (!force && isBusy(state.phase) && sig(file) === lastSig) return; // duplicate selection
  lastSig = sig(file);
  ctrl?.abort();
  const c = (ctrl = new AbortController());
  const id = ++runId;
  if (state.preview && state.file !== file) URL.revokeObjectURL(state.preview);
  const preview = state.file === file && state.preview ? state.preview : URL.createObjectURL(file);
  const started = Date.now();
  set({ ...initial, phase: "init", file, preview });
  void run(id, c.signal, file, preview, started);
}

async function run(id: number, signal: AbortSignal, file: File, preview: string, started: number) {
  const live = () => id === runId;
  const initTimer = setTimeout(() => live() && state.phase === "init" && set({ phase: "identifying" }), 900);
  let crop: CropResult;
  try {
    crop = await identifyCrop(file, signal);
  } catch (e) {
    clearTimeout(initTimer);
    if (!live() || e instanceof CancelledError) return;
    return set({ phase: "error", error: { msg: e instanceof ApiError ? e.message : "Unexpected error during crop identification.", stage: "crop" } });
  }
  clearTimeout(initTimer);
  if (!live()) return;
  if (!crop.crop) return set({ crop, phase: "unknown" });
  const which = crop.crop;
  set({ crop, phase: "routing" });
  const routeTimer = setTimeout(() => live() && state.phase === "routing" && set({ phase: "diagnosing" }), 1400);
  let disease: DiseaseResult;
  try {
    disease = await detectDisease(which, file, signal);
  } catch (e) {
    clearTimeout(routeTimer);
    if (!live() || e instanceof CancelledError) return;
    return set({ phase: "error", error: { msg: e instanceof ApiError ? e.message : "Unexpected error during disease detection.", stage: "disease" } });
  }
  clearTimeout(routeTimer);
  if (!live()) return;
  set({ disease, phase: "finishing" });
  const image = await makeThumbnail(preview).catch(() => preview);
  const record: PredictionRecord = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    crop: which,
    cropConfidence: crop.confidencePct,
    cropProbabilities: crop.probabilities,
    disease: disease.disease,
    confidence: disease.confidencePct,
    probabilities: disease.probabilities,
    model: `${which} Disease AI`,
    image,
    heatmap: disease.overlay ?? disease.heatmap,
    heatmapMethod: disease.heatmapMethod,
    heatmapNote: disease.heatmapNote,
  };
  const wait = MIN_MS - (Date.now() - started);
  if (wait > 0) await sleep(wait);
  if (!live()) return;
  await addRecord(record);
  if (!live()) return;
  set({ phase: "done", record });
}

export function cancelDetection() {
  runId++;
  ctrl?.abort();
  lastSig = "";
  if (state.preview) URL.revokeObjectURL(state.preview);
  set(initial);
}

export function retryDetection() {
  if (state.file) startDetection(state.file, true);
}

export function useDetection() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => state, () => initial);
}
