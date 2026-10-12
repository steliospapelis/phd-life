-- Fixes signup failures caused by the original generated handle exceeding
-- the profiles.username maximum length of 16 characters.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, 'research_' || substr(replace(new.id::text, '-', ''), 1, 7))
  on conflict (id) do nothing;

  insert into public.player_state (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;
