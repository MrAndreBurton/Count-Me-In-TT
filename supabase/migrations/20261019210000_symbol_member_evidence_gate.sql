-- Stage 1A: paid-member-only persistent Symbol Bank and Symbol Challenge evidence.
-- Apply to development and test before production. No historical data modifications.
BEGIN;

-- This SECURITY DEFINER helper must not disclose membership for unrelated learners.
-- The same can_play_student authorization is required by the discovery RPC and
-- by existing game-result INSERT policies.
CREATE OR REPLACE FUNCTION public.has_paid_symbol_evidence_membership(p_student_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $fn$
  SELECT COALESCE(
    auth.uid() IS NOT NULL
    AND p_student_id IS NOT NULL
    AND public.can_play_student(p_student_id)
    AND EXISTS (
      SELECT 1
      FROM public.student_profiles sp
      JOIN public.student_memberships sm ON sm.student_id = sp.id
      JOIN public.membership_plans mp ON mp.id = sm.plan_id
      WHERE sp.id = p_student_id
        AND sp.profile_status = 'active'
        AND sm.is_current = true
        AND sm.status IN ('active', 'grace')
        AND sm.starts_at <= now()
        AND (sm.expires_at IS NULL OR sm.expires_at > now())
        AND mp.is_active = true
        AND mp.is_paid = true
    ), false
  );
$fn$;

REVOKE ALL ON FUNCTION public.has_paid_symbol_evidence_membership(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_paid_symbol_evidence_membership(uuid) TO authenticated;

-- Viewing evidence requires view permission, not play permission.
-- Preserve authorised parent access and existing admin visibility.
CREATE OR REPLACE FUNCTION public.has_paid_symbol_evidence_view_access(
  p_student_id uuid
)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $fn$
  SELECT COALESCE(
    auth.uid() IS NOT NULL
    AND p_student_id IS NOT NULL
    AND public.can_view_student(p_student_id)
    AND EXISTS (
      SELECT 1
      FROM public.student_profiles sp
      JOIN public.student_memberships sm
        ON sm.student_id = sp.id
      JOIN public.membership_plans mp
        ON mp.id = sm.plan_id
      WHERE sp.id = p_student_id
        AND sp.profile_status = 'active'
        AND sm.is_current = true
        AND sm.status IN ('active', 'grace')
        AND sm.starts_at <= now()
        AND (
          sm.expires_at IS NULL
          OR sm.expires_at > now()
        )
        AND mp.is_active = true
        AND mp.is_paid = true
    ), false
  );
$fn$;

REVOKE ALL ON FUNCTION
  public.has_paid_symbol_evidence_view_access(uuid)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION
  public.has_paid_symbol_evidence_view_access(uuid)
TO authenticated;

-- Additional restriction on historical learner evidence.
-- Existing permissive SELECT authorisation remains in force.
CREATE POLICY "Symbol vault history requires paid membership"
ON public.symbol_bank_student_states
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  public.is_active_admin()
  OR public.has_paid_symbol_evidence_view_access(student_id)
);

-- Restrict personal Symbol Challenge history to paid members.
-- Preserve other games, organisation results and site-admin access.
CREATE POLICY "Personal symbol results require paid membership to view"
ON public.game_results
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  game_type <> 'symbol_challenge'
  OR context_type IS DISTINCT FROM 'personal'
  OR public.is_active_admin()
  OR public.has_paid_symbol_evidence_view_access(student_id)
);

-- Restrict personal Symbol Challenge attempt history.
-- Preserve the existing parent-result authorisation requirement.
CREATE POLICY "Personal symbol attempts require paid membership to view"
ON public.symbol_challenge_attempt_items
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.game_results g
    WHERE g.id = game_result_id
      AND (
        g.context_type IS DISTINCT FROM 'personal'
        OR public.is_active_admin()
        OR public.has_paid_symbol_evidence_view_access(g.student_id)
      )
  )
);

-- Personal Symbol Challenge evidence requires paid membership.
-- Organisation records remain subject to existing INSERT authorisation.
CREATE POLICY "Symbol results require paid membership"
ON public.game_results
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  game_type <> 'symbol_challenge'
  OR context_type IS DISTINCT FROM 'personal'
  OR public.has_paid_symbol_evidence_membership(student_id)
);

-- Apply the same membership rule through the parent result.
CREATE POLICY "Symbol attempt items require paid membership"
ON public.symbol_challenge_attempt_items
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.game_results g
    WHERE g.id = game_result_id
      AND g.game_type = 'symbol_challenge'
      AND (
        g.context_type IS DISTINCT FROM 'personal'
        OR public.has_paid_symbol_evidence_membership(g.student_id)
      )
  )
);

-- Preserve active-release and playable-symbol checks, authorisation and
-- discovery-only upsert. Change: all persisted discoveries require membership,
-- including free-tier symbols. Free-tier content remains publicly viewable.
CREATE OR REPLACE FUNCTION public.discover_symbol_bank_symbol(
  target_student_id uuid, target_symbol_id text
)
RETURNS TABLE (
  student_id uuid, release_id text, symbol_id text, state text,
  first_discovered_at timestamptz, last_viewed_at timestamptz,
  state_changed_at timestamptz, created_at timestamptz, updated_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $fn$
DECLARE
  v_release_id text;
  v_access_tier text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING errcode = '42501';
  END IF;
  IF target_student_id IS NULL THEN
    RAISE EXCEPTION 'Student profile is required.' USING errcode = '22023';
  END IF;
  IF nullif(btrim(target_symbol_id), '') IS NULL THEN
    RAISE EXCEPTION 'Symbol ID is required.' USING errcode = '22023';
  END IF;
  IF NOT public.can_play_student(target_student_id) THEN
    RAISE EXCEPTION 'You are not authorized to record activity for this student.' USING errcode = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.student_profiles sp
    WHERE sp.id = target_student_id AND sp.profile_status = 'active'
  ) THEN
    RAISE EXCEPTION 'The student profile is not active.' USING errcode = '22023';
  END IF;
  SELECT r.release_id INTO v_release_id
  FROM public.symbol_bank_content_releases r
  WHERE r.status = 'active'
  ORDER BY r.activated_at DESC NULLS LAST, r.imported_at DESC
  LIMIT 1;
  IF v_release_id IS NULL THEN
    RAISE EXCEPTION 'No active Symbol Bank release is available.' USING errcode = '55000';
  END IF;
  SELECT s.access_tier INTO v_access_tier
  FROM public.symbol_bank_records s
  WHERE s.release_id = v_release_id
    AND s.symbol_id = btrim(target_symbol_id)
    AND s.is_game_active = true
  LIMIT 1;
  IF v_access_tier IS NULL THEN
    RAISE EXCEPTION 'The symbol is not available in the active Symbol Bank release.'
      USING errcode = '22023';
  END IF;
  IF NOT public.has_paid_symbol_evidence_membership(target_student_id) THEN
    RAISE EXCEPTION 'An active paid membership is required to record Symbol Bank evidence.'
      USING errcode = '42501';
  END IF;
  INSERT INTO public.symbol_bank_student_states AS s (
    student_id, release_id, symbol_id, state,
    first_discovered_at, last_viewed_at, state_changed_at, created_at, updated_at
  ) VALUES (
    target_student_id, v_release_id, btrim(target_symbol_id), 'DISCOVERED',
    now(), now(), now(), now(), now()
  )
  ON CONFLICT ON CONSTRAINT symbol_bank_student_states_pkey
  DO UPDATE SET last_viewed_at = now()
  RETURNING s.student_id, s.release_id, s.symbol_id, s.state,
    s.first_discovered_at, s.last_viewed_at, s.state_changed_at,
    s.created_at, s.updated_at
  INTO student_id, release_id, symbol_id, state,
    first_discovered_at, last_viewed_at, state_changed_at,
    created_at, updated_at;
  RETURN NEXT;
END;
$fn$;

REVOKE ALL ON FUNCTION public.discover_symbol_bank_symbol(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.discover_symbol_bank_symbol(uuid, text) TO authenticated;
COMMIT;
