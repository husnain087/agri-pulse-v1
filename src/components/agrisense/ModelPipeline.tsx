import { useLanguage } from "@/lib/site-language";
import { Check, Loader2, AlertTriangle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { NeuralBrainAnimation } from "./NeuralBrainAnimation";

export type CardState = "waiting" | "active" | "selected" | "done" | "error" | "skipped";

export function ModelStatusCard({ index, title, state, label }: { index: string; title: string; state: CardState; label: string }) {
 const { t } = useLanguage();
  const Icon = state === "active" || state === "selected" ? Loader2 : state === "done" ? Check : state === "error" ? AlertTriangle : Circle;
  return (
    <div
      className={cn(
        "glass rounded-xl p-4 transition-all duration-500",
        (state === "active" || state === "selected") && "glow",
        state === "done" && "border-primary/50",
        state === "error" && "border-destructive/60",
        state === "skipped" && "opacity-40",
      )}
    >
      <p className="font-mono text-xs text-muted-foreground">{t(index)}</p>
      <p className="mt-1 font-display font-semibold">{t(title)}</p>
      <p className={cn("mt-2 flex items-center gap-2 text-sm", state === "error" ? "text-destructive" : state === "waiting" || state === "skipped" ? "text-muted-foreground" : "text-primary")}>
        <Icon className={cn("h-4 w-4", (state === "active" || state === "selected") && "animate-spin")} aria-hidden />
        {t(label)}
      </p>
    </div>
  );
}

interface Props {
  crop: { state: CardState; label: string };
  maize: { state: CardState; label: string };
  wheat: { state: CardState; label: string };
  message: string;
  intensity: number;
  stage: number; // 0..3 real pipeline steps completed
}

export function ModelPipeline({ crop, maize, wheat, message, intensity, stage }: Props) {
 const { t } = useLanguage();
  const line = (s: CardState) =>
    cn("transition-all duration-500", s === "waiting" || s === "skipped" ? "stroke-border" : s === "error" ? "stroke-destructive" : "stroke-primary");
  const flowing = (s: CardState) => s === "active" || s === "selected";
  return (
    <div className="glass rounded-2xl p-5 md:p-8 animate-fade-up">
      <div className="grid items-center gap-6 lg:grid-cols-[1.2fr_auto_1fr]">
        <div className="relative mx-auto aspect-square w-full max-w-md">
          <NeuralBrainAnimation intensity={intensity} />
        </div>
        <svg viewBox="0 0 80 300" className="hidden h-72 w-20 lg:block" aria-hidden fill="none" strokeWidth="2">
          {t([{ s: crop.state, y: 50 }, { s: maize.state, y: 150 }, { s: wheat.state, y: 250 }].map(({ s, y }) => (
            <path key={y} d={`M0 150 C 40 150, 40 ${y}, 80 ${y}`} className={cn(line(s), flowing(s) && "animate-flow")} strokeDasharray={flowing(s) ? "6 4" : undefined} />
          )))}
        </svg>
        <div className="space-y-3">
          <ModelStatusCard index="01" title={t("Crop Identifier")} {...crop} />
          <ModelStatusCard index="02" title={t("Maize Disease AI")} {...maize} />
          <ModelStatusCard index="03" title={t("Wheat Disease AI")} {...wheat} />
        </div>
      </div>
      <div className="mt-6" role="status" aria-live="polite">
        <p className="text-center font-display text-lg">{t(message)}</p>
        <div className="mx-auto mt-3 flex max-w-sm gap-2" aria-label={t(`Step ${stage} of 3`)}>
          {t([1, 2, 3].map((i) => (
            <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors duration-500", stage >= i ? "bg-gradient-primary" : "bg-muted")} />
          )))}
        </div>
        <p className="mt-2 text-center font-mono text-xs text-muted-foreground">{t("Step ")}{t(stage)} {t("/ 3 · Identify → Route → Diagnose")}</p>
      </div>
    </div>
  );
}
