-- Level 3 Production Hardening v1
-- Retire staged-release controlled-test loaders now that the frozen Level 3 release is active.

create or replace function public.get_math_language_level3_release(
  p_release_id text,
  p_question_count integer default 10,
  p_mode_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_account_id uuid := auth.uid();
  v_release public.math_language_content_releases;
  v_count integer := greatest(1, least(coalesce(p_question_count, 10), 40));
  v_questions jsonb;
begin
  if v_account_id is null then
    raise exception 'Auth session missing';
  end if;

  select * into v_release
  from public.math_language_content_releases
  where release_id = p_release_id
    and level = 3
    and release_status = 'active';

  if not found then
    raise exception 'Requested Level 3 release is not active';
  end if;

  select coalesce(jsonb_agg(q_payload order by question_id), '[]'::jsonb)
  into v_questions
  from (
    select
      q.question_id,
      jsonb_build_object(
        'question_id', q.question_id,
        'release_id', q.release_id,
        'term_id', q.term_id,
        'mode_id', q.mode_id,
        'difficulty_id', q.difficulty_id,
        'prompt', q.prompt,
        'misconception_target', q.misconception_target,
        'representation_required', q.representation_required,
        'representation_family', q.representation_family,
        'representation_data', q.representation_data,
        'canonical_correct_option_id', q.canonical_correct_option_id,
        'shuffle_policy', q.shuffle_policy,
        'options', (
          select jsonb_agg(
            jsonb_build_object(
              'option_id', o.option_id,
              'question_id', o.question_id,
              'option_text', o.option_text,
              'feedback_text', o.feedback_text,
              'is_correct', o.is_correct,
              'authoring_slot', o.authoring_slot,
              'authoring_sequence', o.authoring_sequence,
              'option_role', o.option_role
            ) order by o.authoring_sequence
          )
          from public.math_language_options o
          where o.question_id = q.question_id
            and o.status = 'active'
        )
      ) as q_payload
    from public.math_language_questions q
    where q.release_id = p_release_id
      and q.status = 'active'
      and (p_mode_id is null or q.mode_id = p_mode_id)
    order by random()
    limit v_count
  ) picked;

  if jsonb_array_length(v_questions) = 0 then
    raise exception 'No Level 3 questions are available for the requested mode';
  end if;

  return jsonb_build_object(
    'release', jsonb_build_object(
      'release_id', v_release.release_id,
      'level', v_release.level,
      'content_sha256', v_release.content_sha256,
      'release_status', v_release.release_status
    ),
    'mode_id', p_mode_id,
    'questions', v_questions
  );
end;
$function$;

revoke all on function public.get_math_language_level3_release(text, integer, text) from public;
revoke all on function public.get_math_language_level3_release(text, integer, text) from anon;
grant execute on function public.get_math_language_level3_release(text, integer, text) to authenticated;

-- Remove both temporary staged-capable controlled-test entry points.
drop function if exists public.get_math_language_level3_test_release(text, integer, text);
drop function if exists public.get_math_language_level3_test_release(text, integer);;
