import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/** 会话 cookie 名 */
export const SESSION_COOKIE = "sololive_session";
/** 会话有效期（秒），30 天 */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * 用 scrypt 对密码加盐哈希，格式 `salt:hash`（均为 hex）。
 * 使用 Node 内置 crypto，零外部依赖（避免 bcrypt 原生编译在 Windows 上的麻烦）。
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/** 校验密码是否匹配存储的 `salt:hash`。 */
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}
