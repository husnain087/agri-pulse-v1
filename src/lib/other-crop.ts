import { z } from "zod";

export const cropPhotoSchema = z.object({
  image: z.string().max(8_000_000).regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/, "Please upload a valid crop photo."),
  language: z.enum(["en", "ur"]),
}).strict();

const diseaseFindingSchema = z.object({
  name: z.string().min(1).max(200),
  kind: z.enum(["rust", "other"]),
  evidence: z.array(z.string().min(1).max(500)).min(1).max(5),
}).strict();

const healthFields = {
  summary: z.string().min(1).max(1000),
  nextSteps: z.array(z.string().min(1).max(500)).max(5),
};

export const cropHealthSchema = z.discriminatedUnion("status", [
  z.object({ ...healthFields, status: z.literal("suspected_disease"), diseases: z.array(diseaseFindingSchema).min(1).max(5) }).strict(),
  z.object({ ...healthFields, status: z.literal("no_visible_disease"), diseases: z.array(diseaseFindingSchema).max(0) }).strict(),
  z.object({ ...healthFields, status: z.literal("uncertain"), diseases: z.array(diseaseFindingSchema).max(0) }).strict(),
  z.object({ ...healthFields, status: z.literal("not_assessable"), diseases: z.array(diseaseFindingSchema).max(0) }).strict(),
]);

export const cropIdentificationSchema = z.object({
  status: z.enum(["identified", "uncertain", "not_crop"]),
  cropName: z.string().min(1).max(200),
  scientificName: z.string().max(200),
  summary: z.string().max(1500),
  visibleFeatures: z.array(z.string().max(500)).max(8),
  growingConditions: z.string().max(1500),
  commonUses: z.string().max(1000),
  care: z.array(z.string().max(500)).max(8),
  alternatives: z.array(z.string().max(200)).max(5),
  verification: z.string().max(1000),
  health: cropHealthSchema,
}).strict().superRefine((result, context) => {
  if (result.status === "not_crop" && result.health.status !== "not_assessable") {
    context.addIssue({ code: "custom", path: ["health", "status"], message: "A non-crop photo cannot receive a crop health assessment." });
  }
});
export type CropIdentification = z.infer<typeof cropIdentificationSchema>;

export const cropOutputFormat = {
  type: "json_schema" as const,
  name: "crop_identification",
  strict: true,
  schema: {
    type: "object", additionalProperties: false,
    properties: {
      status: { type: "string", enum: ["identified", "uncertain", "not_crop"] },
      cropName: { type: "string" }, scientificName: { type: "string" },
      summary: { type: "string" }, visibleFeatures: { type: "array", items: { type: "string" } },
      growingConditions: { type: "string" }, commonUses: { type: "string" },
      care: { type: "array", items: { type: "string" } }, alternatives: { type: "array", items: { type: "string" } },
      verification: { type: "string" },
      health: {
        type: "object", additionalProperties: false,
        properties: {
          status: { type: "string", enum: ["suspected_disease", "no_visible_disease", "uncertain", "not_assessable"] },
          diseases: { type: "array", items: {
            type: "object", additionalProperties: false,
            properties: {
              name: { type: "string" }, kind: { type: "string", enum: ["rust", "other"] },
              evidence: { type: "array", items: { type: "string" } },
            },
            required: ["name", "kind", "evidence"],
          } },
          summary: { type: "string" }, nextSteps: { type: "array", items: { type: "string" } },
        },
        required: ["status", "diseases", "summary", "nextSteps"],
      },
    },
    required: ["status", "cropName", "scientificName", "summary", "visibleFeatures", "growingConditions", "commonUses", "care", "alternatives", "verification", "health"],
  },
};