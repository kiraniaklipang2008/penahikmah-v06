-- Create quiz_feedback table for mentor feedback on quiz results
CREATE TABLE public.quiz_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_result_id UUID NOT NULL REFERENCES public.quiz_results(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL,
  comment TEXT NOT NULL DEFAULT '',
  adjusted_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(quiz_result_id)
);

-- Enable RLS
ALTER TABLE public.quiz_feedback ENABLE ROW LEVEL SECURITY;

-- Students can view feedback on their own quiz results
CREATE POLICY "Students can view own feedback"
ON public.quiz_feedback
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.quiz_results qr
    WHERE qr.id = quiz_result_id AND qr.user_id = auth.uid()
  )
);

-- Guru/admin can view all feedback
CREATE POLICY "Guru and admin can view all feedback"
ON public.quiz_feedback
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'guru') OR
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'super_admin')
);

-- Guru/admin can insert feedback
CREATE POLICY "Guru and admin can insert feedback"
ON public.quiz_feedback
FOR INSERT
TO authenticated
WITH CHECK (
  (public.has_role(auth.uid(), 'guru') OR
   public.has_role(auth.uid(), 'admin') OR
   public.has_role(auth.uid(), 'super_admin'))
  AND mentor_id = auth.uid()
);

-- Guru/admin can update their own feedback
CREATE POLICY "Guru and admin can update own feedback"
ON public.quiz_feedback
FOR UPDATE
TO authenticated
USING (
  mentor_id = auth.uid() AND
  (public.has_role(auth.uid(), 'guru') OR
   public.has_role(auth.uid(), 'admin') OR
   public.has_role(auth.uid(), 'super_admin'))
);

-- Guru/admin can delete their own feedback
CREATE POLICY "Guru and admin can delete own feedback"
ON public.quiz_feedback
FOR DELETE
TO authenticated
USING (
  mentor_id = auth.uid() AND
  (public.has_role(auth.uid(), 'guru') OR
   public.has_role(auth.uid(), 'admin') OR
   public.has_role(auth.uid(), 'super_admin'))
);

-- Add updated_at trigger
CREATE TRIGGER update_quiz_feedback_updated_at
BEFORE UPDATE ON public.quiz_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();