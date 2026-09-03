"use client";

import type { Itinerary } from "@/types";

/** 无高德 key 时的降级示意：把各活动点的经纬度归一化到一个小 SVG 上。 */
export default function MapFallback({
  itinerary,
}: {
  itinerary: Itinerary;
}) {
  const pts = [...itinerary.mapPoints].sort((a, b) => a.order - b.order);
  const lats = pts.map((p) => p.lat);
  const lngs = pts.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const W = 360;
  const H = 240;
  const pad = 28;
  const rangeLat = maxLat - minLat || 0.001;
  const rangeLng = maxLng - minLng || 0.001;
  const x = (lng: number) => pad + ((lng - minLng) / rangeLng) * (W - 2 * pad);
  const y = (lat: number) => H - pad - ((lat - minLat) / rangeLat) * (H - 2 * pad);

  const points = pts.map((p, i) => ({ ...p, x: x(p.lng), y: y(p.lat), i }));
  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-100 px-5 py-3 text-sm font-medium text-zinc-700">
        路线示意（相对位置）
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full bg-zinc-50">
        <polyline
          points={polyline}
          fill="none"
          stroke="#4f46e5"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        {points.map((p) => (
          <g key={p.i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={p.i === 0 ? 5 : 9}
              fill={p.i === 0 ? "#a1a1aa" : "#4f46e5"}
            />
            <text
              x={p.x}
              y={p.y - 12}
              textAnchor="middle"
              fontSize="11"
              fill="#52525b"
            >
              {p.i === 0 ? "起点" : p.i}
            </text>
          </g>
        ))}
      </svg>
      <p className="px-5 py-3 text-xs text-zinc-400">
        未配置高德 key，展示各活动相对位置。在 .env 填入
        NEXT_PUBLIC_AMAP_JS_KEY 即可点亮真实地图。
      </p>
    </div>
  );
}
