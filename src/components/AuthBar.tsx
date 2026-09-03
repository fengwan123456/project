"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { PublicUser } from "@/types";

interface Props {
  user: PublicUser | null;
  onAuth: (u: PublicUser | null) => void;
}

function maskPhone(phone: string): string {
  return phone.length === 11 ? `${phone.slice(0, 3)}****${phone.slice(7)}` : phone;
}

const PHONE_RE = /^1\d{10}$/;

export default function AuthBar({ user, onAuth }: Props) {
  const [tab, setTab] = useState<"sms" | "password">("sms");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [devHint, setDevHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  async function handleSendCode() {
    if (!PHONE_RE.test(phone)) {
      setError("请输入 11 位手机号");
      return;
    }
    setError(null);
    setDevHint(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "发送失败");
      setCountdown(60);
      if (typeof data.devCode === "string") {
        setCode(data.devCode);
        setDevHint(`开发模式验证码已自动填入：${data.devCode}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "发送失败");
    } finally {
      setBusy(false);
    }
  }

  async function handleSmsLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/sms/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "登录失败");
      onAuth(data.user);
      setPhone("");
      setCode("");
      setDevHint(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setBusy(false);
    }
  }

  async function handlePasswordLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "登录失败");
      onAuth(data.user);
      setPhone("");
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    onAuth(null);
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-600">👤 {maskPhone(user.phone)}</span>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100"
        >
          退出
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-stretch gap-1.5">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="flex rounded-lg border border-zinc-200 p-0.5">
          <button
            type="button"
            onClick={() => {
              setTab("sms");
              setError(null);
            }}
            className={`rounded-md px-2.5 py-1 text-xs font-medium ${
              tab === "sms" ? "bg-indigo-600 text-white" : "text-zinc-500"
            }`}
          >
            验证码登录
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("password");
              setError(null);
            }}
            className={`rounded-md px-2.5 py-1 text-xs font-medium ${
              tab === "password" ? "bg-indigo-600 text-white" : "text-zinc-500"
            }`}
          >
            密码登录
          </button>
        </div>

        {tab === "sms" ? (
          <form onSubmit={handleSmsLogin} className="flex items-center gap-2">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="手机号"
              inputMode="numeric"
              maxLength={11}
              className="w-28 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
            />
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="验证码"
              inputMode="numeric"
              maxLength={6}
              className="w-20 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={busy || countdown > 0}
              className="rounded-lg border border-indigo-200 px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
            >
              {countdown > 0 ? `${countdown}s` : "获取验证码"}
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {busy ? "…" : "登录 / 注册"}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordLogin} className="flex items-center gap-2">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="手机号"
              inputMode="numeric"
              maxLength={11}
              className="w-28 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="密码"
              className="w-24 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {busy ? "…" : "登录"}
            </button>
          </form>
        )}
      </div>
      {devHint && <p className="text-right text-xs text-emerald-600">{devHint}</p>}
      {error && <p className="text-right text-xs text-rose-600">{error}</p>}
    </div>
  );
}
