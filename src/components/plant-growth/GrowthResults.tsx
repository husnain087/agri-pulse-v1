import { Cpu, Ruler, TrendingUp, Info, Thermometer, Droplets, Sun, CalendarClock, Leaf } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Badge } from "@/components/ui/badge";
import type { GrowthPrediction } from "@/lib/plant-growth/growth-api";

const fmt = (v: unknown, d = 2) => (typeof v === "number" && Number.isFinite(v) ? v.toFixed(d) : "—");
const label = (k: string) => k.replace(/_/g, " ").replace(/^after /, "After ");
const ENV_ICON: Record<string, typeof Sun> = { temperature_c: Thermometer, humidity_percent: Droplets, sunlight_hours_per_day: Sun, watering_interval_days: CalendarClock };
const ENV_UNIT: Record<string, string> = { temperature_c: "°C", humidity_percent: "%", sunlight_hours_per_day: "h/day", watering_interval_days: "days" };

export function GrowthResults({ data, image, analyzedAt }: { data: GrowthPrediction; image: string; analyzedAt: number }) {
  const p = data.prediction ?? {};
  const pd = data.plant_details ?? {};
  const future = Object.entries(p.future_height_cm ?? {});
  const chart = data.chart_data ?? [];
  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-start gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-4 text-sm">
        <Cpu className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p><strong>Prediction from the trained Agri Pulse growth model</strong>{data.model_name ? ` (${data.model_name})` : ""}.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="surface rounded-2xl p-5">
          <img src={image} alt="Submitted plant" className="aspect-square w-full rounded-xl object-cover" />
          <p className="mt-3 text-xs text-muted-foreground">Analyzed {new Date(analyzedAt).toLocaleString()}</p>
          {data.uploaded_image && (
            <p className="mt-1 text-xs text-muted-foreground">
              {data.uploaded_image.format} · {data.uploaded_image.width_px}×{data.uploaded_image.height_px}px
            </p>
          )}
        </div>
        <div className="surface rounded-2xl p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{data.model_name ?? "ML model"}</Badge>
            {p.growth_status && <Badge variant="secondary">{p.growth_status}</Badge>}
          </div>
          <h2 className="mt-3 flex items-center gap-2 text-2xl font-bold md:text-3xl"><Leaf className="h-6 w-6 text-primary" />{pd.species ?? "Plant"}{pd.variety ? ` · ${pd.variety}` : ""}</h2>
          <p className="mt-1 text-muted-foreground">Age {fmt(pd.age_days, 0)} days · current height {fmt(pd.current_height_cm, 1)} cm</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-muted/60 p-4">
              <p className="flex items-center gap-2 text-xs text-muted-foreground"><TrendingUp className="h-4 w-4" /> Predicted growth rate</p>
              <p className="mt-1 font-display text-2xl font-bold">{fmt(p.growth_rate_cm_per_day, 3)} cm/day</p>
            </div>
            <div className="rounded-xl bg-muted/60 p-4">
              <p className="flex items-center gap-2 text-xs text-muted-foreground"><Ruler className="h-4 w-4" /> Growth status</p>
              <p className="mt-1 font-display text-2xl font-bold">{p.growth_status ?? "—"}</p>
            </div>
          </div>
          {future.length > 0 && (
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {future.map(([k, v]) => (
                <div key={k} className="rounded-xl bg-muted/60 p-4">
                  <p className="text-xs capitalize text-muted-foreground">{label(k)}</p>
                  <p className="mt-1 font-display text-xl font-bold">{fmt(v)} cm</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="surface rounded-2xl p-6">
          <h3 className="font-semibold">Projected height</h3>
          {chart.length > 1 ? (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(d) => `Day ${d}`} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} unit=" cm" width={60} />
                  <Tooltip formatter={(v) => [`${v} cm`, "Height"]} labelFormatter={(d) => `Day ${d}`} />
                  <Area type="monotone" dataKey="estimated_height_cm" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.25} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="mt-3 text-sm text-muted-foreground">No chart data returned.</p>}
        </div>
        <div className="surface rounded-2xl p-6">
          <h3 className="font-semibold">Environment used</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {Object.entries(data.environment ?? {}).map(([k, v]) => {
              const I = ENV_ICON[k] ?? Info;
              return <li key={k} className="flex items-center gap-2"><I className="h-4 w-4 text-primary" /><span className="capitalize text-muted-foreground">{k.replace(/_/g, " ")}</span><span className="ml-auto font-medium">{fmt(v, 1)} {ENV_UNIT[k] ?? ""}</span></li>;
            })}
          </ul>
        </div>
      </div>
      <details className="surface rounded-2xl p-5 text-sm">
        <summary className="cursor-pointer font-semibold">Raw API response</summary>
        <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-muted/60 p-3 font-mono text-xs">{JSON.stringify({ ...data, warnings: undefined }, null, 2)}</pre>
      </details>
    </div>
  );
}
