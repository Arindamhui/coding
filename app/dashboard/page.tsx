"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Trophy,
  Brain,
  BarChart3,
  Zap,
  Shuffle,
  Sparkles,
  Target,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProblemTopics } from "@/components/problems/ProblemTopics";
import { ColorChangeCard } from "@/components/color-change-card";
import { cn } from "@/lib/utils";

type Problem = {
  id: string;
  title: string;
  difficulty: number;
  topic: string | null;
  successRate?: number;
};

type Recommendation = {
  title: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  reason: string;
};

type Topic = {
  name: string;
  count: number;
};

export default function DashboardPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<
    "all" | "easy" | "medium" | "hard"
  >("all");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recsSummary, setRecsSummary] = useState("");
  const [recsLoading, setRecsLoading] = useState(false);
  const [recsLoaded, setRecsLoaded] = useState(false);

  // Fetch problems
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedTopic) params.set("topic", selectedTopic);
    if (difficultyFilter !== "all") {
      params.set("difficulty", difficultyFilter === "easy" ? "1" : difficultyFilter === "medium" ? "2" : "3");
    }
    if (searchQuery) params.set("search", searchQuery);

    fetch(`/api/problems?${params.toString()}&limit=500`)
      .then((r) => {
        if (!r.ok) {
          console.error("Failed to fetch problems:", r.status);
          return [];
        }
        return r.json();
      })
      .then((data) => {
        const problemsList = Array.isArray(data) ? data : [];
        console.log("Fetched problems:", problemsList.length);
        setProblems(problemsList);
      })
      .catch((error) => {
        console.error("Error fetching problems:", error);
        setProblems([]);
      })
      .finally(() => setLoading(false));
  }, [selectedTopic, difficultyFilter, searchQuery]);

  // Fetch topics
  useEffect(() => {
    fetch("/api/problems/topics")
      .then((r) => {
        if (!r.ok) {
          console.error("Failed to fetch topics:", r.status);
          return [];
        }
        return r.json();
      })
      .then((data) => setTopics(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.error("Error fetching topics:", error);
        setTopics([]);
      });
  }, []);

  const filteredProblems = useMemo(() => {
    let filtered = problems;
    if (difficultyFilter !== "all") {
      const target =
        difficultyFilter === "easy" ? 1 : difficultyFilter === "medium" ? 2 : 3;
      filtered = filtered.filter((p) => p.difficulty === target);
    }
    if (searchQuery) {
      filtered = filtered.filter((p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [problems, difficultyFilter, searchQuery]);

  async function fetchRecommendations() {
    if (recsLoading) return;
    setRecsLoading(true);
    try {
      const res = await fetch("/api/ai/recommend");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setRecommendations(data.recommendations || []);
      setRecsSummary(data.summary || "");
      setRecsLoaded(true);
    } catch (err) {
      console.error("Recommendation error:", err);
    } finally {
      setRecsLoading(false);
    }
  }

  function handleShuffle() {
    if (filteredProblems.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredProblems.length);
      const randomProblem = filteredProblems[randomIndex];
      window.location.href = `/dashboard/questions/${randomProblem.id}`;
    }
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] px-6 py-8 bg-[#1a1a1a]">
      <div className="w-full max-w-7xl mx-auto">
        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <ColorChangeCard
            heading="Coding Room"
            description="Race with friends in real-time coding battles"
            imgSrc="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop"
            href="/dashboard/race/create"
            colorOverlay="rgba(0,180,255,0.6)"
            icon={<Zap className="h-5 w-5 text-white" />}
          />
          <ColorChangeCard
            heading="Contests"
            description="Compete in timed challenges and climb ranks"
            imgSrc="https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&auto=format&fit=crop"
            href="/dashboard/contest"
            colorOverlay="rgba(200,50,150,0.6)"
            icon={<Trophy className="h-5 w-5 text-white" />}
          />
          <ColorChangeCard
            heading="AI Interview"
            description="Practice interviews with AI-powered feedback"
            imgSrc="https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&auto=format&fit=crop"
            href="/dashboard/interview"
            colorOverlay="rgba(240,100,50,0.6)"
            icon={<Brain className="h-5 w-5 text-white" />}
          />
          <ColorChangeCard
            heading="Analytics"
            description="Track progress and identify skill gaps"
            imgSrc="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop"
            href="/dashboard/analytics"
            colorOverlay="rgba(34,197,94,0.6)"
            icon={<BarChart3 className="h-5 w-5 text-white" />}
          />
        </div>

        {/* AI Recommendations Section */}
        <div className="mb-8">
          <div className="rounded-xl border border-purple-500/30 bg-linear-to-br from-purple-950/40 via-[#1a1a1a] to-[#1a1a1a] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-500/20 p-2">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Recommended For You</h2>
                  <p className="text-xs text-muted-foreground">AI-powered picks based on your skill gaps</p>
                </div>
              </div>
              <Button
                onClick={fetchRecommendations}
                disabled={recsLoading}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white border-0"
              >
                {recsLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing…</>
                ) : recsLoaded ? (
                  <><Sparkles className="h-4 w-4 mr-2" /> Refresh</>
                ) : (
                  <><Target className="h-4 w-4 mr-2" /> Get Recommendations</>
                )}
              </Button>
            </div>

            {recsLoaded && recsSummary && (
              <p className="text-sm text-purple-300/80 mb-4 leading-relaxed">{recsSummary}</p>
            )}

            {recsLoaded && recommendations.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-[#2d2d2d] bg-[#1f1f1f] p-4 hover:border-purple-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider",
                          rec.difficulty === "easy"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : rec.difficulty === "medium"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        )}
                      >
                        {rec.difficulty}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{rec.topic}</span>
                    </div>
                    <h4 className="text-sm font-medium text-white mb-1 leading-tight">{rec.title}</h4>
                    <p className="text-[11px] text-muted-foreground leading-snug">{rec.reason}</p>
                  </div>
                ))}
              </div>
            )}

            {!recsLoaded && !recsLoading && (
              <div className="text-center py-6 text-sm text-muted-foreground">
                Click &quot;Get Recommendations&quot; to receive personalized problem suggestions
              </div>
            )}
          </div>
        </div>

        {/* Problems Section */}
        <div className="space-y-4">
          {/* Topic Filters */}
          <ProblemTopics
            topics={topics}
            selectedTopic={selectedTopic || undefined}
            onTopicSelect={(topic) => setSelectedTopic(topic)}
          />

          {/* Search and Filters */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex-1">
              <Input
                type="search"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#1f1f1f] border-[#2d2d2d] text-foreground"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShuffle}
                className="h-9 border-[#2d2d2d]"
                title="Shuffle problems"
              >
                <Shuffle className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Difficulty Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
            <span className="text-muted-foreground mr-1">Difficulty:</span>
            {[
              { id: "all", label: "All" },
              { id: "easy", label: "Easy" },
              { id: "medium", label: "Medium" },
              { id: "hard", label: "Hard" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() =>
                  setDifficultyFilter(opt.id as typeof difficultyFilter)
                }
                className={cn(
                  "rounded-full px-3 py-1 transition-colors",
                  difficultyFilter === opt.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted/70 border border-[#2d2d2d]"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Problem List - LeetCode Style */}
          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg overflow-hidden">
            {loading && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Loading problems…
              </div>
            )}
            {!loading && filteredProblems.length === 0 && problems.length === 0 && (
              <div className="p-8 text-center text-sm text-foreground">
                <p className="mb-2">No problems found.</p>
                <p className="text-xs text-muted-foreground">
                  Run <code className="px-1 py-0.5 bg-muted rounded text-foreground">npm run seed:leetcode</code> to seed problems.
                </p>
              </div>
            )}
            {!loading && filteredProblems.length === 0 && problems.length > 0 && (
              <div className="p-8 text-center text-sm text-foreground">
                <p>No problems match your filters.</p>
                <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters.</p>
              </div>
            )}
              {!loading && filteredProblems.length > 0 && (
                <div className="overflow-x-auto">
                  <div className="min-w-full">
                    {/* Rows - LeetCode Style */}
                    {filteredProblems.map((p, index) => (
                      <Link
                        key={p.id}
                        href={`/dashboard/questions/${p.id}`}
                        className="flex items-center gap-4 px-4 py-2.5 border-b border-[#2d2d2d] hover:bg-[#1f1f1f] transition-colors group"
                      >
                        {/* Problem Number and Title */}
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <span className="text-sm text-muted-foreground font-medium w-12 shrink-0">
                            {index + 1}.
                          </span>
                          <span className="text-sm text-foreground group-hover:text-blue-400 transition-colors truncate">
                            {p.title}
                          </span>
                        </div>
                        
                        {/* Acceptance Rate */}
                        <div className="text-sm text-muted-foreground w-20 text-right shrink-0">
                          {p.successRate !== undefined && p.successRate > 0
                            ? `${p.successRate.toFixed(1)}%`
                            : "—"}
                        </div>
                        
                        {/* Difficulty Badge */}
                        <div className="w-16 shrink-0">
                          {p.difficulty === 1 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Easy
                            </span>
                          ) : p.difficulty === 2 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              Med.
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              Hard
                            </span>
                          )}
                        </div>
                        
                        {/* Lock/Star Icon Placeholder */}
                        <div className="w-6 shrink-0 flex justify-end">
                          {/* Can add lock or star icon here */}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
