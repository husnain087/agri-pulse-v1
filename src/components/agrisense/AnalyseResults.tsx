import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Brain, LoaderCircle, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAccount } from "@/lib/auth-context";
import { useLanguage } from "@/lib/site-language";
import { analyseModelResult } from "@/lib/result-analysis.functions";
import type { ResultAdvice, ResultModel } from "@/lib/result-analysis";

export function AnalyseResults({ model, result }: { model: ResultModel; result: unknown }) {
  const { user } = useAccount();
  const { language } = useLanguage();
  const payload = JSON.stringify(result);
  // Remount on result, account or language changes: no advice leaks across identities or predictions.
  return <ResultExplanation key={`${user?.id ?? "public"}:${language}:${model}:${payload}`} model={model} payload={payload} />;
}

function ResultExplanation({ model, payload }: { model: ResultModel; payload: string }) {
  const { t: tr, language } = useLanguage();
  const analyse = useServerFn(analyseModelResult);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [advice, setAdvice] = useState<ResultAdvice | null>(null);
  const [error, setError] = useState("");
  const generation = useRef(0);
  useEffect(() => () => { generation.current++; }, []);

  async function requestAdvice() {
    if (busy) return;
    const id = ++generation.current;
    setBusy(true); setError("");
    try {
      const response = await analyse({ data: { model, result: payload, language } });
      if (id !== generation.current) return;
      if (response.ok) setAdvice(response.advice);
      else setError(response.error);
    } catch {
      if (id === generation.current) setError("AI explanation is unavailable right now. Your model result is unchanged.");
    } finally { if (id === generation.current) setBusy(false); }
  }

  return <Dialog open={open} onOpenChange={setOpen}>
    <Button size="lg" variant="outline" onClick={() => { setOpen(true); if (!advice && !busy) void requestAdvice(); }}><Brain />{tr("Analyse Results")}</Button>
    <DialogContent dir={language === "ur" ? "rtl" : "ltr"} className="max-h-[85dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto break-words">
      <DialogHeader className="pe-5 text-start">
        <DialogTitle className="flex items-center gap-2 leading-normal"><Brain className="h-5 w-5 shrink-0 text-primary" />{tr("AI Result Analysis")}</DialogTitle>
        <DialogDescription>{tr("Lovable AI · Result details, crop care & prevention")}</DialogDescription>
      </DialogHeader>
      {busy && <div role="status" className="flex items-center gap-3 border-y py-8 text-sm text-muted-foreground"><LoaderCircle className="h-6 w-6 shrink-0 animate-spin text-primary motion-reduce:animate-none" />{tr("Analysing your model result…")}</div>}
      {error && <div className="space-y-4"><p role="alert" className="text-sm text-destructive">{tr(error)}</p><Button variant="outline" onClick={() => void requestAdvice()}><RotateCcw />{tr("Retry")}</Button></div>}
      {advice && <div className="space-y-5 text-sm leading-relaxed">
        <section><h3 className="font-semibold">{tr("What your result means")}</h3><p className="mt-2 whitespace-pre-line text-muted-foreground">{advice.explanation}</p></section>
        <AdviceList title={tr("Key findings")} items={advice.findings} />
        <AdviceList title={tr("Recommended next steps")} items={advice.nextSteps} />
        <AdviceList title={tr("Disease prevention & crop care")} items={advice.prevention} />
        <section className="border-t pt-4"><h3 className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4 text-primary" />{tr("When to seek expert help")}</h3><p className="mt-2 text-muted-foreground">{advice.expertHelp}</p></section>
      </div>}
    </DialogContent>
  </Dialog>;
}

function AdviceList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return <section className="border-t pt-4"><h3 className="font-semibold">{title}</h3><ul className="mt-2 list-disc space-y-2 ps-5 text-muted-foreground">{items.map((item, i) => <li key={i}>{item}</li>)}</ul></section>;
}