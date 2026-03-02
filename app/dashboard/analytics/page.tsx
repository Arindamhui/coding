"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAnalyticsStore } from "@/stores/analytics-store";
import {
  Brain,
  Target,
  TrendingDown,
  Shield,
  Loader2,
  Activity,
  Eye,
  Flame,
  CheckCircle2,
  XCircle,
  Clock,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DifficultyBreakdown {
  easy: number;
  medium: number;
  hard: number;
}

interface RecentSubmission {
  problemId: number;
  problemTitle: string;
  problemDifficulty: number;
  status: string;
  language: string;
  submittedAt: string;
}

interface AnalyticsData {
  submissionsByDay: { date: string; count: number }[];
  problemsSolved: number;
  accuracy: number;
  streak: number;
  maxStreak: number;
  totalActiveDays: number;
  totalSubmissions: number;
  difficultyBreakdown: DifficultyBreakdown;
  recentSubmissions: RecentSubmission[];
}

interface WeaknessAnalytics {
  result: {
    weak_topics: { topic: string; accuracy: number; suggestion: string }[];
    behavior_patterns: {
      pattern: string;
      severity: "low" | "medium" | "high";
      description: string;
    }[];
    risk_areas: {
      area: string;
      risk_level: "low" | "medium" | "high";
      detail: string;
    }[];
    improvement_plan: {
      step: number;
      action: string;
      expected_outcome: string;
    }[];
    confidence_score: number;
  };
  stats: {
    totalAttempted: number;
    totalSolved: number;
    failedAttempts: number;
    topicAccuracy: {
      topic: string;
      accuracy: number;
      attempted: number;
      solved: number;
    }[];
  };
}

// ─── Helper: time-ago ─────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const mos = Math.floor(days / 30);
  if (mos < 12) return `${mos}mo ago`;
  return `${Math.floor(mos / 12)}y ago`;
}

// ─── Shared severity maps ────────────────────────────────────────────────────

const severityColor = {
  low: "text-green-400",
  medium: "text-amber-400",
  high: "text-red-400",
};
const severityBg = {
  low: "bg-green-400/10",
  medium: "bg-amber-400/10",
  high: "bg-red-400/10",
};

// ─── SubmissionHeatmap ────────────────────────────────────────────────────────

function SubmissionHeatmap({
  submissionsByDay,
}: {
  submissionsByDay: { date: string; count: number }[];
}) {
  const { weeks, monthLabels } = useMemo(() => {
    const map = new Map<string, number>(
      submissionsByDay.map((s) => [s.date, s.count])
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // go back 52 full weeks from the most-recent Sunday
    const endSunday = new Date(today);
    endSunday.setDate(today.getDate() - today.getDay()); // this past Sunday

    const startDate = new Date(endSunday);
    startDate.setDate(endSunday.getDate() - 52 * 7 + 1); // 52 weeks back + 1 day

    // build 53 weeks × 7 days grid
    const weeksArr: { date: Date; count: number }[][] = [];
    const cur = new Date(startDate);

    while (cur <= endSunday) {
      const week: { date: Date; count: number }[] = [];
      for (let d = 0; d < 7; d++) {
        if (cur > endSunday) break;
        const key = cur.toISOString().slice(0, 10);
        week.push({ date: new Date(cur), count: map.get(key) ?? 0 });
        cur.setDate(cur.getDate() + 1);
      }
      weeksArr.push(week);
    }

    // month labels
    const labels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weeksArr.forEach((week, col) => {
      const m = week[0].date.getMonth();
      if (m !== lastMonth) {
        labels.push({
          label: week[0].date.toLocaleString("default", { month: "short" }),
          col,
        });
        lastMonth = m;
      }
    });

    return { weeks: weeksArr, monthLabels: labels };
  }, [submissionsByDay]);

  const CELL = 14; // px per cell
  const GAP = 3;   // px gap

  const cellColor = (count: number) => {
    if (count === 0) return "bg-zinc-700";
    if (count === 1) return "bg-green-800";
    if (count <= 2) return "bg-green-600";
    if (count <= 4) return "bg-green-400";
    return "bg-green-300";
  };

  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const stride = CELL + GAP; // px per week column

  return (
    <div className="overflow-x-auto pb-2">
      <div className="inline-block min-w-max">
        {/* Month labels */}
        <div className="relative h-5 mb-1" style={{ marginLeft: 36 }}>
          {monthLabels.map((m) => (
            <span
              key={`${m.label}-${m.col}`}
              className="absolute text-[11px] font-medium text-zinc-300"
              style={{ left: m.col * stride }}
            >
              {m.label}
            </span>
          ))}
        </div>

        {/* Day labels + grid */}
        <div className="flex gap-0">
          {/* Day labels */}
          <div className="flex flex-col mr-2" style={{ gap: GAP }}>
            {DAYS.map((d, i) => (
              <div
                key={d}
                className="text-[11px] font-medium text-zinc-400 flex items-center justify-end pr-1"
                style={{ height: CELL }}
              >
                {i % 2 === 1 ? d.slice(0, 3) : ""}
              </div>
            ))}
          </div>

          {/* Week columns */}
          <div className="flex" style={{ gap: GAP }}>
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
                {week.map((cell, di) => (
                  <div
                    key={di}
                    title={`${cell.date.toISOString().slice(0, 10)}: ${cell.count} submission${cell.count !== 1 ? "s" : ""}`}
                    className={cn(
                      "rounded-sm cursor-default transition-opacity hover:opacity-80",
                      cellColor(cell.count)
                    )}
                    style={{ width: CELL, height: CELL }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-3 justify-end">
          <span className="text-[11px] text-zinc-400 mr-1">Less</span>
          {["bg-zinc-700", "bg-green-800", "bg-green-600", "bg-green-400", "bg-green-300"].map(
            (c, i) => (
              <div key={i} className={cn("rounded-sm", c)} style={{ width: CELL, height: CELL }} />
            )
          )}
          <span className="text-[11px] text-zinc-400 ml-1">More</span>
        </div>
      </div>
    </div>
  );
}

// ─── DifficultyRing (SVG donut) ───────────────────────────────────────────────

function DifficultyRing({ breakdown }: { breakdown: DifficultyBreakdown }) {
  const { easy, medium, hard } = breakdown;
  const total = easy + medium + hard;

  const R = 60;
  const stroke = 14;
  const circumference = 2 * Math.PI * R;

  // build 3 arcs: easy (teal), medium (orange), hard (red)
  const segments = [
    { value: easy, color: "#00b8a3", label: "Easy" },
    { value: medium, color: "#ffa116", label: "Medium" },
    { value: hard, color: "#ff375f", label: "Hard" },
  ];

  let offset = 0;
  const arcs = segments.map((s) => {
    const dashLen = total > 0 ? (s.value / total) * circumference : 0;
    const arc = { ...s, dashLen, dashOffset: -offset };
    offset += dashLen;
    return arc;
  });

  return (
    <div className="flex flex-col items-center gap-4">
      {/* SVG donut */}
      <div className="relative">
        <svg width={160} height={160} viewBox="0 0 160 160">
          {/* background circle */}
          <circle
            cx={80}
            cy={80}
            r={R}
            fill="none"
            stroke="#2d2d2d"
            strokeWidth={stroke}
          />
          {arcs.map((arc, i) =>
            arc.dashLen > 0 ? (
              <circle
                key={i}
                cx={80}
                cy={80}
                r={R}
                fill="none"
                stroke={arc.color}
                strokeWidth={stroke}
                strokeDasharray={`${arc.dashLen} ${circumference - arc.dashLen}`}
                strokeDashoffset={arc.dashOffset}
                strokeLinecap="butt"
                transform="rotate(-90 80 80)"
              />
            ) : null
          )}
        </svg>
        {/* center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{total}</span>
          <span className="text-xs text-muted-foreground">Solved</span>
        </div>
      </div>

      {/* breakdown bars */}
      <div className="w-full space-y-2">
        {segments.map((s) => (
          <div key={s.label} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span style={{ color: s.color }}>{s.label}</span>
              <span className="text-muted-foreground">{s.value}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: total > 0 ? `${(s.value / total) * 100}%` : "0%",
                  background: s.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "accepted")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-400">
        <CheckCircle2 className="h-3 w-3" />
        Accepted
      </span>
    );
  if (status === "time_limit_exceeded")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
        <Clock className="h-3 w-3" />
        TLE
      </span>
    );
  if (status === "wrong_answer")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-400">
        <XCircle className="h-3 w-3" />
        Wrong Answer
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-muted-foreground">
      <Minus className="h-3 w-3" />
      {status}
    </span>
  );
}

// ─── DifficultyBadge ──────────────────────────────────────────────────────────

function DifficultyBadge({ difficulty }: { difficulty: number }) {
  if (difficulty === 1)
    return <span className="text-xs text-[#00b8a3]">Easy</span>;
  if (difficulty === 2)
    return <span className="text-xs text-[#ffa116]">Medium</span>;
  return <span className="text-xs text-[#ff375f]">Hard</span>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { setStats } = useAnalyticsStore();

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const [weakness, setWeakness] = useState<WeaknessAnalytics | null>(null);
  const [weaknessLoading, setWeaknessLoading] = useState(false);
  const [weaknessLoaded, setWeaknessLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/analytics/me")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setStats({
          submissionsByDay: d.submissionsByDay ?? [],
          problemsSolved: d.problemsSolved ?? 0,
          accuracy: d.accuracy ?? 0,
          streak: d.streak ?? 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [setStats]);

  const fetchWeaknessAnalytics = async () => {
    setWeaknessLoading(true);
    try {
      const res = await fetch("/api/ai/weakness-analytics");
      if (!res.ok) throw new Error("Failed");
      const d: WeaknessAnalytics = await res.json();
      setWeakness(d);
      setWeaknessLoaded(true);
    } catch {
      setWeakness(null);
    } finally {
      setWeaknessLoading(false);
    }
  };

  const confidenceColor = (score: number) =>
    score >= 70 ? "bg-green-500" : score >= 40 ? "bg-amber-500" : "bg-red-500";

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalSubmissions = data?.totalSubmissions ?? 0;
  const totalActiveDays = data?.totalActiveDays ?? 0;
  const maxStreak = data?.maxStreak ?? 0;
  const streak = data?.streak ?? 0;
  const accuracy = data?.accuracy ?? 0;
  const problemsSolved = data?.problemsSolved ?? 0;
  const difficultyBreakdown = data?.difficultyBreakdown ?? {
    easy: 0,
    medium: 0,
    hard: 0,
  };
  const submissionsByDay = data?.submissionsByDay ?? [];
  const recentSubmissions = data?.recentSubmissions ?? [];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Your coding progress at a glance.
        </p>
      </div>

      {/* ── Analytics Bento Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-[200px]">

        {/* 1. Difficulty Ring — 2×2 tall */}
        <motion.div
          className="md:col-span-2 md:row-span-2 bg-zinc-800 border border-zinc-600 rounded-xl p-6 flex flex-col hover:border-zinc-400 transition-colors overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex-1 overflow-hidden">
            <DifficultyRing breakdown={difficultyBreakdown} />
          </div>
          <div className="mt-3">
            <h3 className="text-base font-semibold text-white">Problems Solved</h3>
            <p className="text-gray-400 text-xs mt-0.5">Breakdown by difficulty level.</p>
          </div>
        </motion.div>

        {/* 2. Current Streak — 2×1 */}
        <motion.div
          className="md:col-span-2 bg-zinc-800 border border-zinc-600 rounded-xl p-6 flex flex-col hover:border-orange-500/60 transition-colors overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 0.98 }}
        >
          <div className="flex-1 flex items-center gap-4">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Flame className="h-12 w-12 text-orange-400" />
            </motion.div>
            <div>
              <p className="text-4xl font-bold text-orange-400">{streak}</p>
              <p className="text-sm text-gray-400">{streak === 1 ? "day" : "days"}</p>
            </div>
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Current Streak</h3>
            <p className="text-gray-400 text-xs mt-0.5">Keep it going!</p>
          </div>
        </motion.div>

        {/* 3. Submission stats 2×2 — 2 col × 2 rows tall */}
        <motion.div
          className="md:col-span-2 md:row-span-2 bg-zinc-800 border border-zinc-600 rounded-xl p-6 flex flex-col hover:border-zinc-400 transition-colors overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex-1 grid grid-cols-2 gap-3">
            {[
              { label: "Total", sublabel: "Submissions", value: totalSubmissions, color: "text-green-400", bg: "bg-green-400/10", icon: <Activity className="h-5 w-5" /> },
              { label: "Solved", sublabel: "Problems", value: problemsSolved, color: "text-teal-300", bg: "bg-teal-400/10", icon: <CheckCircle2 className="h-5 w-5" /> },
              { label: "Acceptance", sublabel: "Rate", value: `${accuracy}%`, color: "text-amber-300", bg: "bg-amber-400/10", icon: <Target className="h-5 w-5" /> },
              { label: "Active", sublabel: "Days", value: totalActiveDays, color: "text-blue-300", bg: "bg-blue-400/10", icon: <Eye className="h-5 w-5" /> },
            ].map((s) => (
              <div key={s.label} className={`rounded-lg ${s.bg} border border-white/5 p-3 flex flex-col gap-1`}>
                <div className={`${s.color}`}>{s.icon}</div>
                <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
                <p className="text-[10px] text-zinc-400 leading-tight">{s.label}<br />{s.sublabel}</p>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <h3 className="text-base font-semibold text-white">Submission Stats</h3>
            <p className="text-gray-400 text-xs mt-0.5">Your activity at a glance.</p>
          </div>
        </motion.div>

        {/* 4. Max Streak — 2×1 */}
        <motion.div
          className="md:col-span-2 bg-zinc-800 border border-zinc-600 rounded-xl p-6 flex flex-col hover:border-yellow-500/60 transition-colors overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 0.98 }}
        >
          <div className="flex-1 flex items-center gap-4">
            <motion.div
              animate={{ rotate: [-5, 5, -5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Flame className="h-12 w-12 text-yellow-400" />
            </motion.div>
            <div>
              <p className="text-4xl font-bold text-yellow-400">{maxStreak}</p>
              <p className="text-sm text-gray-400">days ever</p>
            </div>
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Max Streak</h3>
            <p className="text-gray-400 text-xs mt-0.5">Your personal best.</p>
          </div>
        </motion.div>

        {/* 5. Acceptance Rate bar — 3×1 */}
        <motion.div
          className="md:col-span-3 bg-zinc-800 border border-zinc-600 rounded-xl p-6 flex flex-col hover:border-green-500/60 transition-colors overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 0.98 }}
        >
          <div className="flex-1 flex flex-col justify-center gap-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Acceptance Rate</span>
              <span className="text-white font-bold text-2xl">{accuracy}%</span>
            </div>
            <div className="h-3 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-green-500"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(accuracy, 100)}%` }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>0%</span>
              <span className="text-green-400">{totalSubmissions} total submissions</span>
              <span>100%</span>
            </div>
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Acceptance Rate</h3>
            <p className="text-gray-400 text-xs mt-0.5">Ratio of accepted to total submissions.</p>
          </div>
        </motion.div>

        {/* 6. Active Days — 3×1 */}
        <motion.div
          className="md:col-span-3 bg-zinc-800 border border-zinc-600 rounded-xl p-6 flex flex-col hover:border-blue-500/60 transition-colors overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 0.98 }}
        >
          <div className="flex-1 flex items-center gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-5xl font-bold text-blue-400">{totalActiveDays}</span>
              <span className="text-gray-400 text-sm">active days</span>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              {[
                { label: "Easy solved", value: difficultyBreakdown.easy, color: "bg-[#00b8a3]", max: Math.max(difficultyBreakdown.easy + difficultyBreakdown.medium + difficultyBreakdown.hard, 1) },
                { label: "Medium solved", value: difficultyBreakdown.medium, color: "bg-[#ffa116]", max: Math.max(difficultyBreakdown.easy + difficultyBreakdown.medium + difficultyBreakdown.hard, 1) },
                { label: "Hard solved", value: difficultyBreakdown.hard, color: "bg-[#ff375f]", max: Math.max(difficultyBreakdown.easy + difficultyBreakdown.medium + difficultyBreakdown.hard, 1) },
              ].map((b) => (
                <div key={b.label} className="space-y-0.5">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{b.label}</span>
                    <span>{b.value}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${b.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(b.value / b.max) * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.6 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Activity Overview</h3>
            <p className="text-gray-400 text-xs mt-0.5">Days you've submitted at least once.</p>
          </div>
        </motion.div>

        {/* 7. Full-width Heatmap — 6×2 */}
        <motion.div
          className="md:col-span-6 md:row-span-2 bg-zinc-800 border border-zinc-600 rounded-xl p-6 flex flex-col hover:border-green-500/40 transition-colors overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">Submission Activity</h3>
            <div className="flex items-center gap-4 text-xs text-zinc-300">
              <span>{totalSubmissions} submissions</span>
              <span>{totalActiveDays} active days</span>
              <span>Max streak {maxStreak}</span>
            </div>
          </div>
          <div className="flex-1 overflow-auto flex items-center">
            <SubmissionHeatmap submissionsByDay={submissionsByDay} />
          </div>
        </motion.div>

      </div>

      {/* ── Recent Submissions ── */}
      <motion.div
        className="bg-zinc-800 border border-zinc-600 rounded-xl overflow-hidden hover:border-zinc-400 transition-colors"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        whileHover={{ scale: 1.005 }}
      >
        <div className="p-6 border-b border-zinc-700">
          <h3 className="text-base font-semibold text-white">Recent Submissions</h3>
          <p className="text-zinc-400 text-xs mt-0.5">Your last 20 submissions across all problems.</p>
        </div>
        <div className="p-6">
          {recentSubmissions.length === 0 ? (
            <p className="text-sm text-zinc-400">No submissions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-600 text-xs text-zinc-400">
                    <th className="pb-3 text-left font-medium">Problem</th>
                    <th className="pb-3 text-left font-medium">Status</th>
                    <th className="pb-3 text-left font-medium">Language</th>
                    <th className="pb-3 text-right font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSubmissions.map((sub, i) => (
                    <tr
                      key={i}
                      className="border-b border-zinc-700/50 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 pr-4">
                        <Link
                          href={`/dashboard/questions/${sub.problemId}`}
                          className="font-medium text-zinc-100 hover:text-green-400 transition-colors"
                        >
                          {sub.problemTitle}
                        </Link>
                        <div className="mt-0.5">
                          <DifficultyBadge difficulty={sub.problemDifficulty} />
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={sub.status} />
                      </td>
                      <td className="py-3 pr-4 text-zinc-400 capitalize">
                        {sub.language}
                      </td>
                      <td className="py-3 text-right text-zinc-400">
                        {timeAgo(sub.submittedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>

      {/* ─── AI Weakness Analysis Section ─── */}
      <motion.div
        className="rounded-xl border border-purple-500/40 bg-purple-500/10 p-6 space-y-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
              <Brain className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">AI Weakness Analysis</h2>
              <p className="text-sm text-muted-foreground">
                Deep analysis of your coding patterns, weak areas, and
                improvement roadmap
              </p>
            </div>
          </div>
          <Button
            onClick={fetchWeaknessAnalytics}
            disabled={weaknessLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {weaknessLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing…
              </>
            ) : weaknessLoaded ? (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Re-analyze
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Analyze My Weaknesses
              </>
            )}
          </Button>
        </div>

        {weakness && (
          <div className="space-y-6">
            {/* Confidence Score */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground">
                Analysis Confidence
              </span>
              <div className="flex-1 h-3 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${confidenceColor(weakness.result.confidence_score)}`}
                  style={{ width: `${weakness.result.confidence_score}%` }}
                />
              </div>
              <span className="text-sm font-bold">
                {weakness.result.confidence_score}%
              </span>
            </div>

            {/* 2×2 Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Weak Topics */}
              <motion.div
                className="rounded-xl border border-rose-500/40 bg-rose-500/10 overflow-hidden"
                whileHover={{ scale: 1.02 }}
              >
              <Card className="border-0 bg-transparent">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingDown className="h-4 w-4 text-rose-400" />
                    Weak Topics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {weakness.result.weak_topics.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No significant weaknesses detected.
                    </p>
                  ) : (
                    weakness.result.weak_topics.map((t, i) => (
                      <div key={i} className="rounded-lg bg-white/5 p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{t.topic}</span>
                          <span className="text-xs text-rose-400">
                            {t.accuracy.toFixed(0)}% accuracy
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{t.suggestion}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
              </motion.div>

              {/* Behavior Patterns */}
              <motion.div
                className="rounded-xl border border-amber-500/40 bg-amber-500/10 overflow-hidden"
                whileHover={{ scale: 1.02 }}
              >
              <Card className="border-0 bg-transparent">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="h-4 w-4 text-amber-400" />
                    Behavior Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {weakness.result.behavior_patterns.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No notable patterns detected.
                    </p>
                  ) : (
                    weakness.result.behavior_patterns.map((p, i) => (
                      <div key={i} className="rounded-lg bg-white/5 p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{p.pattern}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityBg[p.severity]} ${severityColor[p.severity]}`}
                          >
                            {p.severity}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{p.description}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
              </motion.div>

              {/* Risk Areas */}
              <motion.div
                className="rounded-xl border border-orange-500/40 bg-orange-500/10 overflow-hidden"
                whileHover={{ scale: 1.02 }}
              >
              <Card className="border-0 bg-transparent">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Shield className="h-4 w-4 text-orange-400" />
                    Risk Areas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {weakness.result.risk_areas.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No risk areas identified.
                    </p>
                  ) : (
                    weakness.result.risk_areas.map((r, i) => (
                      <div key={i} className="rounded-lg bg-white/5 p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{r.area}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityBg[r.risk_level]} ${severityColor[r.risk_level]}`}
                          >
                            {r.risk_level}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{r.detail}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
              </motion.div>

              {/* Improvement Plan */}
              <motion.div
                className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 overflow-hidden"
                whileHover={{ scale: 1.02 }}
              >
              <Card className="border-0 bg-transparent">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="h-4 w-4 text-emerald-400" />
                    Improvement Plan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {weakness.result.improvement_plan.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No improvement plan generated yet.
                    </p>
                  ) : (
                    weakness.result.improvement_plan.map((s, i) => (
                      <div key={i} className="rounded-lg bg-white/5 p-3 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                            {s.step}
                          </span>
                          <span className="text-sm font-medium">{s.action}</span>
                        </div>
                        <p className="text-xs text-muted-foreground pl-7">
                          → {s.expected_outcome}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
              </motion.div>
            </div>

            {/* Topic Accuracy Breakdown */}
            {weakness.stats.topicAccuracy.length > 0 && (
              <motion.div
                className="rounded-xl border border-purple-500/40 bg-purple-500/10 overflow-hidden"
                whileHover={{ scale: 1.005 }}
              >
              <Card className="border-0 bg-transparent">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Eye className="h-4 w-4 text-purple-400" />
                    Topic Accuracy Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {weakness.stats.topicAccuracy
                    .sort((a, b) => a.accuracy - b.accuracy)
                    .map((t, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>
                            {t.topic}{" "}
                            <span className="text-xs text-muted-foreground">
                              ({t.solved}/{t.attempted})
                            </span>
                          </span>
                          <span className="font-medium">
                            {t.accuracy.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              t.accuracy >= 70
                                ? "bg-green-500"
                                : t.accuracy >= 40
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${Math.max(t.accuracy, 2)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
              </motion.div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
