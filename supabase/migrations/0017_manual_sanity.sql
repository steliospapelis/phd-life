-- Allow each user to set their current sanity while keeping player_state authoritative.
-- The change is recorded so manual adjustments remain auditable in sanity_ledger.

drop function if exists public.set_sanity(integer);
create or replace function public.set_sanity(p_sanity integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before integer;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if p_sanity < 0 or p_sanity > 100 then
    raise exception 'Sanity must be between 0 and 100';
  end if;

  select sanity into v_before
  from public.player_state
  where user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Player state unavailable';
  end if;

  if p_sanity <> v_before then
    insert into public.sanity_ledger(user_id, source_type, delta, sanity_after)
    values (auth.uid(), 'manual_adjustment', p_sanity - v_before, p_sanity);
  end if;

  update public.player_state
  set sanity = p_sanity, updated_at = now()
  where user_id = auth.uid();

  return jsonb_build_object('sanity', p_sanity);
end;
$$;

revoke all on function public.set_sanity(integer) from public;
grant execute on function public.set_sanity(integer) to authenticated;
