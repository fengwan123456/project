import { describe, it, expect } from "vitest";
import {
  selectActivities,
  type ScoredActivity,
} from "@/lib/algorithms/knapsack";
import type { Activity } from "@/types";

function act(score: number, cost: number, durationMin: number): ScoredActivity {
  const a: Activity = {
    id: String(score) + cost + durationMin,
    name: "x",
    category: "探店",
    tags: [],
    lat: 0,
    lng: 0,
    address: "",
    costMin: cost,
    costMax: cost,
    durationMin,
    openTime: "00:00",
    closeTime: "24:00",
    rating: 4,
    indoor: true,
    alcoholFree: true,
    socialScore: 50,
  };
  return { activity: a, score, cost, durationMin };
}

describe("knapsack / DP 活动选择", () => {
  it("在预算与时间约束下选出总价值最大的子集", () => {
    const items = [
      act(80, 50, 60), // A
      act(70, 40, 45), // B
      act(60, 30, 30), // C
      act(90, 100, 90), // D（太贵，难以组合）
    ];
    const picked = selectActivities(items, {
      budget: 100,
      timeBudgetMin: 180,
      maxCount: 3,
    });

    const totalScore = picked.reduce((s, p) => s + p.score, 0);
    const totalCost = picked.reduce((s, p) => s + p.cost, 0);
    const totalTime = picked.reduce((s, p) => s + p.durationMin, 0);

    // 最优组合应为 A + B = 150（任何三件都超预算）
    expect(totalScore).toBe(150);
    expect(totalCost).toBeLessThanOrEqual(100);
    expect(totalTime).toBeLessThanOrEqual(180);
    expect(picked.length).toBeLessThanOrEqual(3);
  });

  it("尊重 maxCount 与 minCount 约束", () => {
    const items = [
      act(60, 10, 15),
      act(60, 10, 15),
      act(60, 10, 15),
      act(60, 10, 15),
      act(60, 10, 15),
    ];
    const picked = selectActivities(items, {
      budget: 100,
      timeBudgetMin: 500,
      maxCount: 3,
      minCount: 2,
    });
    expect(picked.length).toBe(3);
  });

  it("预算不足时返回空", () => {
    const items = [act(80, 500, 60)];
    const picked = selectActivities(items, {
      budget: 100,
      timeBudgetMin: 180,
      maxCount: 4,
    });
    expect(picked).toHaveLength(0);
  });
});
