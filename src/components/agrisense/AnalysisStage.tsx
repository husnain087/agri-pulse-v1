import { useLanguage } from "@/lib/site-language";
import { X, RotateCcw, AlertTriangle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModelPipeline, type CardState } from "./ModelPipeline";
import { cancelDetection, retryDetection, isBusy, type DetectionState } from "@/lib/detection-store";
import type { Crop } from "@/lib/agrisense-api";

export function cardStates(s: DetectionState) {
  const { phase, crop, error } = s;
  const chosen: Crop | null = crop?.crop ?? null;
  const cropCard = (): { state: CardState; label: string } => {
    if (phase === "init") return { state: "waiting", label: "Preparing" };
    if (phase === "identifying") return { state: "active", label: "Identifying Crop" };
    if (phase === "error" && error?.stage === "crop") return { state: "error", label: "Error" };
    if (phase === "unknown") return { state: "error", label: `Unsupported: ${crop?.rawLabel ?? "?"}` };
    if (chosen) return { state: "done", label: phase === "finishing" || phase === "done" ? "Completed" : `${chosen} Identified` };
    return { state: "waiting", label: "Waiting" };
  };
  const diseaseCard = (which: Crop): { state: CardState; label: string } => {
    if (!chosen) return { state: "waiting", label: phase === "unknown" ? "Not run" : "Waiting" };
    if (chosen !== which) return { state: "skipped", label: "Inactive" };
    if (phase === "routing") return { state: "selected", label: "Activating" };
    if (phase === "diagnosing") return { state: "active", label: "Analyzing" };
    if (phase === "error") return { state: "error", label: "Error" };
    if (phase === "finishing" || phase === "done") return { state: "done", label: "Completed" };
    return { state: "waiting", label: "Waiting" };
  };
  return { crop: cropCard(), maize: diseaseCard("Maize"), wheat: diseaseCard("Wheat"), chosen };
}

export function AnalysisStage({ s }: { s: DetectionState }) {
 const { t: tr } = useLanguage();
  const { crop, maize, wheat, chosen } = cardStates(s);
  const message: Record<string, string> = {
    init: "Initializing AI Analysis...",
    identifying: "Identifying crop type...",
    routing: `${chosen} identified — activating ${chosen} Disease AI.`,
    diagnosing: chosen === "Maize" ? "Analyzing crop health · Generating visual explanation..." : "Analyzing crop health...",
    finishing: "Analysis complete — preparing your results...",
    unknown: `The image was classified as "${s.crop?.rawLabel}". Please upload a clear maize or wheat leaf image.`,
    error: s.error?.msg ?? "Something went wrong.",
  };
  const stage = { init: 0, identifying: 0, routing: 1, diagnosing: 2, finishing: 3, done: 3 }[s.phase as "init"] ?? (s.crop ? 1 : 0);
  const busy = isBusy(s.phase);

  return (
    <div className="theme-night overflow-hidden rounded-3xl p-3 md:p-5">
      <div className="mb-3 flex items-center justify-between gap-3 px-2">
        <div className="flex items-center gap-3">
          {tr(s.preview && <img src={s.preview} alt={tr("Uploaded crop")} className="h-12 w-12 rounded-lg object-cover ring-1 ring-border" />)}
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-primary">{tr("Live analysis")}</p>
            <p className="max-w-[12rem] truncate text-sm text-muted-foreground sm:max-w-xs">{tr(s.file?.name)}</p>
          </div>
        </div>
        {tr(busy ? (
          <Button variant="outline" size="sm" onClick={cancelDetection}><X /> {tr("Cancel")}</Button>
        ) : null)}
      </div>
      <ModelPipeline crop={crop} maize={maize} wheat={wheat} message={message[s.phase] ?? ""} intensity={busy ? 1 : 0.2} stage={stage} />
      {tr((s.phase === "error" || s.phase === "unknown") && (
        <div role="alert" className="glass mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl p-4">
          <p className="flex items-center gap-2 text-sm"><AlertTriangle className="h-4 w-4 text-destructive" />{tr(message[s.phase])}</p>
          <div className="flex gap-2">
            {tr(s.phase === "error" && <Button variant="outline" onClick={retryDetection}><RotateCcw /> {tr("Retry")}</Button>)}
            <Button onClick={cancelDetection}><Upload /> {tr("Upload another image")}</Button>
          </div>
        </div>
      ))}
    </div>
  );
}
