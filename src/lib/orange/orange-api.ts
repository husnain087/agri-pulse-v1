export const ORANGE_MODEL = "EfficientNet-B0";
export const ORANGE_ENDPOINT = "/api/public/orange-predict";
export const ORANGE_MIN_MS = 5500;
export const ORANGE_MAX_MB = 15;

export interface OrangeResult {
  filename: string;
  disease: string;
  confidence: number; // percent, as returned
  predictions: { label: string; pct: number }[]; // descending
  note?: string | undefined;
}

export function parseOrange(d: unknown): OrangeResult {
  const o = d as { filename?: unknown; predicted_disease?: unknown; confidence?: unknown; predictions?: unknown; note?: unknown } | null;
  if (!o || typeof o.predicted_disease !== "string" || typeof o.confidence !== "number") throw new Error("The model returned an unexpected response.");
  const preds = o.predictions && typeof o.predictions === "object" ? (o.predictions as Record<string, unknown>) : {};
  return {
    filename: typeof o.filename === "string" ? o.filename : "",
    disease: o.predicted_disease,
    confidence: o.confidence,
    predictions: Object.entries(preds)
      .filter(([, v]) => typeof v === "number")
      .map(([label, v]) => ({ label, pct: v as number }))
      .sort((a, b) => b.pct - a.pct),
    note: typeof o.note === "string" ? o.note : undefined,
  };
}

export async function predictOrange(file: File, signal?: AbortSignal): Promise<OrangeResult> {
  const fd = new FormData();
  fd.append("file", file);
  let res: Response;
  try {
    res = await fetch(ORANGE_ENDPOINT, { method: "POST", body: fd, signal: signal ?? AbortSignal.timeout(100_000) });
  } catch (e) {
    if ((e as Error).name === "TimeoutError") throw new Error("The request timed out — the model may be waking up. Please retry.");
    throw new Error("Network error — the prediction service could not be reached.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = (data as { detail?: unknown } | null)?.detail;
    throw new Error(typeof detail === "string" ? detail : `Orange disease prediction failed (HTTP ${res.status}).`);
  }
  return parseOrange(data);
}

export function buildReport(r: OrangeResult, at: Date): string {
  return [
    "Agri Pulse — Orange Disease Detection Report",
    `Date/time: ${at.toLocaleString()}`,
    `Image file: ${r.filename}`,
    `Model: ${ORANGE_MODEL}`,
    "",
    `Prediction: ${r.disease}`,
    `Confidence: ${r.confidence.toFixed(2)}%`,
    "",
    "All class probabilities:",
    ...r.predictions.map((p) => `  ${p.label}: ${p.pct.toFixed(2)}%`),
    "",
    "Limitation: This is an automated image classification, not a confirmed diagnosis. It does not assess severity,",
    "locate disease on the fruit, or prescribe treatment. Confirm results with a qualified agricultural expert.",
  ].join("\n");
}

export interface DiseaseInfo { about: string; symptoms: string[]; inspect: string[]; prevent: string[]; expert: string }

export const ORANGE_INFO: Record<string, DiseaseInfo> = {
  "black spot": {
    about: "Citrus black spot is a fungal disease (Phyllosticta citricarpa) that mainly blemishes the fruit rind and can cause early fruit drop.",
    symptoms: ["Hard, sunken spots with brick-red to black margins", "Grey centres, sometimes with tiny black dots", "Freckle-like or virulent spotting on maturing fruit"],
    inspect: ["Check fruit on the sunny side of the canopy", "Look for leaf litter with fungal growth under trees", "Compare several fruits from different trees"],
    prevent: ["Remove fallen leaves and infected fruit", "Prune for airflow and light", "Follow locally approved fungicide programmes"],
    expert: "Black spot is a regulated (quarantine) disease in many regions — report suspected cases to your local plant-protection office.",
  },
  canker: {
    about: "Citrus canker is a bacterial disease (Xanthomonas citri) spread by wind-driven rain, tools and people.",
    symptoms: ["Raised, corky, brown lesions on fruit, leaves and twigs", "Lesions often ringed by a yellow halo", "Water-soaked margins on young lesions"],
    inspect: ["Check both leaf surfaces and young shoots", "Look for lesions along leaf-miner damage", "Inspect neighbouring trees"],
    prevent: ["Disinfect tools and equipment", "Use windbreaks and healthy certified nursery stock", "Control citrus leaf miner"],
    expert: "Canker is regulated in many countries — contact an extension officer to confirm and follow local rules.",
  },
  greening: {
    about: "Huanglongbing (citrus greening) is a bacterial disease spread by the Asian citrus psyllid. It has no cure and severely declines trees.",
    symptoms: ["Small, lopsided fruit that stays green at the bottom", "Bitter fruit with aborted seeds", "Blotchy, asymmetric yellow mottling on leaves"],
    inspect: ["Look for psyllids on new flushes", "Check leaves for asymmetric mottling", "Cut fruit to check for uneven colour and aborted seeds"],
    prevent: ["Monitor and manage psyllid populations", "Plant certified disease-free trees", "Remove confirmed infected trees as advised"],
    expert: "Greening can only be confirmed by laboratory testing — contact an agricultural expert promptly.",
  },
  scab: {
    about: "Citrus scab is a fungal disease (Elsinoë fawcettii) that causes rough, wart-like blemishes, mostly affecting appearance.",
    symptoms: ["Raised, corky, wart-like scabs on fruit", "Pink-grey to brown scab colour", "Distorted, puckered young leaves"],
    inspect: ["Examine young fruit and new leaves", "Check after periods of wet weather", "Distinguish from canker (no yellow halo)"],
    prevent: ["Prune to improve air movement", "Avoid overhead irrigation on young growth", "Apply approved protective sprays at petal fall where recommended"],
    expert: "Consult an expert if scabbing is widespread or you are unsure whether it is canker.",
  },
  healthy: {
    about: "The model's top class for this image is healthy — no disease class scored higher.",
    symptoms: ["Even rind colour and texture", "No spots, lesions or scabs visible"],
    inspect: ["Keep checking fruit and leaves regularly", "Watch new flushes for pests such as psyllids and leaf miners"],
    prevent: ["Maintain balanced nutrition and irrigation", "Keep the orchard floor clean", "Use clean tools and certified planting material"],
    expert: "Consult an expert if you notice symptoms the photo didn't capture.",
  },
};

export const infoFor = (label: string) => ORANGE_INFO[label.trim().toLowerCase()];
