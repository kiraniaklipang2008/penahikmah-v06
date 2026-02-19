import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Lesson {
  id: string;
  title: string;
  duration_minutes: number;
  order_index: number;
  completed: boolean;
}

export interface Subject {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  order_index: number;
  lessons: Lesson[];
  completedCount: number;
}

export function useCourses() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["courses", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Fetch subjects + lessons
      const { data: subjects, error: subjectsError } = await supabase
        .from("subjects")
        .select("*, lessons(id, title, duration_minutes, order_index)")
        .order("order_index");

      if (subjectsError) throw subjectsError;

      // Fetch completed lessons for current user
      const { data: progress, error: progressError } = await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", user!.id);

      if (progressError) throw progressError;

      const completedIds = new Set((progress ?? []).map((p) => p.lesson_id));

      return (subjects ?? []).map((s: any) => {
        const lessons: Lesson[] = (s.lessons ?? [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((l: any) => ({ ...l, completed: completedIds.has(l.id) }));

        return {
          id: s.id,
          name: s.name,
          description: s.description,
          icon: s.icon,
          color: s.color,
          order_index: s.order_index,
          lessons,
          completedCount: lessons.filter((l) => l.completed).length,
        } satisfies Subject;
      });
    },
  });
}

export function useToggleLesson() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ lessonId, completed }: { lessonId: string; completed: boolean }) => {
      if (!user) throw new Error("Not authenticated");

      if (completed) {
        // Mark as incomplete — delete the row
        const { error } = await supabase
          .from("lesson_progress")
          .delete()
          .eq("user_id", user.id)
          .eq("lesson_id", lessonId);
        if (error) throw error;
      } else {
        // Mark as complete — insert a row
        const { error } = await supabase
          .from("lesson_progress")
          .insert({ user_id: user.id, lesson_id: lessonId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses", user?.id] });
    },
  });
}
