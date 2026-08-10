-- 0007_content_library.sql
-- Starter content library.
--
-- Deliberately small: this is the shape the eventual ~500 words / ~1,000
-- sentences / ~100 prompts per language will land in, not the volume. Growing
-- it is a CSV import into these same tables (Supabase Studio's table import or
-- psql \copy) with source / source_license / source_url filled in -- no schema
-- change and no migration. See "Scaling the content library" in the README.

insert into example_sentences (language_code, cefr_level, text, translation_en, source, source_license)
values
  ('en', 'A1', 'I live in a small flat near the station.', null, 'Lingua Match', 'hand-authored'),
  ('en', 'A1', 'She drinks coffee every morning before work.', null, 'Lingua Match', 'hand-authored'),
  ('en', 'A2', 'We went to the cinema and the film was terrible.', null, 'Lingua Match', 'hand-authored'),
  ('en', 'A2', 'Could you tell me how to get to the museum?', null, 'Lingua Match', 'hand-authored'),
  ('en', 'B1', 'I have been learning English for about three years now.', null, 'Lingua Match', 'hand-authored'),
  ('en', 'B1', 'If the weather is good, we usually eat outside.', null, 'Lingua Match', 'hand-authored'),
  ('en', 'B2', 'She had already left by the time I arrived.', null, 'Lingua Match', 'hand-authored'),
  ('en', 'B2', 'The point I was trying to make got lost somewhere.', null, 'Lingua Match', 'hand-authored'),

  ('de', 'A1', 'Ich wohne in einer kleinen Wohnung am Bahnhof.', 'I live in a small flat near the station.', 'Lingua Match', 'hand-authored'),
  ('de', 'A1', 'Sie trinkt jeden Morgen Kaffee vor der Arbeit.', 'She drinks coffee every morning before work.', 'Lingua Match', 'hand-authored'),
  ('de', 'A2', 'Wir sind ins Kino gegangen und der Film war schrecklich.', 'We went to the cinema and the film was terrible.', 'Lingua Match', 'hand-authored'),
  ('de', 'A2', 'Können Sie mir sagen, wie ich zum Museum komme?', 'Could you tell me how to get to the museum?', 'Lingua Match', 'hand-authored'),
  ('de', 'B1', 'Ich lerne seit ungefähr drei Jahren Deutsch.', 'I have been learning German for about three years.', 'Lingua Match', 'hand-authored'),
  ('de', 'B1', 'Wenn das Wetter gut ist, essen wir meistens draußen.', 'If the weather is good, we usually eat outside.', 'Lingua Match', 'hand-authored'),
  ('de', 'B2', 'Sie war schon weg, als ich ankam.', 'She had already left by the time I arrived.', 'Lingua Match', 'hand-authored'),
  ('de', 'B2', 'Worauf ich hinauswollte, ist irgendwo verloren gegangen.', 'The point I was trying to make got lost somewhere.', 'Lingua Match', 'hand-authored'),

  ('es', 'A1', 'Vivo en un piso pequeño cerca de la estación.', 'I live in a small flat near the station.', 'Lingua Match', 'hand-authored'),
  ('es', 'A1', 'Ella bebe café todas las mañanas antes del trabajo.', 'She drinks coffee every morning before work.', 'Lingua Match', 'hand-authored'),
  ('es', 'A2', 'Fuimos al cine y la película fue terrible.', 'We went to the cinema and the film was terrible.', 'Lingua Match', 'hand-authored'),
  ('es', 'A2', '¿Me puede decir cómo llegar al museo?', 'Could you tell me how to get to the museum?', 'Lingua Match', 'hand-authored'),
  ('es', 'B1', 'Llevo unos tres años aprendiendo español.', 'I have been learning Spanish for about three years.', 'Lingua Match', 'hand-authored'),
  ('es', 'B1', 'Si hace buen tiempo, solemos comer fuera.', 'If the weather is good, we usually eat outside.', 'Lingua Match', 'hand-authored'),
  ('es', 'B2', 'Ella ya se había ido cuando llegué.', 'She had already left by the time I arrived.', 'Lingua Match', 'hand-authored'),
  ('es', 'B2', 'Lo que quería decir se perdió por el camino.', 'The point I was trying to make got lost somewhere.', 'Lingua Match', 'hand-authored');

insert into vocabulary_words (language_code, cefr_level, word, translation_en, part_of_speech, source, source_license)
values
  ('en', 'A1', 'house', null, 'noun', 'Lingua Match', 'hand-authored'),
  ('en', 'A1', 'water', null, 'noun', 'Lingua Match', 'hand-authored'),
  ('en', 'A1', 'friend', null, 'noun', 'Lingua Match', 'hand-authored'),
  ('en', 'A1', 'to eat', null, 'verb', 'Lingua Match', 'hand-authored'),
  ('en', 'A1', 'tomorrow', null, 'adverb', 'Lingua Match', 'hand-authored'),
  ('en', 'A2', 'neighbour', null, 'noun', 'Lingua Match', 'hand-authored'),
  ('en', 'A2', 'to borrow', null, 'verb', 'Lingua Match', 'hand-authored'),
  ('en', 'A2', 'crowded', null, 'adjective', 'Lingua Match', 'hand-authored'),
  ('en', 'B1', 'anxious', null, 'adjective', 'Lingua Match', 'hand-authored'),
  ('en', 'B1', 'to reckon', null, 'verb', 'Lingua Match', 'hand-authored'),
  ('en', 'B2', 'reluctant', null, 'adjective', 'Lingua Match', 'hand-authored'),
  ('en', 'B2', 'to overhear', null, 'verb', 'Lingua Match', 'hand-authored'),

  ('de', 'A1', 'das Haus', 'house', 'noun', 'Lingua Match', 'hand-authored'),
  ('de', 'A1', 'das Wasser', 'water', 'noun', 'Lingua Match', 'hand-authored'),
  ('de', 'A1', 'der Freund', 'friend', 'noun', 'Lingua Match', 'hand-authored'),
  ('de', 'A1', 'essen', 'to eat', 'verb', 'Lingua Match', 'hand-authored'),
  ('de', 'A1', 'morgen', 'tomorrow', 'adverb', 'Lingua Match', 'hand-authored'),
  ('de', 'A2', 'der Nachbar', 'neighbour', 'noun', 'Lingua Match', 'hand-authored'),
  ('de', 'A2', 'leihen', 'to borrow', 'verb', 'Lingua Match', 'hand-authored'),
  ('de', 'A2', 'überfüllt', 'crowded', 'adjective', 'Lingua Match', 'hand-authored'),
  ('de', 'B1', 'aufgeregt', 'anxious', 'adjective', 'Lingua Match', 'hand-authored'),
  ('de', 'B1', 'vermuten', 'to reckon', 'verb', 'Lingua Match', 'hand-authored'),
  ('de', 'B2', 'zögerlich', 'reluctant', 'adjective', 'Lingua Match', 'hand-authored'),
  ('de', 'B2', 'mithören', 'to overhear', 'verb', 'Lingua Match', 'hand-authored'),

  ('es', 'A1', 'la casa', 'house', 'noun', 'Lingua Match', 'hand-authored'),
  ('es', 'A1', 'el agua', 'water', 'noun', 'Lingua Match', 'hand-authored'),
  ('es', 'A1', 'el amigo', 'friend', 'noun', 'Lingua Match', 'hand-authored'),
  ('es', 'A1', 'comer', 'to eat', 'verb', 'Lingua Match', 'hand-authored'),
  ('es', 'A1', 'mañana', 'tomorrow', 'adverb', 'Lingua Match', 'hand-authored'),
  ('es', 'A2', 'el vecino', 'neighbour', 'noun', 'Lingua Match', 'hand-authored'),
  ('es', 'A2', 'prestar', 'to borrow', 'verb', 'Lingua Match', 'hand-authored'),
  ('es', 'A2', 'abarrotado', 'crowded', 'adjective', 'Lingua Match', 'hand-authored'),
  ('es', 'B1', 'inquieto', 'anxious', 'adjective', 'Lingua Match', 'hand-authored'),
  ('es', 'B1', 'suponer', 'to reckon', 'verb', 'Lingua Match', 'hand-authored'),
  ('es', 'B2', 'reacio', 'reluctant', 'adjective', 'Lingua Match', 'hand-authored'),
  ('es', 'B2', 'oír por casualidad', 'to overhear', 'verb', 'Lingua Match', 'hand-authored')
on conflict (language_code, word) do nothing;

-- language_code is null: these work in whatever language the pair is practising.
insert into conversation_prompts (language_code, cefr_level, topic, prompt, source, source_license)
values
  (null, 'A1', 'basics', 'What is your name and where are you from?', 'Lingua Match', 'hand-authored'),
  (null, 'A1', 'basics', 'How many languages do you speak?', 'Lingua Match', 'hand-authored'),
  (null, 'A1', 'daily-life', 'What time do you usually wake up?', 'Lingua Match', 'hand-authored'),
  (null, 'A2', 'city', 'What is your favourite place in your city?', 'Lingua Match', 'hand-authored'),
  (null, 'A2', 'city', 'How long does it take you to get to work or school?', 'Lingua Match', 'hand-authored'),
  (null, 'A2', 'food', 'What did you have for dinner yesterday?', 'Lingua Match', 'hand-authored'),
  (null, 'A2', 'food', 'Which dish from your country should everyone try once?', 'Lingua Match', 'hand-authored'),
  (null, 'A2', 'daily-life', 'What do you usually do on Sunday afternoons?', 'Lingua Match', 'hand-authored'),
  (null, 'B1', 'travel', 'What is the last trip you took, and would you go back?', 'Lingua Match', 'hand-authored'),
  (null, 'B1', 'travel', 'Which country would you move to if you had to leave yours?', 'Lingua Match', 'hand-authored'),
  (null, 'B1', 'culture', 'What is a habit in your country that foreigners find strange?', 'Lingua Match', 'hand-authored'),
  (null, 'B1', 'culture', 'Which holiday matters most where you live, and why?', 'Lingua Match', 'hand-authored'),
  (null, 'B1', 'language', 'What is the hardest thing about the language you are learning?', 'Lingua Match', 'hand-authored'),
  (null, 'B1', 'language', 'Which word in your language has no good translation?', 'Lingua Match', 'hand-authored'),
  (null, 'B1', 'personal', 'What is something you changed your mind about recently?', 'Lingua Match', 'hand-authored'),
  (null, 'B1', 'personal', 'What is your dream job, and how close are you to it?', 'Lingua Match', 'hand-authored'),
  (null, 'B1', 'media', 'What was the last film or series you finished?', 'Lingua Match', 'hand-authored'),
  (null, 'B1', 'media', 'Which song would you use to explain your country to someone?', 'Lingua Match', 'hand-authored'),
  (null, 'B2', 'opinion', 'Is it better to live in a big city or a small town?', 'Lingua Match', 'hand-authored'),
  (null, 'B2', 'opinion', 'Has learning a language changed how you see your own?', 'Lingua Match', 'hand-authored'),
  (null, 'B2', 'personal', 'What is a skill you would learn if money were no issue?', 'Lingua Match', 'hand-authored'),
  (null, 'B2', 'culture', 'What do people misunderstand most about where you are from?', 'Lingua Match', 'hand-authored'),
  (null, 'B2', 'work', 'How do people in your country feel about work and free time?', 'Lingua Match', 'hand-authored'),
  (null, 'B2', 'language', 'When do you notice yourself thinking in your second language?', 'Lingua Match', 'hand-authored');
