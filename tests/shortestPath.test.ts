import { describe, it, expect } from "vitest";
import { floydWarshall, dijkstra } from "@/lib/algorithms/shortestPath";

describe("最短路径算法", () => {
  // 0→2 直达 10，但 0→1→2 = 6，更短
  const cost = (i: number, j: number) => {
    const m = [
      [0, 3, 10, 5],
      [3, 0, 3, 8],
      [10, 3, 0, 2],
      [5, 8, 2, 0],
    ];
    return m[i][j];
  };

  it("Floyd-Warshall 找到经中转点的最短路径", () => {
    const fw = floydWarshall(4, cost);
    expect(fw[0][2]).toBe(6); // 0→1→2
    expect(fw[0][3]).toBe(5); // 直达
    expect(fw[3][1]).toBe(5); // 3→2→1 = 2+3
  });

  it("Dijkstra 与 Floyd-Warshall 结果一致", () => {
    const fw = floydWarshall(4, cost);
    const d = dijkstra(4, cost, 0);
    expect(d[2]).toBe(fw[0][2]);
    expect(d[3]).toBe(fw[0][3]);
    expect(d[1]).toBe(3);
  });
});
