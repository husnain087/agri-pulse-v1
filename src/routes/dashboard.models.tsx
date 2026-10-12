import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RefreshCw, ScanSearch, Leaf, Wheat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/agrisense/BrandMark";
import { cardStates } from "@/components/agrisense/AnalysisStage";
import { API, checkHealth, type ApiKey, type Health } from "@/lib/agrisense-api";
import { useDetection } from "@/lib/detection-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/models")({
  head: () => ({
    meta: [
      { title: "AI Models — Agri Pulse" },
      { name: "description", content: "Live availability and run status of the crop identifier, maize and wheat disease models." },
      { property: "og:title", content: "AI Models — Agri Pulse" },
      { property: "og:description", content: "Live status of the three Agri Pulse models." },
    ],
  }),
  component: Models,
});

const INFO: Record<ApiKey, { purpose: string; classes: string; icon: typeof Leaf }> = {
  crop: { purpose: "Runs first on every image and decides whether it shows maize or wheat.", classes: "Maize · Wheat · Other", icon: ScanSearch },
  maize: { purpose: "Diagnoses maize leaves and returns a Grad-CAM heatmap.", classes: "Blight · Common Rust · Gray Leaf Spot · Healthy", icon: Leaf },
  wheat: { purpose: "Diagnoses wheat leaves. Shows a heatmap whenever the service returns one.", classes: "Healthy · Septoria · Stripe Rust", icon: Wheat },
};

function Models() {
  const s = useDetection();
  const cards = cardStates(s);
  const [h, setH] = useState<Record<ApiKey, Health>>({ crop: "checking", maize: "checking", wheat: "checking" });
  const run = () => {
    setH({ crop: "checking", maize: "checking", wheat: "checking" });
    (Object.keys(API) as ApiKey[]).forEach((k) => void checkHealth(k).then((v) => setH((p) => ({ ...p, [k]: v }))));
  };
  useEffect(run, []);
  const runLabel = (k: ApiKey) => {
    const st = cards[k].state;
    return st === "active" || st === "selected" ? "Running" : st === "done" ? "Completed" : st === "error" ? "Error" : "Idle";
  };
  return (
    <div className="animate-fade-up">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title="AI Models" sub="Availability is shown as Online only when the service's health check actually responds." />
        <Button variant="outline" onClick={run}><RefreshCw /> Recheck</Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {(Object.keys(API) as ApiKey[]).map((k, i) => {
          const Icon = INFO[k].icon;
          return (
            <div key={k} className="surface flex flex-col rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-primary"><Icon className="h-5 w-5" /></span>
                <Badge variant="outline">{runLabel(k)}</Badge>
              </div>
              <p className="mt-4 font-mono text-xs text-muted-foreground">0{i + 1}</p>
              <h3 className="text-xl font-semibold">{API[k].name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{INFO[k].purpose}</p>
              <p className="mt-3 text-xs text-muted-foreground">Classes: {INFO[k].classes}</p>
              <p className="mt-4 break-all rounded-lg bg-muted p-2 font-mono text-xs">{API[k].base}</p>
              <p className="mt-4 flex items-center gap-2 text-sm">
                <span className={cn("h-2.5 w-2.5 rounded-full", h[k] === "online" ? "bg-success" : h[k] === "offline" ? "bg-destructive" : "animate-pulse bg-muted-foreground")} />
                {h[k] === "online" ? "Online — health check passed" : h[k] === "offline" ? "Unreachable / not verified" : "Checking…"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
