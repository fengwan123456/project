import type {
  Activity,
  Itinerary,
  ItineraryItem,
  LatLng,
  PlanQuery,
  SocialMode,
} from "@/types";
import { estimateTravelMinutes, timeToMinutes, minutesToTime } from "@/lib/geo";
import { scoreActivity } from "@/lib/scoring";
import {
  selectActivities,
  type ScoredActivity,
} from "./knapsack";
import { buildTravelMatrix } from "./shortestPath";
import { heldKarpPath } from "./tsp";

export type TravelTimeFn = (a: LatLng, b: LatLng) => number;

export interface PlannerOptions {
  travelTime?: TravelTimeFn;
  maxCount?: number; // 默认 4
  minCount?: number; // 默认 1（预算/时间实在不够时允许只排 1 个）
}

interface ScheduledItem {
  activity: ScoredActivity;
  startTime: string;
  endTime: string;
  travelMinutes: number;
}

/** 营业时间 [open, close] 与时间窗 [t0, t1] 是否有交集 */
function hoursOverlap(a: Activity, t0: number, t1: number): boolean {
  const open = timeToMinutes(a.openTime);
  const close = timeToMinutes(a.closeTime);
  return open <= t1 && close >= t0;
}

/**
 * 社交模式硬过滤（业务规则）：
 * - solo：排除强组队型活动（剧本杀/狼人杀等，一个人去不成立）；
 * - buddy：排除纯独处型活动（书店等，找搭子无意义）。
 */
function socialCompatible(a: Activity, social: SocialMode): boolean {
  return social === "solo" ? a.socialScore <= 80 : a.socialScore >= 40;
}

function avgCost(a: Activity): number {
  return (a.costMin + a.costMax) / 2;
}

const DEFAULT_ORIGIN: LatLng = { lat: 31.3002, lng: 121.5132 };

function resolveOrigin(loc: PlanQuery["location"]): LatLng {
  if ("lat" in loc && typeof loc.lat === "number") {
    return { lat: loc.lat, lng: loc.lng };
  }
  // 仅地址且未地理编码时的兜底
  return DEFAULT_ORIGIN;
}

/**
 * 用最短移动顺序（Held-Karp）排定活动，再沿顺序贪心排时刻表。
 * 返回排好的条目与「是否在时间窗/营业时间内可行」标记。
 */
function buildSchedule(
  ordered: ScoredActivity[],
  origin: LatLng,
  t0: number,
  t1: number,
  travelTime: TravelTimeFn
): { items: ScheduledItem[]; feasible: boolean } {
  if (ordered.length === 0) return { items: [], feasible: true };

  const points: LatLng[] = [
    origin,
    ...ordered.map((o) => ({ lat: o.activity.lat, lng: o.activity.lng })),
  ];
  const dist = buildTravelMatrix(points, travelTime);
  const { order } = heldKarpPath(dist, 0); // order：points 下标 1..k 的访问顺序
  const sequence = order.map((nodeIdx) => ordered[nodeIdx - 1]);

  let clock = t0;
  let prev: LatLng = origin;
  const items: ScheduledItem[] = [];
  let feasible = true;

  for (const sa of sequence) {
    const here: LatLng = { lat: sa.activity.lat, lng: sa.activity.lng };
    const travel = travelTime(prev, here);
    const arrive = clock + travel;
    const open = timeToMinutes(sa.activity.openTime);
    const close = timeToMinutes(sa.activity.closeTime);
    const start = Math.max(arrive, open, t0);
    const end = start + sa.activity.durationMin;

    if (end > close || end > t1) feasible = false;

    items.push({
      activity: sa,
      startTime: minutesToTime(start),
      endTime: minutesToTime(Math.max(start, Math.min(end, t1, close))),
      travelMinutes: travel,
    });
    clock = end;
    prev = here;
  }

  return { items, feasible };
}

/**
 * 行程规划编排器（纯函数，可离线运行）：
 *   过滤(营业时间重叠) → 评分 → DP 背包选择 → Floyd-Warshall 距离矩阵
 *   → Held-Karp 定序 → 时刻表生成（超窗则回退丢最低分活动）。
 */
export function planItinerary(
  candidates: Activity[],
  query: PlanQuery,
  opts: PlannerOptions = {}
): Itinerary {
  const travelTime = opts.travelTime ?? estimateTravelMinutes;
  const maxCount = opts.maxCount ?? 4;
  const minCount = opts.minCount ?? 1;

  const origin = resolveOrigin(query.location);
  const t0 = timeToMinutes(query.timeWindow.start);
  const t1 = timeToMinutes(query.timeWindow.end);
  const windowMinutes = Math.max(0, t1 - t0);

  // 1. 营业时间重叠 + 社交模式硬过滤
  const feasible = candidates.filter(
    (a) => hoursOverlap(a, t0, t1) && socialCompatible(a, query.social)
  );

  // 2. 评分
  const scored: ScoredActivity[] = feasible.map((activity) => ({
    activity,
    score: scoreActivity(activity, query),
    cost: avgCost(activity),
    durationMin: activity.durationMin,
  }));

  // 3. DP 选择（预留每跳 15 分钟移动时间）
  const reservedTravel = Math.max(0, maxCount - 1) * 15;
  const timeBudget = Math.max(0, windowMinutes - reservedTravel);
  let ordered = selectActivities(scored, {
    budget: query.budget,
    timeBudgetMin: timeBudget,
    minCount,
    maxCount,
  });

  // 品类去重：同一 category 至多保留一个（保留得分最高的），避免“连排两家书店”这类重复。
  // 只删不补，因此不会破坏预算/时间约束。
  const byCategory = new Map<string, ScoredActivity>();
  for (const s of ordered) {
    const cat = s.activity.category;
    if (!byCategory.has(cat) || s.score > byCategory.get(cat)!.score) {
      byCategory.set(cat, s);
    }
  }
  ordered = [...byCategory.values()];

  // 4. 定序 + 排时刻表，超窗则回退
  let schedule = buildSchedule(ordered, origin, t0, t1, travelTime);
  while (ordered.length > 1 && !schedule.feasible) {
    let minIdx = 0;
    for (let i = 1; i < ordered.length; i++) {
      if (ordered[i].score < ordered[minIdx].score) minIdx = i;
    }
    ordered = ordered.filter((_, i) => i !== minIdx);
    schedule = buildSchedule(ordered, origin, t0, t1, travelTime);
  }

  const items: ItineraryItem[] = schedule.items.map((it, idx) => ({
    activity: it.activity.activity,
    order: idx,
    startTime: it.startTime,
    endTime: it.endTime,
    travelMinutes: it.travelMinutes,
    cost: Math.round(it.activity.cost),
  }));

  const totalCost = items.reduce((s, it) => s + it.cost, 0);
  const actualDuration =
    items.length > 0
      ? timeToMinutes(items[items.length - 1].endTime) -
        timeToMinutes(items[0].startTime)
      : 0;

  const mapPoints = [
    { name: "起点", lat: origin.lat, lng: origin.lng, order: -1 },
    ...items.map((it, idx) => ({
      name: it.activity.name,
      lat: it.activity.lat,
      lng: it.activity.lng,
      order: idx,
    })),
  ];

  return {
    mode: query.social,
    items,
    totalCost,
    totalDurationMin: Math.max(0, actualDuration),
    origin,
    mapPoints,
  };
}
