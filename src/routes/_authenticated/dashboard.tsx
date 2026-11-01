import { useLanguage } from "@/lib/site-language";
import { LanguageSwitcher } from "@/components/agrisense/LanguageSwitcher";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { LayoutDashboard, ScanLine, History, BarChart3, Cpu, Settings, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/agrisense/BrandMark";
import { useDetection, isBusy } from "@/lib/detection-store";
import { cn } from "@/lib/utils";
import { AccountButton } from "@/components/agrisense/AccountButton";

export const Route = createFileRoute("/_authenticated/dashboard")({ staticData: { sitemap: false }, component: DashboardLayout });

const NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/detect", label: "New Detection", icon: ScanLine },
  { to: "/dashboard/history", label: "Prediction History", icon: History },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/models", label: "AI Models", icon: Cpu },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

function SideNav({ onNav }: { onNav?: () => void }) {
 const { t: tr } = useLanguage();
  const s = useDetection();
  return (
    <nav className="flex flex-col gap-1" aria-label={tr("Dashboard")}>
      {tr(NAV.map(({ to, label, icon: Icon, ...rest }) => (
        <Link
          key={to}
          to={to}
          onClick={onNav}
          activeOptions={{ exact: "exact" in rest }}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          activeProps={{ className: "bg-accent !text-primary font-medium" }}
        >
          <Icon className="h-4 w-4" /> {tr(label)}
          {tr(to === "/dashboard/detect" && isBusy(s.phase) && <span className="ml-auto h-2 w-2 animate-pulse rounded-full bg-primary" aria-label={tr("Analysis running")} />)}
        </Link>
      )))}
    </nav>
  );
}

function DashboardLayout() {
 const { t: tr } = useLanguage();
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="theme-night sticky top-0 hidden h-screen flex-col gap-8 p-5 lg:flex">
        <BrandMark />
        <SideNav />
        <p className="mt-auto text-xs text-muted-foreground">{tr("History is stored in your account only.")}</p>
      </aside>
      {tr(open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button className="absolute inset-0 bg-foreground/40" aria-label={tr("Close menu")} onClick={() => setOpen(false)} />
          <aside className="theme-night absolute inset-y-0 left-0 flex w-72 flex-col gap-8 p-5 animate-in slide-in-from-left">
            <div className="flex items-center justify-between"><BrandMark /><Button size="icon" variant="ghost" onClick={() => setOpen(false)} aria-label={tr("Close menu")}><X /></Button></div>
            <SideNav onNav={() => setOpen(false)} />
          </aside>
        </div>
      ))}
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b bg-background/80 px-5 py-3 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" className="lg:hidden" onClick={() => setOpen(true)} aria-label={tr("Open menu")}><Menu /></Button>
            <span className="lg:hidden"><BrandMark /></span>
            <p className="hidden text-sm text-muted-foreground lg:block">{tr("Crop intelligence workspace")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2"><Button asChild size="sm"><Link to="/dashboard/detect"><ScanLine /> {tr("New Detection")}</Link></Button><LanguageSwitcher /><AccountButton /></div>
        </header>
        <main className={cn("mx-auto max-w-6xl px-5 py-8 md:px-8")}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

