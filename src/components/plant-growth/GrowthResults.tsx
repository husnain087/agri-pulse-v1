import { Sparkles, Ruler, TrendingUp, AlertTriangle, Lightbulb, Info, Calculator } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { GrowthAi, MeasuredRate } from "@/lib/plant-growth/types";
import { cn } from "@/lib/utils";

const HEALTH: Record<GrowthAi["health_status"], string> = {
  healthy: "Healthy", mild_stress: "Mild stress", moderate_stress: "Moderate stress", severe_stress: "Severe stress", uncertain: "Uncertain",
};
const SEV: Record<string, string> = { low: "text-success", medium: "text-gold", high: "text-destructive" };

export function GrowthResults({ ai, measured, image, model, analyzedAt }: { ai: GrowthAi; measured: MeasuredRate | null; image: string; model: string; analyzedAt: number }) {
  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-start gap-3 rounded-2xl border border-gold/40 bg-gold/10 p-4 text-sm">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
        <p><strong>AI-generated preliminary assessment</strong> by {model}. This is <em>not</em> a prediction from a trained AgriSense ML model and is kept separate from crop / maize / wheat model results. {ai.confidence_note}</p>
      </div>
      {!ai.image_is_plant && <p role="alert" className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">The image doesn't appear to show a plant. Please upload a clear plant photo.</p>}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="surface rounded-2xl p-5">
          <img src={image} alt="Analyzed plant" className="aspect-square w-full rounded-xl object-cover" />
          <p className="mt-3 text-xs text-muted-foreground">Analyzed {new Date(analyzedAt).toLocaleString()}</p>
        </div>
        <div className="surface rounded-2xl p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">AI estimate</Badge>
            <Badge variant="secondary">{HEALTH[ai.health_status]}</Badge>
          </div>
          <h2 className="mt-3 text-2xl font-bold md:text-3xl">{ai.growth_stage}</h2>
          <p className="mt-2 text-muted-foreground">{ai.visible_condition}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-muted/60 p-4">
              <p className="flex items-center gap-2 text-xs text-muted-foreground"><Ruler className="h-4 w-4" /> Estimated current height <Badge variant="outline" className="ml-auto">AI</Badge></p>
              <p className="mt-1 font-display text-2xl font-bold">{ai.estimated_height_cm != null ? `≈ ${ai.estimated_height_cm.toFixed(1)} cm` : "Not reliable"}</p>
              {ai.height_estimate_basis && <p className="mt-1 text-xs text-muted-foreground">{ai.height_estimate_basis}</p>}
            </div>
            <div className="rounded-xl bg-muted/60 p-4">
              <p className="flex items-center gap-2 text-xs text-muted-foreground"><Calculator className="h-4 w-4" /> Measured growth rate <Badge variant="outline" className="ml-auto">Your data</Badge></p>
              <p className="mt-1 font-display text-2xl font-bold">{measured ? `${measured.cmPerDay.toFixed(2)} cm/day` : "Insufficient data"}</p>
              <p className="mt-1 text-xs text-muted-foreground">{measured ? `${measured.deltaCm >= 0 ? "+" : ""}${measured.deltaCm.toFixed(1)} cm over ${measured.days} days — calculated from your measurements.` : "Enter current height, previous height and days between them."}</p>
            </div>
          </div>
          <div className="mt-3 rounded-xl bg-muted/60 p-4">
            <p className="flex items-center gap-2 text-xs text-muted-foreground"><TrendingUp className="h-4 w-4" /> Future growth estimate <Badge variant="outline" className="ml-auto">AI</Badge></p>
            {ai.future_growth ? (
              <>
                <p className="mt-1 font-display text-xl font-bold">≈ {ai.future_growth.estimated_height_cm.toFixed(1)} cm in {ai.future_growth.days_ahead} days</p>
                <p className="mt-1 text-xs text-muted-foreground">{ai.future_growth.rationale}</p>
              </>
            ) : <p className="mt-1 text-sm">Not enough supporting data for a reliable projection.</p>}
          </div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="surface rounded-2xl p-6">
          <h3 className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4 text-gold" /> Possible growth risks</h3>
          {ai.growth_risks.length ? (
            <ul className="mt-4 space-y-3">{ai.growth_risks.map((r, i) => (
              <li key={i} className="rounded-xl bg-muted/60 p-3"><p className="flex justify-between gap-2 font-medium">{r.risk}<span className={cn("text-xs uppercase", SEV[r.severity])}>{r.severity}</span></p><p className="mt-1 text-xs text-muted-foreground">{r.evidence}</p></li>
            ))}</ul>
          ) : <p className="mt-3 text-sm text-muted-foreground">No notable risks identified.</p>}
          <h4 className="mt-6 text-sm font-semibold">Visible stress signs</h4>
          {ai.stress_signs.length ? <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{ai.stress_signs.map((s, i) => <li key={i}>{s}</li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">None visible.</p>}
        </div>
        <div className="surface rounded-2xl p-6">
          <h3 className="flex items-center gap-2 font-semibold"><Lightbulb className="h-4 w-4 text-primary" /> Recommendations</h3>
          <ul className="mt-4 space-y-2 text-sm">{ai.recommendations.map((r, i) => <li key={i} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{r}</li>)}</ul>
          {ai.data_limitations.length > 0 && (<>
            <h4 className="mt-6 flex items-center gap-2 text-sm font-semibold"><Info className="h-4 w-4 text-cyan" /> Limitations</h4>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{ai.data_limitations.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </>)}
        </div>
      </div>
    </div>
  );
}
