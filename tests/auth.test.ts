import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  generateSessionToken,
} from "@/lib/auth";

describe("auth 密码哈希", () => {
  it("正确密码通过、错误密码拒绝", () => {
    const stored = hashPassword("secret123");
    expect(stored).toContain(":");
    expect(verifyPassword("secret123", stored)).toBe(true);
    expect(verifyPassword("wrong-pass", stored)).toBe(false);
  });

  it("同一密码两次哈希盐不同（结果不同）", () => {
    const a = hashPassword("secret123");
    const b = hashPassword("secret123");
    expect(a).not.toBe(b);
  });

  it("非法存储格式返回 false", () => {
    expect(verifyPassword("secret123", "not-a-valid-hash")).toBe(false);
  });
});

describe("auth 会话 token", () => {
  it("token 随机且长度足够（64 位 hex）", () => {
    const t1 = generateSessionToken();
    const t2 = generateSessionToken();
    expect(t1).not.toBe(t2);
    expect(t1).toMatch(/^[0-9a-f]{64}$/);
  });
});
