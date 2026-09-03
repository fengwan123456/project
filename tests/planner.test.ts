import { describe, it, expect } from "vitest";
import { planItinerary } from "@/lib/algorithms/planner";
import { scoreActivity } from "@/lib/scoring";
import { SEED_CENTER, SEED_VENUES } from "@/lib/seed-data/venues";
import { timeToMinutes } from "@/lib/geo";
import type { Activity, PlanQuery } from "@/types";

const activities: Activity[] = SEED_VENUES.map((v, i) => ({
  ...v,
  id: `v${i}`,
}));

function makeQuery(partial: Partial<PlanQuery> = {}): PlanQuery {
  return {
    location: SEED_CENTER,
    timeWindow: { start: "18:00", end: "22:30" },
    budget: 100,
    indoor: null,
    noAlcohol: true,
    social: "solo",
    interests: [],
    ...partial,
  };
}

describe("planner 编排", () => {
  it("产出 1-4 个活动，且时刻表在时间窗内、按时间有序", () => {
    const it = planItinerary(activities, makeQuery());
    expect(it.items.length).toBeGreaterThanOrEqual(1);
    expect(it.items.length).toBeLessThanOrEqual(4);

    const end = timeToMinutes(it.items[it.items.length - 1].endTime);
    expect(end).toBeLessThanOrEqual(timeToMinutes("22:30"));

    for (let i = 1; i < it.items.length; i++) {
      const prevEnd = timeToMinutes(it.items[i - 1].endTime);
      const start = timeToMinutes(it.items[i].startTime);
      expect(start).toBeGreaterThanOrEqual(prevEnd);
    }
  });

  it("总花费不超预算（含取整容差）", () => {
    const it = planItinerary(activities, makeQuery({ budget: 100 }));
    expect(it.totalCost).toBeLessThanOrEqual(102);
  });

  it("buddy 模式更偏好社交友好的活动", () => {
    const solo = planItinerary(activities, makeQuery({ social: "solo" }));
    const buddy = planItinerary(activities, makeQuery({ social: "buddy" }));
    const avgSocial = (it: typeof solo) =>
      it.items.reduce((s, x) => s + x.activity.socialScore, 0) /
      Math.max(1, it.items.length);
    expect(avgSocial(buddy)).toBeGreaterThanOrEqual(avgSocial(solo));
  });
});

describe("scoring", () => {
  it("不喝酒偏好下，无酒精活动得分更高", () => {
    const q = makeQuery({ noAlcohol: true });
    const withAlcohol: Activity = {
      ...activities[0],
      alcoholFree: false,
      indoor: true,
    };
    const noAlcohol: Activity = {
      ...activities[0],
      alcoholFree: true,
      indoor: true,
    };
    expect(scoreActivity(noAlcohol, q)).toBeGreaterThan(
      scoreActivity(withAlcohol, q)
    );
  });

  it("solo 模式偏好低社交分的活动", () => {
    const q = makeQuery({ social: "solo" });
    const quiet: Activity = { ...activities[0], socialScore: 10 };
    const social: Activity = { ...activities[0], socialScore: 90 };
    expect(scoreActivity(quiet, q)).toBeGreaterThan(scoreActivity(social, q));
  });
});
