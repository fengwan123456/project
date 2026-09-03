import { describe, it, expect } from "vitest";
import { heldKarpPath } from "@/lib/algorithms/tsp";

describe("TSP / Held-Karp 状态压缩 DP", () => {
  it("找到从起点出发访问所有点的最短顺序", () => {
    // 0 是起点；最优顺序 0→1→2→3，总成本 1+1+1=3
    const dist = [
      [0, 1, 100, 100],
      [1, 0, 1, 100],
      [100, 1, 0, 1],
      [100, 100, 1, 0],
    ];
    const { order, cost } = heldKarpPath(dist, 0);
    expect(order).toEqual([1, 2, 3]);
    expect(cost).toBe(3);
  });

  it("单节点退化为直接到达", () => {
    const dist = [
      [0, 7],
      [7, 0],
    ];
    const { order, cost } = heldKarpPath(dist, 0);
    expect(order).toEqual([1]);
    expect(cost).toBe(7);
  });
});
