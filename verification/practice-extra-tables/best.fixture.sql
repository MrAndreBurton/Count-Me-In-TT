CREATE OR REPLACE FUNCTION public.get_multiplication_practice_best(p_table_number integer, p_practice_mode text, p_range_max integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  practice_context record;
  exact_game_mode text;
  best_duration_ms integer;
  best_played_at timestamptz;
begin
  if p_table_number is null or p_table_number not between 1 and 12 then
    raise exception using errcode = '22023', message = 'INVALID_TABLE_NUMBER';
  end if;

  if p_practice_mode is null or p_practice_mode not in ('build', 'mix') then
    raise exception using errcode = '22023', message = 'INVALID_PRACTICE_MODE';
  end if;

  if p_range_max is null or p_range_max not in (12, 15) then
    raise exception using errcode = '22023', message = 'INVALID_RANGE_MAX';
  end if;

  select *
  into practice_context
  from private.current_multiplication_practice_context();

  if p_table_number is null or p_table_number not in (1, 2, 5, 10)
     and not practice_context.has_member_access then
    raise exception using errcode = '42501', message = 'MEMBERSHIP_REQUIRED';
  end if;

  exact_game_mode := format(
    'table_%s_%s_%s',
    p_table_number,
    p_practice_mode,
    p_range_max
  );

  select gr.duration_ms, gr.played_at
  into best_duration_ms, best_played_at
  from public.game_results gr
  where gr.student_id = practice_context.student_id
    and gr.game_type = 'multiplication_practice'
    and gr.game_mode = exact_game_mode
    and gr.verification_status = 'verified'
    and gr.duration_ms is not null
  order by gr.duration_ms asc, gr.played_at asc, gr.id asc
  limit 1;

  return jsonb_build_object(
    'gameMode', exact_game_mode,
    'bestDurationMs', best_duration_ms,
    'playedAt', best_played_at
  );
end;
$function$

