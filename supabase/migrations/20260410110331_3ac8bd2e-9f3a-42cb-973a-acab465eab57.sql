CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage settings" ON public.platform_settings
  FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can read settings" ON public.platform_settings
  FOR SELECT TO authenticated
  USING (true);

INSERT INTO public.platform_settings (key, value) VALUES
  ('mentoring_name', 'O Construtor'),
  ('mentor_name', 'Vagner Vieira'),
  ('sequential_content', 'true'),
  ('email_notifications', 'false');

CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();