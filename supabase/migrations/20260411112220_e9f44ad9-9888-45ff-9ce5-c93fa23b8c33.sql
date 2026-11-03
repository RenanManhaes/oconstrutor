-- Add time columns to encontros
ALTER TABLE public.encontros ADD COLUMN start_time time;
ALTER TABLE public.encontros ADD COLUMN end_time time;

-- Create encontro_attendance table
CREATE TABLE public.encontro_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  encontro_id uuid NOT NULL REFERENCES public.encontros(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'present',
  marked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, encontro_id)
);

ALTER TABLE public.encontro_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attendance" ON public.encontro_attendance FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own attendance" ON public.encontro_attendance FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own attendance" ON public.encontro_attendance FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all attendance" ON public.encontro_attendance FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create encontro_ai_insights table
CREATE TABLE public.encontro_ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  encontro_id uuid NOT NULL REFERENCES public.encontros(id) ON DELETE CASCADE,
  pillar_id uuid REFERENCES public.journey_stages(id) ON DELETE SET NULL,
  insight text NOT NULL,
  progress_score integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, encontro_id, pillar_id)
);

ALTER TABLE public.encontro_ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own insights" ON public.encontro_ai_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own insights" ON public.encontro_ai_insights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own insights" ON public.encontro_ai_insights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all insights" ON public.encontro_ai_insights FOR ALL USING (public.has_role(auth.uid(), 'admin'));