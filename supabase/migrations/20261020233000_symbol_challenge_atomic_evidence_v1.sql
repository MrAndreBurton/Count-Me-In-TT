-- Development-first: atomic, idempotent personal Symbol Challenge evidence.
-- Does not alter historical rows. Client-supplied answer keys are NOT independently
-- reconstructed: verification_status remains pending.
BEGIN;
CREATE UNIQUE INDEX IF NOT EXISTS symbol_challenge_personal_attempt_unique_v1
ON public.game_results (student_id, ((game_metadata->>'attempt_id')))
WHERE game_type = 'symbol_challenge' AND context_type = 'personal'
  AND game_metadata ? 'attempt_id';

CREATE OR REPLACE FUNCTION public.save_symbol_challenge_round_v1(
  p_student_id uuid, p_round jsonb, p_responses jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE
  v_user uuid := auth.uid();
  v_attempt uuid;
  v_release text;
  v_mode text;
  v_count integer;
  v_first integer := 0;
  v_final integer := 0;
  v_result uuid;
  v_existing uuid;
  v_existing_fingerprint text;
  v_evidence_fingerprint text;
  v_enc jsonb;
  v_resp jsonb;
  v_opts jsonb;
  v_selected jsonb;
  v_correct text;
  v_selected_final text;
  v_first_correct boolean;
  v_final_correct boolean;
  v_support boolean;
  v_attempts integer;
  v_index integer;
BEGIN
  IF v_user IS NULL OR p_student_id IS NULL THEN
    RAISE EXCEPTION 'Authentication and learner required' USING errcode = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.account_student_links l
    JOIN public.student_profiles s ON s.id = l.student_id
    WHERE l.account_id = v_user AND l.student_id = p_student_id
      AND l.can_play = true AND s.profile_status = 'active'
  ) OR NOT public.has_paid_symbol_evidence_membership(p_student_id) THEN
    RAISE EXCEPTION 'Active paid learner membership required' USING errcode = '42501';
  END IF;
  IF jsonb_typeof(p_round) <> 'object' OR jsonb_typeof(p_responses) <> 'array'
     OR jsonb_typeof(p_round->'encounters') <> 'array'
     OR jsonb_typeof(p_round->'config') <> 'object' THEN
    RAISE EXCEPTION 'Invalid round payload' USING errcode = '22023';
  END IF;
  v_release := p_round->>'releaseId';
  v_mode := p_round->'config'->>'experienceMode';
  IF v_mode NOT IN ('FOCUS','CHALLENGE') THEN
    RAISE EXCEPTION 'Invalid experience mode' USING errcode = '22023';
  END IF;
  BEGIN
    v_attempt := (p_round->'config'->>'seed')::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'Invalid round attempt ID' USING errcode = '22023';
  END;
  IF v_attempt IS NULL OR v_release IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.symbol_bank_content_releases r WHERE r.release_id = v_release
  ) THEN
    RAISE EXCEPTION 'Unknown release or attempt ID' USING errcode = '22023';
  END IF;
  v_count := jsonb_array_length(p_round->'encounters');
  IF v_count < 1 OR v_count > 100 OR jsonb_array_length(p_responses) <> v_count THEN
    RAISE EXCEPTION 'Incomplete round evidence' USING errcode = '22023';
  END IF;
  -- Validate every response before writing anything.
  FOR v_index IN 0..v_count-1 LOOP
    v_enc := p_round->'encounters'->v_index;
    v_resp := p_responses->v_index;
    v_opts := v_enc->'optionPayload';
    v_selected := v_resp->'selectedOptionIds';
    v_correct := v_enc->>'correctOptionId';
    IF (v_enc->>'answerSequence')::integer <> v_index+1
      OR v_enc->>'encounterId' IS DISTINCT FROM v_resp->>'encounterId'
      OR v_enc->>'symbolId' IS DISTINCT FROM v_resp->>'symbolId'
      OR v_enc->>'questionBehaviour' IS DISTINCT FROM v_resp->>'questionBehaviour'
      OR v_enc->>'difficulty' NOT IN ('D1','D2','D3')
      OR v_enc->>'questionBehaviour' NOT IN ('QB-01','QB-02','QB-03','QB-04','QB-05','QB-06')
      OR jsonb_typeof(v_enc->'promptPayload') <> 'object'
      OR jsonb_typeof(v_opts) <> 'array'
      OR jsonb_typeof(v_enc->'generationMetadata') <> 'object'
      OR jsonb_typeof(v_selected) <> 'array'
      OR jsonb_array_length(v_selected) NOT BETWEEN 1 AND 2
      OR NOT EXISTS (SELECT 1 FROM public.symbol_bank_records b
          WHERE b.release_id = v_release AND b.symbol_id = v_enc->>'symbolId')
      OR NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_opts) o WHERE o->>'id' = v_correct)
    THEN
      RAISE EXCEPTION 'Invalid encounter evidence at question %', v_index+1 USING errcode = '22023';
    END IF;
    v_attempts := jsonb_array_length(v_selected);
    IF (v_resp->>'attemptCount')::integer <> v_attempts OR v_attempts > 1 AND v_mode <> 'FOCUS'
      OR EXISTS (SELECT 1 FROM jsonb_array_elements(v_selected) a
        WHERE NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_opts) o WHERE o->>'id' = a #>> '{}'))
    THEN
      RAISE EXCEPTION 'Invalid answer selection at question %', v_index+1 USING errcode = '22023';
    END IF;
    v_selected_final := v_selected->>(v_attempts-1);
    v_first_correct := (v_selected->>0 = v_correct);
    v_final_correct := (v_selected_final = v_correct);
    v_support := (v_attempts = 2);
    IF (v_resp->>'firstResponseCorrect')::boolean IS DISTINCT FROM v_first_correct
      OR (v_resp->>'finalResponseCorrect')::boolean IS DISTINCT FROM v_final_correct
      OR (v_resp->>'supportUsed')::boolean IS DISTINCT FROM v_support
      OR (v_support AND v_first_correct)
    THEN
      RAISE EXCEPTION 'Inconsistent response at question %', v_index+1 USING errcode = '22023';
    END IF;
    v_first := v_first + CASE WHEN v_first_correct THEN 1 ELSE 0 END;
    v_final := v_final + CASE WHEN v_final_correct THEN 1 ELSE 0 END;
  END LOOP;
  -- A canonical fingerprint binds the attempt ID to its exact submitted evidence.
  -- This is an integrity/deduplication check, NOT server-side answer verification.
  v_evidence_fingerprint := md5(
    jsonb_build_object('round', p_round, 'responses', p_responses)::text
  );
  -- Unique index makes retrying the same attempt safe even under concurrency.
  INSERT INTO public.game_results (
    student_id, account_id, game_type, game_mode, mode_label,
    score, max_score, correct_answers, incorrect_answers, accuracy_percent,
    submission_type, public_eligible, verification_status,
    symbol_bank_release_id, context_type, game_metadata
  ) VALUES (
    p_student_id, v_user, 'symbol_challenge', lower(v_mode),
    CASE WHEN v_mode='FOCUS' THEN 'Symbol Challenge Focus' ELSE 'Symbol Challenge' END,
    v_final, v_count, v_final, v_count-v_final,
    round(100.0*v_final/v_count,2), 'practice', false, 'pending',
    v_release, 'personal',
    jsonb_build_object('attempt_id',v_attempt::text,
      'evidence_fingerprint',v_evidence_fingerprint,
      'round_config',p_round->'config',
      'generator_version',p_round->'generatorVersion','first_try_correct',v_first,
      'first_try_accuracy_percent',round(100.0*v_first/v_count,2),
      'symbol_bank_version',p_round->'symbolBankVersion',
      'game_contract_version',p_round->'gameContractVersion',
      'question_generation_spec_version',p_round->'questionGenerationSpecVersion')
  ) ON CONFLICT (student_id, ((game_metadata->>'attempt_id')))
    WHERE game_type = 'symbol_challenge' AND context_type = 'personal'
      AND game_metadata ? 'attempt_id'
    DO NOTHING RETURNING id INTO v_result;
  IF v_result IS NULL THEN
    SELECT id, game_metadata->>'evidence_fingerprint'
      INTO v_existing, v_existing_fingerprint
    FROM public.game_results
    WHERE student_id = p_student_id AND game_type = 'symbol_challenge'
      AND context_type = 'personal' AND game_metadata->>'attempt_id' = v_attempt::text;
    IF v_existing IS NULL THEN
      RAISE EXCEPTION 'Unable to resolve saved attempt';
    END IF;
    IF v_existing_fingerprint IS DISTINCT FROM v_evidence_fingerprint THEN
      RAISE EXCEPTION 'Attempt ID already exists with different evidence'
        USING errcode = '23505';
    END IF;
    RETURN v_existing;
  END IF;
  FOR v_index IN 0..v_count-1 LOOP
    v_enc := p_round->'encounters'->v_index;
    v_resp := p_responses->v_index;
    v_selected := v_resp->'selectedOptionIds';
    v_attempts := jsonb_array_length(v_selected);
    v_correct := v_enc->>'correctOptionId';
    v_selected_final := v_selected->>(v_attempts-1);
    INSERT INTO public.symbol_challenge_attempt_items (
      game_result_id, release_id, symbol_id, question_behaviour, difficulty,
      answer_sequence, prompt_payload, option_payload, selected_option_id,
      correct_option_id, is_correct, response_ms, shuffle_seed, encounter_role,
      generation_metadata
    ) VALUES (
      v_result, v_release, v_enc->>'symbolId', v_enc->>'questionBehaviour',
      v_enc->>'difficulty', v_index+1, v_enc->'promptPayload',
      v_enc->'optionPayload', v_selected_final, v_correct,
      v_selected_final = v_correct, NULL, v_attempt::text, 'INITIAL',
      COALESCE(v_enc->'generationMetadata','{}'::jsonb) ||
      jsonb_build_object('selected_option_ids',v_selected,
        'first_response_correct',(v_selected->>0 = v_correct),
        'final_response_correct',(v_selected_final = v_correct),
        'attempt_count',v_attempts,'support_used',v_attempts=2)
    );
  END LOOP;
  RETURN v_result;
END;
$fn$;
REVOKE ALL ON FUNCTION public.save_symbol_challenge_round_v1(uuid,jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_symbol_challenge_round_v1(uuid,jsonb,jsonb) TO authenticated;
COMMIT;
