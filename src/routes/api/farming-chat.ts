import { createFileRoute } from "@tanstack/react-router";
import { chatRequestSchema, FARMING_INSTRUCTIONS } from "@/lib/farming-assistant";

export const Route = createFileRoute("/api/farming-chat")({
  staticData: { sitemap: false },
  server: { handlers: { POST: async ({ request }) => {
    const origin = request.headers.get("origin");
    if (!origin || origin !== new URL(request.url).origin) {
      return Response.json({ error: "Please use the farming assistant on Agri Pulse." }, { status: 403 });
    }
    if (Number(request.headers.get("content-length") ?? 0) > 250000) {
      return Response.json({ error: "This conversation is too long. Please clear the chat." }, { status: 413 });
    }
    let raw: unknown;
    try {
      const body = await request.text();
      if (body.length > 250000) return Response.json({ error: "This conversation is too long. Please clear the chat." }, { status: 413 });
      raw = JSON.parse(body);
    } catch {
      return Response.json({ error: "The chat request could not be read." }, { status: 400 });
    }
    const parsed = chatRequestSchema.safeParse(raw);
    if (!parsed.success) return Response.json({ error: "Please send a text question, or clear a very long chat." }, { status: 400 });
    const apiKey = process.env["UDC_GOOGLE_GEMINI_DEVELOPER_API_API_KEY"];
    const lovableKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey || !lovableKey) return Response.json({ error: "The Gemini connection is not configured. Please contact the site owner." }, { status: 503 });
    const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
    const { streamText, convertToModelMessages } = await import("ai");
    const google = createGoogleGenerativeAI({
      baseURL: "https://connector-gateway.lovable.dev/udc_google_gemini_developer_api/v1beta",
      apiKey,
      fetch: async (input, init) => {
        const headers = new Headers(init?.headers);
        headers.delete("x-goog-api-key");
        headers.set("Authorization", `Bearer ${lovableKey}`);
        headers.set("X-Connection-Api-Key", apiKey);
        return fetch(input, { ...init, headers });
      },
    });
    const result = streamText({
      model: google("gemini-3.5-flash-lite"),
      system: FARMING_INSTRUCTIONS,
      messages: await convertToModelMessages(parsed.data.messages),
      abortSignal: request.signal,
      maxRetries: 0,
    });
    return result.toUIMessageStreamResponse({
      originalMessages: parsed.data.messages,
      headers: { "Cache-Control": "no-store" },
      onError: (error) => {
        // Never log request history or connection credentials.
        const message = error instanceof Error ? error.message : "Gemini could not complete this answer.";
        return message.replaceAll(apiKey, "[redacted]").replaceAll(lovableKey, "[redacted]");
      },
      onFinish: () => { /* Session-only messages remain in the browser's mounted chat state. */ },
    });
  } } },
});