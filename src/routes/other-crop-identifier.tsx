import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ScanSearch, Upload, X, LoaderCircle, Leaf, ShieldCheck, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/agrisense/BrandMark";
import { AccountButton } from "@/components/agrisense/AccountButton";
import { AnalyseResults } from "@/components/agrisense/AnalyseResults";
import { LanguageSwitcher } from "@/components/agrisense/LanguageSwitcher";
import { NeuralBrainAnimation } from "@/components/agrisense/NeuralBrainAnimation";
import { ModelStatusCard } from "@/components/agrisense/ModelPipeline";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/site-language";
import { IMAGE_ACCEPT, normalizeImage } from "@/lib/normalize-image";
import { identifyOtherCrop } from "@/lib/other-crop.functions";
import type { CropIdentification } from "@/lib/other-crop";

export const Route = createFileRoute("/other-crop-identifier")({
  staticData: { sitemap: true },
  head: () => ({ meta: [
    { title: "Other Crop Identifier — Agri Pulse" },
    { name: "description", content: "Identify crops from photos with Agri Pulse AI, check visible rust and disease signs, and explore growing conditions and crop care." },
    { property: "og:title", content: "Other Crop Identifier — Agri Pulse" },
    { property: "og:description", content: "Upload a crop photo for AI identification, visible rust and disease checks, and crop details in English or Urdu." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: OtherCropPage,
});

function OtherCropPage() {
  const { t: tr, language } = useLanguage();
  const identify = useServerFn(identifyOtherCrop);
  const input = useRef<HTMLInputElement>(null);
  const generation = useRef(0);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CropIdentification | null>(null);
  const [resultLanguage, setResultLanguage] = useState(language);
  const [stage, setStage] = useState(0);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => () => { generation.current++; }, []);
  // Stage indicators advance while the real request is in flight; results show as soon as the model answers.
  useEffect(() => {
    if (!busy) return;
    setStage(1);
    const timers = [setTimeout(() => setStage(2), 900), setTimeout(() => setStage(3), 2200)];
    return () => timers.forEach(clearTimeout);
  }, [busy]);

  const pick = async (photo?: File) => {
    if (!photo || busy || preparing) return;
    const id = ++generation.current;
    setPreparing(true); setError(null); setResult(null);
    try {
      const normalized = await normalizeImage(photo, 1600);
      if (id !== generation.current) return;
      setFile(normalized); setPreview(URL.createObjectURL(normalized));
    } catch (e) { if (id === generation.current) setError(e instanceof Error ? e.message : "Could not read this image."); }
    finally { if (id === generation.current) setPreparing(false); }
  };
  const analyze = async () => {
    if (!file || busy || preparing) return;
    const id = ++generation.current;
    setBusy(true); setError(null); setResult(null);
    const selectedLanguage = language;
    try {
      const image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read this image."));
        reader.onerror = () => reject(new Error("Could not read this image."));
        reader.readAsDataURL(file);
      });
      const response = await identify({ data: { image, language: selectedLanguage } });
      if (id === generation.current) { setResult(response); setResultLanguage(selectedLanguage); }
    } catch (e) { if (id === generation.current) setError(e instanceof Error ? e.message : "Prediction failed."); }
    finally { if (id === generation.current) setBusy(false); }
  };
  const clear = () => { generation.current++; setFile(null); setPreview(null); setResult(null); setError(null); };

  return <div className="min-h-screen">
    <header className="theme-night">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5">
        <BrandMark /><div className="flex flex-wrap items-center gap-2"><Button asChild size="sm" variant="outline"><Link to="/"><ArrowLeft />{tr("Home")}</Link></Button><LanguageSwitcher /><AccountButton /></div>
      </div>
      <div className="mx-auto max-w-6xl px-5 pb-10 pt-6"><p className="flex items-center gap-2 text-sm text-primary"><ScanSearch className="h-4 w-4" />{tr("AI-Powered")}</p><h1 className="mt-3 text-4xl font-bold md:text-5xl">{tr("Other Crop Identifier")}</h1><p className="mt-3 max-w-2xl text-muted-foreground">{tr("Identify your crop, check visible rust and disease signs, and explore growing details.")}</p></div>
    </header>
    <main className="mx-auto max-w-6xl px-5 py-10">
      <div className="grid items-start gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="min-w-0">
          <input ref={input} type="file" accept={IMAGE_ACCEPT} aria-label={tr("Choose crop image")} className="sr-only" disabled={busy || preparing} onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ""; }} />
          <Button variant="outline" disabled={busy || preparing} onClick={() => input.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void pick(e.dataTransfer.files[0]); }} className="h-auto aspect-[4/3] w-full flex-col gap-3 overflow-hidden border-2 border-dashed p-4 whitespace-normal">
            {preview ? <img src={preview} alt={tr("Selected crop photo")} className="h-full w-full object-contain" /> : <><Upload className="h-10 w-10 text-primary" /><span>{tr(preparing ? "Preparing photo…" : "Upload a crop photo")}</span><span className="text-center text-xs text-muted-foreground">{tr("Any photo type (JPG, PNG, WEBP, HEIC…) · up to 50 MB")}</span></>}
          </Button>
          {file && <div className="mt-3 flex items-center gap-2"><span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{file.name}</span><Button variant="ghost" size="icon" title={tr("Remove")} aria-label={tr("Remove")} disabled={busy || preparing} onClick={clear}><X /></Button><Button variant="outline" size="sm" disabled={busy || preparing} onClick={() => input.current?.click()}><Upload />{tr("Replace Image")}</Button></div>}
          <Button size="lg" className="mt-5 w-full bg-gradient-primary" disabled={!file || busy || preparing} onClick={() => void analyze()}>{busy ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <ScanSearch />}{tr(busy ? "Identifying Crop" : "Identify Crop")}</Button>
          {error && <p role="alert" className="mt-4 text-sm text-destructive">{tr(error)}</p>}
        </div>
        <div className="min-w-0">
          {busy ? <div role="status" className="theme-night overflow-hidden rounded-3xl p-3 md:p-5"><div className="glass rounded-2xl p-5 md:p-8 animate-fade-up">
            <div className="grid items-center gap-6 lg:grid-cols-[1.2fr_auto_1fr]">
              <div className="relative mx-auto aspect-square w-full max-w-md"><NeuralBrainAnimation intensity={1} /></div>
              <svg viewBox="0 0 80 300" className="hidden h-72 w-20 lg:block" aria-hidden fill="none" strokeWidth="2">
                {[50, 150, 250].map((y, i) => (
                  <path key={y} d={`M0 150 C 40 150, 40 ${y}, 80 ${y}`} className={cn("transition-all duration-500", stage > i ? "stroke-primary animate-flow" : "stroke-border")} strokeDasharray={stage > i ? "6 4" : undefined} />
                ))}
              </svg>
              <div className="space-y-3">
                <ModelStatusCard index="01" title={tr("Upload your photo")} state={stage >= 1 ? "done" : "waiting"} label={stage >= 1 ? "Completed" : "Waiting"} />
                <ModelStatusCard index="02" title={tr("AI model is studying it")} state={stage === 1 ? "active" : stage >= 2 ? "done" : "waiting"} label={stage === 1 ? "Analyzing" : stage >= 2 ? "Completed" : "Waiting"} />
                <ModelStatusCard index="03" title={tr("Preparing crop details")} state={stage === 2 ? "active" : stage >= 3 ? "done" : "waiting"} label={stage === 2 ? "Analyzing" : stage >= 3 ? "Completed" : "Waiting"} />
              </div>
            </div>
            <div className="mt-6">
              <p className="text-center font-display text-lg">{tr(stage === 1 ? "Identifying crop type..." : stage === 2 ? "AI model is studying the leaf and fruit features..." : "Preparing crop details and care guidance...")}</p>
              <div className="mx-auto mt-3 flex max-w-sm gap-2" aria-label={tr(`Step ${stage} of 3`)}>
                {[1, 2, 3].map((i) => <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors duration-500", stage >= i ? "bg-gradient-primary" : "bg-muted")} />)}
              </div>
              <p className="mt-2 text-center font-mono text-xs text-muted-foreground">{tr("Step ")}{tr(stage)} {tr("/ 3 · Upload → Identify → Details")}</p>
            </div>
          </div></div> : result ? <div dir={resultLanguage === "ur" ? "rtl" : "ltr"} className="space-y-6 break-words animate-fade-up">
            <AnalyseResults model="other-crop" result={result} />
            <div><p className="text-sm text-primary">{tr(result.status === "identified" ? "Identified crop" : result.status === "uncertain" ? "Identification uncertain" : "No crop identified")}</p><h2 className="mt-2 text-3xl font-bold">{result.cropName}</h2>{result.scientificName && <p dir="ltr" className="mt-1 text-sm italic text-muted-foreground">{result.scientificName}</p>}<p className="mt-3 leading-relaxed">{result.summary}</p></div>
            <section aria-label={tr("Rust & disease check")} className="border-t pt-4">
              <h3 className="text-lg font-semibold">{tr("Rust & disease check")}</h3>
              <p className={cn("mt-3 flex items-center gap-2 font-semibold", result.health.status === "suspected_disease" ? "text-destructive" : result.health.status === "no_visible_disease" ? "text-primary" : "text-muted-foreground")}>
                {result.health.status === "no_visible_disease" ? <ShieldCheck className="h-5 w-5 shrink-0" /> : <TriangleAlert className="h-5 w-5 shrink-0" />}
                {tr(result.health.status === "suspected_disease" ? "Suspected disease detected" : result.health.status === "no_visible_disease" ? "No disease detected" : result.health.status === "uncertain" ? "Disease assessment uncertain" : "Disease assessment unavailable")}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{result.health.summary}</p>
              {result.health.diseases.map((disease, index) => <div key={index} className="mt-4 border-s-2 border-destructive ps-4">
                <p className="text-xs font-medium text-muted-foreground">{tr(disease.kind === "rust" ? "Suspected rust" : "Suspected disease")}</p>
                <h4 className="mt-1 font-semibold">{disease.name}</h4>
                <ul className="mt-2 list-disc space-y-1 ps-5 text-sm text-muted-foreground">{disease.evidence.map((evidence, i) => <li key={i}>{evidence}</li>)}</ul>
              </div>)}
              {result.health.nextSteps.length > 0 && <div className="mt-4"><h4 className="text-sm font-semibold">{tr("Suggested next steps")}</h4><ul className="mt-2 list-disc space-y-2 ps-5 text-sm text-muted-foreground">{result.health.nextSteps.map((step, index) => <li key={index}>{step}</li>)}</ul></div>}
            </section>
            {result.visibleFeatures.length > 0 && <Detail title={tr("Visible features")} items={result.visibleFeatures} />}
            {result.growingConditions && <Detail title={tr("Growing conditions")} text={result.growingConditions} />}
            {result.commonUses && <Detail title={tr("Common uses")} text={result.commonUses} />}
            {result.care.length > 0 && <Detail title={tr("General crop care")} items={result.care} />}
            {result.alternatives.length > 0 && <Detail title={tr("Possible alternatives")} items={result.alternatives} />}
            {result.verification && <p className="border-s-2 border-primary ps-4 text-sm text-muted-foreground">{result.verification}</p>}
          </div> : <div className="flex min-h-64 items-center justify-center border-b py-10"><Leaf className="h-16 w-16 text-primary/40" aria-hidden /></div>}
        </div>
      </div>
    </main>
  </div>;
}

function Detail({ title, text, items }: { title: string; text?: string; items?: string[] }) {
  return <section className="border-t pt-4"><h3 className="text-lg font-semibold">{title}</h3>{text && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>}{items && <ul className="mt-2 list-disc space-y-2 ps-5 text-sm text-muted-foreground">{items.map((item, index) => <li key={index}>{item}</li>)}</ul>}</section>;
}