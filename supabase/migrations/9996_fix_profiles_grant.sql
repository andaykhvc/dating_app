revoke update on profiles from authenticated;
grant update (
  first_name,
  date_of_birth,
  is_18_plus_confirmed,
  country_code,
  city,
  bio,
  intentions,
  preferred_age_min,
  preferred_age_max,
  preferred_countries,
  hide_dating_profiles,
  onboarding_completed_at,
  updated_at
) on profiles to authenticated;
