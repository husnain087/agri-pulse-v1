import { Link } from "@tanstack/react-router";
import { Brain, type LucideIcon } from "lucide-react";

export function BrandMark() {
  return (
    <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary text-primary-foreground"><Brain className="h-5 w-5" /></span>
      Agri <span className="text-primary">Pulse</span>
    </Link>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="surface flex flex-col items-center rounded-2xl px-6 py-14 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-primary"><Brain className="h-7 w-7" /></div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
      {sub && <p className="mt-2 text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: LucideIcon }) {
  return (
    <div className="surface rounded-2xl p-5">
      <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{label}</p><Icon className="h-5 w-5 text-primary" /></div>
      <p className="mt-3 font-display text-3xl font-bold">{value}</p>
    </div>
  );
}

