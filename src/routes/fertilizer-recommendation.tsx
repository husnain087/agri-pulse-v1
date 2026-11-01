import { useLanguage } from "@/lib/site-language";
import { LanguageSwitcher } from "@/components/agrisense/LanguageSwitcher";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, Brain, FlaskConical, Home, Leaf, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/agrisense/BrandMark";
import { AccountButton } from "@/components/agrisense/AccountButton";
import { NeuralBrainAnimation } from "@/components/agrisense/NeuralBrainAnimation";
import { FERT_OPTIONS, NUM_FIELDS, predictFertilizer, toFertInput, type FertInput, type FertPrediction, type SelectKey } from "@/lib/fertilizer/fertilizer-api";

export const Route = createFileRoute("/fertilizer-recommendation")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "AI Fertilizer Recommendation — Agri Pulse" },
      { name: "description", content: "Get an intelligent fertilizer recommendation from soil conditions, crop type and nutrient levels using a trained machine learning model." },
      { property: "og:title", content: "AI Fertilizer Recommendation — Agri Pulse" },
      { property: "og:description", content: "Machine-learning fertilizer recommendations from your soil, crop and N-P-K values." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FertilizerPage,
});

const LABELS: Record<SelectKey, string> = { Soil_Type: "Soil Type", Crop_Type: "Crop Type", Crop_Growth_Stage: "Crop Growth Stage", Season: "Season", Irrigation_Type: "Irrigation Type", Previous_Crop: "Previous Crop", Region: "Region" };
const MAIN_SELECTS: SelectKey[] = ["Soil_Type", "Crop_Type"];
const EXTRA_SELECTS: SelectKey[] = ["Crop_Growth_Stage", "Season", "Irrigation_Type", "Previous_Crop", "Region"];
const STAGES = ["Analyzing soil conditions", "Evaluating crop requirements", "Processing nutrient values", "Generating fertilizer recommendation"];
const field = "h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/30";

type Phase = { k: "form" } | { k: "running" } | { k: "error"; msg: string } | { k: "done"; r: FertPrediction; input: FertInput };

function FertilizerPage() {
 const { t } = useLanguage();
  const [raw, setRaw] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<Phase>({ k: "form" });
  const run = useRef(0);

  const submit = async () => {
    const v = toFertInput(raw);
    if (!v.ok) { setErrors(v.errors); document.getElementById(`f-${Object.keys(v.errors)[0]}`)?.focus(); return; }
    setErrors({});
    const id = ++run.current;
    setPhase({ k: "running" });
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      const r = await predictFertilizer(v.body);
      if (id === run.current) setPhase({ k: "done", r, input: v.body });
    } catch (e) {
      if (id === run.current) setPhase({ k: "error", msg: e instanceof Error ? e.message : "Prediction failed." });
    }
  };
  const reset = () => { setRaw({}); setErrors({}); setPhase({ k: "form" }); };

  const num = (f: (typeof NUM_FIELDS)[number]) => (
    <label key={f.k} className="block text-sm">
      <span className="mb-1.5 block font-medium">{t(f.label)}</span>
      <input id={`f-${f.k}`} type="number" inputMode="decimal" step="any" min={f.min} max={f.max} value={raw[f.k] ?? ""} onChange={(e) => setRaw({ ...raw, [f.k]: e.target.value })} className={field} aria-invalid={!!errors[f.k]} />
      {t(errors[f.k] && <span className="mt-1 block text-xs text-destructive">{t(errors[f.k])}</span>)}
    </label>
  );
  const sel = (k: SelectKey) => (
    <label key={k} className="block text-sm">
      <span className="mb-1.5 block font-medium">{t(LABELS[k])}</span>
      <select id={`f-${k}`} value={raw[k] ?? ""} onChange={(e) => setRaw({ ...raw, [k]: e.target.value })} className={field} aria-invalid={!!errors[k]}>
        <option value="">{t("Select…")}</option>
        {t(FERT_OPTIONS[k].map((o) => <option key={o} value={o}>{t(o)}</option>))}
      </select>
      {t(errors[k] && <span className="mt-1 block text-xs text-destructive">{t(errors[k])}</span>)}
    </label>
  );

  return (
    <div className="min-h-screen">
      <header className="theme-night">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <BrandMark />
          <div className="flex flex-wrap items-center gap-2"><Button asChild size="sm" variant="outline"><Link to="/"><ArrowLeft /> {t("Home")}</Link></Button><LanguageSwitcher /><AccountButton /></div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">{t("Option 4 · Fertilizer Model")}</p>
        <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold md:text-4xl"><FlaskConical className="h-8 w-8 text-primary" /> {t("AI-Powered Fertilizer Recommendation")}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{t("Get an intelligent fertilizer recommendation based on your soil conditions, crop type, and nutrient levels using our machine learning model.")}</p>

        {t(phase.k === "running" && <Processing />)}

        {t(phase.k === "done" && <Results r={phase.r} input={phase.input} onAgain={submit} onNew={reset} />)}

        {t((phase.k === "form" || phase.k === "error") && (
          <form className="animate-fade-up mt-8 space-y-6" onSubmit={(e) => { e.preventDefault(); void submit(); }} noValidate>
            {t(phase.k === "error" && (
              <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
                <AlertTriangle className="h-5 w-5 text-destructive" /><span className="flex-1">{t(phase.msg)}</span>
                <Button type="submit" size="sm" variant="outline"><RotateCcw /> {t("Retry")}</Button>
              </div>
            ))}
            <section className="surface rounded-2xl p-5 md:p-6">
              <h2 className="text-lg font-semibold">{t("Soil, crop & nutrients")}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{t(NUM_FIELDS.filter((f) => f.main).map(num))}{t(MAIN_SELECTS.map(sel))}</div>
            </section>
            <section className="surface rounded-2xl p-5 md:p-6">
              <h2 className="text-lg font-semibold">{t("Field & season details")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("The model also requires these values to make a prediction.")}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{t(NUM_FIELDS.filter((f) => !f.main).map(num))}{t(EXTRA_SELECTS.map(sel))}</div>
            </section>
            {t(Object.keys(errors).length > 0 && <p className="text-sm text-destructive">{t("Please fix the highlighted fields.")}</p>)}
            <div className="flex flex-wrap gap-3">
              <Button type="submit" size="lg" className="bg-gradient-primary glow"><Sparkles /> {t("Get Fertilizer Recommendation")}</Button>
              <Button type="button" size="lg" variant="outline" onClick={reset}><RotateCcw /> {t("Reset Form")}</Button>
            </div>
          </form>
        ))}
      </main>
    </div>
  );
}

function Processing() {
 const { t } = useLanguage();
  return (
    <div className="theme-night animate-fade-up mt-8 overflow-hidden rounded-3xl p-6 md:p-8" role="status" aria-live="polite">
      <div className="grid items-center gap-6 md:grid-cols-[1fr_1fr]">
        <div className="relative mx-auto aspect-square w-full max-w-xs">
          <NeuralBrainAnimation intensity={0.85} />
          <span className="absolute inset-0 m-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-primary text-primary-foreground glow animate-pulse"><Brain className="h-8 w-8" /></span>
        </div>
        <div>
          <p className="font-display text-2xl font-bold">{t("AI Model is Analyzing Your Input…")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("Waiting for the fertilizer recommendation model to respond.")}</p>
          <ol className="mt-6 space-y-3">
            {t(STAGES.map((s, i) => (
              <li key={s} className="flex items-center gap-3 rounded-xl border border-primary/20 bg-muted/40 px-3 py-2.5 text-sm">
                <span className="relative grid h-3 w-3 place-items-center"><span className="absolute h-3 w-3 animate-ping rounded-full bg-primary/60" style={{ animationDelay: `${i * 0.35}s` }} /><span className="h-2 w-2 rounded-full bg-primary" /></span>
                {t(s)}
              </li>
            )))}
          </ol>
          <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full w-1/3 animate-[fert-sweep_1.4s_ease-in-out_infinite] rounded-full bg-gradient-primary" /></div>
        </div>
      </div>
    </div>
  );
}

function Results({ r, input, onAgain, onNew }: { r: FertPrediction; input: FertInput; onAgain: () => void; onNew: () => void }) {
 const { t } = useLanguage();
  const probs = [...(r.model_probabilities ?? [])].sort((a, b) => b.probability_percent - a.probability_percent);
  const top = probs.find((p) => p.fertilizer === r.predicted_fertilizer);
  return (
    <div className="animate-fade-up mt-8 space-y-6">
      <div className="theme-night relative overflow-hidden rounded-3xl p-6 md:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 opacity-50" aria-hidden><NeuralBrainAnimation intensity={0.3} /></div>
        <p className="relative font-mono text-xs uppercase tracking-widest text-primary">{t("Recommended fertilizer")}</p>
        <p className="relative mt-2 flex items-center gap-3 text-4xl font-bold md:text-5xl"><Leaf className="h-10 w-10 text-primary" /> {t(r.predicted_fertilizer)}</p>
        {t(top && <p className="relative mt-3 text-muted-foreground">{t("Model probability: ")}<span className="font-mono text-primary">{t(top.probability_percent.toFixed(2))}{t("%")}</span></p>)}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {t(probs.length > 0 && (
          <section className="surface rounded-2xl p-5">
            <h2 className="font-semibold">{t("All fertilizer probabilities")}</h2>
            <ul className="mt-4 space-y-3">
              {t(probs.map((p) => (
                <li key={p.fertilizer} className="text-sm">
                  <div className="flex justify-between"><span>{t(p.fertilizer)}</span><span className="font-mono">{t(p.probability_percent.toFixed(2))}{t("%")}</span></div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-primary transition-all duration-700" style={{ width: `${p.probability_percent}%` }} /></div>
                </li>
              )))}
            </ul>
          </section>
        ))}
        <section className="surface rounded-2xl p-5">
          <h2 className="font-semibold">{t("Your input")}</h2>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {t(NUM_FIELDS.map((f) => <div key={f.k} className="contents"><dt className="text-muted-foreground">{t(f.label)}</dt><dd className="text-right font-mono">{t(input[f.k])}</dd></div>))}
            {t((Object.keys(LABELS) as SelectKey[]).map((k) => <div key={k} className="contents"><dt className="text-muted-foreground">{t(LABELS[k])}</dt><dd className="text-right">{t(input[k])}</dd></div>))}
          </dl>
        </section>
      </div>
      {t(r.notice && <p className="text-sm text-muted-foreground">{t(r.notice)}</p>)}
      <div className="flex flex-wrap gap-3">
        <Button onClick={onAgain} className="bg-gradient-primary glow"><RotateCcw /> {t("Try Again")}</Button>
        <Button variant="outline" onClick={onNew}><Sparkles /> {t("Make Another Prediction")}</Button>
        <Button asChild variant="outline"><Link to="/"><Home /> {t("Back to Home")}</Link></Button>
      </div>
    </div>
  );
}
