/**
 * 带固定起点的「路径 TSP」（开放回路，不返回起点）—— Held-Karp 状态压缩 DP。
 *
 * 给定距离矩阵 dist[i][j] 与起点 start，求「从 start 出发、恰好访问其余所有节点一次」
 * 的最短访问顺序。这是对「最短路径边权」的二次利用：先用 Floyd-Warshall 得到任意两点
 * 最短耗时，再用 Held-Karp 决定访问顺序，两层都落到「最短路径 + 动态规划」上。
 *
 * 返回 order（访问顺序，用节点下标表示，不含起点）与总成本 cost。
 */
export function heldKarpPath(
  dist: number[][],
  start = 0
): { order: number[]; cost: number } {
  const n = dist.length;
  const nodes: number[] = [];
  for (let i = 0; i < n; i++) {
    if (i !== start) nodes.push(i);
  }
  const k = nodes.length;
  if (k === 0) return { order: [], cost: 0 };

  const full = (1 << k) - 1;
  const dp: number[][] = Array.from({ length: 1 << k }, () =>
    new Array(k).fill(Infinity)
  );
  const parent: number[][] = Array.from({ length: 1 << k }, () =>
    new Array(k).fill(-1)
  );

  // 起点 → 第一个节点
  for (let i = 0; i < k; i++) {
    dp[1 << i][i] = dist[start][nodes[i]];
  }

  for (let mask = 1; mask <= full; mask++) {
    for (let i = 0; i < k; i++) {
      if (!(mask & (1 << i))) continue;
      const prevMask = mask ^ (1 << i);
      if (prevMask === 0) continue; // 单节点已由起点初始化
      for (let j = 0; j < k; j++) {
        if (!(prevMask & (1 << j))) continue;
        const cand = dp[prevMask][j] + dist[nodes[j]][nodes[i]];
        if (cand < dp[mask][i]) {
          dp[mask][i] = cand;
          parent[mask][i] = j;
        }
      }
    }
  }

  // 最优终点
  let end = 0;
  let best = Infinity;
  for (let i = 0; i < k; i++) {
    if (dp[full][i] < best) {
      best = dp[full][i];
      end = i;
    }
  }

  // 回溯顺序
  const orderRev: number[] = [];
  let mask = full;
  let cur = end;
  while (mask !== 0) {
    orderRev.push(nodes[cur]);
    const p = parent[mask][cur];
    if (p === -1) break;
    mask ^= 1 << cur;
    cur = p;
  }
  return { order: orderRev.reverse(), cost: best };
}
