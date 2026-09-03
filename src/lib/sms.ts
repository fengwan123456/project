import { randomInt } from "node:crypto";

/** 验证码有效期（秒），5 分钟 */
export const SMS_CODE_TTL_SECONDS = 60 * 5;
/** 同号两次发送的最小间隔（秒），60 秒 */
export const SMS_SEND_INTERVAL_SECONDS = 60;

/** 生成 6 位数字验证码（补零，如 `042317`）。 */
export function generateSmsCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/**
 * 发送验证码。当前为「开发模式」：不接真实短信服务商，验证码打印到服务端
 * 控制台，并在非生产环境返回 devCode 供前端直接展示/回填。
 *
 * 接入真实服务商（阿里云/腾讯云）时，只替换本函数实现即可：
 *   - 阿里云短信：用 AccessKeyId/Secret 做 HMAC 签名，调 dysmsapi SendSms；
 *   - 腾讯云短信：用 SecretId/SecretKey 调 sms SendSms。
 * 生产环境请务必删除返回 devCode 的分支。
 */
export async function sendSmsCode(
  phone: string,
  code: string
): Promise<{ devCode?: string }> {
  console.log(`[sms:dev] 向 ${phone} 发送验证码：${code}`);

  if (process.env.NODE_ENV !== "production") {
    return { devCode: code };
  }
  return {};
}
