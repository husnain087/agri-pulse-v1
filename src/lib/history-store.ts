// Prediction history persisted in this browser's IndexedDB (not shared across devices).
import { useSyncExternalStore } from "react";
import type { Crop } from "./agrisense-api";

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

const DB = "agrisense", STORE = "predictions";
let records: PredictionRecord[] = [];
let loaded = false;
let storageError = null as string | null;
const listeners = new Set<() => void>();
let snapshot: { records: PredictionRecord[]; loaded: boolean; storageError: string | null } = { records, loaded, storageError };
const emit = () => { snapshot = { records, loaded, storageError }; listeners.forEach((l) => l()); };

function open(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: "id" });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((res, rej) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => res(req.result);
    t.onerror = () => rej(t.error);
    t.onabort = () => rej(t.error);
  });
}

let loading: Promise<void> | null = null;
function ensureLoaded() {
  if (loading || typeof indexedDB === "undefined") return;
  loading = tx<PredictionRecord[]>("readonly", (s) => s.getAll() as IDBRequest<PredictionRecord[]>)
    .then((all) => { records = all.sort((a, b) => b.createdAt - a.createdAt); })
    .catch(() => { storageError = "Browser storage is unavailable — history can't be saved in this browser."; })
    .finally(() => { loaded = true; emit(); });
}

export async function addRecord(r: PredictionRecord) {
  try {
    await tx("readwrite", (s) => s.put(r));
    records = [r, ...records.filter((x) => x.id !== r.id)];
    storageError = null;
  } catch {
    storageError = "Couldn't save this prediction — browser storage may be full. Delete old records to free space.";
  }
  emit();
}
export async function deleteRecord(id: string) {
  await tx("readwrite", (s) => s.delete(id)).catch(() => {});
  records = records.filter((r) => r.id !== id);
  emit();
}
export async function clearRecords() {
  await tx("readwrite", (s) => s.clear()).catch(() => {});
  records = [];
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
