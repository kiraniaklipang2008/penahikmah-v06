import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Option {
  id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

export interface Question {
  id: string;
  question_text: string;
  order_index: number;
  options: Option[];
}

export interface Quiz {
  id: string;
  title: string;
  duration_minutes: number;
  order_index: number;
  subject_id: string;
  subject_name: string;
  subject_color: string;
  subject_icon: string;
  questions: Question[];
  bestScore: number | null;
  totalQuestions: number;
}

export interface QuizResult {
  id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  completed_at: string;
}

export function useAssessment() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["assessment", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Fetch quizzes joined with subjects and questions/options
      const { data: quizzes, error: quizzesError } = await supabase
        .from("quizzes")
        .select(`
          id, title, duration_minutes, order_index, subject_id,
          subjects(name, color, icon),
          questions(id, question_text, order_index, options(id, option_text, is_correct, order_index))
        `)
        .order("order_index");

      if (quizzesError) throw quizzesError;

      // Fetch best scores for current user
      const { data: results, error: resultsError } = await supabase
        .from("quiz_results")
        .select("quiz_id, score, total_questions")
        .eq("user_id", user!.id);

      if (resultsError) throw resultsError;

      // Map best score per quiz
      const bestScoreMap: Record<string, number> = {};
      for (const r of results ?? []) {
        const pct = Math.round((r.score / r.total_questions) * 100);
        if (bestScoreMap[r.quiz_id] === undefined || pct > bestScoreMap[r.quiz_id]) {
          bestScoreMap[r.quiz_id] = pct;
        }
      }

      return (quizzes ?? []).map((q: any) => {
        const questions: Question[] = (q.questions ?? [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((qu: any) => ({
            id: qu.id,
            question_text: qu.question_text,
            order_index: qu.order_index,
            options: (qu.options ?? []).sort((a: any, b: any) => a.order_index - b.order_index),
          }));

        return {
          id: q.id,
          title: q.title,
          duration_minutes: q.duration_minutes,
          order_index: q.order_index,
          subject_id: q.subject_id,
          subject_name: q.subjects?.name ?? "",
          subject_color: q.subjects?.color ?? "blue",
          subject_icon: q.subjects?.icon ?? "BookOpen",
          questions,
          totalQuestions: questions.length,
          bestScore: bestScoreMap[q.id] ?? null,
        } satisfies Quiz;
      });
    },
  });
}

export function useSubmitQuiz() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      quizId,
      score,
      totalQuestions,
    }: {
      quizId: string;
      score: number;
      totalQuestions: number;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("quiz_results").insert({
        user_id: user.id,
        quiz_id: quizId,
        score,
        total_questions: totalQuestions,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessment", user?.id] });
    },
  });
}
