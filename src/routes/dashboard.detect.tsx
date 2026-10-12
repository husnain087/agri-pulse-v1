import { createFileRoute, Link } from "@tanstack/react-router";
import { Upload, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/agrisense/BrandMark";
import { ImageUpload } from "@/components/agrisense/ImageUpload";
import { AnalysisStage } from "@/components/agrisense/AnalysisStage";
import { RecordView } from "@/components/agrisense/RecordView";
import { useDetection, startDetection, cancelDetection } from "@/lib/detection-store";
import { useHistory } from "@/lib/history-store";

export const Route = createFileRoute("/dashboard/detect")({
  head: () => ({
    meta: [
      { title: "New Detection — Agri Pulse" },
      { name: "description", content: "Upload a crop image — Agri Pulse identifies the crop and detects disease automatically." },
      { property: "og:title", content: "New Detection — Agri Pulse" },
      { property: "og:description", content: "Upload a crop image and watch the AI pipeline work automatically." },
    ],
  }),
  component: Detect,
});

function Detect() {
  const s = useDetection();
  const { storageError } = useHistory();
  return (
    <div className="animate-fade-up">
      <PageHeader title="New Detection" sub="Just choose a photo — crop identification, model selection and diagnosis run automatically." />
      {s.phase === "idle" && <div className="mx-auto max-w-3xl"><ImageUpload onFile={(f) => startDetection(f)} /></div>}
      {s.phase !== "idle" && s.phase !== "done" && <AnalysisStage s={s} />}
      {s.phase === "done" && s.record && (
        <>
          {storageError && <p role="alert" className="mb-4 rounded-xl bg-muted p-3 text-sm text-destructive">{storageError}</p>}
          <RecordView
            record={s.record}
            original={s.preview}
            actions={<>
              <Button size="lg" onClick={cancelDetection}><Upload /> Upload Another Image</Button>
              <Button size="lg" variant="outline" asChild><Link to="/dashboard/history"><History /> View Prediction History</Link></Button>
            </>}
          />
        </>
      )}
    </div>
  );
}
