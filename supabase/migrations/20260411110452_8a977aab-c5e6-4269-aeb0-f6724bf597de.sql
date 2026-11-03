
-- Create encontro_notes table
CREATE TABLE public.encontro_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  encontro_id uuid NOT NULL REFERENCES public.encontros(id) ON DELETE CASCADE,
  notes text DEFAULT '',
  actions text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, encontro_id)
);

ALTER TABLE public.encontro_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes" ON public.encontro_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes" ON public.encontro_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON public.encontro_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON public.encontro_notes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all notes" ON public.encontro_notes FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_encontro_notes_updated_at BEFORE UPDATE ON public.encontro_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create encontro_checklist table
CREATE TABLE public.encontro_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  encontro_id uuid NOT NULL REFERENCES public.encontros(id) ON DELETE CASCADE,
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.encontro_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own checklist" ON public.encontro_checklist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own checklist" ON public.encontro_checklist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own checklist" ON public.encontro_checklist FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own checklist" ON public.encontro_checklist FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all checklist" ON public.encontro_checklist FOR ALL USING (public.has_role(auth.uid(), 'admin'));
