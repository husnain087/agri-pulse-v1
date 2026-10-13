import { useEffect, useState } from "react";
import { Brain } from "lucide-react";
import { ORANGE_MIN_MS, ORANGE_MODEL } from "@/lib/orange/orange-api";

const MSGS = ["Initializing EfficientNet-B0...", "Preprocessing image...", "Extracting visual features...", "Analyzing disease patterns...", "Calculating class probabilities...", "Preparing prediction results..."];
const LAYERS = [4, 6, 6, 5];
const W = 360, H = 220;
const pos = (l: number, i: number) => ({ x: 30 + (l * (W - 60)) / (LAYERS.length - 1), y: ((i + 1) * H) / (LAYERS[l]! + 1) });

export function OrangeProcessing({ image, started, waitingOnApi }: { image: string; started: number; waitingOnApi: boolean }) {
  const [now, setNow] = useState(started);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const t = setInterval(() => setNow(Date.now()), 120);
    return () => clearInterval(t);
  }, []);
  const p = Math.min(1, (now - started) / ORANGE_MIN_MS);
  const pct = waitingOnApi && p >= 1 ? 96 : Math.round(p * 96);
  const msg = MSGS[Math.min(MSGS.length - 1, Math.floor(p * MSGS.length))];
  const edges: { a: { x: number; y: number }; b: { x: number; y: number }; k: string }[] = [];
  for (let l = 0; l < LAYERS.length - 1; l++)
    for (let i = 0; i < LAYERS[l]!; i++)
      for (let j = 0; j < LAYERS[l + 1]!; j++) if ((i + j) % 2 === 0) edges.push({ a: pos(l, i), b: pos(l + 1, j), k: `${l}-${i}-${j}` });
  const C = 2 * Math.PI * 34;

  return (
    <div className="theme-night overflow-hidden rounded-3xl p-5 md:p-7" role="status" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground"><Brain className="h-6 w-6" /></span>
          <div><p className="font-display text-2xl font-bold">{ORANGE_MODEL}</p><p className="text-sm text-muted-foreground">Deep Learning Image Classification Model</p></div>
        </div>
        <div className="relative h-20 w-20">
          <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90"><circle cx="40" cy="40" r="34" className="fill-none stroke-muted" strokeWidth="6" /><circle cx="40" cy="40" r="34" className="fill-none stroke-primary transition-all duration-150" strokeWidth="6" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} /></svg>
          <span className="absolute inset-0 grid place-items-center font-mono text-sm">{pct}%</span>
        </div>
      </div>
      <div className="mt-6 grid items-center gap-6 md:grid-cols-[220px_1fr]">
        <div className="relative mx-auto aspect-square w-full max-w-[220px] overflow-hidden rounded-2xl ring-1 ring-primary/40">
          <img src={image} alt="Orange being analyzed" className="h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-3 rounded-lg border border-primary/60" aria-hidden />
          {["left-2 top-2 border-l-2 border-t-2", "right-2 top-2 border-r-2 border-t-2", "left-2 bottom-2 border-b-2 border-l-2", "right-2 bottom-2 border-b-2 border-r-2"].map((c) => <span key={c} className={`absolute h-5 w-5 border-primary ${c}`} aria-hidden />)}
          {!reduced && <div className="orange-scan pointer-events-none absolute inset-x-0 h-12 bg-gradient-to-b from-transparent via-primary/40 to-transparent" aria-hidden />}
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden>
          {edges.map(({ a, b, k }) => <line key={k} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="stroke-primary/25" strokeWidth="0.8" />)}
          {!reduced && edges.filter((_, i) => i % 3 === 0).map(({ a, b, k }, i) => (
            <circle key={`p${k}`} r="2.2" className="fill-primary">
              <animateMotion dur={`${1.2 + (i % 5) * 0.25}s`} begin={`${(i % 7) * 0.18}s`} repeatCount="indefinite" path={`M${a.x},${a.y} L${b.x},${b.y}`} />
            </circle>
          ))}
          {LAYERS.flatMap((n, l) => Array.from({ length: n }, (_, i) => {
            const { x, y } = pos(l, i);
            return <circle key={`n${l}${i}`} cx={x} cy={y} r="6" className={`fill-background stroke-primary ${reduced ? "" : "orange-neuron"}`} strokeWidth="2" style={{ animationDelay: `${(l * 0.3 + i * 0.12).toFixed(2)}s` }} />;
          }))}
        </svg>
      </div>
      <p className="mt-5 text-center font-mono text-sm text-primary">{p >= 1 && waitingOnApi ? "Waiting for the model response..." : msg}</p>
    </div>
  );
}
