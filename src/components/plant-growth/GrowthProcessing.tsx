import { Check, Loader2, Circle, AlertTriangle, ImagePlus, Cpu, ChartNoAxesCombined } from "lucide-react";
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
    <div className="theme-night rounded-3xl p-5 md:p-8 animate-fade-up" role="status" aria-label="Growth model processing">
      <div className="mb-6 flex items-center gap-2 border-b border-border pb-6 sm:gap-4" aria-hidden="true">
        {order.map((stage, i) => {
          const Icon = [ImagePlus, Cpu, ChartNoAxesCombined][i];
          const active = states[stage] === "active";
          const connected = states[stage] === "done" || active;
          return <div key={stage} className="contents">
            {i > 0 && <div className={cn("model-data-link", (states[order[i - 1]] === "active" || active) && busy && "model-data-link-active")}><span /><span /><span /></div>}
            <div className="flex w-20 shrink-0 flex-col items-center gap-2 text-center sm:w-28">
              <span className={cn("grid h-12 w-12 place-items-center rounded-xl border bg-muted transition-colors", active && "glow border-primary text-primary", states[stage] === "done" && "border-primary/50 text-primary")}>
                <Icon className={cn("h-6 w-6", active && "animate-pulse")} />
              </span>
              <span className={cn("text-xs font-medium", connected ? "text-foreground" : "text-muted-foreground")}>{["Photo + inputs", "Growth model", "Growth results"][i]}</span>
            </div>
          </div>;
        })}
      </div>
      <div className="grid items-center gap-8 lg:grid-cols-2">
        <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl ring-1 ring-border">
          <img src={image} alt="Plant being analyzed" className="h-full w-full object-cover" />
          {busy && <div className="pointer-events-none absolute inset-x-0 h-1/3 bg-gradient-to-b from-transparent via-primary/40 to-transparent animate-scan" aria-hidden />}
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-inset ring-primary/40" aria-hidden />
        </div>
        <div>
          <div className="relative mx-auto aspect-[2/1] max-w-md">
            <NeuralBrainAnimation intensity={busy ? 1 : 0.15} />
            <span className="absolute bottom-0 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap font-mono text-xs text-primary"><span className={cn("h-1.5 w-1.5 rounded-full bg-primary", busy && "animate-pulse")} />{busy ? "Neural network active" : "Agri Pulse growth model"}</span>
          </div>
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
          <p className="mt-2 text-center font-mono text-xs text-muted-foreground">Step {done} / 3 · Agri Pulse growth model</p>
        </div>
      </div>
    </div>
  );
}
