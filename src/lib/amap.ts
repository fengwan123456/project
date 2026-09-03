import type { LatLng } from "@/types";
import { estimateTravelMinutes } from "@/lib/geo";
import type { TravelTimeFn } from "@/lib/algorithms/planner";

/**
 * 高德地图 Web服务 API 的可插拔 adapter。
 * 所有方法在缺少 AMAP_WEB_KEY 时返回 null，调用方自动降级到种子数据 + haversine 估算。
 * 坐标为 GCJ-02；REST 请求中 location/origin/destination 均用「经度,纬度」。
 */

const AMAP_KEY = process.env.AMAP_WEB_KEY ?? "";
const BASE = "https://restapi.amap.com/v3";

export function hasAmapKey(): boolean {
  return AMAP_KEY.length > 0;
}

/** 步行/驾车路径规划：返回耗时（分钟）。key 缺失返回 null。 */
export async function routeMinutes(
  origin: LatLng,
  dest: LatLng,
  method: "walking" | "driving" = "walking"
): Promise<number | null> {
  if (!hasAmapKey()) return null;
  try {
    const params = new URLSearchParams({
      key: AMAP_KEY,
      origin: `${origin.lng},${origin.lat}`,
      destination: `${dest.lng},${dest.lat}`,
    });
    const res = await fetch(`${BASE}/direction/${method}?${params}`);
    const data = (await res.json()) as any;
    if (data.status !== "1" || !data.route?.paths?.length) return null;
    return Math.ceil((data.route.paths[0].duration ?? 0) / 60);
  } catch {
    return null;
  }
}

/** 地理编码：地址 → 坐标。key 缺失返回 null。 */
export async function geocode(address: string): Promise<LatLng | null> {
  if (!hasAmapKey()) return null;
  try {
    const params = new URLSearchParams({ key: AMAP_KEY, address });
    const res = await fetch(`${BASE}/geocode/geo?${params}`);
    const data = (await res.json()) as any;
    if (data.status !== "1" || !data.geocodes?.length) return null;
    const [lng, lat] = String(data.geocodes[0].location ?? ",").split(",");
    return { lng: Number(lng) || 0, lat: Number(lat) || 0 };
  } catch {
    return null;
  }
}

/**
 * 为「起点 + 若干活动点」预取两两真实路线耗时，返回一个同步的 TravelTimeFn：
 * 命中预取矩阵用真实值，否则回退 haversine 估算。无 key 或点 <2 返回 null。
 */
export async function buildAmapTravelTime(
  points: LatLng[]
): Promise<TravelTimeFn | null> {
  if (!hasAmapKey() || points.length < 2) return null;

  const keyOf = (p: LatLng) => `${p.lat},${p.lng}`;
  const matrix = new Map<string, number>();

  const tasks: Promise<void>[] = [];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      tasks.push(
        (async () => {
          const d = await routeMinutes(points[i], points[j]);
          if (d != null) {
            const a = keyOf(points[i]);
            const b = keyOf(points[j]);
            matrix.set(`${a}|${b}`, d);
            matrix.set(`${b}|${a}`, d);
          }
        })()
      );
    }
  }
  await Promise.all(tasks);

  return (a: LatLng, b: LatLng): number => {
    const hit = matrix.get(`${keyOf(a)}|${keyOf(b)}`);
    return hit != null ? hit : estimateTravelMinutes(a, b);
  };
}
