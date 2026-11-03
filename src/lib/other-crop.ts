import { z } from "zod";

export const cropPhotoSchema = z.object({
  image: z.string().max(8_000_000).regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/, "Please upload a valid crop photo."),
  language: z.enum(["en", "ur"]),
}).strict();

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
}).strict();
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
    },
    required: ["status", "cropName", "scientificName", "summary", "visibleFeatures", "growingConditions", "commonUses", "care", "alternatives", "verification"],
  },
};