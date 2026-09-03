import type { LatLng } from "@/types";

export type CostFn = (i: number, j: number) => number;

/**
 * 全源最短路 —— Floyd-Warshall。
 * 输入节点数 n 与边权函数 cost(i,j)，返回 dist[i][j]（i 到 j 的最短路径成本）。
 * 对「起点 + 若干活动点」这种小点集（≤5）一次算全，供后续 TSP 直接取用。
 */
export function floydWarshall(n: number, cost: CostFn): number[][] {
  const dist: number[][] = [];
  for (let i = 0; i < n; i++) {
    dist[i] = [];
    for (let j = 0; j < n; j++) {
      dist[i][j] = i === j ? 0 : cost(i, j);
    }
  }
  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (dist[i][k] + dist[k][j] < dist[i][j]) {
          dist[i][j] = dist[i][k] + dist[k][j];
        }
      }
    }
  }
  return dist;
}

/**
 * 单源最短路 —— Dijkstra（邻接矩阵版，无负权边）。
 * 返回从 src 到各点的最短距离，用于在含「中转点」的图上验证最短路径。
 */
export function dijkstra(n: number, cost: CostFn, src: number): number[] {
  const dist = new Array(n).fill(Infinity);
  const visited = new Array(n).fill(false);
  dist[src] = 0;

  for (let k = 0; k < n; k++) {
    let u = -1;
    for (let i = 0; i < n; i++) {
      if (!visited[i] && (u === -1 || dist[i] < dist[u])) u = i;
    }
    if (u === -1 || dist[u] === Infinity) break;
    visited[u] = true;
    for (let v = 0; v < n; v++) {
      if (!visited[v] && dist[u] + cost(u, v) < dist[v]) {
        dist[v] = dist[u] + cost(u, v);
      }
    }
  }
  return dist;
}

/**
 * 依据坐标点集 + 移动耗时函数，构建完整图并跑 Floyd-Warshall，
 * 得到「起点 + 各活动点」之间的全源最短移动耗时矩阵。
 */
export function buildTravelMatrix(
  points: LatLng[],
  travelTime: (a: LatLng, b: LatLng) => number
): number[][] {
  return floydWarshall(points.length, (i, j) => travelTime(points[i], points[j]));
}
