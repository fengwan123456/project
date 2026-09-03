import { describe, it, expect } from "vitest";
import {
  haversineMeters,
  estimateTravelMinutes,
  timeToMinutes,
  minutesToTime,
} from "@/lib/geo";

describe("geo", () => {
  it("haversine 计算两点距离，量级正确", () => {
    // 五角场 → 复旦大学（约 1.5km）
    const a = { lat: 31.3002, lng: 121.5132 };
    const b = { lat: 31.295, lng: 121.4995 };
    const m = haversineMeters(a, b);
    expect(m).toBeGreaterThan(1000);
    expect(m).toBeLessThan(2500);
  });

  it("同一点距离为 0", () => {
    const a = { lat: 31.3, lng: 121.5 };
    expect(haversineMeters(a, a)).toBeCloseTo(0, 6);
  });

  it("timeToMinutes / minutesToTime 互逆", () => {
    expect(timeToMinutes("18:30")).toBe(1110);
    expect(minutesToTime(1110)).toBe("18:30");
    expect(timeToMinutes("24:00")).toBe(1440);
    expect(minutesToTime(0)).toBe("00:00");
  });

  it("移动耗时随距离递增，且短途按步行", () => {
    const origin = { lat: 31.3002, lng: 121.5132 };
    const near = { lat: 31.301, lng: 121.514 }; // ~100m
    const far = { lat: 31.32, lng: 121.52 }; // ~2km
    const tNear = estimateTravelMinutes(origin, near);
    const tFar = estimateTravelMinutes(origin, far);
    expect(tFar).toBeGreaterThan(tNear);
    expect(tNear).toBeGreaterThanOrEqual(2);
  });
});
