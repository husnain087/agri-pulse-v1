import { Check, Loader2, Circle, AlertTriangle } from "lucide-react";
import { NeuralBrainAnimation } from "@/components/agrisense/NeuralBrainAnimation";
import { cn } from "@/lib/utils";

export type GrowthStage = "preprocess" | "analyze" | "result";
export type StageState = "pending" | "active" | "done" | "error";

const LABELS: Record<GrowthStage, string> = {
  preprocess: "Model health check",
  analyze: "Growth model prediction",
  result: "Result generation",
};

/** Visual feedback only — every state is driven by the real request lifecycle. */
export function GrowthProcessing({ image, states }: { image: string; states: Record<GrowthStage, StageState> }) {
  const order: GrowthStage[] = ["preprocess", "analyze", "result"];
  const done = order.filter((s) => states[s] === "done").length;
  const busy = order.some((s) => states[s] === "active");
  return (
    <div className="theme-night rounded-3xl p-5 md:p-8 animate-fade-up">
      <div className="grid items-center gap-8 lg:grid-cols-2">
        <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl ring-1 ring-border">
          <img src={image} alt="Plant being analyzed" className="h-full w-full object-cover" />
          {busy && <div className="pointer-events-none absolute inset-x-0 h-1/3 bg-gradient-to-b from-transparent via-primary/40 to-transparent animate-scan" aria-hidden />}
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-inset ring-primary/40" aria-hidden />
        </div>
        <div>
          <div className="mx-auto aspect-[2/1] max-w-md"><NeuralBrainAnimation intensity={busy ? 1 : 0.15} /></div>
          <ul className="mt-4 space-y-3" aria-live="polite">
            {order.map((s) => {
              const st = states[s];
              const Icon = st === "active" ? Loader2 : st === "done" ? Check : st === "error" ? AlertTriangle : Circle;
              return (
                <li key={s} className={cn("glass flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all", st === "active" && "glow")}>
                  <Icon className={cn("h-4 w-4", st === "active" && "animate-spin text-primary", st === "done" && "text-primary", st === "error" && "text-destructive", st === "pending" && "text-muted-foreground")} />
                  <span className={st === "pending" ? "text-muted-foreground" : ""}>{LABELS[s]}</span>
                  <span className="ml-auto font-mono text-xs text-muted-foreground">{st === "active" ? "running" : st}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex gap-2" aria-label={`Step ${done} of 3`}>
            {order.map((s, i) => <div key={s} className={cn("h-1.5 flex-1 rounded-full transition-colors", i < done ? "bg-gradient-primary" : "bg-muted")} />)}
          </div>
          <p className="mt-2 text-center font-mono text-xs text-muted-foreground">Step {done} / 3 · AgriSense growth model</p>
        </div>
      </div>
    </div>
  );
}
