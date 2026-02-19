
-- Make the trigger assign super_admin if no users exist yet (first user = super admin)
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If this is the first user, make them super_admin
  IF (SELECT count(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin')
    ON CONFLICT DO NOTHING;
  END IF;
  -- Always assign siswa role
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'siswa')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
