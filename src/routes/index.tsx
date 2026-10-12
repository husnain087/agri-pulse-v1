import { createFileRoute, Link } from "@tanstack/react-router";
import { Sprout, ArrowRight, ScanSearch, Bug, GitBranch, Flame, History, Activity, Upload, Cpu, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/agrisense/BrandMark";
import { NeuralBrainAnimation } from "@/components/agrisense/NeuralBrainAnimation";
import { AccountButton } from "@/components/agrisense/AccountButton";
import hero from "@/assets/hero-field.jpg";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Agri Pulse — Crop Disease Detection & Plant Growth Prediction" },
      { name: "description", content: "Agri Pulse identifies maize and wheat, detects crop diseases with heatmaps, and predicts plant growth rates and future heights." },
      { property: "og:title", content: "Agri Pulse — Crop Disease Detection & Plant Growth Prediction" },
      { property: "og:description", content: "Identify crops, detect maize and wheat diseases, and predict plant growth with Agri Pulse." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const FEATURES = [
  { icon: ScanSearch, t: "AI Crop Identification", d: "An EfficientNet model recognises maize or wheat before anything else runs." },
  { icon: Bug, t: "Automatic Disease Detection", d: "Specialist models diagnose blight, rusts, leaf spot, septoria and more." },
  { icon: GitBranch, t: "Intelligent Model Routing", d: "Your image is sent only to the disease model that matches the identified crop." },
  { icon: Flame, t: "Grad-CAM Heatmaps", d: "See which leaf regions influenced the prediction, side by side with your photo." },
  { icon: History, t: "Prediction History", d: "Every completed analysis is saved to your account, searchable and filterable." },
  { icon: Activity, t: "Real-Time Analysis Status", d: "A live neural pipeline shows exactly which model is working, step by step." },
];

function Home() {
  return (
    <div>
      <section className="theme-night relative isolate overflow-hidden">
        <img src={hero} alt="" width={1920} height={1088} className="absolute inset-0 -z-20 h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/60 via-background/70 to-background" />
        {Array.from({ length: 14 }, (_, i) => (
          <span key={i} aria-hidden className="absolute -z-10 h-1.5 w-1.5 rounded-full bg-primary/70 animate-float" style={{ left: `${(i * 37) % 100}%`, top: `${20 + ((i * 53) % 70)}%`, animationDelay: `${i * 0.4}s` }} />
        ))}
        <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <BrandMark />
          <nav className="hidden gap-7 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">How It Works</a>
            <Link to="/dashboard/models" className="hover:text-foreground">AI Models</Link>
          </nav>
          <div className="flex items-center gap-2"><Button asChild size="sm" variant="outline"><Link to="/dashboard">Dashboard</Link></Button><AccountButton /></div>
        </header>
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-24 pt-12 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
          <div className="animate-fade-up">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Agri Pulse</p>
            <h1 className="mt-4 text-5xl font-bold leading-[1.05] md:text-6xl">Smarter Farming Starts with <span className="text-gradient">AI</span></h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">Identify crops, detect maize and wheat diseases, and predict plant growth with Agri Pulse.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-primary glow"><Link to="/dashboard/detect">Analyze My Crop <ArrowRight /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link to="/dashboard">Explore Dashboard</Link></Button>
            </div>
          </div>
          <div className="glass rounded-3xl p-5">
            <div className="mx-auto aspect-square max-w-sm"><NeuralBrainAnimation intensity={0.35} /></div>
            <ol className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
              {["Crop Identification", "Disease Detection", "Heatmap Analysis"].map((t, i) => (
                <li key={t} className="rounded-xl border bg-muted/50 px-2 py-3"><span className="block font-mono text-primary">0{i + 1}</span>{t}</li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pt-20">
        <h2 className="text-3xl font-bold md:text-4xl">Choose your analysis</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="theme-night relative flex flex-col overflow-hidden rounded-2xl p-6">
            <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 opacity-60" aria-hidden><NeuralBrainAnimation intensity={0.4} /></div>
            <p className="relative font-mono text-xs uppercase tracking-widest text-primary">Option 1 · Trained ML models</p>
            <h3 className="relative mt-2 flex items-center gap-2 text-2xl font-semibold"><ScanSearch className="h-6 w-6 shrink-0 text-primary" /> Existing AI Models</h3>
            <p className="mt-2 text-sm text-muted-foreground">Crop Identifier → Maize or Wheat Disease AI with Grad-CAM heatmaps.</p>
            <div className="mt-auto flex flex-wrap gap-3 pt-6">
              <Button asChild className="bg-gradient-primary glow"><Link to="/dashboard/detect">Analyze My Crop <ArrowRight /></Link></Button>
              <Button asChild variant="outline"><Link to="/dashboard/models">View models</Link></Button>
            </div>
          </div>
          <div className="theme-night relative flex flex-col overflow-hidden rounded-2xl p-6">
            <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 opacity-60" aria-hidden><NeuralBrainAnimation intensity={0.4} /></div>
            <p className="font-mono text-xs uppercase tracking-widest text-primary">Option 2 · Growth Model</p>
            <h3 className="mt-2 flex items-center gap-2 text-2xl font-semibold"><Sprout className="h-6 w-6 text-primary" /> Plant Growth Risk &amp; Prediction AI</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">Predict growth rate and future height with the trained Agri Pulse growth model.</p>
            <div className="mt-auto pt-6"><Button asChild className="bg-gradient-primary glow"><Link to="/plant-growth-risk"><Sprout /> Detect Growth Risk</Link></Button></div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl scroll-mt-10 px-5 py-24">
        <h2 className="text-3xl font-bold md:text-4xl">Everything you need to read a leaf</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">Three deployed deep-learning models working as one pipeline — no manual crop selection, no fake results.</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, t, d }) => (
            <div key={t} className="surface rounded-2xl p-6 transition-transform hover:-translate-y-1">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-primary"><Icon className="h-5 w-5" /></span>
              <h3 className="mt-4 text-lg font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="scroll-mt-10 bg-secondary/60 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-3xl font-bold md:text-4xl">How it works</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              { icon: Upload, t: "Upload a crop image", d: "Drop a maize or wheat leaf photo. Analysis starts instantly." },
              { icon: Cpu, t: "AI picks the right model", d: "The Crop Identifier decides the crop and routes to its disease model." },
              { icon: BarChart3, t: "View your results", d: "Disease prediction, confidence score and heatmap — saved to history." },
            ].map(({ icon: Icon, t, d }, i) => (
              <div key={t} className="surface rounded-2xl p-6">
                <div className="flex items-center gap-3"><span className="font-display text-4xl font-bold text-primary/30">0{i + 1}</span><Icon className="h-6 w-6 text-primary" /></div>
                <h3 className="mt-4 text-lg font-semibold">{t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center"><Button asChild size="lg"><Link to="/dashboard/detect">Analyze My Crop <ArrowRight /></Link></Button></div>
        </div>
      </section>

      <footer className="theme-night py-10 text-center text-sm text-muted-foreground">Powered by <span className="text-primary">Muhammad Husnain Haider</span></footer>
    </div>
  );
}
