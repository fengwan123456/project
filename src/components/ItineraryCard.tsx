"use client";

import type { Itinerary, PublicUser } from "@/types";

interface Props {
  itinerary: Itinerary;
  user: PublicUser | null;
  favoritedIds: Set<string>;
  checkInCounts: Record<string, number>;
  onToggleFavorite: (activityId: string) => void;
  onCheckIn: (activityId: string) => void;
}

export default function ItineraryCard({
  itinerary,
  user,
  favoritedIds,
  checkInCounts,
  onToggleFavorite,
  onCheckIn,
}: Props) {
  const isBuddy = itinerary.mode === "buddy";

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
        <div>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
              isBuddy
                ? "bg-amber-100 text-amber-700"
                : "bg-indigo-100 text-indigo-700"
            }`}
          >
            {isBuddy ? "👥 找搭子" : "🧍 一个人去"}
          </span>
          <h2 className="mt-2 text-lg font-bold text-zinc-900">你的今晚</h2>
        </div>
        <div className="text-right text-sm">
          <div className="font-semibold text-zinc-900">
            约 ¥{itinerary.totalCost}
          </div>
          <div className="text-zinc-400">{itinerary.totalDurationMin} 分钟</div>
        </div>
      </div>

      <ol className="divide-y divide-zinc-100">
        {itinerary.items.map((it, i) => {
          const count = checkInCounts[it.activity.id] ?? 0;
          const favorited = favoritedIds.has(it.activity.id);
          return (
            <li key={it.activity.id} className="flex gap-3 px-5 py-4">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                  {i + 1}
                </div>
                {i < itinerary.items.length - 1 && (
                  <div className="mt-1 w-px flex-1 bg-zinc-200" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-zinc-900">
                    {it.startTime} – {it.endTime}
                  </span>
                  <span className="text-xs text-zinc-400">约 ¥{it.cost}</span>
                </div>
                <p className="mt-0.5 text-sm text-zinc-800">{it.activity.name}</p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  {it.activity.category} · {it.activity.address}
                </p>
                {i > 0 && it.travelMinutes > 0 && (
                  <p className="mt-1 text-xs text-zinc-400">
                    🚶 到达约 {it.travelMinutes} 分钟
                  </p>
                )}
              </div>

              {user && (
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(it.activity.id)}
                    className={`rounded-lg px-2 py-1 text-xs ${
                      favorited
                        ? "text-rose-600 hover:bg-rose-50"
                        : "text-zinc-400 hover:bg-zinc-100"
                    }`}
                    title={favorited ? "取消收藏" : "收藏"}
                  >
                    {favorited ? "♥ 已收藏" : "♡ 收藏"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onCheckIn(it.activity.id)}
                    className="rounded-lg bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                  >
                    {count > 0 ? `打卡 · ${count}` : "打卡"}
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {isBuddy && (
        <div className="border-t border-zinc-100 bg-amber-50 px-5 py-4">
          <button className="w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600">
            发布找搭子帖（1~3 人）
          </button>
          <p className="mt-2 text-center text-xs text-amber-600">
            MVP 阶段仅记录找搭子意图，实时匹配即将上线
          </p>
        </div>
      )}
    </div>
  );
}
