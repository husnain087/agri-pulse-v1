import { describe, expect, it } from "vitest";
import { resultAnalysisInputSchema, resultAdviceSchema } from "./result-analysis";

describe("Model result explanations", () => {
  it.each(["crop-disease", "other-crop", "plant-growth", "orange-disease", "fertilizer"])("accepts %s results for on-demand advice", (model) => {
    const parsed = resultAnalysisInputSchema.parse({ model, language: "en", result: JSON.stringify({ disease: "Stripe rust", confidence: 91.33 }) });
    expect(parsed.result).toEqual({ disease: "Stripe rust", confidence: 91.33 });
  });
  it("accepts Urdu without changing original predictions", () => {
    const parsed = resultAnalysisInputSchema.parse({ model: "fertilizer", language: "ur", result: '{"predicted_fertilizer":"Urea"}' });
    expect(parsed.language).toBe("ur");
    expect(parsed.result).toEqual({ predicted_fertilizer: "Urea" });
  });
  it("rejects arbitrary models and invalid results", () => {
    for (const result of ["broken", "null", "[]", '"result"']) expect(resultAnalysisInputSchema.safeParse({ model: "other-crop", language: "en", result }).success).toBe(false);
    expect(resultAnalysisInputSchema.safeParse({ model: "arbitrary", language: "en", result: "{}" }).success).toBe(false);
  });
  it("requires details, next steps and disease prevention in the advice", () => {
    const advice = { explanation: "The model suggests stripe rust.", findings: ["Stripe rust is suspected."], nextSteps: ["Inspect nearby plants."], prevention: ["Avoid prolonged leaf wetness."], expertHelp: "Ask a local agronomist to confirm." };
    expect(resultAdviceSchema.parse(advice).prevention).toEqual(["Avoid prolonged leaf wetness."]);
    expect(resultAdviceSchema.safeParse({ ...advice, prevention: undefined }).success).toBe(false);
  });
});