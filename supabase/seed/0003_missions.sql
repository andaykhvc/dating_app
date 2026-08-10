-- 0003_missions.sql
-- The mission pool. One of these is attached automatically the moment two
-- people match, so nobody lands in an empty chat wondering what to say.

insert into missions
  (key, title, description, category, xp_reward_per_step, target_steps, related_game_template_id, is_daily)
values
  ('city_questions',
   'Three questions about their city',
   'Ask your partner 3 questions about the city they live in.',
   'culture', 20, 3,
   (select id from game_templates where key = 'conversation_mission'), false),

  ('food_swap',
   'Swap a favourite dish',
   'Tell each other about one dish from your country and how it is made.',
   'culture', 20, 2,
   (select id from game_templates where key = 'conversation_mission'), false),

  ('weekend_plans',
   'Weekend plans',
   'Describe your typical weekend in your target language.',
   'daily-life', 20, 1,
   (select id from game_templates where key = 'ask_your_partner'), false),

  ('slang_exchange',
   'Teach one piece of slang',
   'Teach your partner one slang expression people actually use where you live.',
   'language', 25, 2, null, false),

  ('correct_me',
   'Correct each other once',
   'Each of you writes a sentence in your target language and corrects the other.',
   'language', 25, 2,
   (select id from game_templates where key = 'correction_challenge'), false),

  ('voice_hello',
   'Say hello out loud',
   'Send a short voice message introducing yourself in your target language.',
   'speaking', 25, 1,
   (select id from game_templates where key = 'voice_challenge'), false),

  ('dream_job',
   'Dream jobs',
   'Ask your partner what their dream job is and explain yours.',
   'personal', 20, 1,
   (select id from game_templates where key = 'ask_your_partner'), false),

  ('music_taste',
   'One song each',
   'Recommend one song in your native language and explain what it is about.',
   'culture', 20, 2, null, false),

  ('false_friends',
   'Find a false friend',
   'Find one word that looks the same in both languages but means something different.',
   'language', 25, 1, null, false),

  ('travel_tip',
   'A place tourists miss',
   'Tell your partner about one place in your country that tourists never visit.',
   'culture', 20, 2,
   (select id from game_templates where key = 'conversation_mission'), false),

  ('describe_photo',
   'Describe what you see',
   'Describe the last photo you took, in your target language.',
   'daily-life', 20, 1,
   (select id from game_templates where key = 'ask_your_partner'), false),

  ('numbers_game',
   'Talk in numbers',
   'Ask each other three questions whose answers are numbers.',
   'language', 20, 3,
   (select id from game_templates where key = 'conversation_mission'), false),

  ('morning_routine',
   'Morning routines',
   'Describe your morning routine in five sentences.',
   'daily-life', 20, 1, null, false),

  ('holiday_traditions',
   'A tradition worth explaining',
   'Explain one holiday tradition from your country.',
   'culture', 25, 2,
   (select id from game_templates where key = 'conversation_mission'), false),

  ('small_talk',
   'Survive small talk',
   'Have a five-message exchange about the weather without switching languages.',
   'language', 25, 5, null, false),

  ('word_of_the_day',
   'Word of the day',
   'Teach each other one new word and use it in a sentence.',
   'language', 20, 2, null, false),

  ('childhood_memory',
   'A childhood memory',
   'Tell a short story from your childhood in your target language.',
   'personal', 25, 1,
   (select id from game_templates where key = 'ask_your_partner'), false),

  ('local_transport',
   'Getting around',
   'Explain how people usually get around in your city.',
   'daily-life', 20, 1, null, false)
on conflict (key) do nothing;
