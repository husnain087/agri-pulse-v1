import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Activity, Leaf, Wheat, HeartPulse, Bug, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState, StatCard } from "@/components/agrisense/BrandMark";
import { ChartCard, TimelineChart, DonutChart, HBarChart } from "@/components/agrisense/Charts";
import { RecordRow } from "@/components/agrisense/RecentPredictions";
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
  const { records, loaded } = useHistory();
  const nav = useNavigate();
  const s = computeStats(records);
  return (
    <div className="animate-fade-up">
      <PageHeader title="Overview" sub="All figures are calculated from predictions saved to your account." />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total Predictions" value={s.total} icon={Activity} />
        <StatCard label="Maize Predictions" value={s.maize} icon={Leaf} />
        <StatCard label="Wheat Predictions" value={s.wheat} icon={Wheat} />
        <StatCard label="Healthy Crops" value={s.healthy} icon={HeartPulse} />
        <StatCard label="Disease Detected" value={s.diseased} icon={Bug} />
      </div>
      {loaded && records.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No predictions yet" body="Upload your first crop image — charts and recent predictions will appear here automatically." action={<Button asChild><Link to="/dashboard/detect"><ScanLine /> Analyze my crop</Link></Button>} />
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <ChartCard title="Predictions over time"><TimelineChart data={s.timeline} /></ChartCard>
            <ChartCard title="Maize vs Wheat"><DonutChart data={s.cropSplit} /></ChartCard>
            <ChartCard title="Disease categories"><HBarChart data={s.diseases} /></ChartCard>
            <ChartCard title="Healthy vs Diseased"><DonutChart data={s.healthSplit} /></ChartCard>
          </div>
          <div className="surface mt-8 rounded-2xl p-5">
            <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">Recent predictions</h3><Link to="/dashboard/history" className="text-sm text-primary hover:underline">View all</Link></div>
            <ul className="divide-y">
              {records.slice(0, 5).map((r) => <RecordRow key={r.id} r={r} onClick={() => void nav({ to: "/dashboard/history", search: { id: r.id } })} />)}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
