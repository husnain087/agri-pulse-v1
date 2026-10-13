import { createFileRoute } from "@tanstack/react-router";

// Same-origin relay: the Orange Disease API sends no CORS headers, so browsers can't call it directly.
// Forwards only the uploaded image; stores nothing.
const UPSTREAM = "https://orange-disease-api.fastapicloud.dev/predict";
const MAX_BYTES = 15 * 1024 * 1024;

export const Route = createFileRoute("/api/public/orange-predict")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return Response.json({ detail: "Expected multipart form data." }, { status: 400 });
        }
        const file = form.get("file");
        if (!(file instanceof File) || file.size === 0) return Response.json({ detail: "No image was uploaded." }, { status: 400 });
        if (file.size > MAX_BYTES) return Response.json({ detail: "Image is larger than 15 MB." }, { status: 413 });
        if (file.type && !file.type.startsWith("image/")) return Response.json({ detail: "File must be an image." }, { status: 415 });
        const fd = new FormData();
        fd.append("file", file, file.name || "orange.jpg");
        try {
          const res = await fetch(UPSTREAM, { method: "POST", body: fd, signal: AbortSignal.timeout(90_000) });
          return new Response(await res.text(), { status: res.status, headers: { "Content-Type": "application/json" } });
        } catch {
          return Response.json({ detail: "The orange model could not be reached. Please retry." }, { status: 502 });
        }
      },
    },
  },
});
