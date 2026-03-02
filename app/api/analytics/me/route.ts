import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { submissions, problems } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // All submissions (lightweight)
  const all = await db
    .select({
      id: submissions.id,
      problemId: submissions.problemId,
      status: submissions.status,
      submittedAt: submissions.submittedAt,
    })
    .from(submissions)
    .where(eq(submissions.userId, user.id));

  const accepted = all.filter((s) => s.status === "accepted");
  const accuracy = all.length > 0 ? (accepted.length / all.length) * 100 : 0;

  // Submissions per day map
  const byDay = new Map<string, number>();
  for (const s of all) {
    const date =
      s.submittedAt instanceof Date
        ? s.submittedAt.toISOString().slice(0, 10)
        : String(s.submittedAt).slice(0, 10);
    byDay.set(date, (byDay.get(date) ?? 0) + 1);
  }
  const submissionsByDay = Array.from(byDay.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Current streak
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if ((byDay.get(key) ?? 0) > 0) streak++;
    else break;
  }

  // Max streak ever
  const sortedDays = Array.from(byDay.keys()).sort();
  let maxStreak = 0;
  let cur = 0;
  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) {
      cur = 1;
    } else {
      const prev = new Date(sortedDays[i - 1]);
      const curr = new Date(sortedDays[i]);
      const diff = (curr.getTime() - prev.getTime()) / 86400000;
      cur = diff === 1 ? cur + 1 : 1;
    }
    maxStreak = Math.max(maxStreak, cur);
  }

  // Difficulty breakdown (accepted, unique problems)
  const withDifficulty = await db
    .select({
      problemId: submissions.problemId,
      status: submissions.status,
      difficulty: problems.difficulty,
    })
    .from(submissions)
    .innerJoin(problems, eq(submissions.problemId, problems.id))
    .where(eq(submissions.userId, user.id));

  const solvedEasy = new Set<string>();
  const solvedMedium = new Set<string>();
  const solvedHard = new Set<string>();
  for (const s of withDifficulty) {
    if (s.status !== "accepted") continue;
    if (s.difficulty === 1) solvedEasy.add(s.problemId);
    else if (s.difficulty === 2) solvedMedium.add(s.problemId);
    else if (s.difficulty === 3) solvedHard.add(s.problemId);
  }

  // Recent submissions with problem info
  const recentRaw = await db
    .select({
      id: submissions.id,
      status: submissions.status,
      language: submissions.language,
      submittedAt: submissions.submittedAt,
      problemTitle: problems.title,
      problemDifficulty: problems.difficulty,
      problemId: submissions.problemId,
    })
    .from(submissions)
    .innerJoin(problems, eq(submissions.problemId, problems.id))
    .where(eq(submissions.userId, user.id))
    .orderBy(desc(submissions.submittedAt))
    .limit(20);

  const problemsSolved = solvedEasy.size + solvedMedium.size + solvedHard.size;

  return NextResponse.json({
    submissionsByDay,
    problemsSolved,
    accuracy: Math.round(accuracy * 10) / 10,
    streak,
    maxStreak,
    totalActiveDays: byDay.size,
    totalSubmissions: all.length,
    difficultyBreakdown: {
      easy: solvedEasy.size,
      medium: solvedMedium.size,
      hard: solvedHard.size,
    },
    recentSubmissions: recentRaw,
  });
}
