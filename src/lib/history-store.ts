// Prediction history persisted privately against the authenticated account.
import { useSyncExternalStore } from "react";
import type { Crop } from "./agrisense-api";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface PredictionRecord {
  id: string;
  createdAt: number;
  crop: Crop;
  cropConfidence?: number | undefined;
  cropProbabilities?: Record<string, number> | undefined;
  disease: string;
  confidence?: number | undefined;
  probabilities?: Record<string, number> | undefined;
  model: string;
  image: string; // downscaled JPEG data URL
  heatmap?: string | undefined;
  heatmapMethod?: string | undefined;
  heatmapNote?: string | undefined;
}

export const isHealthy = (r: Pick<PredictionRecord, "disease">) => r.disease.trim().toLowerCase() === "healthy";

let owner: string | null = null;
let generation = 0;
let records: PredictionRecord[] = [];
let loaded = false;
let storageError = null as string | null;
const listeners = new Set<() => void>();
let snapshot: { records: PredictionRecord[]; loaded: boolean; storageError: string | null } = { records, loaded, storageError };
const emit = () => { snapshot = { records, loaded, storageError }; listeners.forEach((l) => l()); };

let loading: Promise<void> | null = null;
function ensureLoaded() {
  if (loading || !owner || loaded) return;
  const id = generation;
  loading = (async () => {
    const { data, error } = await supabase.from("predictions").select("payload").eq("user_id", owner!).eq("kind", "detection").order("created_at", { ascending: false });
    if (id !== generation) return;
    if (error) storageError = "Couldn't load your saved predictions. Please refresh to retry.";
    else {
      const all = new Map((data ?? []).map((r) => { const record = r.payload as unknown as PredictionRecord; return [record.id, record] as const; }));
      records.forEach((r) => all.set(r.id, r));
      records = [...all.values()].sort((a, b) => b.createdAt - a.createdAt);
    }
    loaded = true; loading = null; emit();
  })();
}

export function setHistoryOwner(id: string | null) {
  if (owner === id) return;
  owner = id; generation++; records = []; loaded = !id; loading = null; storageError = null; emit();
  ensureLoaded();
}

export async function addRecord(r: PredictionRecord, userId = owner) {
  const version = generation;
  try {
    if (!userId || userId !== owner) throw new Error("Sign in to save predictions.");
    const { error } = await supabase.from("predictions").insert({ id: r.id, user_id: userId, kind: "detection", payload: JSON.parse(JSON.stringify(r)) as Json, created_at: new Date(r.createdAt).toISOString() });
    if (error) throw error;
    if (version !== generation) return;
    records = [r, ...records.filter((x) => x.id !== r.id)];
    storageError = null;
  } catch {
    if (version !== generation) return;
    storageError = "Couldn't save this prediction to your account. Please check your connection and try again.";
  }
  emit();
}
export async function deleteRecord(id: string) {
  if (!owner) return;
  const version = generation;
  const { error } = await supabase.from("predictions").delete().eq("id", id).eq("user_id", owner).eq("kind", "detection");
  if (version !== generation) return;
  if (error) { storageError = "Couldn't delete this prediction. Please try again."; emit(); return; }
  records = records.filter((r) => r.id !== id);
  storageError = null;
  emit();
}
export async function clearRecords() {
  if (!owner) return;
  const version = generation;
  const { error } = await supabase.from("predictions").delete().eq("user_id", owner).eq("kind", "detection");
  if (version !== generation) return;
  if (error) { storageError = "Couldn't clear your history. Please try again."; emit(); return; }
  records = [];
  storageError = null;
  emit();
}

const serverSnap = { records: [] as PredictionRecord[], loaded: false, storageError: null as string | null };
export function useHistory() {
  return useSyncExternalStore(
    (l) => { listeners.add(l); ensureLoaded(); return () => listeners.delete(l); },
    () => snapshot,
    () => serverSnap,
  );
}

/** Downscale an image file to a JPEG data URL for compact storage. */
export function makeThumbnail(src: string, max = 512): Promise<string> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = rej;
    img.src = src;
  });
}
