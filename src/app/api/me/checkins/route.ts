import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

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

  await prisma.checkIn.create({ data: { userId: user.id, activityId } });

  const checkInCount = await prisma.checkIn.count({
    where: { userId: user.id, activityId },
  });
  const last = await prisma.checkIn.findFirst({
    where: { userId: user.id, activityId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    checkInCount,
    lastCheckInAt: last?.createdAt.toISOString() ?? null,
  });
}
