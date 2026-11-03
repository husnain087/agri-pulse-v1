import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ScanSearch, Upload, X, LoaderCircle, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/agrisense/BrandMark";
import { AccountButton } from "@/components/agrisense/AccountButton";
import { LanguageSwitcher } from "@/components/agrisense/LanguageSwitcher";
import { NeuralBrainAnimation } from "@/components/agrisense/NeuralBrainAnimation";
import { useLanguage } from "@/lib/site-language";
import { IMAGE_ACCEPT, normalizeImage } from "@/lib/normalize-image";
import { identifyOtherCrop } from "@/lib/other-crop.functions";
import type { CropIdentification } from "@/lib/other-crop";

export const Route = createFileRoute("/other-crop-identifier")({
  staticData: { sitemap: true },
  head: () => ({ meta: [
    { title: "Other Crop Identifier — Agri Pulse" },
    { name: "description", content: "Identify crops from a photo with Agri Pulse AI and explore visible features, growing conditions, common uses and care guidance." },
    { property: "og:title", content: "Other Crop Identifier — Agri Pulse" },
    { property: "og:description", content: "Upload a crop photo for AI identification and crop details in English or Urdu." },
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
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => () => { generation.current++; }, []);

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
      <div className="mx-auto max-w-6xl px-5 pb-10 pt-6"><p className="flex items-center gap-2 text-sm text-primary"><ScanSearch className="h-4 w-4" />{tr("AI-Powered")}</p><h1 className="mt-3 text-4xl font-bold md:text-5xl">{tr("Other Crop Identifier")}</h1><p className="mt-3 max-w-2xl text-muted-foreground">{tr("Identify a crop from its photo and explore its growing conditions, uses and care.")}</p></div>
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
          {busy ? <div role="status" className="theme-night rounded-lg p-6 text-center"><div className="mx-auto aspect-square max-w-xs"><NeuralBrainAnimation intensity={0.8} /></div><h2 className="mt-3 text-xl font-semibold">{tr("Identifying Crop")}</h2><p className="mt-2 text-sm text-muted-foreground">{tr("Examining your photo and preparing crop details…")}</p></div> : result ? <div dir={resultLanguage === "ur" ? "rtl" : "ltr"} className="space-y-6 break-words animate-fade-up">
            <div><p className="text-sm text-primary">{tr(result.status === "identified" ? "Identified crop" : result.status === "uncertain" ? "Identification uncertain" : "No crop identified")}</p><h2 className="mt-2 text-3xl font-bold">{result.cropName}</h2>{result.scientificName && <p dir="ltr" className="mt-1 text-sm italic text-muted-foreground">{result.scientificName}</p>}<p className="mt-3 leading-relaxed">{result.summary}</p></div>
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