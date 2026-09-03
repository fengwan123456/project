"use client";

import type { FavoriteEntry, PublicUser } from "@/types";

interface Props {
  user: PublicUser | null;
  favorites: FavoriteEntry[];
  onCheckIn: (activityId: string) => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return "还没打过卡";
  const d = new Date(iso);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export default function FavoritesPanel({ user, favorites, onCheckIn }: Props) {
  if (!user) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-6 text-center text-sm text-zinc-400">
        🔖 登录后可以收藏喜欢的店、记录去过几次
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-zinc-900">我的收藏</h2>
      <p className="mb-4 mt-0.5 text-xs text-zinc-400">
        记录你喜欢吃的店和去过的次数
      </p>

      {favorites.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-400">
          还没有收藏，规划一段行程后点「♡ 收藏」吧
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {favorites.map((f) => (
            <li
              key={f.activity.id}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900">
                  {f.activity.name}
                </p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  {f.activity.category} · 去过 {f.checkInCount} 次 · 上次{" "}
                  {formatDate(f.lastCheckInAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onCheckIn(f.activity.id)}
                className="shrink-0 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
              >
                打卡
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
