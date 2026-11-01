import { useLanguage } from "@/lib/site-language";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Upload, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/agrisense/BrandMark";
import { ImageUpload } from "@/components/agrisense/ImageUpload";
import { AnalysisStage } from "@/components/agrisense/AnalysisStage";
import { RecordView } from "@/components/agrisense/RecordView";
import { useDetection, startDetection, cancelDetection } from "@/lib/detection-store";
import { useHistory } from "@/lib/history-store";

export const Route = createFileRoute("/_authenticated/dashboard/detect")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "New Detection — Agri Pulse" },
      { name: "description", content: "Upload a crop image — Agri Pulse identifies the crop and detects disease automatically." },
      { property: "og:title", content: "New Detection — Agri Pulse" },
      { property: "og:description", content: "Upload a crop image and watch the AI pipeline work automatically." },
    ],
  }),
  component: Detect,
});

function Detect() {
 const { t: tr } = useLanguage();
  const s = useDetection();
  const { storageError } = useHistory();
  return (
    <div className="animate-fade-up">
      <PageHeader title={tr("New Detection")} sub={tr("Just choose a photo — crop identification, model selection and diagnosis run automatically.")} />
      {tr(s.phase === "idle" && <div className="mx-auto max-w-3xl"><ImageUpload onFile={(f) => startDetection(f)} /></div>)}
      {tr(s.phase !== "idle" && s.phase !== "done" && <AnalysisStage s={s} />)}
      {tr(s.phase === "done" && s.record && (
        <>
          {tr(storageError && <p role="alert" className="mb-4 rounded-xl bg-muted p-3 text-sm text-destructive">{tr(storageError)}</p>)}
          <RecordView
            record={s.record}
            original={s.preview}
            actions={<>
              <Button size="lg" onClick={cancelDetection}><Upload /> {tr("Upload Another Image")}</Button>
              <Button size="lg" variant="outline" asChild><Link to="/dashboard/history"><History /> {tr("View Prediction History")}</Link></Button>
            </>}
          />
        </>
      ))}
    </div>
  );
}
