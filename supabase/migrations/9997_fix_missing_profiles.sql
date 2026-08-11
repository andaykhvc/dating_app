-- Create profiles for any auth users that don't have them yet
INSERT INTO profiles (id, first_name, is_18_plus_confirmed)
SELECT id, 
       CASE WHEN raw_user_meta_data->>'first_name' = '' THEN NULL 
            ELSE raw_user_meta_data->>'first_name' END,
       COALESCE((raw_user_meta_data->>'is_18_plus_confirmed')::boolean, false)
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Create progress rows for any users without them
INSERT INTO user_progress (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_progress)
ON CONFLICT (user_id) DO NOTHING;
