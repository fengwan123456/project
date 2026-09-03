import type { Activity } from "@/types";

export interface ScoredActivity {
  activity: Activity;
  score: number; // fitScore，越大越好
  cost: number; // 平均花费（元）
  durationMin: number;
}

export interface SelectionOptions {
  budget: number; // 总预算（元）
  timeBudgetMin: number; // 可用时长（分钟，已扣除移动预留）
  minCount?: number; // 至少选几个（默认 1）
  maxCount?: number; // 最多选几个（默认 4）
  budgetStep?: number; // 预算离散粒度（默认 10 元）
  timeStep?: number; // 时间离散粒度（默认 15 分钟）
}

/**
 * 三维资源的 0/1 背包动态规划：
 * 在「数量 / 预算 / 时长」三重约束下，选择活动子集使总 fitScore 最大。
 *
 * dp[i][c][b][t] = 考虑前 i 个活动、选了 c 个、花 b 单位预算、占 t 单位时长时的最大得分。
 * 用 choice 数组回溯出具体选择。N≤20、C≤4、B≤50、T≤24，状态空间极小。
 */
export function selectActivities(
  candidates: ScoredActivity[],
  opts: SelectionOptions
): ScoredActivity[] {
  const {
    budget,
    timeBudgetMin,
    minCount = 1,
    maxCount = 4,
    budgetStep = 10,
    timeStep = 15,
  } = opts;

  const B = Math.max(1, Math.floor(budget / budgetStep));
  const T = Math.max(1, Math.floor(timeBudgetMin / timeStep));
  const C = Math.min(maxCount, candidates.length);

  const items = candidates.map((c) => ({
    ...c,
    b: Math.ceil(c.cost / budgetStep),
    t: Math.max(1, Math.ceil(c.durationMin / timeStep)),
  }));
  const n = items.length;

  const NEG = -1e9;
  const idx = (i: number, c: number, b: number, t: number) =>
    (((i * (C + 1) + c) * (B + 1) + b) * (T + 1) + t);

  const dp = new Float64Array((n + 1) * (C + 1) * (B + 1) * (T + 1));
  const choice = new Uint8Array((n + 1) * (C + 1) * (B + 1) * (T + 1));
  dp.fill(NEG);
  dp[idx(0, 0, 0, 0)] = 0;

  for (let i = 1; i <= n; i++) {
    const item = items[i - 1];
    for (let c = 0; c <= C; c++) {
      for (let b = 0; b <= B; b++) {
        for (let t = 0; t <= T; t++) {
          const cur = idx(i, c, b, t);
          // 不选
          let best = dp[idx(i - 1, c, b, t)];
          let take = 0;
          // 选
          if (c >= 1 && b >= item.b && t >= item.t) {
            const prev = dp[idx(i - 1, c - 1, b - item.b, t - item.t)];
            if (prev > NEG) {
              const cand = prev + item.score;
              if (cand > best) {
                best = cand;
                take = 1;
              }
            }
          }
          dp[cur] = best;
          choice[cur] = take;
        }
      }
    }
  }

  // 找满足「至少 minCount 个」的最优状态
  let bestScore = NEG;
  let bestState = { c: 0, b: 0, t: 0 };
  for (let c = minCount; c <= C; c++) {
    for (let b = 0; b <= B; b++) {
      for (let t = 0; t <= T; t++) {
        const v = dp[idx(n, c, b, t)];
        if (v > bestScore) {
          bestScore = v;
          bestState = { c, b, t };
        }
      }
    }
  }

  if (bestScore <= NEG / 2) return [];

  // 回溯
  let { c, b, t } = bestState;
  const picked: typeof items = [];
  for (let i = n; i >= 1; i--) {
    const item = items[i - 1];
    if (choice[idx(i, c, b, t)] === 1) {
      picked.push(item);
      c -= 1;
      b -= item.b;
      t -= item.t;
    }
  }
  picked.reverse();

  return picked.map(({ b: _b, t: _t, ...rest }) => rest);
}
