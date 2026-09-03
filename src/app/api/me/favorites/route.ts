import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { rowToActivity } from "@/lib/activity";
import type { FavoriteEntry } from "@/types";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    include: { activity: true },
    orderBy: { createdAt: "desc" },
  });

  const activityIds = favorites.map((f) => f.activityId);
  const checkIns = await prisma.checkIn.findMany({
    where: { userId: user.id, activityId: { in: activityIds } },
    orderBy: { createdAt: "desc" },
  });

  const countBy = new Map<string, number>();
  const lastBy = new Map<string, Date>();
  for (const c of checkIns) {
    countBy.set(c.activityId, (countBy.get(c.activityId) ?? 0) + 1);
    if (!lastBy.has(c.activityId)) lastBy.set(c.activityId, c.createdAt);
  }

  const items: FavoriteEntry[] = favorites.map((f) => ({
    activity: rowToActivity(f.activity),
    checkInCount: countBy.get(f.activityId) ?? 0,
    lastCheckInAt: lastBy.get(f.activityId)?.toISOString() ?? null,
  }));

  return NextResponse.json({ favorites: items });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体不是合法 JSON" }, { status: 400 });
  }
  const activityId = typeof body.activityId === "string" ? body.activityId : "";
  if (!activityId) {
    return NextResponse.json({ error: "缺少 activityId" }, { status: 400 });
  }

  const activity = await prisma.activity.findUnique({ where: { id: activityId } });
  if (!activity) {
    return NextResponse.json({ error: "活动不存在" }, { status: 404 });
  }

  const existing = await prisma.favorite.findUnique({
    where: { userId_activityId: { userId: user.id, activityId } },
  });

  let favorited: boolean;
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    favorited = false;
  } else {
    await prisma.favorite.create({ data: { userId: user.id, activityId } });
    favorited = true;
  }

  return NextResponse.json({ favorited });
}
