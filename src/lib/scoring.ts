import type { Activity, PlanQuery } from "@/types";

/**
 * 给单个活动打分（相对权重，可正可负），衡量它与用户偏好的匹配程度。
 * 作为后续 DP 选择时的「价值」输入。不做 0-100 钳制，以保留相对区分度。
 */
export function scoreActivity(a: Activity, q: PlanQuery): number {
  let s = 0;

  // 室内/室外
  if (q.indoor != null) {
    s += q.indoor === a.indoor ? 15 : -20;
  }

  // 不喝酒
  if (q.noAlcohol) {
    s += a.alcoholFree ? 15 : -40;
  }

  // 社交倾向（主导项）：solo 偏爱独处/安静，buddy 偏爱社交友好
  s +=
    q.social === "solo"
      ? (50 - a.socialScore) * 0.6
      : (a.socialScore - 50) * 0.6;

  // 兴趣标签命中
  const overlap = a.tags.filter((t) => q.interests.includes(t)).length;
  s += overlap * 8;

  // 预算匹配
  const avgCost = (a.costMin + a.costMax) / 2;
  s += avgCost <= q.budget ? 10 : -10;
  if (a.costMin > q.budget * 1.5) s -= 30;

  // 评分
  s += (a.rating - 3.5) * 8;

  return s;
}
