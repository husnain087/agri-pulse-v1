import { useLanguage } from "@/lib/site-language";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Citrus, Brain, ArrowRight, Activity, Leaf, Wheat, HeartPulse, Bug, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState, StatCard } from "@/components/agrisense/BrandMark";
import { ChartCard, TimelineChart, DonutChart, HBarChart } from "@/components/agrisense/Charts";
import { RecordRow } from "@/components/agrisense/RecentPredictions";
import { NeuralBrainAnimation } from "@/components/agrisense/NeuralBrainAnimation";
import { useHistory } from "@/lib/history-store";
import { computeStats } from "@/lib/analytics";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Dashboard — Agri Pulse" },
      { name: "description", content: "Overview of your crop predictions, disease findings and trends." },
      { property: "og:title", content: "Dashboard — Agri Pulse" },
      { property: "og:description", content: "Overview of your crop predictions, disease findings and trends." },
    ],
  }),
  component: Overview,
});

function Overview() {
 const { t: tr } = useLanguage();
  const { records, loaded } = useHistory();
  const nav = useNavigate();
  const s = computeStats(records);
  return (
    <div className="animate-fade-up">
      <PageHeader title={tr("Overview")} sub={tr("All figures are calculated from predictions saved to your account.")} />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label={tr("Total Predictions")} value={s.total} icon={Activity} />
        <StatCard label={tr("Maize Predictions")} value={s.maize} icon={Leaf} />
        <StatCard label={tr("Wheat Predictions")} value={s.wheat} icon={Wheat} />
        <StatCard label={tr("Healthy Crops")} value={s.healthy} icon={HeartPulse} />
        <StatCard label={tr("Disease Detected")} value={s.diseased} icon={Bug} />
      </div>
      <Link to="/orange-disease-detection" className="theme-night group relative mt-8 flex flex-col overflow-hidden rounded-2xl p-6 transition-transform hover:-translate-y-1">
        <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 opacity-60" aria-hidden><NeuralBrainAnimation intensity={0.4} /></div>
        <div className="relative flex items-center gap-2"><span className="rounded-full bg-primary/20 px-3 py-1 font-mono text-xs uppercase tracking-widest text-primary">{tr("AI-Powered")}</span><Brain className="h-4 w-4 text-primary" /></div>
        <h3 className="relative mt-3 flex items-center gap-2 text-2xl font-semibold"><Citrus className="h-6 w-6 text-primary" /> {tr("Orange Disease Detection")}</h3>
        <p className="relative mt-2 max-w-xl text-sm text-muted-foreground">{tr("Detect orange fruit diseases using an EfficientNet-B0 deep learning model. Upload an orange image and receive a predicted disease class with confidence scores.")}</p>
        <p className="relative mt-1 text-xs text-muted-foreground">{tr("AI-based citrus disease classification.")}</p>
        <span className="relative mt-5 inline-flex w-fit items-center gap-2 rounded-md bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground glow">{tr("Open Detection Module ")}<ArrowRight className="h-4 w-4" /></span>
      </Link>
      {tr(loaded && records.length === 0 ? (
        <div className="mt-8">
          <EmptyState title={tr("No predictions yet")} body="Upload your first crop image — charts and recent predictions will appear here automatically." action={<Button asChild><Link to="/dashboard/detect"><ScanLine /> {tr("Analyze my crop")}</Link></Button>} />
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <ChartCard title={tr("Predictions over time")}><TimelineChart data={s.timeline} /></ChartCard>
            <ChartCard title={tr("Maize vs Wheat")}><DonutChart data={s.cropSplit} /></ChartCard>
            <ChartCard title={tr("Disease categories")}><HBarChart data={s.diseases} /></ChartCard>
            <ChartCard title={tr("Healthy vs Diseased")}><DonutChart data={s.healthSplit} /></ChartCard>
          </div>
          <div className="surface mt-8 rounded-2xl p-5">
            <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">{tr("Recent predictions")}</h3><Link to="/dashboard/history" className="text-sm text-primary hover:underline">{tr("View all")}</Link></div>
            <ul className="divide-y">
              {tr(records.slice(0, 5).map((r) => <RecordRow key={r.id} r={r} onClick={() => void nav({ to: "/dashboard/history", search: { id: r.id } })} />))}
            </ul>
          </div>
        </>
      ))}
    </div>
  );
}
