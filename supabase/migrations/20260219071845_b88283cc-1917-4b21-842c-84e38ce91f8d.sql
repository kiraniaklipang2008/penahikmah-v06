
-- Table: students (data siswa lengkap, synced with profiles)
CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE, -- nullable, linked when user registers
  nisn text NOT NULL DEFAULT '',
  full_name text NOT NULL,
  birth_place text NOT NULL DEFAULT '',
  birth_date date,
  gender text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  parent_name text NOT NULL DEFAULT '',
  parent_phone text NOT NULL DEFAULT '',
  enrollment_year integer,
  status text NOT NULL DEFAULT 'aktif', -- aktif, lulus, keluar
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Table: teachers (data guru lengkap, synced with profiles)
CREATE TABLE public.teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE, -- nullable, linked when user registers
  nip text NOT NULL DEFAULT '',
  full_name text NOT NULL,
  subject text NOT NULL DEFAULT '', -- mata pelajaran
  education text NOT NULL DEFAULT '', -- pendidikan terakhir
  phone text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'aktif', -- aktif, nonaktif
  position text NOT NULL DEFAULT '', -- jabatan
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Table: classes (kelas + wali kelas + tahun ajaran)
CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, -- e.g. "10A", "11B"
  academic_year text NOT NULL DEFAULT '', -- e.g. "2025/2026"
  homeroom_teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Table: class_students (many-to-many: students in classes)
CREATE TABLE public.class_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(class_id, student_id)
);

ALTER TABLE public.class_students ENABLE ROW LEVEL SECURITY;

-- Triggers for updated_at
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at
  BEFORE UPDATE ON public.teachers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add resources for RBAC
INSERT INTO public.resources (name, description) VALUES
  ('students', 'Data Siswa'),
  ('teachers', 'Data Guru'),
  ('classes', 'Data Kelas')
ON CONFLICT DO NOTHING;
