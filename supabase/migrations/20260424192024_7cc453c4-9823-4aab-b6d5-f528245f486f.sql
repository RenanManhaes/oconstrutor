CREATE OR REPLACE FUNCTION public.get_next_public_invite()
RETURNS TABLE (
  slug text,
  invite_title text,
  encontro_title text,
  encontro_date date,
  encontro_start_time time without time zone,
  spots_remaining integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pi.slug,
    pi.title,
    e.title,
    e.date,
    e.start_time,
    CASE
      WHEN pi.max_signups IS NULL THEN NULL
      ELSE GREATEST(0, pi.max_signups - (SELECT COUNT(*)::INTEGER FROM public.guest_signups gs WHERE gs.invite_id = pi.id))
    END AS spots_remaining
  FROM public.public_invites pi
  JOIN public.encontros e ON e.id = pi.encontro_id
  WHERE pi.active = true
    AND (pi.expires_at IS NULL OR pi.expires_at > now())
    AND (pi.max_signups IS NULL OR (SELECT COUNT(*) FROM public.guest_signups gs WHERE gs.invite_id = pi.id) < pi.max_signups)
    AND (e.date IS NULL OR e.date >= CURRENT_DATE)
  ORDER BY e.date ASC NULLS LAST, pi.created_at DESC
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_next_public_invite() TO anon, authenticated;