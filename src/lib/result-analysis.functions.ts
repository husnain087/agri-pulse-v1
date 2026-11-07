import { createServerFn } from "@tanstack/react-start";
import { resultAnalysisInputSchema, resultAdviceSchema, resultAdviceFormat, resultAdviceInstructions, type ResultAdvice } from "./result-analysis";

type AnalysisResponse = { ok: true; advice: ResultAdvice } | { ok: false; error: string };

export const analyseModelResult = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => resultAnalysisInputSchema.parse(data))
  .handler(async ({ data }): Promise<AnalysisResponse> => {
    const { generateResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
    try {
      const response = await generateResponse({
        model: "openai/gpt-6-astra",
        reasoning: { effort: "low" },
        max_output_tokens: 3200,
        instructions: resultAdviceInstructions(data.language),
        input: [{ role: "user", content: [{ type: "input_text", text: JSON.stringify({ model: data.model, result: data.result }) }] }],
        text: { format: resultAdviceFormat },
      });
      if (response.status !== "completed") return { ok: false, error: "AI could not complete the explanation. Your model result is unchanged." };
      const parts = response.output.flatMap((item) => item.type === "message" ? item.content : []);
      if (parts.some((part) => part.type === "refusal")) return { ok: false, error: "AI cannot provide advice for this result. Please consult an agricultural expert." };
      const text = parts.flatMap((part) => part.type === "output_text" ? [part.text] : []).join("");
      return { ok: true, advice: resultAdviceSchema.parse(JSON.parse(text)) };
    } catch (error) {
      if (error instanceof GatewayError) {
        console.error("Result explanation failed", { code: error.code, ids: error.ids, outcome: error.outcome, recovery: error.recovery });
        if (error.httpStatus === 402) return { ok: false, error: "AI credits are unavailable. The site owner needs to restore Lovable AI credits." };
        if (error.httpStatus === 429) return { ok: false, error: "AI is busy. Please wait before trying again." };
        if (error.httpStatus === 403) return { ok: false, error: "AI access is restricted. The site owner needs to check Lovable AI access settings." };
      }
      return { ok: false, error: "AI explanation is unavailable right now. Your model result is unchanged." };
    }
  });