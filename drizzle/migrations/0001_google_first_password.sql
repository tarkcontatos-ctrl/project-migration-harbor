CREATE TABLE public.google_password_setup (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  completed_at timestamptz
);
GRANT SELECT ON public.google_password_setup TO authenticated;
GRANT ALL ON public.google_password_setup TO service_role;
ALTER TABLE public.google_password_setup ENABLE ROW LEVEL SECURITY;
CREATE POLICY google_password_setup_own ON public.google_password_setup FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE FUNCTION public.track_google_registration() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.raw_app_meta_data->>'provider' = 'google' AND COALESCE(NEW.encrypted_password, '') = '' THEN
    INSERT INTO public.google_password_setup(user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.track_google_registration() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER zz_track_google_registration AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.track_google_registration();

CREATE FUNCTION public.needs_google_password() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.google_password_setup s JOIN auth.users u ON u.id = s.user_id
    WHERE s.user_id = auth.uid() AND s.completed_at IS NULL AND COALESCE(u.encrypted_password, '') = '');
$$;
REVOKE ALL ON FUNCTION public.needs_google_password() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.needs_google_password() TO authenticated;

CREATE FUNCTION public.block_incomplete_google_booking() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.google_password_setup s JOIN auth.users u ON u.id = s.user_id
    WHERE s.user_id = NEW.usuario_id AND s.completed_at IS NULL AND COALESCE(u.encrypted_password, '') = '') THEN
    RAISE EXCEPTION 'Crie sua senha antes de agendar.';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.block_incomplete_google_booking() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER require_google_password_before_booking BEFORE INSERT ON public.agendamentos FOR EACH ROW EXECUTE FUNCTION public.block_incomplete_google_booking();