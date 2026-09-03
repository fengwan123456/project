"use client";

import { useEffect, useRef, useState } from "react";
import type { Itinerary } from "@/types";
import MapFallback from "./MapFallback";

declare global {
  interface Window {
    _AMapSecurityConfig?: { securityJsCode?: string };
    AMap?: any;
  }
}

/**
 * 高德 JS API 2.0 地图。key 缺失或加载失败时降级到 MapFallback。
 * 安全密钥 securityJsCode 必须在加载脚本之前写入 window._AMapSecurityConfig。
 */
export default function AmapView({ itinerary }: { itinerary: Itinerary }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [failed, setFailed] = useState(false);

  const key = process.env.NEXT_PUBLIC_AMAP_JS_KEY ?? "";
  const securityCode = process.env.NEXT_PUBLIC_AMAP_SECURITY_CODE ?? "";
  const hasKey = key.length > 0;

  useEffect(() => {
    if (!hasKey || !containerRef.current) return;

    function renderMap() {
      try {
        const AMap = window.AMap;
        if (!AMap || !containerRef.current) return;

        if (mapRef.current) mapRef.current.destroy();
        const map = new AMap.Map(containerRef.current, {
          zoom: 14,
          center: [itinerary.origin.lng, itinerary.origin.lat],
        });
        mapRef.current = map;

        const pts = [...itinerary.mapPoints].sort((a, b) => a.order - b.order);
        const path = pts.map((p) => [p.lng, p.lat]);
        new AMap.Polyline({
          path,
          strokeColor: "#4f46e5",
          strokeWeight: 5,
          strokeOpacity: 0.9,
        }).setMap(map);

        pts.forEach((p, i) => {
          new AMap.Marker({
            position: [p.lng, p.lat],
            title: p.name,
            label: {
              content: i === 0 ? "起" : String(i),
              offset: new AMap.Pixel(0, -24),
            },
          }).setMap(map);
        });

        map.setFitView(null, false, [60, 60, 60, 60]);
      } catch {
        setFailed(true);
      }
    }

    if (window.AMap) {
      renderMap();
      return;
    }

    window._AMapSecurityConfig = { securityJsCode: securityCode };
    const script = document.createElement("script");
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}`;
    script.async = true;
    script.onload = renderMap;
    script.onerror = () => setFailed(true);
    document.head.appendChild(script);

    return () => {
      mapRef.current?.destroy();
      mapRef.current = null;
    };
  }, [hasKey, itinerary, securityCode]);

  if (!hasKey || failed) {
    return <MapFallback itinerary={itinerary} />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-100 px-5 py-3 text-sm font-medium text-zinc-700">
        路线地图
      </div>
      <div ref={containerRef} className="h-80 w-full" />
    </div>
  );
}
