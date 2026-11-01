import { useLanguage } from "@/lib/site-language";
import { Download, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import video from "@/assets/agripulse-ai-presentation-video.mp4.asset.json";

export function VideoPresentationDialog() {
 const { t: tr } = useLanguage();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg" variant="outline"><PlayCircle /> {tr("Video Presentation")}</Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100vw-2rem)] max-w-4xl flex-col rounded-lg">
        <DialogHeader className="pr-6">
          <DialogTitle>{tr("Agri Pulse Video Presentation")}</DialogTitle>
          <DialogDescription>{tr("Project presentation video · about 3¾ minutes")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <a href={video.url} download="agri-pulse-video-presentation.mp4"><Download /> {tr("Download Video")}</a>
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto rounded border bg-black">
          <video
            src={video.url}
            controls
            playsInline
            preload="metadata"
            aria-label={tr("Agri Pulse video presentation")}
            className="mx-auto aspect-video w-full object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
