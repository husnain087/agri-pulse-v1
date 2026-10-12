import { useEffect, useRef } from "react";

/** Pseudo-3D rotating neural point cloud on canvas. `intensity` 0..1 drives pulse activity. */
export function NeuralBrainAnimation({ intensity = 0.2 }: { intensity?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const intensityRef = useRef(intensity);
  intensityRef.current = intensity;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const N = window.innerWidth < 640 ? 240 : 420;
    // points on two lobes (brain-ish ellipsoid)
    const pts = Array.from({ length: N }, (_, i) => {
      const side = i % 2 ? 1 : -1;
      const u = Math.random() * Math.PI * 2;
      const v = Math.acos(2 * Math.random() - 1);
      const r = 0.85 + Math.random() * 0.15;
      return {
        x: side * 0.32 + Math.sin(v) * Math.cos(u) * 0.62 * r,
        y: Math.cos(v) * 0.55 * r,
        z: Math.sin(v) * Math.sin(u) * 0.78 * r,
      };
    });
    const edges: [number, number][] = [];
    for (let i = 0; i < N; i++)
      for (let j = i + 1; j < N; j++) {
        const a = pts[i], b = pts[j];
        if (!a || !b) continue;
        if ((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2 < 0.035) edges.push([i, j]);
      }
    const pulses: { e: number; t: number }[] = [];
    let raf = 0, angle = 0;
    const css = getComputedStyle(canvas);
    const green = css.getPropertyValue("--primary").trim();
    const cyan = css.getPropertyValue("--cyan").trim();
    const gold = css.getPropertyValue("--gold").trim();

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const k = intensityRef.current;
      angle += reduced ? 0 : 0.003 + k * 0.006;
      const s = Math.min(w, h) * 0.55;
      const cos = Math.cos(angle), sin = Math.sin(angle);
      const proj = pts.map((p) => {
        const x = p.x * cos - p.z * sin, z = p.x * sin + p.z * cos;
        const f = 2.4 / (2.4 + z);
        return { x: w / 2 + x * s * f, y: h / 2 + p.y * s * f, d: f };
      });
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = `color-mix(in oklch, ${cyan} ${12 + k * 18}%, transparent)`;
      ctx.beginPath();
      for (const [a, b] of edges) {
        const start = proj[a], end = proj[b];
        if (!start || !end) continue;
        ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y);
      }
      ctx.stroke();
      for (const p of proj) {
        ctx.fillStyle = `color-mix(in oklch, ${green} ${40 + p.d * 30}%, transparent)`;
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.1 * p.d + 0.4, 0, Math.PI * 2); ctx.fill();
      }
      if (!reduced && edges.length && Math.random() < 0.08 + k * 0.8) {
        for (let burst = 0; burst < 1 + Math.floor(k * 4); burst++) pulses.push({ e: (Math.random() * edges.length) | 0, t: 0 });
      }
      for (let i = pulses.length - 1; i >= 0; i--) {
        const pu = pulses[i];
        if (!pu) continue;
        pu.t += 0.015 + k * 0.02;
        if (pu.t >= 1) { pulses.splice(i, 1); continue; }
        const edge = edges[pu.e];
        if (!edge) continue;
        const start = proj[edge[0]], end = proj[edge[1]];
        if (!start || !end) continue;
        const x = start.x + (end.x - start.x) * pu.t, y = start.y + (end.y - start.y) * pu.t;
        ctx.shadowBlur = 10; ctx.shadowColor = i % 3 ? cyan : gold;
        ctx.strokeStyle = i % 3 ? cyan : gold;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        const tail = Math.max(0, pu.t - 0.3);
        ctx.moveTo(start.x + (end.x - start.x) * tail, start.y + (end.y - start.y) * tail);
        ctx.lineTo(x, y); ctx.stroke();
        ctx.fillStyle = i % 3 ? cyan : gold;
        ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }
      if (!reduced) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} className="h-full w-full" aria-label="Animated neural network visualizing the AI pipeline" role="img" />;
}
