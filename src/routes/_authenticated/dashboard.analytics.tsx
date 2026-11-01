import { useLanguage } from "@/lib/site-language";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Gauge, Bug, HeartPulse, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState, StatCard } from "@/components/agrisense/BrandMark";
import { ChartCard, TimelineChart, DonutChart, HBarChart } from "@/components/agrisense/Charts";
import { useHistory } from "@/lib/history-store";
import { computeStats } from "@/lib/analytics";

export const Route = createFileRoute("/_authenticated/dashboard/analytics")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Analytics — Agri Pulse" },
      { name: "description", content: "Crop distribution, disease frequency and confidence trends from your saved predictions." },
      { property: "og:title", content: "Analytics — Agri Pulse" },
      { property: "og:description", content: "Insights derived from your saved crop predictions." },
    ],
  }),
  component: Analytics,
});

function Analytics() {
 const { t } = useLanguage();
  const { records, loaded } = useHistory();
  const s = computeStats(records);
  if (loaded && !records.length)
    return (
      <div className="animate-fade-up">
        <PageHeader title={t("Analytics")} />
        <EmptyState title={t("Analytics will appear after your first prediction")} body="Every completed analysis feeds these charts automatically." action={<Button asChild><Link to="/dashboard/detect"><ScanLine /> {t("Analyze a crop")}</Link></Button>} />
      </div>
    );
  return (
    <div className="animate-fade-up">
      <PageHeader title={t("Analytics")} sub={t("Derived only from completed predictions stored in your account.")} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t("Analyses completed")} value={s.total} icon={Activity} />
        <StatCard label={t("Average confidence")} value={s.avgConfidence === null ? "—" : `${s.avgConfidence.toFixed(1)}%`} icon={Gauge} />
        <StatCard label={t("Most frequent disease")} value={s.topDisease ?? "None"} icon={Bug} />
        <StatCard label={t("Healthy rate")} value={s.total ? `${Math.round((s.healthy / s.total) * 100)}%` : "—"} icon={HeartPulse} />
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <ChartCard title={t("Prediction activity over time")} className="lg:col-span-2"><TimelineChart data={s.timeline} /></ChartCard>
        <ChartCard title={t("Crop distribution")}><DonutChart data={s.cropSplit} /></ChartCard>
        <ChartCard title={t("Healthy vs diseased")}><DonutChart data={s.healthSplit} /></ChartCard>
        <ChartCard title={t("Disease frequency")} className="lg:col-span-2"><HBarChart data={s.diseases} /></ChartCard>
      </div>
    </div>
  );
}
