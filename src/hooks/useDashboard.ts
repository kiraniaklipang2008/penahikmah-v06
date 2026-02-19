import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface RecentResult {
  id: string;
  quizTitle: string;
  subjectName: string;
  scorePct: number;
  completedAt: string;
}

export interface DashboardData {
  subjectCount: number;
  lessonsCompleted: number;
  quizzesAttempted: number;
  averageScore: number | null;
  recentResults: RecentResult[];
}

export function useDashboard() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dashboard", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<DashboardData> => {
      const [subjectsRes, progressRes, quizResultsRes, recentRes] = await Promise.all([
        // Total subjects
        supabase.from("subjects").select("id", { count: "exact", head: true }),

        // Lessons completed by user
        supabase
          .from("lesson_progress")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user!.id),

        // All quiz results for stats
        supabase
          .from("quiz_results")
          .select("quiz_id, score, total_questions")
          .eq("user_id", user!.id),

        // Recent quiz results with quiz + subject names
        supabase
          .from("quiz_results")
          .select("id, score, total_questions, completed_at, quizzes(title, subjects(name))")
          .eq("user_id", user!.id)
          .order("completed_at", { ascending: false })
          .limit(5),
      ]);

      if (subjectsRes.error) throw subjectsRes.error;
      if (progressRes.error) throw progressRes.error;
      if (quizResultsRes.error) throw quizResultsRes.error;
      if (recentRes.error) throw recentRes.error;

      const allResults = quizResultsRes.data ?? [];
      const uniqueQuizIds = new Set(allResults.map((r) => r.quiz_id));
      const avgScore =
        allResults.length > 0
          ? Math.round(
              allResults.reduce((sum, r) => sum + (r.score / r.total_questions) * 100, 0) /
                allResults.length
            )
          : null;

      const recentResults: RecentResult[] = (recentRes.data ?? []).map((r: any) => ({
        id: r.id,
        quizTitle: r.quizzes?.title ?? "Kuis",
        subjectName: r.quizzes?.subjects?.name ?? "-",
        scorePct: Math.round((r.score / r.total_questions) * 100),
        completedAt: new Date(r.completed_at).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      }));

      return {
        subjectCount: subjectsRes.count ?? 0,
        lessonsCompleted: progressRes.count ?? 0,
        quizzesAttempted: uniqueQuizIds.size,
        averageScore: avgScore,
        recentResults,
      };
    },
  });
}
