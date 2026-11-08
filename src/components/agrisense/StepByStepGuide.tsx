import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Pause, Play, RotateCcw, Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLanguage } from "@/lib/site-language";
import { getGuideStep, selectGuideVoice, WEBSITE_GUIDE } from "@/lib/website-guide";

export function StepByStepGuide() {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<"idle" | "playing" | "paused" | "finished">("idle");
  const [feedback, setFeedback] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const generation = useRef(0);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const label = (en: string, ur: string) => language === "ur" ? ur : en;
  const step = getGuideStep(index, language);

  const stop = () => {
    generation.current += 1;
    if (utterance.current) {
      utterance.current.onend = null;
      utterance.current.onerror = null;
      utterance.current = null;
    }
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setStatus("idle");
    setFeedback("");
  };

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const refresh = () => setVoices(window.speechSynthesis.getVoices());
    refresh();
    window.speechSynthesis.addEventListener("voiceschanged", refresh);
    return () => {
      generation.current += 1;
      window.speechSynthesis.removeEventListener("voiceschanged", refresh);
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => { stop(); setFeedback(""); }, [language]);

  const speak = (nextIndex: number) => {
    stop();
    setIndex(nextIndex);
    setFeedback("");
    const next = getGuideStep(nextIndex, language);
    if (!next) return;
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      setFeedback(label("Audio is unavailable in this browser. You can still read each step.", "اس براؤزر میں آواز دستیاب نہیں۔ آپ ہر مرحلہ پڑھ سکتے ہیں۔"));
      return;
    }
    const voice = selectGuideVoice(window.speechSynthesis.getVoices(), language);
    if (language === "ur" && !voice) {
      setFeedback("اردو کی آواز دستیاب نہیں۔ اپنے آلے میں اردو آواز شامل کریں یا انگریزی منتخب کریں۔ مراحل اردو میں پڑھ سکتے ہیں۔");
      return;
    }
    const token = generation.current;
    const speech = new SpeechSynthesisUtterance(`${label("Step", "مرحلہ")} ${nextIndex + 1}. ${next.title}. ${next.text}`);
    speech.lang = language === "ur" ? "ur-PK" : "en-US";
    if (voice) speech.voice = voice;
    speech.rate = 0.95;
    speech.onend = () => {
      if (token !== generation.current) return;
      if (nextIndex + 1 < WEBSITE_GUIDE.length) speak(nextIndex + 1);
      else { utterance.current = null; setStatus("finished"); }
    };
    speech.onerror = () => {
      if (token !== generation.current) return;
      setStatus("idle");
      setFeedback(label("Audio could not play. Try Play or read the steps below.", "آواز نہیں چل سکی۔ دوبارہ چلائیں یا نیچے مراحل پڑھیں۔"));
    };
    utterance.current = speech;
    setStatus("playing");
    try { window.speechSynthesis.speak(speech); }
    catch { setStatus("idle"); setFeedback(label("Audio could not play. You can read the steps below.", "آواز نہیں چل سکی۔ آپ نیچے مراحل پڑھ سکتے ہیں۔")); }
  };

  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (next) speak(0);
    else stop();
  };
  const pauseOrPlay = () => {
    if (status === "playing") { window.speechSynthesis.pause(); setStatus("paused"); }
    else if (status === "paused") { window.speechSynthesis.resume(); setStatus("playing"); }
    else speak(status === "finished" ? 0 : index);
  };

  return <Dialog open={open} onOpenChange={changeOpen}>
    <DialogTrigger asChild><Button size="lg" variant="outline"><BookOpen />{label("Step-by-Step Guide", "مرحلہ وار رہنمائی")}</Button></DialogTrigger>
    <DialogContent dir={language === "ur" ? "rtl" : "ltr"} className="flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-2xl flex-col rounded-lg">
      <DialogHeader className="shrink-0 pr-6 text-start">
        <DialogTitle>{label("Step-by-Step Guide", "مرحلہ وار رہنمائی")}</DialogTitle>
        <DialogDescription>{label("Agri Pulse · Your website walkthrough", "ایگری پلس · ویب سائٹ کی رہنمائی")}</DialogDescription>
      </DialogHeader>
      <div className="min-h-0 space-y-5 overflow-y-auto">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-medium text-primary"><Volume2 className="h-4 w-4" />{label(`Step ${index + 1} of ${WEBSITE_GUIDE.length}`, `مرحلہ ${index + 1} از ${WEBSITE_GUIDE.length}`)}</p>
          <div className="flex gap-1">
            <Button size="icon" variant="outline" onClick={pauseOrPlay} title={status === "playing" ? label("Pause guide", "رہنمائی روکیں") : label("Play guide", "رہنمائی سنیں")} aria-label={status === "playing" ? label("Pause guide", "رہنمائی روکیں") : label("Play guide", "رہنمائی سنیں")}>{status === "playing" ? <Pause /> : <Play />}</Button>
            <Button size="icon" variant="outline" onClick={stop} aria-label={label("Stop guide", "آواز بند کریں")} title={label("Stop guide", "آواز بند کریں")}><Square /></Button>
            <Button size="icon" variant="outline" onClick={() => speak(0)} aria-label={label("Restart guide", "دوبارہ شروع کریں")} title={label("Restart guide", "دوبارہ شروع کریں")}><RotateCcw /></Button>
          </div>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all motion-reduce:transition-none" style={{ width: `${((index + 1) / WEBSITE_GUIDE.length) * 100}%` }} /></div>
        <article className="space-y-3" aria-live="polite"><h3 className="text-xl font-semibold">{step?.title}</h3><p className="leading-relaxed text-muted-foreground">{step?.text}</p></article>
        <p role="status" className="text-sm text-muted-foreground">{feedback || (status === "playing" ? label("Reading aloud…", "آواز میں رہنمائی جاری ہے…") : status === "paused" ? label("Paused", "رکا ہوا") : status === "finished" ? label("Guide complete", "رہنمائی مکمل") : label("Audio stopped", "آواز بند ہے"))}</p>
        {language === "ur" && !selectGuideVoice(voices, "ur") && !feedback && <p className="text-sm text-muted-foreground">اردو آواز کی دستیابی آپ کے آلے پر منحصر ہے۔</p>}
        <div className="flex justify-between gap-3">
          <Button variant="outline" disabled={index === 0} onClick={() => speak(index - 1)}><ArrowLeft />{label("Previous", "پچھلا")}</Button>
          <Button disabled={index === WEBSITE_GUIDE.length - 1} onClick={() => speak(index + 1)}>{label("Next", "اگلا")}<ArrowRight /></Button>
        </div>
        <ol className="divide-y border-t">
          {WEBSITE_GUIDE.map((item, i) => <li key={item.en.title}><Button variant="ghost" onClick={() => speak(i)} aria-current={i === index ? "step" : undefined} className="h-auto w-full justify-start gap-3 whitespace-normal py-3 text-start"><span className="shrink-0 font-mono text-primary">{i + 1}</span><span className={i === index ? "font-semibold text-primary" : "text-muted-foreground"}>{item[language].title}</span></Button></li>)}
        </ol>
      </div>
    </DialogContent>
  </Dialog>;
}