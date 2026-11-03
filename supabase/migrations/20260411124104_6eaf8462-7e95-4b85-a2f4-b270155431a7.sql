
-- Fix user_roles policies: restrict to authenticated
DROP POLICY IF EXISTS "Admins can view roles" ON public.user_roles;
CREATE POLICY "Admins can view roles" ON public.user_roles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Fix access_logs policies
DROP POLICY IF EXISTS "Admins can view all logs" ON public.access_logs;
CREATE POLICY "Admins can view all logs" ON public.access_logs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can insert own logs" ON public.access_logs;
CREATE POLICY "Users can insert own logs" ON public.access_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own logs" ON public.access_logs;
CREATE POLICY "Users can view own logs" ON public.access_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Fix encontro_ai_insights policies
DROP POLICY IF EXISTS "Admins can manage all insights" ON public.encontro_ai_insights;
CREATE POLICY "Admins can manage all insights" ON public.encontro_ai_insights FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can insert own insights" ON public.encontro_ai_insights;
CREATE POLICY "Users can insert own insights" ON public.encontro_ai_insights FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own insights" ON public.encontro_ai_insights;
CREATE POLICY "Users can update own insights" ON public.encontro_ai_insights FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own insights" ON public.encontro_ai_insights;
CREATE POLICY "Users can view own insights" ON public.encontro_ai_insights FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Fix encontro_attendance policies
DROP POLICY IF EXISTS "Admins can manage all attendance" ON public.encontro_attendance;
CREATE POLICY "Admins can manage all attendance" ON public.encontro_attendance FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can insert own attendance" ON public.encontro_attendance;
CREATE POLICY "Users can insert own attendance" ON public.encontro_attendance FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own attendance" ON public.encontro_attendance;
CREATE POLICY "Users can update own attendance" ON public.encontro_attendance FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own attendance" ON public.encontro_attendance;
CREATE POLICY "Users can view own attendance" ON public.encontro_attendance FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Fix encontro_checklist policies
DROP POLICY IF EXISTS "Admins can manage all checklist" ON public.encontro_checklist;
CREATE POLICY "Admins can manage all checklist" ON public.encontro_checklist FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can delete own checklist" ON public.encontro_checklist;
CREATE POLICY "Users can delete own checklist" ON public.encontro_checklist FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own checklist" ON public.encontro_checklist;
CREATE POLICY "Users can insert own checklist" ON public.encontro_checklist FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own checklist" ON public.encontro_checklist;
CREATE POLICY "Users can update own checklist" ON public.encontro_checklist FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own checklist" ON public.encontro_checklist;
CREATE POLICY "Users can view own checklist" ON public.encontro_checklist FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Fix encontro_notes policies
DROP POLICY IF EXISTS "Admins can manage all notes" ON public.encontro_notes;
CREATE POLICY "Admins can manage all notes" ON public.encontro_notes FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can delete own notes" ON public.encontro_notes;
CREATE POLICY "Users can delete own notes" ON public.encontro_notes FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own notes" ON public.encontro_notes;
CREATE POLICY "Users can insert own notes" ON public.encontro_notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notes" ON public.encontro_notes;
CREATE POLICY "Users can update own notes" ON public.encontro_notes FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own notes" ON public.encontro_notes;
CREATE POLICY "Users can view own notes" ON public.encontro_notes FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Fix notifications policies
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;
CREATE POLICY "Admins can manage all notifications" ON public.notifications FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Fix user_progress policies
DROP POLICY IF EXISTS "Admins can manage all progress" ON public.user_progress;
CREATE POLICY "Admins can manage all progress" ON public.user_progress FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can insert own progress" ON public.user_progress;
CREATE POLICY "Users can insert own progress" ON public.user_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own progress" ON public.user_progress;
CREATE POLICY "Users can update own progress" ON public.user_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own progress" ON public.user_progress;
CREATE POLICY "Users can view own progress" ON public.user_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Fix profiles policies
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Auto-create own profile" ON public.profiles;
CREATE POLICY "Auto-create own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Fix announcements admin policy
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix encontros admin policy
DROP POLICY IF EXISTS "Admins can manage encontros" ON public.encontros;
CREATE POLICY "Admins can manage encontros" ON public.encontros FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix encontro_materials admin policy
DROP POLICY IF EXISTS "Admins can manage encontro_materials" ON public.encontro_materials;
CREATE POLICY "Admins can manage encontro_materials" ON public.encontro_materials FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix journey_stages admin policy
DROP POLICY IF EXISTS "Admins can manage stages" ON public.journey_stages;
CREATE POLICY "Admins can manage stages" ON public.journey_stages FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix journeys admin policy
DROP POLICY IF EXISTS "Admins can manage journeys" ON public.journeys;
CREATE POLICY "Admins can manage journeys" ON public.journeys FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix materials admin policy
DROP POLICY IF EXISTS "Admins can manage materials" ON public.materials;
CREATE POLICY "Admins can manage materials" ON public.materials FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix modules admin policy
DROP POLICY IF EXISTS "Admins can manage modules" ON public.modules;
CREATE POLICY "Admins can manage modules" ON public.modules FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix platform_settings admin policy
DROP POLICY IF EXISTS "Admins can manage settings" ON public.platform_settings;
CREATE POLICY "Admins can manage settings" ON public.platform_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix tasks admin policy
DROP POLICY IF EXISTS "Admins can manage tasks" ON public.tasks;
CREATE POLICY "Admins can manage tasks" ON public.tasks FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
