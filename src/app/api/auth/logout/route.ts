import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth";
import { clearSessionCookie, destroySession } from "@/lib/session";

export async function POST() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await destroySession(token);
  await clearSessionCookie();

  return NextResponse.json({ ok: true });
}
