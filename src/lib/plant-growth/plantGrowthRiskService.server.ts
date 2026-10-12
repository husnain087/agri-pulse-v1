// Server-only: calls Lovable AI for the Plant Growth Risk feature. Isolated from the FastAPI ML models.
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, Output, NoObjectGeneratedError, APICallError } from "ai";
import { createLovableAiGatewayRunIdFetch } from "./run-id.server";
import { GrowthAiSchema, type GrowthInput, type GrowthResult, type MeasuredRate } from "./types";

const MODEL = "openai/gpt-6-astra";
const GATEWAY = "https://ai.gateway.lovable.dev/v1";

const INSTRUCTIONS = `You are an agronomy assistant producing a PRELIMINARY visual assessment of a single plant photo for the AgriSense Plant Growth Risk feature.
Rules:
- Describe only what is visible plus the user-provided context. Never invent measurements.
- If the image is not a plant, set image_is_plant=false and keep other fields minimal.
- estimated_height_cm: give a number ONLY if a clear scale reference (ruler, hand, pot of known size) is visible OR the user supplied height; otherwise null and explain in data_limitations.
- future_growth: provide ONLY when the user supplied a current height AND a previous height with days between them (a measured growth rate is provided to you). Otherwise null and explain why in data_limitations.
- Keep growth_risks to at most 5, recommendations to at most 6, concise sentences.
- You are not a disease classifier; do not claim a confirmed disease diagnosis.`;

function measuredRate(i: GrowthInput): MeasuredRate | null {
  if (i.heightCm == null || i.previousHeightCm == null || i.daysSincePrevious == null || i.daysSincePrevious <= 0) return null;
  const deltaCm = i.heightCm - i.previousHeightCm;
  return { deltaCm, days: i.daysSincePrevious, cmPerDay: deltaCm / i.daysSincePrevious };
}

function contextText(i: GrowthInput, rate: MeasuredRate | null) {
  const f = (label: string, v: unknown, unit = "") => (v == null || v === "" ? `${label}: not provided` : `${label}: ${v}${unit}`);
  return [
    f("Species", i.species), f("Age", i.ageDays, " days"), f("Current height", i.heightCm, " cm"),
    f("Previous height", i.previousHeightCm, " cm"), f("Days since previous measurement", i.daysSincePrevious),
    f("Temperature", i.temperatureC, " °C"), f("Humidity", i.humidityPct, " %"), f("Sunlight", i.sunlight), f("Watering", i.watering),
    rate ? `Measured growth rate (computed from user data): ${rate.cmPerDay.toFixed(3)} cm/day over ${rate.days} days` : "Measured growth rate: unavailable",
  ].join("\n");
}

export async function analyzePlantGrowthRisk(input: GrowthInput, signal?: AbortSignal): Promise<GrowthResult> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return { ok: false, status: 500, message: "AI service is not configured." };
  const rate = measuredRate(input);
  const runId = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({
    baseURL: GATEWAY,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runId.fetch,
  });
  try {
    const result = streamText({
      model: provider.responses(MODEL),
      system: INSTRUCTIONS,
      messages: [{
        role: "user",
        content: [
          { type: "text", text: `Assess this plant.\n${contextText(input, rate)}` },
          { type: "image", image: new URL(input.imageDataUrl) },
        ],
      }],
      experimental_output: Output.object({ schema: GrowthAiSchema }),
      ...(signal ? { abortSignal: signal } : {}),
      providerOptions: {
        openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] },
      },
    });
    let streamErr: unknown = null;
    for await (const part of result.fullStream) if (part.type === "error") streamErr = part.error;
    if (streamErr) throw streamErr;
    const ai = GrowthAiSchema.parse(JSON.parse(await result.text));
    // Never surface a projection the rules disallow.
    if (!rate) ai.future_growth = null;
    return { ok: true, ai, measured: rate, model: "Lovable AI (vision LLM)", analyzedAt: Date.now() };
  } catch (e) {
    if (APICallError.isInstance(e)) {
      const s = e.statusCode ?? 500;
      const msg = s === 429 ? "AI is busy right now — please try again in a moment." : s === 402 ? "AI credits are exhausted for this workspace." : s === 403 ? "AI access is blocked for this workspace." : `AI request failed (${s}).`;
      return { ok: false, status: s, message: msg };
    }
    if (NoObjectGeneratedError.isInstance(e)) return { ok: false, status: 502, message: "The AI returned an unreadable answer. Please try again." };
    if ((e as Error)?.name === "AbortError") return { ok: false, status: 499, message: "Cancelled." };
    console.error("plant-growth-risk", e);
    return { ok: false, status: 500, message: "Unexpected error while analyzing the plant." };
  }
}
