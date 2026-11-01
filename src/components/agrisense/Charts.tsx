import { useLanguage } from "@/lib/site-language";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid } from "recharts";
import type { ReactNode } from "react";

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const tip = { contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--popover-foreground)" } };

export function ChartCard({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
 const { t } = useLanguage();
  return (
    <div className={`surface rounded-2xl p-5 ${className ?? ""}`}>
      <h3 className="mb-4 font-semibold">{t(title)}</h3>
      <div className="h-64">{t(children)}</div>
    </div>
  );
}

export function TimelineChart({ data }: { data: { date: string; count: number }[] }) {
 const { t } = useLanguage();
  return (
    <ResponsiveContainer>
      <AreaChart data={data}>
        <defs><linearGradient id="g1" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} /><stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} /></linearGradient></defs>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} />
        <YAxis allowDecimals={false} stroke="var(--muted-foreground)" fontSize={12} width={30} />
        <Tooltip {...tip} />
        <Area type="monotone" dataKey="count" name="Predictions" stroke="var(--chart-1)" fill="url(#g1)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({ data }: { data: { name: string; value: number }[] }) {
 const { t } = useLanguage();
  return (
    <ResponsiveContainer>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={data.length > 1 ? 3 : 0} label={t(({ name, value }) => `${name} (${value})`)} fontSize={12}>
          {t(data.map((d, i) => <Cell key={d.name} fill={d.name === "Diseased" ? "var(--chart-4)" : COLORS[i % COLORS.length]} />))}
        </Pie>
        <Tooltip {...tip} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function HBarChart({ data }: { data: { name: string; value: number }[] }) {
 const { t } = useLanguage();
  return (
    <ResponsiveContainer>
      <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
        <CartesianGrid stroke="var(--border)" horizontal={false} />
        <XAxis type="number" allowDecimals={false} stroke="var(--muted-foreground)" fontSize={12} />
        <YAxis type="category" dataKey="name" width={150} stroke="var(--muted-foreground)" fontSize={12} />
        <Tooltip {...tip} />
        <Bar dataKey="value" name="Predictions" fill="var(--chart-2)" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
