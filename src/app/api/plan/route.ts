import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rowToActivity } from "@/lib/activity";
import { planItinerary } from "@/lib/algorithms/planner";
import { geocode, buildAmapTravelTime } from "@/lib/amap";
import { getCurrentUser } from "@/lib/session";
import { SEED_CENTER } from "@/lib/seed-data/venues";
import type { LatLng, PlanQuery } from "@/types";

function normalizeQuery(body: Record<string, unknown>): PlanQuery {
  const social = body.social === "buddy" ? "buddy" : "solo";
  return {
    location:
      (body.location as PlanQuery["location"]) ?? { address: "上海·五角场" },
    timeWindow: {
      start: typeof body.startTime === "string" ? body.startTime : "18:00",
      end: typeof body.endTime === "string" ? body.endTime : "22:30",
    },
    budget: Number(body.budget) || 100,
    indoor: typeof body.indoor === "boolean" ? body.indoor : null,
    noAlcohol: !!body.noAlcohol,
    social,
    interests: Array.isArray(body.interests) ? (body.interests as string[]) : [],
  };
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体不是合法 JSON" }, { status: 400 });
  }

  const query = normalizeQuery(body);

  // 起点坐标：优先用传入坐标，其次按地址地理编码，最后兜底种子中心
  let origin: LatLng = SEED_CENTER;
  const loc = query.location;
  if ("lat" in loc && typeof loc.lat === "number") {
    origin = { lat: loc.lat, lng: loc.lng };
  } else if ("address" in loc && loc.address) {
    const geo = await geocode(loc.address);
    if (geo) origin = geo;
  }

  const rows = await prisma.activity.findMany();
  const candidates = rows.map(rowToActivity);

  // 先用 haversine 粗排选出活动（DP 选择不依赖 travelTime），
  // 再对「起点 + 被选活动」预取真实耗时并重排定序，得到最终行程。
  const first = planItinerary(candidates, { ...query, location: origin });
  const points: LatLng[] = [
    origin,
    ...first.items.map((it) => ({ lat: it.activity.lat, lng: it.activity.lng })),
  ];
  const realTravel = await buildAmapTravelTime(points);
  const itinerary = realTravel
    ? planItinerary(candidates, { ...query, location: origin }, { travelTime: realTravel })
    : first;

  // 持久化（Plan + PlanItem）；登录用户归户到 userId（匿名则为 null）
  const user = await getCurrentUser();
  const plan = await prisma.plan.create({
    data: {
      mode: query.social,
      query: JSON.stringify(body),
      userId: user?.id ?? null,
      items: {
        create: itinerary.items.map((it) => ({
          activityId: it.activity.id,
          order: it.order,
          startTime: it.startTime,
          endTime: it.endTime,
          travelMinutes: it.travelMinutes,
        })),
      },
    },
  });

  return NextResponse.json({ planId: plan.id, itinerary });
}
