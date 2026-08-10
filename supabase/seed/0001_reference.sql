-- 0001_reference.sql
-- Languages and interests. Adding a fourth launch language later is one insert
-- here plus content rows; no code change and no migration.

insert into languages (code, name, native_name, flag_emoji, is_launch_language) values
  ('en', 'English', 'English',  '🇬🇧', true),
  ('de', 'German',  'Deutsch',  '🇩🇪', true),
  ('es', 'Spanish', 'Español',  '🇪🇸', true),
  ('fr', 'French',  'Français', '🇫🇷', false),
  ('it', 'Italian', 'Italiano', '🇮🇹', false),
  ('pt', 'Portuguese', 'Português', '🇵🇹', false),
  ('nl', 'Dutch',   'Nederlands', '🇳🇱', false),
  ('pl', 'Polish',  'Polski',   '🇵🇱', false),
  ('tr', 'Turkish', 'Türkçe',   '🇹🇷', false),
  ('sv', 'Swedish', 'Svenska',  '🇸🇪', false)
on conflict (code) do nothing;

insert into interests (key, label, emoji) values
  ('travel',      'Travel',       '✈️'),
  ('cinema',      'Cinema',       '🎬'),
  ('music',       'Music',        '🎵'),
  ('cooking',     'Cooking',      '🍳'),
  ('football',    'Football',     '⚽'),
  ('gaming',      'Gaming',       '🎮'),
  ('books',       'Books',        '📚'),
  ('art',         'Art',          '🎨'),
  ('photography', 'Photography',  '📷'),
  ('hiking',      'Hiking',       '🥾'),
  ('fitness',     'Fitness',      '💪'),
  ('food',        'Food',         '🍜'),
  ('technology',  'Technology',   '💻'),
  ('nature',      'Nature',       '🌿'),
  ('dancing',     'Dancing',      '💃'),
  ('history',     'History',      '🏛️'),
  ('coffee',      'Coffee',       '☕'),
  ('pets',        'Pets',         '🐾'),
  ('fashion',     'Fashion',      '👗'),
  ('volunteering','Volunteering', '🤝'),
  ('boardgames',  'Board games',  '🎲'),
  ('yoga',        'Yoga',         '🧘'),
  ('festivals',   'Festivals',    '🎪'),
  ('languages',   'Languages',    '🗣️')
on conflict (key) do nothing;
