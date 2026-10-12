/** Accept any photo format and convert it to a JPEG File the analysis services understand. */
export const MAX_UPLOAD_MB = 50;
export const IMAGE_ACCEPT =
  "image/*,.jpg,.jpeg,.jfif,.png,.webp,.gif,.bmp,.tif,.tiff,.avif,.heic,.heif,.svg,.ico";

const EXT = /\.(jpe?g|jfif|png|webp|gif|bmp|tiff?|avif|heic|heif|svg|ico)$/i;

export function isImageFile(f: File) {
  return f.type.startsWith("image/") || EXT.test(f.name);
}

const isHeic = (f: File) => /heic|heif/i.test(f.type) || /\.(heic|heif)$/i.test(f.name);

function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); res(img); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("decode")); };
    img.src = url;
  });
}

export async function normalizeImage(file: File, max = 2048): Promise<File> {
  if (!isImageFile(file)) throw new Error("Please choose an image file.");
  if (file.size === 0) throw new Error("This file is empty.");
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) throw new Error(`Image is too large — maximum ${MAX_UPLOAD_MB} MB.`);

  let source: Blob = file;
  let img: HTMLImageElement;
  try {
    img = await loadImage(source);
  } catch {
    if (!isHeic(file)) throw new Error("This image format couldn't be opened. Try saving it as JPG or PNG.");
    const { default: heic2any } = await import("heic2any");
    const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
    source = (Array.isArray(out) ? out[0] : out) ?? file;
    img = await loadImage(source);
  }

  const w = img.naturalWidth || img.width || 1024;
  const h = img.naturalHeight || img.height || 1024;
  const k = Math.min(1, max / Math.max(w, h));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w * k));
  c.height = Math.max(1, Math.round(h * k));
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Could not process image.");
  ctx.fillStyle = "#ffffff"; // flatten transparency (PNG/GIF/SVG) onto white
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(img, 0, 0, c.width, c.height);
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.9));
  if (!blob) throw new Error("Could not process image.");
  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg" });
}
