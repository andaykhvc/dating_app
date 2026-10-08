-- 999991_legal_consent.sql
-- Consent records (issue #42): which Terms / Privacy Policy version a person
-- accepted and when, plus explicit consent for the "open to dating" intention.
--
-- Terms and privacy columns are NOT in the column grant for authenticated, so
-- clients can only set them through accept_legal_terms(); a trigger also makes
-- them forward-only for everyone (evidence cannot be erased or back-dated).
-- dating_consent_at is client-writable (ticking the box) but the server stamps
-- it and clears it whenever the dating intention is removed.
--
-- Existing data: nobody has given dating consent yet, so profiles that already
-- list 'open_to_dating' lose that one intention here (they keep their others,
-- or fall back to 'language_buddy') and have to opt in again with consent.
-- Terms/privacy are left null for existing users: the app asks them to accept
-- on their next visit (the same sheet it uses when the versions change).

alter table public.profiles
  add column terms_accepted_at timestamptz,
  add column terms_version text,
  add column privacy_accepted_at timestamptz,
  add column privacy_version text,
  add column dating_consent_at timestamptz;

update public.profiles
set intentions = case
      when array_length(array_remove(intentions, 'open_to_dating'), 1) is null
        then array['language_buddy']::public.intention_type[]
      else array_remove(intentions, 'open_to_dating')
    end
where 'open_to_dating' = any(intentions);

grant update (dating_consent_at) on public.profiles to authenticated;

-- A new auth user may arrive with the versions they accepted on the signup
-- form (user metadata); OAuth signups carry none and are asked in onboarding.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_terms text := left(nullif(new.raw_user_meta_data ->> 'terms_version', ''), 40);
  v_privacy text := left(nullif(new.raw_user_meta_data ->> 'privacy_version', ''), 40);
begin
  insert into profiles (
    id, first_name, is_18_plus_confirmed,
    terms_accepted_at, terms_version, privacy_accepted_at, privacy_version
  )
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce((new.raw_user_meta_data ->> 'is_18_plus_confirmed')::boolean, false),
    case when v_terms is not null then now() end, v_terms,
    case when v_privacy is not null then now() end, v_privacy
  )
  on conflict (id) do nothing;

  insert into user_progress (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Records acceptance of the current versions, as of now.
create or replace function public.accept_legal_terms(p_terms_version text, p_privacy_version text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  if coalesce(trim(p_terms_version), '') = '' or coalesce(trim(p_privacy_version), '') = ''
     or char_length(p_terms_version) > 40 or char_length(p_privacy_version) > 40 then
    raise exception 'Invalid version' using errcode = 'check_violation';
  end if;

  update profiles
  set terms_accepted_at = now(),
      terms_version = trim(p_terms_version),
      privacy_accepted_at = now(),
      privacy_version = trim(p_privacy_version)
  where id = auth.uid();
end;
$$;

revoke execute on function public.accept_legal_terms(text, text) from public, anon;
grant execute on function public.accept_legal_terms(text, text) to authenticated;

-- Same rules as 0011, plus the consent rules at the end.
create or replace function public.enforce_profile_rules()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();

  if new.date_of_birth is not null
     and new.date_of_birth > (current_date - interval '18 years') then
    raise exception 'You must be at least 18 years old to use this app'
      using errcode = 'check_violation';
  end if;

  -- Completing onboarding is the gate that makes a profile discoverable, so it
  -- is also where required fields stop being optional.
  if new.onboarding_completed_at is not null then
    if new.first_name is null
       or new.date_of_birth is null
       or new.country_code is null
       or new.is_18_plus_confirmed is not true
       or array_length(new.intentions, 1) is null then
      raise exception 'Profile is incomplete'
        using errcode = 'check_violation';
    end if;

    if not exists (
      select 1 from user_languages
      where user_id = new.id and role = 'native'
    ) or not exists (
      select 1 from user_languages
      where user_id = new.id and role = 'learning'
    ) then
      raise exception 'Both a native and a learning language are required'
        using errcode = 'check_violation';
    end if;
  end if;

  -- Consent evidence only moves forward: it can be refreshed by accepting a new
  -- version, never erased or back-dated.
  if tg_op = 'UPDATE' then
    if new.terms_accepted_at is distinct from old.terms_accepted_at
       and old.terms_accepted_at is not null
       and (new.terms_accepted_at is null or new.terms_accepted_at < old.terms_accepted_at) then
      raise exception 'Consent records cannot be removed or back-dated'
        using errcode = 'check_violation';
    end if;
    if new.privacy_accepted_at is distinct from old.privacy_accepted_at
       and old.privacy_accepted_at is not null
       and (new.privacy_accepted_at is null or new.privacy_accepted_at < old.privacy_accepted_at) then
      raise exception 'Consent records cannot be removed or back-dated'
        using errcode = 'check_violation';
    end if;
  end if;

  -- "Open to dating" is special-category-adjacent data: it needs explicit
  -- consent. No dating intention, no consent on file; a dating intention needs
  -- a consent timestamp, which the server stamps itself.
  if not ('open_to_dating' = any(new.intentions)) then
    new.dating_consent_at := null;
  elsif new.dating_consent_at is null then
    raise exception 'Consent is required to be open to dating'
      using errcode = 'check_violation';
  elsif tg_op = 'INSERT' or old.dating_consent_at is null then
    new.dating_consent_at := now();
  else
    new.dating_consent_at := old.dating_consent_at;
  end if;

  return new;
end;
$$;
