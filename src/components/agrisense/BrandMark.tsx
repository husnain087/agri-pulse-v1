import { useLanguage } from "@/lib/site-language";
import { Link } from "@tanstack/react-router";
import { Brain, type LucideIcon } from "lucide-react";

export function BrandMark() {
 const { t } = useLanguage();
  return (
    <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary text-primary-foreground"><Brain className="h-5 w-5" /></span>
      {t("Agri ")}<span className="text-primary">{t("Pulse")}</span>
    </Link>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
 const { t } = useLanguage();
  return (
    <div className="surface flex flex-col items-center rounded-2xl px-6 py-14 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-primary"><Brain className="h-7 w-7" /></div>
      <h3 className="mt-4 text-lg font-semibold">{t(title)}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t(body)}</p>
      {t(action && <div className="mt-5">{t(action)}</div>)}
    </div>
  );
}

export function PageHeader({ title, sub }: { title: string; sub?: string }) {
 const { t } = useLanguage();
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold md:text-4xl">{t(title)}</h1>
      {t(sub && <p className="mt-2 text-muted-foreground">{t(sub)}</p>)}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: LucideIcon }) {
 const { t } = useLanguage();
  return (
    <div className="surface rounded-2xl p-5">
      <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{t(label)}</p><Icon className="h-5 w-5 text-primary" /></div>
      <p className="mt-3 font-display text-3xl font-bold">{t(value)}</p>
    </div>
  );
}

