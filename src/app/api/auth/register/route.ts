import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { createSession, setSessionCookie, publicUser } from "@/lib/session";

const PHONE_RE = /^1\d{10}$/;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体不是合法 JSON" }, { status: 400 });
  }

  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!PHONE_RE.test(phone)) {
    return NextResponse.json({ error: "请输入 11 位手机号" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "密码至少 6 位" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    return NextResponse.json({ error: "该手机号已注册" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: { phone, passwordHash: hashPassword(password) },
  });

  const token = await createSession(user.id);
  await setSessionCookie(token);

  return NextResponse.json({ user: publicUser(user) }, { status: 201 });
}
