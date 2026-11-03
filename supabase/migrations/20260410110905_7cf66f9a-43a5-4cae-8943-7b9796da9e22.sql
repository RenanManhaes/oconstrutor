-- Fix 1: Privilege escalation on user_roles
-- Drop the overly broad ALL policy and replace with specific ones
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Admins can view roles" ON public.user_roles
  FOR SELECT TO public
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT TO public
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles" ON public.user_roles
  FOR UPDATE TO public
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE TO public
  USING (has_role(auth.uid(), 'admin'));

-- Fix 2: Remove duplicate SELECT policy on user_progress
DROP POLICY IF EXISTS "Admins can view all progress" ON public.user_progress;

-- Fix 3: Add ownership-based storage policies for media bucket
-- Drop existing overly broad policies if any
DROP POLICY IF EXISTS "Public read access on media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete media" ON storage.objects;

-- Admins can do everything in media bucket
CREATE POLICY "Admins full access media" ON storage.objects
  FOR ALL TO public
  USING (bucket_id = 'media' AND has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'media' AND has_role(auth.uid(), 'admin'));

-- Public can read media (needed for public URLs)
CREATE POLICY "Public read media" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'media');

-- Authenticated users can upload to their own folder
CREATE POLICY "Users upload own media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media' AND (storage.foldername(name))[1] = 'avatars' AND (storage.foldername(name))[2] = auth.uid()::text);

-- Users can update their own avatar
CREATE POLICY "Users update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'media' AND (storage.foldername(name))[1] = 'avatars' AND (storage.foldername(name))[2] = auth.uid()::text);