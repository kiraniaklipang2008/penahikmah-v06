import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SubjectReport {
  id: string;
  name: string;
  color: string;
  totalLessons: number;
  completedLessons: number;
  completionPct: number;
  bestQuizScore: number | null; // percentage
}

export interface ReportData {
  subjects: SubjectReport[];
  overallCompletionPct: number;
  overallAvgQuizScore: number | null;
}

export function useReport() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["report", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<ReportData> => {
      const [subjectsRes, progressRes, quizResultsRes] = await Promise.all([
        // Subjects with their lessons (just ids)
        supabase
          .from("subjects")
          .select("id, name, color, order_index, lessons(id)")
          .order("order_index"),

        // User's completed lessons
        supabase
          .from("lesson_progress")
          .select("lesson_id")
          .eq("user_id", user!.id),

        // User's quiz results with subject mapping
        supabase
          .from("quiz_results")
          .select("score, total_questions, quizzes(subject_id)")
          .eq("user_id", user!.id),
      ]);

      if (subjectsRes.error) throw subjectsRes.error;
      if (progressRes.error) throw progressRes.error;
      if (quizResultsRes.error) throw quizResultsRes.error;

      const completedIds = new Set(
        (progressRes.data ?? []).map((p) => p.lesson_id)
      );

      // Best quiz score per subject
      const bestScoreBySubject: Record<string, number> = {};
      for (const r of quizResultsRes.data ?? []) {
        const subjectId = (r.quizzes as any)?.subject_id;
        if (!subjectId) continue;
        const pct = Math.round((r.score / r.total_questions) * 100);
        if (
          bestScoreBySubject[subjectId] === undefined ||
          pct > bestScoreBySubject[subjectId]
        ) {
          bestScoreBySubject[subjectId] = pct;
        }
      }

      const subjects: SubjectReport[] = (subjectsRes.data ?? []).map(
        (s: any) => {
          const lessons: { id: string }[] = s.lessons ?? [];
          const completed = lessons.filter((l) => completedIds.has(l.id)).length;
          const total = lessons.length;
          return {
            id: s.id,
            name: s.name,
            color: s.color,
            totalLessons: total,
            completedLessons: completed,
            completionPct: total > 0 ? Math.round((completed / total) * 100) : 0,
            bestQuizScore: bestScoreBySubject[s.id] ?? null,
          };
        }
      );

      const totalLessons = subjects.reduce((s, x) => s + x.totalLessons, 0);
      const totalCompleted = subjects.reduce(
        (s, x) => s + x.completedLessons,
        0
      );
      const overallCompletionPct =
        totalLessons > 0
          ? Math.round((totalCompleted / totalLessons) * 100)
          : 0;

      const scoresWithQuiz = subjects.filter((s) => s.bestQuizScore !== null);
      const overallAvgQuizScore =
        scoresWithQuiz.length > 0
          ? Math.round(
              scoresWithQuiz.reduce((s, x) => s + x.bestQuizScore!, 0) /
                scoresWithQuiz.length
            )
          : null;

      return { subjects, overallCompletionPct, overallAvgQuizScore };
    },
  });
}
