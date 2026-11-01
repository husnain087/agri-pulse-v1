import { useLanguage } from "@/lib/site-language";
import { Link } from "@tanstack/react-router";
import { Brain, type LucideIcon } from "lucide-react";

export function BrandMark() {
 const { t: tr } = useLanguage();
  return (
    <Link to="/" dir="ltr" className="flex items-center gap-2 font-display text-lg font-bold">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary text-primary-foreground"><Brain className="h-5 w-5" /></span>
      {tr("Agri ")}<span className="text-primary">{tr("Pulse")}</span>
    </Link>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
 const { t: tr } = useLanguage();
  return (
    <div className="surface flex flex-col items-center rounded-2xl px-6 py-14 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-primary"><Brain className="h-7 w-7" /></div>
      <h3 className="mt-4 text-lg font-semibold">{tr(title)}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{tr(body)}</p>
      {tr(action && <div className="mt-5">{tr(action)}</div>)}
    </div>
  );
}

export function PageHeader({ title, sub }: { title: string; sub?: string }) {
 const { t: tr } = useLanguage();
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold md:text-4xl">{tr(title)}</h1>
      {tr(sub && <p className="mt-2 text-muted-foreground">{tr(sub)}</p>)}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: LucideIcon }) {
 const { t: tr } = useLanguage();
  return (
    <div className="surface rounded-2xl p-5">
      <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{tr(label)}</p><Icon className="h-5 w-5 text-primary" /></div>
      <p className="mt-3 font-display text-3xl font-bold">{tr(value)}</p>
    </div>
  );
}

