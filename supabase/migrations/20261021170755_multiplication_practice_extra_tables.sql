-- Add exactly tables 13,14,15,20,25,50 to the existing practice contract.
-- Preserve the currently installed function bodies, access rules and privileges.
begin;
do $migration$
declare
  fn regprocedure;
  definition text;
  old_guard constant text := 'if p_table_number is null or p_table_number not between 1 and 12 then';
  new_guard constant text := 'if p_table_number is null or p_table_number not in (1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,20,25,50) then';
begin
  foreach fn in array array[
    'public.save_multiplication_practice_round(integer,text,integer,integer,integer,integer)'::regprocedure,
    'public.save_multiplication_practice_round_v2(integer,text,integer,integer,uuid,uuid,uuid,jsonb)'::regprocedure,
    'public.get_multiplication_practice_best(integer,text,integer)'::regprocedure
  ] loop
    definition := pg_catalog.pg_get_functiondef(fn);
    if strpos(definition, new_guard) > 0 then
      continue; -- Safely supports rechecking an already-applied update.
    end if;
    if (length(definition) - length(replace(definition, old_guard, ''))) <> length(old_guard) then
      raise exception 'Practice table guard differs for %. No functions were changed by this transaction.', fn;
    end if;
    execute replace(definition, old_guard, new_guard);
  end loop;
end;
$migration$;
commit;
