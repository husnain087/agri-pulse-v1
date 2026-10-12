import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { IMAGE_ACCEPT, MAX_UPLOAD_MB as MAX_MB, normalizeImage } from "@/lib/normalize-image";

/** Drop zone — a valid selection immediately triggers `onFile` (which auto-starts analysis). */
export function ImageUpload({ onFile }: { onFile: (f: File) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = async (f?: File) => {
    if (!f) return;
    try {
      const jpg = await normalizeImage(f);
      setError(null);
      onFile(jpg);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read this image.");
    }
  };

  return (
    <div>
      <input ref={input} type="file" accept={IMAGE_ACCEPT} className="sr-only" aria-label="Choose crop image" onChange={(e) => { void accept(e.target.files?.[0]); e.target.value = ""; }} />
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); accept(e.dataTransfer.files[0]); }}
        className={cn(
          "surface flex w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 py-16 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:py-20",
          drag ? "border-primary bg-accent glow" : "hover:border-primary/60",
        )}
      >
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground"><ImagePlus className="h-8 w-8" /></span>
        <span className="font-display text-xl font-semibold">Drop a maize or wheat leaf image</span>
        <span className="max-w-sm text-center text-sm text-muted-foreground">Analysis starts automatically as soon as you choose a photo. Any photo type (JPG, PNG, WEBP, HEIC, GIF…) · up to {MAX_MB} MB</span>
        <span className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground">Browse Image</span>
      </button>
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    </div>
  );
}
