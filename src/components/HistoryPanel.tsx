"use client";

import type { HistoryEntry, PublicUser } from "@/types";

interface Props {
  user: PublicUser | null;
  history: HistoryEntry[];
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function HistoryPanel({ user, history }: Props) {
  if (!user) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-6 text-center text-sm text-zinc-400">
        🕘 登录后，你规划过的每一次行程都会留在这里
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-zinc-900">我的历史行程</h2>
      <p className="mb-4 mt-0.5 text-xs text-zinc-400">回看你规划过的每一段「一个人也好玩」</p>

      {history.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-400">
          还没有历史行程，去左侧规划你的今晚吧
        </p>
      ) : (
        <ul className="space-y-4">
          {history.map((h) => (
            <li
              key={h.id}
              className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-4"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-medium text-zinc-500">{formatDate(h.createdAt)}</span>
                <span
                  className={`rounded-full px-2 py-0.5 font-medium ${
                    h.mode === "solo"
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {h.mode === "solo" ? "一个人去" : "找搭子"}
                </span>
                <span className="text-zinc-400">{h.locationLabel}</span>
                <span className="text-zinc-400">
                  {h.startTime || "--:--"}–{h.endTime || "--:--"}
                </span>
                <span className="ml-auto font-medium text-zinc-600">
                  约 ¥{Math.round(h.totalCost)}
                </span>
              </div>

              <ol className="space-y-1.5">
                {h.items.map((it) => (
                  <li key={it.order} className="flex items-center gap-2 text-sm">
                    <span className="w-12 shrink-0 font-mono text-xs text-indigo-600">
                      {it.startTime}
                    </span>
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300" />
                    <span className="min-w-0 truncate">
                      <span className="text-zinc-400">{it.activity.category}</span>
                      <span className="mx-1 text-zinc-300">·</span>
                      <span className="font-medium text-zinc-800">{it.activity.name}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
