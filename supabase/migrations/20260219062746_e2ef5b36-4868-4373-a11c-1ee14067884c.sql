
-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'guru', 'siswa');

-- 2. User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'siswa',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Only service_role can manage user_roles (server action pattern)
-- No client-side RLS policies needed; edge function uses service_role key

-- 3. Resources table (extensible)
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- 4. Role permissions matrix
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'create', 'read', 'update', 'delete', or custom
  allowed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (role, resource_id, action)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- 5. Security definer function to check roles (no RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 6. Security definer function to check permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _resource TEXT, _action TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.role_permissions rp
    JOIN public.user_roles ur ON ur.role = rp.role
    JOIN public.resources r ON r.id = rp.resource_id
    WHERE ur.user_id = _user_id
      AND r.name = _resource
      AND rp.action = _action
      AND rp.allowed = true
  )
$$;

-- 7. Auto-assign 'siswa' role to new users via trigger
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'siswa')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- 8. Seed default resources
INSERT INTO public.resources (name, description) VALUES
  ('users', 'Manajemen pengguna'),
  ('subjects', 'Mata pelajaran'),
  ('lessons', 'Materi pelajaran'),
  ('quizzes', 'Kuis dan asesmen'),
  ('reports', 'Raport dan laporan'),
  ('roles', 'Manajemen role dan permission');

-- 9. Seed default permissions for super_admin (all access)
INSERT INTO public.role_permissions (role, resource_id, action, allowed)
SELECT 'super_admin', r.id, a.action, true
FROM public.resources r
CROSS JOIN (VALUES ('create'), ('read'), ('update'), ('delete')) AS a(action);

-- 10. Seed default permissions for admin (all except roles management)
INSERT INTO public.role_permissions (role, resource_id, action, allowed)
SELECT 'admin', r.id, a.action, true
FROM public.resources r
CROSS JOIN (VALUES ('create'), ('read'), ('update'), ('delete')) AS a(action)
WHERE r.name != 'roles';

-- Admin can read roles but not modify
INSERT INTO public.role_permissions (role, resource_id, action, allowed)
SELECT 'admin', r.id, a.action, a.action = 'read'
FROM public.resources r
CROSS JOIN (VALUES ('create'), ('read'), ('update'), ('delete')) AS a(action)
WHERE r.name = 'roles';

-- 11. Seed default permissions for guru
INSERT INTO public.role_permissions (role, resource_id, action, allowed)
SELECT 'guru', r.id, a.action,
  CASE
    WHEN r.name IN ('subjects', 'lessons', 'quizzes') AND a.action IN ('create', 'read', 'update') THEN true
    WHEN r.name = 'reports' AND a.action = 'read' THEN true
    WHEN r.name = 'users' AND a.action = 'read' THEN true
    ELSE false
  END
FROM public.resources r
CROSS JOIN (VALUES ('create'), ('read'), ('update'), ('delete')) AS a(action);

-- 12. Seed default permissions for siswa
INSERT INTO public.role_permissions (role, resource_id, action, allowed)
SELECT 'siswa', r.id, a.action,
  CASE
    WHEN r.name IN ('subjects', 'lessons', 'quizzes', 'reports') AND a.action = 'read' THEN true
    ELSE false
  END
FROM public.resources r
CROSS JOIN (VALUES ('create'), ('read'), ('update'), ('delete')) AS a(action);
