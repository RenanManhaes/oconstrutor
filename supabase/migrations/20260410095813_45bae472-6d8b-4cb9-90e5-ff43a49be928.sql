
-- Enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'cliente');

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ===================== USER ROLES (must be created before has_role function) =====================
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'cliente',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
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

-- RLS for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ===================== PROFILES =====================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name text,
  phone text,
  avatar_url text,
  status text NOT NULL DEFAULT 'active',
  last_sign_in_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Auto-create own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===================== JOURNEYS =====================
CREATE TABLE public.journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view journeys" ON public.journeys FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage journeys" ON public.journeys FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_journeys_updated_at BEFORE UPDATE ON public.journeys FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===================== JOURNEY STAGES =====================
CREATE TABLE public.journey_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id uuid REFERENCES public.journeys(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.journey_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view stages" ON public.journey_stages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage stages" ON public.journey_stages FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_stages_updated_at BEFORE UPDATE ON public.journey_stages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===================== MODULES =====================
CREATE TABLE public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid REFERENCES public.journey_stages(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  thumbnail_url text,
  duration_minutes int,
  sort_order int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view modules" ON public.modules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage modules" ON public.modules FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===================== MATERIALS =====================
CREATE TABLE public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES public.modules(id) ON DELETE CASCADE,
  stage_id uuid REFERENCES public.journey_stages(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'video',
  url text,
  thumbnail_url text,
  duration_minutes int,
  sort_order int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view materials" ON public.materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage materials" ON public.materials FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===================== TASKS =====================
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  instruction text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view tasks" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage tasks" ON public.tasks FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ===================== USER PROGRESS =====================
CREATE TABLE public.user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  module_id uuid REFERENCES public.modules(id) ON DELETE CASCADE,
  material_id uuid REFERENCES public.materials(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  response_text text,
  accessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own progress" ON public.user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.user_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all progress" ON public.user_progress FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage all progress" ON public.user_progress FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_progress_updated_at BEFORE UPDATE ON public.user_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===================== ACCESS LOGS =====================
CREATE TABLE public.access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  accessed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own logs" ON public.access_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON public.access_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all logs" ON public.access_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- ===================== ANNOUNCEMENTS =====================
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view active announcements" ON public.announcements FOR SELECT TO authenticated USING (active = true);
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===================== AUTO-CREATE PROFILE ON SIGNUP =====================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===================== STORAGE =====================
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);

CREATE POLICY "Authenticated can view media" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'media');
CREATE POLICY "Admins can upload media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update media" ON storage.objects FOR UPDATE USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete media" ON storage.objects FOR DELETE USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can upload avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND (storage.foldername(name))[1] = 'avatars' AND auth.uid()::text = (storage.foldername(name))[2]);
CREATE POLICY "Users can update avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'media' AND (storage.foldername(name))[1] = 'avatars' AND auth.uid()::text = (storage.foldername(name))[2]);
