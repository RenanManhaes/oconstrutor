-- 1. Add 'convidado' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'convidado';

-- 2. Create public_invites table
CREATE TABLE public.public_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  encontro_id UUID NOT NULL REFERENCES public.encontros(id) ON DELETE CASCADE,
  description TEXT,
  cover_url TEXT,
  max_signups INTEGER,
  expires_at TIMESTAMP WITH TIME ZONE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_public_invites_slug ON public.public_invites(slug);
CREATE INDEX idx_public_invites_encontro_id ON public.public_invites(encontro_id);

ALTER TABLE public.public_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invites"
ON public.public_invites
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_public_invites_updated_at
BEFORE UPDATE ON public.public_invites
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Create guest_signups table
CREATE TABLE public.guest_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invite_id UUID NOT NULL REFERENCES public.public_invites(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  converted_user_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (invite_id, email)
);

CREATE INDEX idx_guest_signups_invite_id ON public.guest_signups(invite_id);
CREATE INDEX idx_guest_signups_status ON public.guest_signups(status);

ALTER TABLE public.guest_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage guest signups"
ON public.guest_signups
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. SECURITY DEFINER function to fetch public invite data (for anonymous visitors)
CREATE OR REPLACE FUNCTION public.get_public_invite_secure(_slug TEXT)
RETURNS TABLE (
  invite_id UUID,
  invite_title TEXT,
  invite_description TEXT,
  invite_cover_url TEXT,
  encontro_title TEXT,
  encontro_description TEXT,
  encontro_date DATE,
  encontro_start_time TIME,
  encontro_end_time TIME,
  encontro_thumbnail_url TEXT,
  spots_remaining INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pi.id,
    pi.title,
    pi.description,
    pi.cover_url,
    e.title,
    e.description,
    e.date,
    e.start_time,
    e.end_time,
    e.thumbnail_url,
    CASE
      WHEN pi.max_signups IS NULL THEN NULL
      ELSE GREATEST(0, pi.max_signups - (SELECT COUNT(*)::INTEGER FROM public.guest_signups gs WHERE gs.invite_id = pi.id))
    END AS spots_remaining
  FROM public.public_invites pi
  JOIN public.encontros e ON e.id = pi.encontro_id
  WHERE pi.slug = _slug
    AND pi.active = true
    AND (pi.expires_at IS NULL OR pi.expires_at > now())
    AND (pi.max_signups IS NULL OR (SELECT COUNT(*) FROM public.guest_signups gs WHERE gs.invite_id = pi.id) < pi.max_signups);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_invite_secure(TEXT) TO anon, authenticated;

-- 5. SECURITY DEFINER function to insert guest signup (for anonymous visitors)
CREATE OR REPLACE FUNCTION public.submit_guest_signup_secure(
  _slug TEXT,
  _full_name TEXT,
  _email TEXT,
  _phone TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite_id UUID;
  v_max_signups INTEGER;
  v_current_count INTEGER;
  v_signup_id UUID;
BEGIN
  -- Validate inputs
  IF _full_name IS NULL OR length(trim(_full_name)) = 0 OR length(_full_name) > 200 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nome inválido');
  END IF;
  IF _email IS NULL OR length(trim(_email)) = 0 OR length(_email) > 255 OR _email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Email inválido');
  END IF;
  IF _phone IS NOT NULL AND length(_phone) > 30 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Telefone inválido');
  END IF;

  -- Find active, non-expired invite
  SELECT id, max_signups
  INTO v_invite_id, v_max_signups
  FROM public.public_invites
  WHERE slug = _slug
    AND active = true
    AND (expires_at IS NULL OR expires_at > now());

  IF v_invite_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Convite indisponível ou expirado');
  END IF;

  -- Check capacity
  IF v_max_signups IS NOT NULL THEN
    SELECT COUNT(*) INTO v_current_count FROM public.guest_signups WHERE invite_id = v_invite_id;
    IF v_current_count >= v_max_signups THEN
      RETURN jsonb_build_object('success', false, 'error', 'Vagas esgotadas');
    END IF;
  END IF;

  -- Insert (handle duplicate email gracefully)
  BEGIN
    INSERT INTO public.guest_signups (invite_id, full_name, email, phone, status)
    VALUES (v_invite_id, trim(_full_name), lower(trim(_email)), NULLIF(trim(_phone), ''), 'pending')
    RETURNING id INTO v_signup_id;
  EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este email já está inscrito neste convite');
  END;

  RETURN jsonb_build_object('success', true, 'signup_id', v_signup_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_guest_signup_secure(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;