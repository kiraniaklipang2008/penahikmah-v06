import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface QuizFeedback {
  id: string;
  quiz_result_id: string;
  mentor_id: string;
  comment: string;
  adjusted_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface QuizResultWithStudent {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  total_questions: number;
  completed_at: string;
  student_name: string;
  quiz_title: string;
  subject_name: string;
  feedback: QuizFeedback | null;
}

// Fetch feedback for a specific quiz result (student view)
export function useQuizFeedback(quizResultId: string | null) {
  return useQuery({
    queryKey: ["quiz-feedback", quizResultId],
    enabled: !!quizResultId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_feedback")
        .select("*")
        .eq("quiz_result_id", quizResultId!)
        .maybeSingle();
      if (error) throw error;
      return data as QuizFeedback | null;
    },
  });
}

// Fetch all feedback for current student's results
export function useMyFeedbacks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-feedbacks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Get user's quiz results
      const { data: results, error: resErr } = await supabase
        .from("quiz_results")
        .select("id")
        .eq("user_id", user!.id);
      if (resErr) throw resErr;
      if (!results?.length) return {};

      const resultIds = results.map((r) => r.id);
      const { data: feedbacks, error: fbErr } = await supabase
        .from("quiz_feedback")
        .select("*")
        .in("quiz_result_id", resultIds);
      if (fbErr) throw fbErr;

      const map: Record<string, QuizFeedback> = {};
      for (const fb of feedbacks ?? []) {
        map[fb.quiz_result_id] = fb as QuizFeedback;
      }
      return map;
    },
  });
}

// Fetch all quiz results for guru feedback view
export function useAllQuizResults() {
  return useQuery({
    queryKey: ["all-quiz-results"],
    queryFn: async () => {
      // We need quiz_results with student profile and quiz info
      // Since we can't join profiles via RLS easily, use the RBAC edge function approach
      const { data, error } = await supabase.functions.invoke("rbac", {
        body: { action: "get_quiz_results_for_feedback" },
      });
      if (error) throw new Error(error.message ?? "Failed to fetch results");
      if (data?.error) throw new Error(data.error);
      return data.results as QuizResultWithStudent[];
    },
  });
}

// Upsert feedback (guru action)
export function useUpsertFeedback() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      quizResultId,
      comment,
      adjustedScore,
    }: {
      quizResultId: string;
      comment: string;
      adjustedScore: number | null;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("quiz_feedback")
        .upsert(
          {
            quiz_result_id: quizResultId,
            mentor_id: user.id,
            comment,
            adjusted_score: adjustedScore,
          },
          { onConflict: "quiz_result_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-quiz-results"] });
      queryClient.invalidateQueries({ queryKey: ["quiz-feedback"] });
      queryClient.invalidateQueries({ queryKey: ["my-feedbacks"] });
    },
  });
}
