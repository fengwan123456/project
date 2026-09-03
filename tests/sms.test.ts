import { describe, it, expect } from "vitest";
import { generateSmsCode } from "@/lib/sms";

describe("sms 验证码生成", () => {
  it("返回 6 位数字字符串", () => {
    for (let i = 0; i < 100; i++) {
      expect(generateSmsCode()).toMatch(/^\d{6}$/);
    }
  });

  it("多次调用结果不同", () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateSmsCode()));
    // 50 次里几乎不可能全部相同；>1 即证明随机
    expect(codes.size).toBeGreaterThan(1);
  });
});
