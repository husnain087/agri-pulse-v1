import { useLanguage } from "@/lib/site-language";
import { LanguageSwitcher } from "@/components/agrisense/LanguageSwitcher";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, AlertTriangle, CheckCircle2, ChevronRight, Citrus, Download, ImagePlus, LayoutDashboard, RotateCcw, Upload, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/agrisense/BrandMark";
import { AccountButton } from "@/components/agrisense/AccountButton";
import { OrangeProcessing } from "@/components/orange/OrangeProcessing";
import { ORANGE_MAX_MB, ORANGE_MIN_MS, ORANGE_MODEL, buildReport, infoFor, predictOrange, type OrangeResult } from "@/lib/orange/orange-api";

export const Route = createFileRoute("/orange-disease-detection")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Orange Disease Detection — Agri Pulse" },
      { name: "description", content: "Detect orange fruit diseases (black spot, canker, greening, scab) with an EfficientNet-B0 deep learning model." },
      { property: "og:title", content: "Orange Disease Detection — Agri Pulse" },
      { property: "og:description", content: "AI-based citrus disease classification with confidence scores for every class." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrangePage,
});

const OK_TYPES = ["image/jpeg", "image/png", "image/webp"];
type Phase = { k: "idle" } | { k: "running"; started: number; apiDone: boolean } | { k: "error"; msg: string } | { k: "done"; r: OrangeResult; at: Date };

function OrangePage() {
 const { t: tr } = useLanguage();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileErr, setFileErr] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>({ k: "idle" });
  const runId = useRef(0);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const pick = (f?: File) => {
    if (!f) return;
    if (f.size === 0) return setFileErr("This file is empty.");
    if (!OK_TYPES.includes(f.type) && !/\.(jpe?g|png|webp)$/i.test(f.name)) return setFileErr("Unsupported format — please use JPG, JPEG, PNG or WebP.");
    if (f.size > ORANGE_MAX_MB * 1024 * 1024) return setFileErr(`Image is larger than ${ORANGE_MAX_MB} MB.`);
    setFileErr(null); setFile(f); setPreview(URL.createObjectURL(f)); setPhase({ k: "idle" });
  };
  const clear = () => { runId.current++; setFile(null); setPreview(null); setPhase({ k: "idle" }); };

  const analyze = async () => {
    if (!file || phase.k === "running") return;
    const id = ++runId.current;
    const started = Date.now();
    setPhase({ k: "running", started, apiDone: false });
    const min = new Promise((r) => setTimeout(r, ORANGE_MIN_MS));
    try {
      const r = await predictOrange(file);
      if (id !== runId.current) return;
      setPhase({ k: "running", started, apiDone: true });
      await min;
      if (id === runId.current) setPhase({ k: "done", r, at: new Date() });
    } catch (e) {
      if (id === runId.current) setPhase({ k: "error", msg: e instanceof Error ? e.message : "Prediction failed." });
    }
  };

  const download = (r: OrangeResult, at: Date) => {
    const url = URL.createObjectURL(new Blob([buildReport(r, at)], { type: "text/plain" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `orange-report-${at.toISOString().slice(0, 19).replace(/:/g, "-")}.txt` });
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen">
      <header className="theme-night">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 flex-wrap px-5 py-5">
          <BrandMark />
          <div className="flex flex-wrap items-center gap-2"><Button asChild variant="outline" size="sm"><Link to="/"><ArrowLeft /> {tr("Home")}</Link></Button><LanguageSwitcher /><AccountButton /></div>
        </div>
        <div className="mx-auto max-w-6xl px-5 pb-14 pt-6">
          <nav aria-label={tr("Breadcrumb")} className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
            <Link to="/dashboard" className="hover:text-primary">{tr("Dashboard")}</Link><ChevronRight className="h-3 w-3" />
            <Link to="/dashboard/models" className="hover:text-primary">{tr("AI Models")}</Link><ChevronRight className="h-3 w-3" />
            <span className="text-foreground">{tr("Orange Disease Detection")}</span>
          </nav>
          <p className="mt-5 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-primary"><Citrus className="h-4 w-4" /> {tr(ORANGE_MODEL)} {tr("· AI-Powered")}</p>
          <h1 className="mt-3 text-4xl font-bold md:text-5xl">{tr("Orange Disease Detection")}</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">{tr("Analyze orange fruit or citrus-related images using deep learning.")}</p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-5 py-10">
        {tr(phase.k !== "done" && phase.k !== "running" && (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="surface rounded-2xl p-5">
              <input ref={input} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="sr-only" aria-label={tr("Choose orange image")} onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
              <button type="button" onClick={() => input.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]); }}
                className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border-2 border-dashed transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {tr(preview ? <img src={preview} alt={tr("Selected orange")} className="h-full w-full object-contain" /> : (<>
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground"><ImagePlus className="h-7 w-7" /></span>
                  <span className="font-semibold">{tr("Drag & drop an orange image")}</span>
                  <span className="text-xs text-muted-foreground">{tr("JPG, JPEG, PNG or WebP · up to ")}{tr(ORANGE_MAX_MB)} {tr("MB")}</span>
                </>))}
              </button>
              {tr(fileErr && <p role="alert" className="mt-2 text-sm text-destructive">{tr(fileErr)}</p>)}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => input.current?.click()}><Upload /> {tr(file ? "Replace Image" : "Upload Image")}</Button>
                {tr(file && <><span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{tr(file.name)}</span><Button variant="ghost" size="sm" onClick={clear}><X /> {tr("Remove")}</Button></>)}
              </div>
            </div>
            <div className="surface flex flex-col rounded-2xl p-6">
              <h2 className="font-semibold">{tr("How it works")}</h2>
              <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>{tr("1. Upload a clear photo of an orange fruit.")}</li>
                <li>{tr("2. ")}{tr(ORANGE_MODEL)} {tr("classifies it into Black spot, Canker, Greening, Scab or healthy.")}</li>
                <li>{tr("3. Review the confidence for every class and download a report.")}</li>
              </ol>
              <p className="mt-4 flex gap-2 rounded-xl bg-muted p-3 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0 text-primary" />{tr("Your selected image is sent to the orange prediction service for analysis only. It is not saved by Agri Pulse.")}</p>
              {tr(phase.k === "error" && (
                <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/40 p-3">
                  <p className="flex items-center gap-2 text-sm"><AlertTriangle className="h-4 w-4 text-destructive" />{tr(phase.msg)}</p>
                  <Button size="sm" variant="outline" onClick={() => void analyze()}><RotateCcw /> {tr("Retry")}</Button>
                </div>
              ))}
              <Button size="lg" className="mt-6 w-full bg-gradient-primary" disabled={!file} onClick={() => void analyze()}><Citrus /> {tr("Analyze Orange")}</Button>
            </div>
          </div>
        ))}

        {tr(phase.k === "running" && preview && <OrangeProcessing image={preview} started={phase.started} waitingOnApi={!phase.apiDone} />)}
        {tr(phase.k === "done" && preview && <Results r={phase.r} at={phase.at} image={preview} onAgain={clear} onDownload={() => download(phase.r, phase.at)} />)}
      </main>
      <footer className="theme-night py-10 text-center text-sm text-muted-foreground">{tr("Powered by ")}<span className="text-primary">{tr("Muhammad Husnain Haider")}</span></footer>
    </div>
  );
}

function Results({ r, at, image, onAgain, onDownload }: { r: OrangeResult; at: Date; image: string; onAgain: () => void; onDownload: () => void }) {
 const { t: tr } = useLanguage();
  const info = infoFor(r.disease);
  const healthy = r.disease.trim().toLowerCase() === "healthy";
  const runnerUp = r.predictions[1]?.pct ?? 0;
  const uncertain = r.confidence < 50 || r.confidence - runnerUp < 15;
  return (
    <div className="animate-fade-up space-y-6">
      <div className="theme-night grid gap-6 rounded-3xl p-6 md:grid-cols-[200px_1fr]">
        <img src={image} alt={tr("Analyzed orange")} className="aspect-square w-full rounded-2xl object-cover ring-1 ring-primary/40" />
        <div>
          <p className="flex items-center gap-2 text-sm text-primary"><CheckCircle2 className="h-4 w-4" /> {tr("Analysis complete · ")}{tr(ORANGE_MODEL)}</p>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">{tr(healthy ? "Healthy orange" : r.disease)}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{tr(r.filename)} {tr("· ")}{tr(at.toLocaleString())}</p>
          <div className="mt-5 flex items-end justify-between"><span className="text-sm text-muted-foreground">{tr("Confidence")}</span><span className="font-mono text-2xl font-semibold">{tr(r.confidence.toFixed(2))}{tr("%")}</span></div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted"><div className="orange-bar h-full rounded-full bg-gradient-primary" style={{ width: `${r.confidence}%` }} /></div>
          {tr(uncertain && <p className="mt-4 flex gap-2 rounded-xl bg-muted p-3 text-sm"><AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />{tr("The model is not strongly confident in this result. Please verify with an agricultural expert.")}</p>)}
        </div>
      </div>

      <section className="surface rounded-2xl p-6">
        <h3 className="text-lg font-semibold">{tr("All class probabilities")}</h3>
        <ul className="mt-4 space-y-3">
          {tr(r.predictions.map((p, i) => (
            <li key={p.label}>
              <div className="flex justify-between text-sm"><span className={i === 0 ? "font-semibold text-primary" : ""}>{tr(p.label)}</span><span className="font-mono">{tr(p.pct.toFixed(2))}{tr("%")}</span></div>
              <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-muted"><div className={`orange-bar h-full rounded-full ${i === 0 ? "bg-gradient-primary" : "bg-primary/40"}`} style={{ width: `${p.pct}%`, animationDelay: `${i * 0.08}s` }} /></div>
            </li>
          )))}
        </ul>
      </section>

      {tr(info && (
        <section className="surface rounded-2xl p-6">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{tr("General agricultural guidance · not produced by the model")}</p>
          <h3 className="mt-2 text-lg font-semibold">{tr("About ")}{tr(healthy ? "healthy fruit" : r.disease)}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{tr(info.about)}</p>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {tr(([["Common symptoms", info.symptoms], ["Suggested inspection", info.inspect], ["Preventive practices", info.prevent]] as const).map(([t, xs]) => (
              <div key={t}><h4 className="text-sm font-semibold">{tr(t)}</h4><ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted-foreground">{tr(xs.map((x) => <li key={x}>{tr(x)}</li>))}</ul></div>
            )))}
          </div>
          <p className="mt-5 rounded-xl bg-muted p-3 text-sm"><span className="font-semibold">{tr("When to consult an expert: ")}</span>{tr(info.expert)}</p>
        </section>
      ))}

      <div className="flex flex-wrap gap-3">
        <Button size="lg" onClick={onAgain}><Upload /> {tr("Analyze Another Image")}</Button>
        <Button size="lg" variant="outline" onClick={onDownload}><Download /> {tr("Download Report")}</Button>
        <Button size="lg" variant="outline" asChild><Link to="/dashboard"><LayoutDashboard /> {tr("Back to Dashboard")}</Link></Button>
      </div>
    </div>
  );
}
