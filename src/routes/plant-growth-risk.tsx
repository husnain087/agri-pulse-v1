import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Sprout, ImagePlus, RotateCcw, ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/agrisense/BrandMark";
import { GrowthProcessing, type GrowthStage, type StageState } from "@/components/plant-growth/GrowthProcessing";
import { GrowthResults } from "@/components/plant-growth/GrowthResults";
import { analyzePlantGrowthRiskFn } from "@/lib/plant-growth/analyze-plant-growth-risk.functions";
import type { GrowthInput, GrowthResult } from "@/lib/plant-growth/types";

export const Route = createFileRoute("/plant-growth-risk")({
  head: () => ({
    meta: [
      { title: "Plant Growth Risk AI — AgriSense AI" },
      { name: "description", content: "Upload a plant photo for an AI-powered preliminary assessment of growth stage, stress and growth risks." },
      { property: "og:title", content: "Plant Growth Risk AI — AgriSense AI" },
      { property: "og:description", content: "AI-powered preliminary plant growth and risk assessment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlantGrowthRisk,
});

const FIELDS = [
  { k: "species", l: "Plant species", t: "text", ph: "e.g. Tomato" },
  { k: "ageDays", l: "Plant age (days)", t: "number" },
  { k: "heightCm", l: "Current height (cm)", t: "number" },
  { k: "previousHeightCm", l: "Previous height (cm)", t: "number" },
  { k: "daysSincePrevious", l: "Days since previous measurement", t: "number" },
  { k: "temperatureC", l: "Temperature (°C)", t: "number" },
  { k: "humidityPct", l: "Humidity (%)", t: "number" },
  { k: "sunlight", l: "Sunlight", t: "text", ph: "e.g. 6h direct sun" },
  { k: "watering", l: "Watering", t: "text", ph: "e.g. every 2 days" },
] as const;

function downscale(file: File, max = 1280): Promise<string> {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      res(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("Could not read image")); };
    img.src = url;
  });
}

const idle: Record<GrowthStage, StageState> = { preprocess: "pending", analyze: "pending", result: "pending" };

function PlantGrowthRisk() {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [states, setStates] = useState(idle);
  const [result, setResult] = useState<GrowthResult | null>(null);
  const [fileErr, setFileErr] = useState<string | null>(null);
  const runId = useRef(0);
  const running = Object.values(states).some((s) => s === "active");

  const pick = async (raw?: File) => {
    if (!raw) return;
    let f: File;
    try { f = await normalizeImage(raw); } catch (e) { return setFileErr(e instanceof Error ? e.message : "Could not read this image."); }
    setFileErr(null); setFile(f); setResult(null); setStates(idle);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
  };

  const n = (k: string) => { const v = form[k]?.trim(); if (!v) return null; const x = Number(v); return Number.isFinite(x) ? x : null; };
  const s = (k: string) => form[k]?.trim() || null;

  const run = async () => {
    if (!file || running) return;
    const id = ++runId.current;
    setResult(null);
    setStates({ preprocess: "active", analyze: "pending", result: "pending" });
    let dataUrl: string;
    try { dataUrl = await downscale(file); } catch {
      setStates({ preprocess: "error", analyze: "pending", result: "pending" });
      return setResult({ ok: false, status: 400, message: "Could not read this image." });
    }
    if (id !== runId.current) return;
    setStates({ preprocess: "done", analyze: "active", result: "pending" });
    const payload: GrowthInput = {
      imageDataUrl: dataUrl, species: s("species"), ageDays: n("ageDays"), heightCm: n("heightCm"),
      previousHeightCm: n("previousHeightCm"), daysSincePrevious: n("daysSincePrevious"), temperatureC: n("temperatureC"),
      humidityPct: n("humidityPct"), sunlight: s("sunlight"), watering: s("watering"),
    };
    let r: GrowthResult;
    try { r = await analyzePlantGrowthRiskFn({ data: payload }); } catch {
      r = { ok: false, status: 0, message: "Network error — could not reach the AI service." };
    }
    if (id !== runId.current) return;
    if (!r.ok) { setStates({ preprocess: "done", analyze: "error", result: "pending" }); return setResult(r); }
    setStates({ preprocess: "done", analyze: "done", result: "active" });
    setTimeout(() => { if (id === runId.current) { setStates({ preprocess: "done", analyze: "done", result: "done" }); setResult(r); } }, 250);
  };

  return (
    <div className="min-h-screen">
      <header className="theme-night">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <BrandMark />
          <Button asChild variant="outline" size="sm"><Link to="/"><ArrowLeft /> Home</Link></Button>
        </div>
        <div className="mx-auto max-w-6xl px-5 pb-14 pt-6">
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-primary"><Sprout className="h-4 w-4" /> Option 2</p>
          <h1 className="mt-3 text-4xl font-bold md:text-5xl">Plant Growth Risk &amp; Prediction AI</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">An AI-powered preliminary assessment using Lovable AI vision. It is separate from the trained crop, maize and wheat models.</p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-5 py-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="surface rounded-2xl p-5">
            <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Choose plant image" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
            <button type="button" onClick={() => input.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]); }}
              className="flex aspect-square w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border-2 border-dashed transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {preview ? <img src={preview} alt="Selected plant" className="h-full w-full object-cover" /> : (<>
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground"><ImagePlus className="h-7 w-7" /></span>
                <span className="font-semibold">Upload a plant photo</span>
                <span className="text-xs text-muted-foreground">JPG, PNG or WEBP · up to 10 MB</span>
              </>)}
            </button>
            {fileErr && <p role="alert" className="mt-2 text-sm text-destructive">{fileErr}</p>}
          </div>
          <div className="surface rounded-2xl p-6">
            <h2 className="font-semibold">Optional details</h2>
            <p className="mt-1 text-sm text-muted-foreground">More data enables growth-rate and projection estimates.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <div key={f.k} className="space-y-1.5">
                  <Label htmlFor={f.k}>{f.l}</Label>
                  <Input id={f.k} type={f.t} inputMode={f.t === "number" ? "decimal" : undefined} placeholder={"ph" in f ? f.ph : ""} value={form[f.k] ?? ""} onChange={(e) => setForm((p) => ({ ...p, [f.k]: e.target.value }))} />
                </div>
              ))}
            </div>
            <Button size="lg" className="mt-6 w-full bg-gradient-primary" disabled={!file || running} onClick={() => void run()}><Sprout /> Detect Growth Risk</Button>
          </div>
        </div>

        {preview && states.preprocess !== "pending" && !(result?.ok) && <GrowthProcessing image={preview} states={states} />}
        {result && !result.ok && (
          <div role="alert" className="surface flex flex-wrap items-center justify-between gap-3 rounded-xl p-4">
            <p className="flex items-center gap-2 text-sm"><AlertTriangle className="h-4 w-4 text-destructive" />{result.message}</p>
            {result.status !== 402 && result.status !== 403 && <Button variant="outline" onClick={() => void run()}><RotateCcw /> Retry</Button>}
          </div>
        )}
        {result?.ok && preview && <GrowthResults ai={result.ai} measured={result.measured} image={preview} model={result.model} analyzedAt={result.analyzedAt} />}
      </main>
      <footer className="theme-night py-10 text-center text-sm text-muted-foreground">Powered by <span className="text-primary">Muhammad Husnain Haider</span></footer>
    </div>
  );
}
