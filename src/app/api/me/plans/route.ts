import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { rowToActivity } from "@/lib/activity";
import type { HistoryEntry } from "@/types";

/** 解析 Plan.query（原始请求快照的 JSON），取出展示字段。 */
function parseQuery(raw: string): {
  startTime: string;
  endTime: string;
  budget: number;
  locationLabel: string;
} {
  let q: Record<string, unknown> = {};
  try {
    q = JSON.parse(raw);
  } catch {
    /* 快照损坏则全部兜底 */
  }

  const startTime = typeof q.startTime === "string" ? q.startTime : "";
  const endTime = typeof q.endTime === "string" ? q.endTime : "";
  const budget = typeof q.budget === "number" ? q.budget : 0;

  let locationLabel = "未知地点";
  const locRaw = q.location;
  if (typeof locRaw === "string") {
    locationLabel = locRaw || locationLabel;
  } else if (locRaw && typeof locRaw === "object") {
    const loc = locRaw as { lat?: number; lng?: number; address?: string };
    if (typeof loc.address === "string" && loc.address) {
      locationLabel = loc.address;
    } else if (typeof loc.lat === "number" && typeof loc.lng === "number") {
      locationLabel = `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`;
    }
  }

  return { startTime, endTime, budget, locationLabel };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const plans = await prisma.plan.findMany({
    where: { userId: user.id },
    include: {
      items: { include: { activity: true }, orderBy: { order: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const history: HistoryEntry[] = plans.map((p) => {
    const q = parseQuery(p.query);
    return {
      id: p.id,
      createdAt: p.createdAt.toISOString(),
      mode: p.mode === "buddy" ? "buddy" : "solo",
      startTime: q.startTime,
      endTime: q.endTime,
      budget: q.budget,
      locationLabel: q.locationLabel,
      items: p.items.map((it) => ({
        activity: rowToActivity(it.activity),
        order: it.order,
        startTime: it.startTime,
        endTime: it.endTime,
        travelMinutes: it.travelMinutes,
      })),
      totalCost: p.items.reduce(
        (sum, it) => sum + (it.activity.costMin + it.activity.costMax) / 2,
        0
      ),
    };
  });

  return NextResponse.json({ plans: history });
}
