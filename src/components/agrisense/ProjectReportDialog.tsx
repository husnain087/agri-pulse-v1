import { useLanguage } from "@/lib/site-language";
import { Download, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import report from "@/assets/project-report.pdf.asset.json";
import cover from "@/assets/project-report-cover.jpg.asset.json";

export function ProjectReportDialog() {
 const { t } = useLanguage();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg" variant="outline"><FileText /> {t("Open & Download Project Report")}</Button>
      </DialogTrigger>
      <DialogContent className="flex h-[85dvh] max-h-[900px] w-[calc(100vw-2rem)] max-w-5xl flex-col rounded-lg">
        <DialogHeader className="pr-6">
          <DialogTitle>{t("Agri Pulse Project Report")}</DialogTitle>
          <DialogDescription>{t("Detailed project report · PDF")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <a href={report.url} download="agri-pulse-project-report.pdf"><Download /> {t("Download PDF")}</a>
          </Button>
          <Button asChild variant="outline">
            <a href={report.url} target="_blank" rel="noopener noreferrer"><ExternalLink /> {t("Open PDF")}<span className="sr-only"> {t("in a new tab")}</span></a>
          </Button>
        </div>
        <a href={report.url} target="_blank" rel="noopener noreferrer" aria-label={t("Open full project report PDF")} className="min-h-0 flex-1 overflow-auto rounded border bg-muted">
          <img src={cover.url} alt={t("First page of the Agri Pulse detailed project report")} className="mx-auto h-full w-full object-contain" />
        </a>
      </DialogContent>
    </Dialog>
  );
}