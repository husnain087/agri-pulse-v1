import { IMAGE_ACCEPT, normalizeImage } from "@/lib/normalize-image";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Sprout, ImagePlus, RotateCcw, ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/agrisense/BrandMark";
import { GrowthProcessing, type GrowthStage, type StageState } from "@/components/plant-growth/GrowthProcessing";
import { GrowthResults } from "@/components/plant-growth/GrowthResults";
import { checkGrowthHealth, predictGrowth, type GrowthFields, type GrowthResult } from "@/lib/plant-growth/growth-api";

export const Route = createFileRoute("/plant-growth-risk")({
  head: () => ({
    meta: [
      { title: "Plant Growth Prediction — AgriSense AI" },
      { name: "description", content: "Predict plant growth rate and future height with the trained AgriSense growth model." },
      { property: "og:title", content: "Plant Growth Prediction — AgriSense AI" },
      { property: "og:description", content: "Growth rate and future height predictions from the AgriSense ML model." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlantGrowthRisk,
});

type Key = keyof GrowthFields;
const FIELDS: { k: Key; l: string; t: "text" | "number"; ph?: string; required: boolean; min?: number; max?: number }[] = [
  { k: "plant_species", l: "Plant species", t: "text", ph: "e.g. Tomato", required: true },
  { k: "plant_variety", l: "Plant variety", t: "text", ph: "e.g. Roma (optional)", required: false },
  { k: "plant_age_days", l: "Plant age (days)", t: "number", required: true, min: 0 },
  { k: "current_height_cm", l: "Current height (cm)", t: "number", required: true, min: 0 },
  { k: "temperature_c", l: "Temperature (°C)", t: "number", required: true, min: -30, max: 60 },
  { k: "humidity_percent", l: "Humidity (%)", t: "number", required: true, min: 0, max: 100 },
  { k: "sunlight_hours_per_day", l: "Sunlight (hours/day)", t: "number", required: true, min: 0, max: 24 },
  { k: "watering_frequency_days", l: "Watering every (days)", t: "number", required: true, min: 0 },
];

const idle: Record<GrowthStage, StageState> = { preprocess: "pending", analyze: "pending", result: "pending" };

function PlantGrowthRisk() {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [states, setStates] = useState(idle);
  const [result, setResult] = useState<GrowthResult | null>(null);
  const [fileErr, setFileErr] = useState<string | null>(null);
  const [formErr, setFormErr] = useState<string | null>(null);
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

  const collect = (): GrowthFields | string => {
    const out: Record<string, string | number> = {};
    for (const f of FIELDS) {
      const v = form[f.k]?.trim() ?? "";
      if (!v) {
        if (f.required) return `Please fill in "${f.l}".`;
        out[f.k] = f.k === "plant_variety" ? "Unknown" : "";
        continue;
      }
      if (f.t === "number") {
        const x = Number(v);
        if (!Number.isFinite(x)) return `"${f.l}" must be a number.`;
        if (f.min != null && x < f.min) return `"${f.l}" must be at least ${f.min}.`;
        if (f.max != null && x > f.max) return `"${f.l}" must be at most ${f.max}.`;
        out[f.k] = x;
      } else out[f.k] = v.slice(0, 80);
    }
    return out as unknown as GrowthFields;
  };

  const run = async () => {
    if (!file || running) return;
    const fields = collect();
    if (typeof fields === "string") return setFormErr(fields);
    setFormErr(null);
    const id = ++runId.current;
    setResult(null);
    setStates({ preprocess: "active", analyze: "pending", result: "pending" });
    const healthy = await checkGrowthHealth();
    if (id !== runId.current) return;
    if (!healthy) {
      setStates({ preprocess: "error", analyze: "pending", result: "pending" });
      return setResult({ ok: false, status: 503, message: "The growth prediction service is not available right now. Please try again shortly." });
    }
    setStates({ preprocess: "done", analyze: "active", result: "pending" });
    const r = await predictGrowth(file, fields);
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
          <p className="mt-3 max-w-2xl text-muted-foreground">Growth rate and future height predicted by the trained AgriSense growth model.</p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-5 py-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="surface rounded-2xl p-5">
            <input ref={input} type="file" accept={IMAGE_ACCEPT} className="sr-only" aria-label="Choose plant image" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ""; }} />
            <button type="button" onClick={() => input.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void pick(e.dataTransfer.files[0]); }}
              className="flex aspect-square w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border-2 border-dashed transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {preview ? <img src={preview} alt="Selected plant" className="h-full w-full object-cover" /> : (<>
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground"><ImagePlus className="h-7 w-7" /></span>
                <span className="font-semibold">Upload a plant photo</span>
                <span className="text-xs text-muted-foreground">Any photo type (JPG, PNG, WEBP, HEIC…) · up to 50 MB</span>
              </>)}
            </button>
            {fileErr && <p role="alert" className="mt-2 text-sm text-destructive">{fileErr}</p>}
          </div>
          <div className="surface rounded-2xl p-6">
            <h2 className="font-semibold">Plant details</h2>
            <p className="mt-1 text-sm text-muted-foreground">All fields except variety are required by the growth model.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <div key={f.k} className="space-y-1.5">
                  <Label htmlFor={f.k}>{f.l}{f.required && <span className="text-destructive"> *</span>}</Label>
                  <Input id={f.k} type={f.t} inputMode={f.t === "number" ? "decimal" : undefined} min={f.min} max={f.max} step="any" placeholder={f.ph ?? ""} value={form[f.k] ?? ""} onChange={(e) => setForm((p) => ({ ...p, [f.k]: e.target.value }))} />
                </div>
              ))}
            </div>
            {formErr && <p role="alert" className="mt-4 text-sm text-destructive">{formErr}</p>}
            <Button size="lg" className="mt-6 w-full bg-gradient-primary" disabled={!file || running} onClick={() => void run()}><Sprout /> Predict Growth</Button>
          </div>
        </div>

        {preview && states.preprocess !== "pending" && !(result?.ok) && <GrowthProcessing image={preview} states={states} />}
        {result && !result.ok && (
          <div role="alert" className="surface flex flex-wrap items-center justify-between gap-3 rounded-xl p-4">
            <p className="flex items-center gap-2 text-sm"><AlertTriangle className="h-4 w-4 text-destructive" />{result.message}</p>
            <Button variant="outline" onClick={() => void run()}><RotateCcw /> Retry</Button>
          </div>
        )}
        {result?.ok && preview && <GrowthResults data={result.data} image={preview} analyzedAt={result.at} />}
      </main>
      <footer className="theme-night py-10 text-center text-sm text-muted-foreground">Powered by <span className="text-primary">Muhammad Husnain Haider</span></footer>
    </div>
  );
}
