import { useLanguage } from "@/lib/site-language";
import { prettyLabel } from "@/lib/agrisense-api";
import { isHealthy, type PredictionRecord } from "@/lib/history-store";
import { fmtDate, fmtPct } from "./RecordView";
import { Badge } from "@/components/ui/badge";
import { Flame } from "lucide-react";

export function RecordRow({ r, onClick, trailing }: { r: PredictionRecord; onClick?: () => void; trailing?: React.ReactNode }) {
 const { t } = useLanguage();
  return (
    <li className="flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-muted/60">
      <button type="button" onClick={onClick} className="flex min-w-0 flex-1 items-center gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
        <img src={r.image} alt={t("")} className="h-14 w-14 shrink-0 rounded-lg object-cover" loading="lazy" />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 font-medium">
            {t(prettyLabel(r.disease))}
            <Badge variant={isHealthy(r) ? "secondary" : "outline"} className={isHealthy(r) ? "text-success" : "text-gold"}>{t(isHealthy(r) ? "Healthy" : "Disease")}</Badge>
          </p>
          <p className="truncate text-xs text-muted-foreground">{t(r.crop)} {t("· ")}{t(r.model)} {t("· ")}{t(fmtDate(r.createdAt))}</p>
        </div>
        <div className="hidden text-right sm:block">
          <p className="font-mono text-sm">{t(fmtPct(r.confidence))}</p>
          <p className="flex items-center justify-end gap-1 text-xs text-muted-foreground"><Flame className="h-3 w-3" />{t(r.heatmap ? "Heatmap" : "No heatmap")}</p>
        </div>
      </button>
      {t(trailing)}
    </li>
  );
}
