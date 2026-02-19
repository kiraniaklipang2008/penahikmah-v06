
-- Create subjects table
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'BookOpen',
  color TEXT NOT NULL DEFAULT 'blue',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lessons table
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lesson_progress table
CREATE TABLE public.lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Enable RLS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- Subjects: all authenticated users can read
CREATE POLICY "Authenticated users can view subjects"
  ON public.subjects FOR SELECT
  TO authenticated
  USING (true);

-- Lessons: all authenticated users can read
CREATE POLICY "Authenticated users can view lessons"
  ON public.lessons FOR SELECT
  TO authenticated
  USING (true);

-- Lesson progress: users manage their own
CREATE POLICY "Users can view own progress"
  ON public.lesson_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.lesson_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
  ON public.lesson_progress FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Seed subjects
INSERT INTO public.subjects (name, description, icon, color, order_index) VALUES
  ('Matematika', 'Aljabar, geometri, kalkulus, dan statistika', 'Calculator', 'blue', 1),
  ('Fisika', 'Mekanika, termodinamika, dan elektromagnetisme', 'Zap', 'yellow', 2),
  ('Kimia', 'Reaksi kimia, tabel periodik, dan stoikiometri', 'FlaskConical', 'green', 3),
  ('Biologi', 'Sel, genetika, ekosistem, dan anatomi', 'Leaf', 'emerald', 4),
  ('Bahasa Indonesia', 'Tata bahasa, sastra, dan keterampilan menulis', 'BookText', 'red', 5),
  ('Bahasa Inggris', 'Grammar, vocabulary, reading, and writing', 'Globe', 'purple', 6);

-- Seed lessons for each subject
DO $$
DECLARE
  math_id UUID;
  physics_id UUID;
  chem_id UUID;
  bio_id UUID;
  bi_id UUID;
  en_id UUID;
BEGIN
  SELECT id INTO math_id FROM public.subjects WHERE name = 'Matematika';
  SELECT id INTO physics_id FROM public.subjects WHERE name = 'Fisika';
  SELECT id INTO chem_id FROM public.subjects WHERE name = 'Kimia';
  SELECT id INTO bio_id FROM public.subjects WHERE name = 'Biologi';
  SELECT id INTO bi_id FROM public.subjects WHERE name = 'Bahasa Indonesia';
  SELECT id INTO en_id FROM public.subjects WHERE name = 'Bahasa Inggris';

  -- Matematika lessons
  INSERT INTO public.lessons (subject_id, title, duration_minutes, order_index) VALUES
    (math_id, 'Persamaan Linear Satu Variabel', 45, 1),
    (math_id, 'Persamaan Kuadrat', 60, 2),
    (math_id, 'Fungsi dan Grafik', 45, 3),
    (math_id, 'Trigonometri Dasar', 60, 4),
    (math_id, 'Statistika dan Probabilitas', 45, 5);

  -- Fisika lessons
  INSERT INTO public.lessons (subject_id, title, duration_minutes, order_index) VALUES
    (physics_id, 'Gerak Lurus Beraturan', 45, 1),
    (physics_id, 'Hukum Newton', 60, 2),
    (physics_id, 'Energi dan Usaha', 45, 3),
    (physics_id, 'Gelombang dan Bunyi', 45, 4),
    (physics_id, 'Listrik Statis', 60, 5);

  -- Kimia lessons
  INSERT INTO public.lessons (subject_id, title, duration_minutes, order_index) VALUES
    (chem_id, 'Tabel Periodik Unsur', 45, 1),
    (chem_id, 'Ikatan Kimia', 60, 2),
    (chem_id, 'Stoikiometri', 60, 3),
    (chem_id, 'Larutan dan pH', 45, 4),
    (chem_id, 'Reaksi Redoks', 45, 5);

  -- Biologi lessons
  INSERT INTO public.lessons (subject_id, title, duration_minutes, order_index) VALUES
    (bio_id, 'Sel dan Organel', 45, 1),
    (bio_id, 'Fotosintesis', 45, 2),
    (bio_id, 'Genetika dan DNA', 60, 3),
    (bio_id, 'Sistem Organ Manusia', 60, 4),
    (bio_id, 'Ekosistem dan Lingkungan', 45, 5);

  -- Bahasa Indonesia lessons
  INSERT INTO public.lessons (subject_id, title, duration_minutes, order_index) VALUES
    (bi_id, 'Teks Argumentasi', 45, 1),
    (bi_id, 'Puisi dan Prosa', 45, 2),
    (bi_id, 'Tata Bahasa Baku', 30, 3),
    (bi_id, 'Menulis Esai', 60, 4),
    (bi_id, 'Membaca Kritis', 45, 5);

  -- Bahasa Inggris lessons
  INSERT INTO public.lessons (subject_id, title, duration_minutes, order_index) VALUES
    (en_id, 'Simple Present & Past Tense', 45, 1),
    (en_id, 'Reading Comprehension', 45, 2),
    (en_id, 'Writing a Paragraph', 60, 3),
    (en_id, 'Vocabulary Building', 30, 4),
    (en_id, 'Listening & Speaking', 45, 5);
END $$;
