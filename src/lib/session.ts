import { cookies } from "next/headers";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { PublicUser } from "@/types";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  generateSessionToken,
} from "@/lib/auth";

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};

/** 从 cookie 读取会话 token 并返回对应用户；未登录/过期返回 null。 */
export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session || session.expiresAt.getTime() < Date.now()) return null;
  return session.user;
}

/** 建一条会话记录，返回 token（调用方负责写入 cookie）。 */
export async function createSession(userId: string): Promise<string> {
  const token = generateSessionToken();
  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000),
    },
  });
  return token;
}

/** 写入会话 cookie。 */
export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, COOKIE_OPTIONS);
}

/** 清除会话 cookie。 */
export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** 删除会话记录（登出）。 */
export async function destroySession(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { token } });
}

/** 去掉敏感字段，暴露给前端。 */
export function publicUser(user: User): PublicUser {
  return { id: user.id, phone: user.phone, nickname: user.nickname };
}
