
-- Table: encontros
CREATE TABLE public.encontros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  thumbnail_url text,
  date date,
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.encontros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage encontros"
  ON public.encontros FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view encontros"
  ON public.encontros FOR SELECT
  TO authenticated
  USING (true);

CREATE TRIGGER update_encontros_updated_at
  BEFORE UPDATE ON public.encontros
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table: encontro_materials
CREATE TABLE public.encontro_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encontro_id uuid NOT NULL REFERENCES public.encontros(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE(encontro_id, material_id)
);

ALTER TABLE public.encontro_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage encontro_materials"
  ON public.encontro_materials FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view encontro_materials"
  ON public.encontro_materials FOR SELECT
  TO authenticated
  USING (true);
