import type { LatLng } from "@/types";

const EARTH_RADIUS_M = 6371000;

export function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** 两点间大圆（球面）最短距离，单位米。 */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/**
 * 估算两点间移动耗时（分钟）。
 * 无高德 key 时的降级方案：短途按步行(约 4.5km/h)，长途按城市混合(约 20km/h)。
 */
export function estimateTravelMinutes(a: LatLng, b: LatLng): number {
  const meters = haversineMeters(a, b);
  const km = meters / 1000;
  if (km <= 1.2) {
    return Math.max(2, Math.ceil(meters / 75)); // 步行 75m/min
  }
  return Math.max(3, Math.ceil(km / 0.333)); // ~20km/h → 0.333km/min
}

/** "HH:MM" → 当日分钟数（0-1440），"24:00" → 1440。 */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

/** 当日分钟数 → "HH:MM"（不跨天）。 */
export function minutesToTime(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = Math.round(min) % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
