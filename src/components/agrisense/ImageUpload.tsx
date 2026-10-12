import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_MB = 10;
const TYPES = ["image/jpeg", "image/png"];

/** Drop zone — a valid selection immediately triggers `onFile` (which auto-starts analysis). */
export function ImageUpload({ onFile }: { onFile: (f: File) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = (f?: File) => {
    if (!f) return;
    if (!TYPES.includes(f.type)) return setError("Please choose a JPG, JPEG or PNG image.");
    if (f.size > MAX_MB * 1024 * 1024) return setError(`Image is too large — maximum ${MAX_MB} MB.`);
    if (f.size === 0) return setError("This file is empty.");
    setError(null);
    onFile(f);
  };

  return (
    <div>
      <input ref={input} type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" className="sr-only" aria-label="Choose crop image" onChange={(e) => { accept(e.target.files?.[0]); e.target.value = ""; }} />
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
        <span className="max-w-sm text-center text-sm text-muted-foreground">Analysis starts automatically as soon as you choose a photo. JPG, JPEG or PNG · up to {MAX_MB} MB</span>
        <span className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground">Browse Image</span>
      </button>
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    </div>
  );
}
