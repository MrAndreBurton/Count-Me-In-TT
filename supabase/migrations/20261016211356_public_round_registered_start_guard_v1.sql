-- Anonymous-to-registered upgrades do not retroactively qualify a round.
create or replace function private.lb_capture_public_round_context()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.start_valid and exists(select 1 from auth.users u where u.id=new.account_id and not coalesce(u.is_anonymous,false)) then
  select case when sp.profile_type='account_holder' then 'NoSchool' else
   case sp.school_type when 'primary' then 'Primary' when 'secondary' then 'Secondary' when 'no_school' then 'NoSchool' end end
   into new.public_category from public.student_profiles sp where sp.id=new.student_id;
  select b.id into new.public_board_id from private.lb_boards b
   join private.lb_public_releases pr on pr.board_id=b.id and pr.is_published
   join private.lb_games g on g.game_key=b.game_key and g.status='active'
   where b.game_key='multiplication' and b.scope='public' and b.status='active'
    and b.active_from<=new.received_at and new.game_mode=any(b.variants);
 end if;
 return new;
end $$;
revoke all on function private.lb_capture_public_round_context() from public,anon,authenticated;
