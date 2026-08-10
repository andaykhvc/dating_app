-- 0004_game_content_en.sql
-- Playable content for learners of English.
--
-- language_code is the language being *learned*. The app UI is English, so
-- English translation exercises are phrased as meaning -> word rather than
-- source-language -> English, which would require knowing the learner's
-- native language.

insert into game_content (game_template_id, language_code, cefr_level, payload, source, source_license)
select id, 'en', c.level::cefr_level, c.payload, 'Lingua Match', 'hand-authored'
from game_templates, (values
  ('A1', '{"sentence":"I ____ in Berlin.","choices":["live","drink","buy","sleep"],"answer":"live"}'::jsonb),
  ('A1', '{"sentence":"She ____ coffee every morning.","choices":["drinks","drink","drinking","drank"],"answer":"drinks"}'::jsonb),
  ('A2', '{"sentence":"We ____ to the cinema last night.","choices":["went","go","gone","going"],"answer":"went"}'::jsonb),
  ('A2', '{"sentence":"There ____ a lot of people at the station.","choices":["were","was","is","been"],"answer":"were"}'::jsonb),
  ('B1', '{"sentence":"If it rains tomorrow, we ____ stay at home.","choices":["will","would","were","had"],"answer":"will"}'::jsonb),
  ('B1', '{"sentence":"I have been learning English ____ three years.","choices":["for","since","during","from"],"answer":"for"}'::jsonb),
  ('B2', '{"sentence":"She said she ____ finished the report already.","choices":["had","has","have","having"],"answer":"had"}'::jsonb)
) as c(level, payload)
where key = 'missing_word';

insert into game_content (game_template_id, language_code, cefr_level, payload, source, source_license)
select id, 'en', c.level::cefr_level, c.payload, 'Lingua Match', 'hand-authored'
from game_templates, (values
  ('A1', '{"prompt":"The meal you eat in the morning","prompt_language":"en","choices":["breakfast","dinner","lunch","supper"],"answer":"breakfast"}'::jsonb),
  ('A1', '{"prompt":"The day after today","prompt_language":"en","choices":["tomorrow","yesterday","tonight","weekend"],"answer":"tomorrow"}'::jsonb),
  ('A2', '{"prompt":"Someone who lives next to you","prompt_language":"en","choices":["neighbour","stranger","colleague","landlord"],"answer":"neighbour"}'::jsonb),
  ('B1', '{"prompt":"Feeling nervous before something important","prompt_language":"en","choices":["anxious","bored","grateful","curious"],"answer":"anxious"}'::jsonb),
  ('B1', '{"prompt":"To finally decide something after thinking","prompt_language":"en","choices":["make up your mind","take your time","lose your head","break the ice"],"answer":"make up your mind"}'::jsonb),
  ('B2', '{"prompt":"To start a conversation with a stranger","prompt_language":"en","choices":["break the ice","spill the beans","hit the roof","call it a day"],"answer":"break the ice"}'::jsonb)
) as c(level, payload)
where key = 'translation_choice';

insert into game_content (game_template_id, language_code, cefr_level, payload, source, source_license)
select id, 'en', c.level::cefr_level, c.payload, 'Lingua Match', 'hand-authored'
from game_templates, (values
  ('A1', '{"tokens":["I","am","going","today"],"answer":"I am going today"}'::jsonb),
  ('A1', '{"tokens":["she","lives","in","Madrid"],"answer":"she lives in Madrid"}'::jsonb),
  ('A2', '{"tokens":["we","have","never","been","to","Italy"],"answer":"we have never been to Italy"}'::jsonb),
  ('B1', '{"tokens":["the","film","was","better","than","I","expected"],"answer":"the film was better than I expected"}'::jsonb),
  ('B2', '{"tokens":["had","I","known","earlier","I","would","have","come"],"answer":"had I known earlier I would have come"}'::jsonb)
) as c(level, payload)
where key = 'word_order';

insert into game_content (game_template_id, language_code, cefr_level, payload, source, source_license)
select id, 'en', c.level::cefr_level, c.payload, 'Lingua Match', 'hand-authored'
from game_templates, (values
  ('A2', '{"prompt":"What is your dream job, and why?"}'::jsonb),
  ('A2', '{"prompt":"What does a perfect Sunday look like for you?"}'::jsonb),
  ('B1', '{"prompt":"What is something people always get wrong about your country?"}'::jsonb),
  ('B1', '{"prompt":"What is the best meal you have ever eaten?"}'::jsonb),
  ('B2', '{"prompt":"What is a skill you would learn if time and money were no issue?"}'::jsonb)
) as c(level, payload)
where key = 'ask_your_partner';

insert into game_content (game_template_id, language_code, cefr_level, payload, source, source_license)
select id, 'en', c.level::cefr_level, c.payload, 'Lingua Match', 'hand-authored'
from game_templates, (values
  ('A2', '{"instructions":"Ask your partner three questions about the city they live in.","suggested_questions":["What is your neighbourhood like?","Where do you go on a free afternoon?","What would you show a visitor first?"],"target_exchanges":3}'::jsonb),
  ('B1', '{"instructions":"Plan an imaginary weekend trip together, entirely in English.","suggested_questions":["Where should we go?","How do we get there?","What do we do on the first evening?"],"target_exchanges":3}'::jsonb),
  ('B1', '{"instructions":"Compare how people celebrate birthdays in your two countries.","suggested_questions":["Who organises the party?","Is there a traditional food?","What would surprise a foreigner?"],"target_exchanges":3}'::jsonb)
) as c(level, payload)
where key = 'conversation_mission';

insert into game_content (game_template_id, language_code, cefr_level, payload, source, source_license)
select id, 'en', c.level::cefr_level, c.payload, 'Lingua Match', 'hand-authored'
from game_templates, (values
  ('A1', '{"instructions":"Record yourself introducing your name, your city and one hobby."}'::jsonb),
  ('A2', '{"instructions":"Record yourself describing what you can see from your window."}'::jsonb),
  ('B1', '{"instructions":"Record a 30 second summary of the last film or series you watched."}'::jsonb)
) as c(level, payload)
where key = 'voice_challenge';

insert into game_content (game_template_id, language_code, cefr_level, payload, source, source_license)
select id, 'en', c.level::cefr_level, c.payload, 'Lingua Match', 'hand-authored'
from game_templates, (values
  ('A1', '{"seed_sentence":"Yesterday I goed to the school with my friend.","hint":"Look at the past tense."}'::jsonb),
  ('A2', '{"seed_sentence":"She don''t like to waking up early on Mondays.","hint":"Two things to fix here."}'::jsonb),
  ('B1', '{"seed_sentence":"I am living here since two years and I still not speak good.","hint":"Tense and word order."}'::jsonb)
) as c(level, payload)
where key = 'correction_challenge';
