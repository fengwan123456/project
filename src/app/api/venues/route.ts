import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rowToActivity } from "@/lib/activity";

export async function GET() {
  const rows = await prisma.activity.findMany();
  const activities = rows.map(rowToActivity);
  return NextResponse.json({ activities });
}
