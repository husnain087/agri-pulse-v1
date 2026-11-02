import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Mic, MicOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/site-language";
import { parseVoiceCommand, VOICE_ASSISTANT_EVENT } from "@/lib/voice-commands";

type Recognition = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void; abort: () => void;
};
type SpeechWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };

export function VoiceControls() {
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [locale, setLocale] = useState<"en-US" | "ur-PK">("en-US");
  const [heard, setHeard] = useState("");
  const [feedback, setFeedback] = useState("");
  const recognition = useRef<Recognition | null>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const label = (en: string, ur: string) => language === "ur" ? ur : en;

  useEffect(() => {
    const browser = window as SpeechWindow;
    setSupported(Boolean(browser.SpeechRecognition || browser.webkitSpeechRecognition));
    return () => {
      if (recognition.current) {
        recognition.current.onresult = null;
        recognition.current.onerror = null;
        recognition.current.onend = null;
        recognition.current.abort();
      }
    };
  }, []);
  useEffect(() => { setLocale(language === "ur" ? "ur-PK" : "en-US"); }, [language]);

  const stop = () => { recognition.current?.abort(); recognition.current = null; setListening(false); };
  const close = () => { stop(); setOpen(false); launcher.current?.focus(); };
  const execute = (text: string) => {
    setHeard(text);
    const action = parseVoiceCommand(text);
    if (!action) { setFeedback(label("Command not recognized.", "حکم سمجھ نہیں آیا۔")); return; }
    setFeedback(label("Done", "ہو گیا"));
    if (action.type === "navigate") {
      close();
      void navigate({ to: action.path });
    } else if (action.type === "language") setLanguage(action.language);
    else if (action.type === "scroll") window.scrollTo({ top: action.direction === "top" ? 0 : window.scrollY + (action.direction === "down" ? 1 : -1) * window.innerHeight * 0.75, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    else {
      close();
      window.dispatchEvent(new CustomEvent(VOICE_ASSISTANT_EVENT, { detail: action }));
    }
  };
  const start = () => {
    stop();
    const browser = window as SpeechWindow;
    const Constructor = browser.SpeechRecognition || browser.webkitSpeechRecognition;
    if (!Constructor) return;
    const session = new Constructor();
    session.lang = locale; session.continuous = false; session.interimResults = false;
    session.onresult = (event) => {
      const text = event.results[0]?.[0]?.transcript;
      if (text) execute(text);
    };
    session.onerror = (event) => {
      if (event.error === "aborted") return;
      setListening(false);
      setFeedback(event.error === "not-allowed" || event.error === "service-not-allowed"
        ? label("Microphone access was denied. Allow it in your browser settings.", "مائیکروفون کی اجازت نہیں ملی۔ براؤزر کی ترتیبات میں اجازت دیں۔")
        : event.error === "no-speech"
          ? label("No speech heard. Try again.", "آواز سنائی نہیں دی۔ دوبارہ کوشش کریں۔")
          : label("Voice recognition is unavailable. Try again or type a command.", "آواز کی شناخت دستیاب نہیں۔ دوبارہ کوشش کریں یا حکم لکھیں۔"));
    };
    session.onend = () => { if (recognition.current === session) { recognition.current = null; setListening(false); } };
    recognition.current = session;
    setFeedback(""); setHeard("");
    try { session.start(); setListening(true); }
    catch { recognition.current = null; setListening(false); setFeedback(label("Could not start the microphone. Try again.", "مائیکروفون شروع نہیں ہوا۔ دوبارہ کوشش کریں۔")); }
  };

  return <>
    {open && <section role="dialog" aria-labelledby="voice-title" dir={language === "ur" ? "rtl" : "ltr"} onKeyDown={(event) => { if (event.key === "Escape") close(); }} className="fixed bottom-24 left-4 z-50 w-[min(340px,calc(100vw-32px))] max-h-[calc(100dvh-120px)] overflow-y-auto rounded-lg border bg-background text-foreground shadow-xl max-sm:bottom-20 max-sm:left-2 max-sm:w-[calc(100vw-16px)]">
      <header className="flex items-center justify-between border-b px-4 py-2"><h2 id="voice-title" className="font-display text-sm font-semibold">{label("Voice controls", "صوتی کنٹرول")}</h2><Button variant="ghost" size="icon" aria-label={label("Close voice controls", "صوتی کنٹرول بند کریں")} onClick={close}><X /></Button></header>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2"><label htmlFor="voice-language" className="text-sm">{label("Voice language", "آواز کی زبان")}</label><select id="voice-language" dir="ltr" value={locale} disabled={listening} onChange={(event) => setLocale(event.target.value === "ur-PK" ? "ur-PK" : "en-US")} className="h-9 rounded-md border border-input bg-background px-2 text-sm"><option value="en-US">English</option><option value="ur-PK">اردو</option></select></div>
        {!supported && <p role="status" className="text-sm text-muted-foreground">{label("Voice input is unavailable in this browser. Try Chrome or Edge; language support varies.", "اس براؤزر میں صوتی ان پٹ دستیاب نہیں۔ Chrome یا Edge آزمائیں؛ زبان کی سہولت مختلف ہو سکتی ہے۔")}</p>}
        <Button onClick={listening ? stop : start} disabled={!supported} className="w-full" variant={listening ? "destructive" : "default"}>{listening ? <MicOff /> : <Mic className={listening ? "motion-safe:animate-pulse" : ""} />}{listening ? label("Stop listening", "سننا بند کریں") : label("Start listening", "سننا شروع کریں")}</Button>
        <p role="status" aria-live="polite" className="break-words text-sm text-muted-foreground">{listening ? label("Listening…", "سن رہا ہے…") : feedback || label("Microphone off", "مائیکروفون بند ہے")}</p>
        <form onSubmit={(event) => { event.preventDefault(); stop(); execute(heard); }} className="flex gap-2"><input aria-label={label("Voice command", "صوتی حکم")} placeholder={label("Open fertilizer", "کھاد کھولو")} value={heard} onChange={(event) => setHeard(event.target.value)} maxLength={12000} className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" /><Button type="submit" size="icon" variant="outline" disabled={!heard.trim() || listening} aria-label={label("Run command", "حکم چلائیں")}><ArrowRight /></Button></form>
        <p className="text-xs text-muted-foreground">{label("Your browser may send audio to its speech service. Agri Pulse does not save recordings.", "آپ کا براؤزر آواز اپنی شناخت کی سروس کو بھیج سکتا ہے۔ Agri Pulse آواز محفوظ نہیں کرتا۔")}</p>
      </div>
    </section>}
    <Button ref={launcher} size="icon" variant={listening ? "destructive" : "default"} title={label("Voice controls", "صوتی کنٹرول")} aria-label={label("Open voice controls", "صوتی کنٹرول کھولیں")} aria-expanded={open} onClick={() => open ? close() : setOpen(true)} className="fixed bottom-5 left-5 z-50 h-14 w-14 rounded-full shadow-xl max-sm:bottom-3 max-sm:left-3">{open ? <X /> : <Mic />}</Button>
  </>;
}