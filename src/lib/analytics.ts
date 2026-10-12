import { isHealthy, type PredictionRecord } from "./history-store";
import { prettyLabel } from "./agrisense-api";

export function computeStats(rs: PredictionRecord[]) {
  const maize = rs.filter((r) => r.crop === "Maize").length;
  const healthy = rs.filter(isHealthy).length;
  const confs = rs.map((r) => r.confidence).filter((c): c is number => typeof c === "number" && Number.isFinite(c));
  const diseaseCounts = new Map<string, number>();
  rs.forEach((r) => { const k = `${r.crop} · ${prettyLabel(r.disease)}`; diseaseCounts.set(k, (diseaseCounts.get(k) ?? 0) + 1); });
  const diseases = [...diseaseCounts].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const days = new Map<string, number>();
  [...rs].sort((a, b) => a.createdAt - b.createdAt).forEach((r) => {
    const d = new Date(r.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    days.set(d, (days.get(d) ?? 0) + 1);
  });
  const diseased = rs.filter((r) => !isHealthy(r));
  const topDisease = (() => {
    const m = new Map<string, number>();
    diseased.forEach((r) => m.set(prettyLabel(r.disease), (m.get(prettyLabel(r.disease)) ?? 0) + 1));
    return [...m].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  })();
  return {
    total: rs.length,
    maize,
    wheat: rs.length - maize,
    healthy,
    diseased: rs.length - healthy,
    avgConfidence: confs.length ? confs.reduce((a, b) => a + b, 0) / confs.length : null,
    diseases,
    topDisease,
    timeline: [...days].map(([date, count]) => ({ date, count })),
    cropSplit: [{ name: "Maize", value: maize }, { name: "Wheat", value: rs.length - maize }].filter((d) => d.value > 0),
    healthSplit: [{ name: "Healthy", value: healthy }, { name: "Diseased", value: rs.length - healthy }].filter((d) => d.value > 0),
  };
}
