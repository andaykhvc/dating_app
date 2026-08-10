-- 0002_game_templates.sql
-- The seven mechanics. Each one has exactly one renderer in the app; new
-- exercises are new game_content rows, not new code.

insert into game_templates
  (key, type, title, description, instructions, default_xp_reward, is_gradable, is_solo)
values
  ('missing_word', 'missing_word',
   'Missing Word',
   'Pick the word that completes the sentence.',
   'Read the sentence and choose the option that fits the gap.',
   10, true, true),

  ('translation_choice', 'translation_choice',
   'Translation Choice',
   'Choose the correct translation.',
   'Pick the option that means the same thing.',
   10, true, true),

  ('word_order', 'word_order',
   'Word Order',
   'Put the words in the right order.',
   'Tap the words one by one to build the sentence.',
   15, true, true),

  ('ask_your_partner', 'ask_your_partner',
   'Ask Your Partner',
   'A question worth asking in your target language.',
   'Send this question to your partner and answer it yourself too.',
   15, false, false),

  ('conversation_mission', 'conversation_mission',
   'Conversation Mission',
   'A short conversation goal to complete together.',
   'Work through the goal in chat, then mark it done.',
   20, false, false),

  ('voice_challenge', 'voice_challenge',
   'Voice Challenge',
   'Say it out loud and record it for your partner.',
   'Record a short voice message with your phone and send it in the chat.',
   20, false, false),

  ('correction_challenge', 'correction_challenge',
   'Correction Challenge',
   'Write a sentence and let your partner correct it.',
   'Write the sentence in chat. Your partner taps it to suggest a correction.',
   15, false, false)
on conflict (key) do nothing;
