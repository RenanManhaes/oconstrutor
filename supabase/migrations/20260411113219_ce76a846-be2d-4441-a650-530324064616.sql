-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  read boolean NOT NULL DEFAULT false,
  tipo text NOT NULL DEFAULT 'info',
  reference_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all notifications" ON public.notifications FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- Enable extensions for cron
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;