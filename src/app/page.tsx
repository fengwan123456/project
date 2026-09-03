"use client";

import { useEffect, useMemo, useState } from "react";
import PlannerForm from "@/components/PlannerForm";
import ItineraryCard from "@/components/ItineraryCard";
import AmapView from "@/components/AmapView";
import AuthBar from "@/components/AuthBar";
import FavoritesPanel from "@/components/FavoritesPanel";
import HistoryPanel from "@/components/HistoryPanel";
import type { FavoriteEntry, HistoryEntry, Itinerary, PublicUser } from "@/types";

export default function Home() {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [user, setUser] = useState<PublicUser | null>(null);
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);
  const [checkInCounts, setCheckInCounts] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const favoritedIds = useMemo(
    () => new Set(favorites.map((f) => f.activity.id)),
    [favorites]
  );

  async function refreshFavorites() {
    try {
      const res = await fetch("/api/me/favorites");
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data.favorites)) return;
      setFavorites(data.favorites);
      // 合并打卡次数（不覆盖本地已点过的计数）
      setCheckInCounts((prev) => {
        const next = { ...prev };
        for (const f of data.favorites as FavoriteEntry[]) {
          next[f.activity.id] = Math.max(next[f.activity.id] ?? 0, f.checkInCount);
        }
        return next;
      });
    } catch {
      /* 静默 */
    }
  }

  async function refreshHistory() {
    try {
      const res = await fetch("/api/me/plans");
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.plans)) setHistory(data.plans);
    } catch {
      /* 静默 */
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!data.user) return;
        setUser(data.user);
        await refreshFavorites();
        await refreshHistory();
      } catch {
        /* 会话恢复失败不打扰 */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAuth(u: PublicUser | null) {
    setUser(u);
    if (u) {
      await refreshFavorites();
      await refreshHistory();
    } else {
      setFavorites([]);
      setCheckInCounts({});
      setHistory([]);
    }
  }

  async function handleToggleFavorite(activityId: string) {
    if (!user) return;
    try {
      const res = await fetch("/api/me/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId }),
      });
      if (res.ok) await refreshFavorites();
    } catch {
      /* 静默 */
    }
  }

  async function handleCheckIn(activityId: string) {
    if (!user) return;
    try {
      const res = await fetch("/api/me/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId }),
      });
      const data = await res.json();
      if (res.ok && typeof data.checkInCount === "number") {
        setCheckInCounts((prev) => ({ ...prev, [activityId]: data.checkInCount }));
        await refreshFavorites();
      }
    } catch {
      /* 静默 */
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-8 sm:px-6">
      <header className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">
              S
            </span>
            <h1 className="text-2xl font-bold tracking-tight">sololive</h1>
          </div>
          <AuthBar user={user} onAuth={handleAuth} />
        </div>
        <p className="mt-2 max-w-lg text-sm leading-6 text-zinc-500">
          一个人也好玩。告诉我今晚的时间、地点和预算，帮你把「吃 → 玩 → 收尾」串成一段不用等人的行程。
        </p>
      </header>

      <div className="grid flex-1 gap-6 lg:grid-cols-[380px_1fr]">
        <PlannerForm
          onResult={setItinerary}
          onLoading={setLoading}
          onError={setError}
        />

        <section className="min-w-0">
          {loading && (
            <div className="flex h-40 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-sm text-zinc-500">
              正在规划你的行程…
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-600">
              {error}
            </div>
          )}

          {!loading && !error && !itinerary && (
            <div className="flex h-full min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white/60 text-center text-zinc-400">
              <p className="text-3xl">🗺️</p>
              <p className="mt-3 text-sm">填好左侧条件，点「规划我的今晚」</p>
            </div>
          )}

          {!loading && itinerary && (
            <div className="space-y-6">
              <ItineraryCard
                itinerary={itinerary}
                user={user}
                favoritedIds={favoritedIds}
                checkInCounts={checkInCounts}
                onToggleFavorite={handleToggleFavorite}
                onCheckIn={handleCheckIn}
              />
              <AmapView itinerary={itinerary} />
            </div>
          )}
        </section>
      </div>

      <div className="mt-8 space-y-6">
        <FavoritesPanel
          user={user}
          favorites={favorites}
          onCheckIn={handleCheckIn}
        />
        <HistoryPanel user={user} history={history} />
      </div>
    </main>
  );
}
