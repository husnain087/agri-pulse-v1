import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { GrowthFields, GrowthPrediction } from "./growth-api";

export interface SavedGrowth {
  id: string;
  at: number;
  image: string;
  fields: GrowthFields;
  data: GrowthPrediction;
}

export async function saveGrowth(userId: string, record: SavedGrowth) {
  const { error } = await supabase.from("predictions").insert({ id: record.id, user_id: userId, kind: "growth", payload: JSON.parse(JSON.stringify(record)) as Json, created_at: new Date(record.at).toISOString() });
  if (error) throw error;
}

export async function loadGrowth(userId: string): Promise<SavedGrowth[]> {
  const { data, error } = await supabase.from("predictions").select("payload").eq("user_id", userId).eq("kind", "growth").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => r.payload as unknown as SavedGrowth);
}