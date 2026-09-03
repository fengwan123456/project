import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, setSessionCookie, publicUser } from "@/lib/session";

const PHONE_RE = /^1\d{10}$/;
const CODE_RE = /^\d{6}$/;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体不是合法 JSON" }, { status: 400 });
  }

  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";

  if (!PHONE_RE.test(phone)) {
    return NextResponse.json({ error: "请输入 11 位手机号" }, { status: 400 });
  }
  if (!CODE_RE.test(code)) {
    return NextResponse.json({ error: "验证码为 6 位数字" }, { status: 400 });
  }

  const record = await prisma.smsCode.findFirst({
    where: { phone, consumed: false },
    orderBy: { createdAt: "desc" },
  });
  const invalid =
    !record ||
    record.expiresAt.getTime() < Date.now() ||
    record.code !== code;
  if (invalid) {
    return NextResponse.json({ error: "验证码错误或已过期" }, { status: 401 });
  }

  // 一次性：标记已消费
  await prisma.smsCode.update({
    where: { id: record.id },
    data: { consumed: true },
  });

  // 验证码登录即注册：新手机号自动建号（无密码）
  let user = await prisma.user.findUnique({ where: { phone } });
  let isNewUser = false;
  if (!user) {
    user = await prisma.user.create({
      data: { phone, passwordHash: null },
    });
    isNewUser = true;
  }

  const token = await createSession(user.id);
  await setSessionCookie(token);

  return NextResponse.json({ user: publicUser(user), isNewUser });
}
