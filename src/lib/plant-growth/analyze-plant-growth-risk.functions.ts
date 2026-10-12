import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { GrowthInputSchema, type GrowthResult } from "./types";

export const analyzePlantGrowthRiskFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => GrowthInputSchema.parse(d))
  .handler(async ({ data }): Promise<GrowthResult> => {
    const { analyzePlantGrowthRisk } = await import("./plantGrowthRiskService.server");
    return analyzePlantGrowthRisk(data, getRequest()?.signal);
  });
