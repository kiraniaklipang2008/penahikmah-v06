
-- Update trigger: 1st signup = super_admin, 2nd signup = admin, rest = siswa
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_count integer;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  
  IF user_count = 0 THEN
    -- First user becomes super_admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'super_admin')
    ON CONFLICT DO NOTHING;
  ELSIF user_count = 1 THEN
    -- Second user becomes admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'admin')
    ON CONFLICT DO NOTHING;
  ELSE
    -- Everyone else becomes siswa
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'siswa')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;
