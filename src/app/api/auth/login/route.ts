import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { createSession, setSessionCookie, publicUser } from "@/lib/session";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体不是合法 JSON" }, { status: 400 });
  }

  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    return NextResponse.json({ error: "手机号或密码错误" }, { status: 401 });
  }
  if (!user.passwordHash) {
    return NextResponse.json(
      { error: "该手机号尚未设置密码，请用验证码登录" },
      { status: 409 }
    );
  }
  if (!verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "手机号或密码错误" }, { status: 401 });
  }

  const token = await createSession(user.id);
  await setSessionCookie(token);

  return NextResponse.json({ user: publicUser(user) });
}
