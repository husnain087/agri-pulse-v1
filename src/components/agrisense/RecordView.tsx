import { Info, Leaf, Download, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prettyLabel } from "@/lib/agrisense-api";
import { isHealthy, type PredictionRecord } from "@/lib/history-store";
import type { ReactNode } from "react";

export const fmtPct = (v?: number) => (v === undefined ? "—" : `${v.toFixed(2)}%`);
export const fmtDate = (t: number) => new Date(t).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

export function HeatmapViewer({ original, heatmap, method, note }: { original: string; heatmap?: string | undefined; method?: string | undefined; note?: string | undefined }) {
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <figure>
          <img src={original} alt="Original upload" className="aspect-square w-full rounded-xl bg-muted object-cover" />
          <figcaption className="mt-2 text-center text-xs text-muted-foreground">Original image</figcaption>
        </figure>
        <figure>
          {heatmap ? (
            <img src={heatmap} alt="Model heatmap overlay" className="aspect-square w-full rounded-xl bg-muted object-cover" />
          ) : (
            <div className="grid aspect-square w-full place-items-center rounded-xl border border-dashed bg-muted/50 p-6 text-center text-sm text-muted-foreground">
              Heatmap unavailable for this prediction — the model did not return one.
            </div>
          )}
          <figcaption className="mt-2 text-center text-xs text-muted-foreground">{heatmap ? `${method ?? "Heatmap"} overlay` : "No heatmap returned"}</figcaption>
        </figure>
      </div>
      <p className="mt-4 flex gap-2 rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
        <span>
          {note ? `${note.replace(/\.+$/, "")}. ` : ""}A heatmap highlights the image regions that most influenced the model's prediction (warmer = stronger influence). It is an explanation aid, not a definitive diagnosis by itself.
        </span>
      </p>
    </div>
  );
}

export function ProbabilityBars({ probs }: { probs: Record<string, number> }) {
  const rows = Object.entries(probs).sort((a, b) => b[1] - a[1]);
  return (
    <ul className="space-y-3">
      {rows.map(([k, v], i) => (
        <li key={k}>
          <div className="mb-1 flex justify-between text-sm"><span>{prettyLabel(k)}</span><span className="font-mono">{v.toFixed(2)}%</span></div>
          <div className="h-2 rounded-full bg-muted"><div className={i === 0 ? "h-2 rounded-full bg-gradient-primary" : "h-2 rounded-full bg-cyan/40"} style={{ width: `${Math.max(1, v)}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="rounded-xl bg-muted/60 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 flex items-center gap-2 font-semibold">{icon}{value}</p>
    </div>
  );
}

function loadImg(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

export async function downloadReport(r: PredictionRecord, original: string) {
  const W = 1200, H = 760, c = document.createElement("canvas");
  c.width = W; c.height = H;
  const x = c.getContext("2d");
  if (!x) return;
  const css = getComputedStyle(document.documentElement);
  const col = (n: string) => css.getPropertyValue(n).trim();
  x.fillStyle = col("--card"); x.fillRect(0, 0, W, H);
  x.fillStyle = col("--primary"); x.fillRect(0, 0, W, 8);
  x.fillStyle = col("--foreground"); x.font = "700 34px 'Space Grotesk', sans-serif"; x.fillText("AgriSense AI — Prediction Report", 48, 70);
  x.font = "16px 'DM Sans', sans-serif"; x.fillStyle = col("--muted-foreground"); x.fillText(fmtDate(r.createdAt), 48, 100);
  const o = await loadImg(original); x.drawImage(o, 48, 130, 420, 420);
  if (r.heatmap) { const h = await loadImg(r.heatmap); x.drawImage(h, 492, 130, 420, 420); }
  else { x.strokeStyle = col("--border"); x.strokeRect(492, 130, 420, 420); x.fillText("Heatmap unavailable", 620, 345); }
  x.fillStyle = col("--muted-foreground"); x.fillText("Original", 48, 575); x.fillText(r.heatmap ? `${r.heatmapMethod ?? "Heatmap"} overlay` : "", 492, 575);
  const lines: [string, string][] = [["Crop", r.crop], ["Crop confidence", fmtPct(r.cropConfidence)], ["Model", r.model], ["Prediction", prettyLabel(r.disease)], ["Confidence", fmtPct(r.confidence)]];
  lines.forEach(([k, v], i) => {
    x.fillStyle = col("--muted-foreground"); x.font = "14px 'DM Sans', sans-serif"; x.fillText(k, 940, 150 + i * 70);
    x.fillStyle = col("--foreground"); x.font = "600 22px 'Space Grotesk', sans-serif"; x.fillText(v, 940, 178 + i * 70);
  });
  x.fillStyle = col("--muted-foreground"); x.font = "13px 'DM Sans', sans-serif";
  x.fillText("Heatmaps show regions influencing the model's prediction and are not a definitive diagnosis.", 48, 640);
  x.fillText("Generated in-browser from live model responses · Powered by AgriSense AI", 48, 665);
  const a = document.createElement("a");
  a.href = c.toDataURL("image/png"); a.download = `agrisense-${r.crop.toLowerCase()}-${r.createdAt}.png`; a.click();
}

export function RecordView({ record: r, original, actions }: { record: PredictionRecord; original?: string | null | undefined; actions?: ReactNode }) {
  const img = original ?? r.image;
  return (
    <div className="space-y-6 animate-fade-up">
      <div className="surface rounded-2xl p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-success" /> Completed · {r.model}</p>
            <h2 className={`mt-2 text-4xl font-bold md:text-5xl ${isHealthy(r) ? "text-success" : "text-gold"}`}>{prettyLabel(r.disease)}</h2>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" />{fmtDate(r.createdAt)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Model confidence</p>
            <p className="font-display text-4xl font-bold">{fmtPct(r.confidence)}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat label="Identified crop" value={r.crop} icon={<Leaf className="h-4 w-4 text-primary" />} />
          <Stat label="Crop confidence" value={fmtPct(r.cropConfidence)} />
          <Stat label="Disease model" value={r.model} />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="surface rounded-2xl p-6"><h3 className="mb-4 font-semibold">Visual explanation</h3><HeatmapViewer original={img} heatmap={r.heatmap} method={r.heatmapMethod} note={r.heatmapNote} /></div>
        <div className="surface rounded-2xl p-6">
          <h3 className="mb-4 font-semibold">Disease probabilities</h3>
          {r.probabilities ? <ProbabilityBars probs={r.probabilities} /> : <p className="text-sm text-muted-foreground">The model did not return class probabilities.</p>}
          {r.cropProbabilities && (<><h3 className="mb-4 mt-8 font-semibold">Crop identification</h3><ProbabilityBars probs={r.cropProbabilities} /></>)}
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {actions}
        <Button size="lg" variant="outline" onClick={() => void downloadReport(r, img)}><Download /> Download report</Button>
      </div>
    </div>
  );
}
