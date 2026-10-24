import { createFileRoute } from "@tanstack/react-router";

// Same-origin relay: the fertilizer API sends no CORS headers. Forwards the JSON input only; stores nothing.
const UPSTREAM = "https://fertilizer-api-6ce35146.fastapicloud.dev/predict";

export const Route = createFileRoute("/api/public/fertilizer-predict")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const text = await request.text();
        if (text.length > 10_000) return Response.json({ detail: "Request too large." }, { status: 413 });
        try { JSON.parse(text); } catch { return Response.json({ detail: "Expected JSON." }, { status: 400 }); }
        try {
          const res = await fetch(UPSTREAM, { method: "POST", headers: { "Content-Type": "application/json" }, body: text, signal: AbortSignal.timeout(60_000) });
          return new Response(await res.text(), { status: res.status, headers: { "Content-Type": "application/json" } });
        } catch {
          return Response.json({ detail: "The fertilizer model could not be reached. Please retry." }, { status: 502 });
        }
      },
    },
  },
});
