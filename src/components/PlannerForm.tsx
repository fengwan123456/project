"use client";

import { useState, type FormEvent } from "react";
import type { Itinerary } from "@/types";

const INTEREST_OPTIONS = [
  "一人食",
  "脱口秀",
  "书店",
  "桌游",
  "羽毛球",
  "徒步",
  "探店",
  "看展",
];

interface Props {
  onResult: (it: Itinerary) => void;
  onLoading: (v: boolean) => void;
  onError: (msg: string | null) => void;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
        active
          ? "border-indigo-600 bg-indigo-600 text-white"
          : "border-zinc-300 bg-white text-zinc-600 hover:border-indigo-400"
      }`}
    >
      {children}
    </button>
  );
}

export default function PlannerForm({ onResult, onLoading, onError }: Props) {
  const [address, setAddress] = useState("上海·五角场");
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("22:30");
  const [budget, setBudget] = useState(100);
  const [indoor, setIndoor] = useState<boolean | null>(null);
  const [noAlcohol, setNoAlcohol] = useState(false);
  const [social, setSocial] = useState<"solo" | "buddy">("solo");
  const [interests, setInterests] = useState<string[]>([]);

  function toggleInterest(tag: string) {
    setInterests((prev) =>
      prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onError(null);
    onLoading(true);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: { address },
          startTime,
          endTime,
          budget,
          indoor,
          noAlcohol,
          social,
          interests,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "规划失败");
      }
      onResult(data.itinerary);
    } catch (err) {
      onError(err instanceof Error ? err.message : "规划失败，请稍后重试");
    } finally {
      onLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
    >
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">
          去哪里
        </label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="输入地点，如：上海·五角场"
          className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">
            从
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">
            到
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 flex items-center justify-between text-sm font-medium text-zinc-700">
          <span>预算</span>
          <span className="font-semibold text-indigo-600">¥{budget}</span>
        </label>
        <input
          type="range"
          min={30}
          max={300}
          step={10}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="w-full accent-indigo-600"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">
          室内还是户外
        </label>
        <div className="flex gap-2">
          <Chip active={indoor === true} onClick={() => setIndoor(true)}>
            室内
          </Chip>
          <Chip active={indoor === false} onClick={() => setIndoor(false)}>
            户外
          </Chip>
          <Chip active={indoor === null} onClick={() => setIndoor(null)}>
            无所谓
          </Chip>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          checked={noAlcohol}
          onChange={(e) => setNoAlcohol(e.target.checked)}
          className="h-4 w-4 accent-indigo-600"
        />
        不喝酒
      </label>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">
          怎么去
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSocial("solo")}
            className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
              social === "solo"
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-zinc-300 bg-white text-zinc-600"
            }`}
          >
            一个人去
          </button>
          <button
            type="button"
            onClick={() => setSocial("buddy")}
            className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
              social === "buddy"
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-zinc-300 bg-white text-zinc-600"
            }`}
          >
            找 1~3 个搭子
          </button>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">
          感兴趣（可多选）
        </label>
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((tag) => (
            <Chip
              key={tag}
              active={interests.includes(tag)}
              onClick={() => toggleInterest(tag)}
            >
              {tag}
            </Chip>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
      >
        规划我的今晚
      </button>
    </form>
  );
}
