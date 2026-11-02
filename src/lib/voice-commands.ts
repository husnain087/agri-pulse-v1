export type VoiceAction =
  | { type: "navigate"; path: "/" | "/dashboard" | "/dashboard/detect" | "/dashboard/history" | "/dashboard/models" | "/plant-growth-risk" | "/orange-disease-detection" | "/fertilizer-recommendation" | "/auth" }
  | { type: "language"; language: "en" | "ur" }
  | { type: "scroll"; direction: "up" | "down" | "top" }
  | { type: "assistant"; open: boolean; draft?: string };

export const VOICE_ASSISTANT_EVENT = "agripulse:voice-assistant";

export function parseVoiceCommand(transcript: string): VoiceAction | null {
  const text = transcript.toLowerCase().replace(/[.,!?؟،]/g, "").replace(/\s+/g, " ").trim();
  if (!text) return null;
  // Questions are drafted for review, never sent without a farmer's confirmation.
  const question = transcript.trim().match(/^(?:ask assistant|ask farming assistant|سوال|اسسٹنٹ سے پوچھو)\s+(.+)$/i);
  if (question) return { type: "assistant", open: true, draft: question[1] };
  if (/^(?:(?:switch|change|set)(?: the)? language to |(?:speak|use) )?(?:urdu|اردو)(?: زبان)?(?: میں)?(?: کرو|کریں|kar do)?$/.test(text)) return { type: "language", language: "ur" };
  if (/^(?:(?:switch|change|set)(?: the)? language to |(?:speak|use) )?(?:english|انگریزی)(?: زبان)?(?: میں)?(?: کرو|کریں|kar do)?$/.test(text)) return { type: "language", language: "en" };
  if (/^(?:scroll down|نیچے جاؤ|نیچے جائیں|neeche jao)$/.test(text)) return { type: "scroll", direction: "down" };
  if (/^(?:scroll up|اوپر جاؤ|اوپر جائیں|upar jao)$/.test(text)) return { type: "scroll", direction: "up" };
  if (/^(?:go to top|back to top|سب سے اوپر)$/.test(text)) return { type: "scroll", direction: "top" };
  if (/^(?:close (?:farming )?(?:assistant|chat)|چیٹ بند کرو|اسسٹنٹ بند کرو)$/.test(text)) return { type: "assistant", open: false };
  if (/^(?:open (?:farming )?(?:assistant|chat)|چیٹ کھولو|اسسٹنٹ کھولو)$/.test(text)) return { type: "assistant", open: true };
  const target = text.replace(/^(?:please )?(?:open|go to|show|take me to) (?:the )?/, "").replace(/(?: کھولو| کھولیں| kholo| پر جاؤ| پر جائیں)$/, "").trim();
  const destinations: Record<string, Extract<VoiceAction, { type: "navigate" }>["path"]> = {
    home: "/", "home page": "/", "ہوم": "/", "ہوم پیج": "/",
    dashboard: "/dashboard", "ڈیش بورڈ": "/dashboard",
    "crop detection": "/dashboard/detect", "maize and wheat": "/dashboard/detect", "maize and wheat analysis": "/dashboard/detect", "مکئی اور گندم": "/dashboard/detect",
    growth: "/plant-growth-risk", "plant growth": "/plant-growth-risk", "growth prediction": "/plant-growth-risk", "پودوں کی نشوونما": "/plant-growth-risk", "نشوونما": "/plant-growth-risk",
    orange: "/orange-disease-detection", "orange detection": "/orange-disease-detection", "orange disease detection": "/orange-disease-detection", "مالٹا": "/orange-disease-detection", "کینو": "/orange-disease-detection",
    fertilizer: "/fertilizer-recommendation", "fertilizer recommendation": "/fertilizer-recommendation", "کھاد": "/fertilizer-recommendation",
    history: "/dashboard/history", "prediction history": "/dashboard/history", "ہسٹری": "/dashboard/history",
    models: "/dashboard/models", "ai models": "/dashboard/models", "ماڈلز": "/dashboard/models",
    login: "/auth", "log in": "/auth", "sign in": "/auth", "لاگ ان": "/auth",
  };
  const path = destinations[target];
  return path ? { type: "navigate", path } : null;
}