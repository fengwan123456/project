import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generateSmsCode,
  sendSmsCode,
  SMS_CODE_TTL_SECONDS,
  SMS_SEND_INTERVAL_SECONDS,
} from "@/lib/sms";

const PHONE_RE = /^1\d{10}$/;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体不是合法 JSON" }, { status: 400 });
  }

  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  if (!PHONE_RE.test(phone)) {
    return NextResponse.json({ error: "请输入 11 位手机号" }, { status: 400 });
  }

  // 发送频率限制：同号最近一次发送未满间隔则拒绝
  const latest = await prisma.smsCode.findFirst({
    where: { phone },
    orderBy: { createdAt: "desc" },
  });
  if (
    latest &&
    Date.now() - latest.createdAt.getTime() < SMS_SEND_INTERVAL_SECONDS * 1000
  ) {
    return NextResponse.json({ error: "发送太频繁，请稍后再试" }, { status: 429 });
  }

  const code = generateSmsCode();
  const expiresAt = new Date(Date.now() + SMS_CODE_TTL_SECONDS * 1000);

  // 清掉该号旧验证码，避免累积
  await prisma.smsCode.deleteMany({ where: { phone } });
  await prisma.smsCode.create({ data: { phone, code, expiresAt } });

  const sent = await sendSmsCode(phone, code);

  return NextResponse.json({ ok: true, ...sent });
}
