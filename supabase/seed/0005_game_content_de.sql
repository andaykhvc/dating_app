-- 0005_game_content_de.sql
-- Playable content for learners of German.

insert into game_content (game_template_id, language_code, cefr_level, payload, source, source_license)
select id, 'de', c.level::cefr_level, c.payload, 'Lingua Match', 'hand-authored'
from game_templates, (values
  ('A1', '{"sentence":"Ich ____ in Berlin.","choices":["wohne","trinke","kaufe","schlafe"],"answer":"wohne"}'::jsonb),
  ('A1', '{"sentence":"Sie ____ jeden Morgen Kaffee.","choices":["trinkt","trinken","getrunken","trank"],"answer":"trinkt"}'::jsonb),
  ('A2', '{"sentence":"Wir ____ gestern ins Kino gegangen.","choices":["sind","haben","waren","werden"],"answer":"sind"}'::jsonb),
  ('A2', '{"sentence":"Ich fahre ____ dem Bus zur Arbeit.","choices":["mit","auf","in","zu"],"answer":"mit"}'::jsonb),
  ('B1', '{"sentence":"Wenn ich Zeit ____, würde ich mehr lesen.","choices":["hätte","habe","hatte","haben"],"answer":"hätte"}'::jsonb),
  ('B1', '{"sentence":"Er wartet ____ den Zug nach München.","choices":["auf","für","an","über"],"answer":"auf"}'::jsonb),
  ('B2', '{"sentence":"Das Konzert, ____ wir gestern besucht haben, war fantastisch.","choices":["das","der","dem","dessen"],"answer":"das"}'::jsonb)
) as c(level, payload)
where key = 'missing_word';

insert into game_content (game_template_id, language_code, cefr_level, payload, source, source_license)
select id, 'de', c.level::cefr_level, c.payload, 'Lingua Match', 'hand-authored'
from game_templates, (values
  ('A1', '{"prompt":"How are you?","prompt_language":"en","choices":["Wie geht es dir?","Wo wohnst du?","Was machst du?","Wer bist du?"],"answer":"Wie geht es dir?"}'::jsonb),
  ('A1', '{"prompt":"Thank you very much","prompt_language":"en","choices":["Vielen Dank","Bitte schön","Guten Tag","Bis später"],"answer":"Vielen Dank"}'::jsonb),
  ('A2', '{"prompt":"I would like to pay, please","prompt_language":"en","choices":["Ich möchte bitte zahlen","Ich habe kein Geld","Das ist zu teuer","Wo ist die Bank?"],"answer":"Ich möchte bitte zahlen"}'::jsonb),
  ('B1', '{"prompt":"It depends on the weather","prompt_language":"en","choices":["Es kommt auf das Wetter an","Das Wetter ist schön","Ich mag kein Wetter","Es regnet oft"],"answer":"Es kommt auf das Wetter an"}'::jsonb),
  ('B1', '{"prompt":"I am looking forward to it","prompt_language":"en","choices":["Ich freue mich darauf","Ich denke darüber nach","Ich warte darauf","Ich sorge mich darum"],"answer":"Ich freue mich darauf"}'::jsonb),
  ('B2', '{"prompt":"That is beside the point","prompt_language":"en","choices":["Das tut nichts zur Sache","Das ist mir egal","Das kommt darauf an","Das macht nichts"],"answer":"Das tut nichts zur Sache"}'::jsonb)
) as c(level, payload)
where key = 'translation_choice';

insert into game_content (game_template_id, language_code, cefr_level, payload, source, source_license)
select id, 'de', c.level::cefr_level, c.payload, 'Lingua Match', 'hand-authored'
from game_templates, (values
  ('A1', '{"tokens":["ich","gehe","heute","einkaufen"],"answer":"ich gehe heute einkaufen"}'::jsonb),
  ('A1', '{"tokens":["sie","wohnt","in","Hamburg"],"answer":"sie wohnt in Hamburg"}'::jsonb),
  ('A2', '{"tokens":["am","Wochenende","fahre","ich","nach","Köln"],"answer":"am Wochenende fahre ich nach Köln"}'::jsonb),
  ('B1', '{"tokens":["ich","glaube","dass","er","recht","hat"],"answer":"ich glaube dass er recht hat"}'::jsonb),
  ('B2', '{"tokens":["obwohl","es","regnete","sind","wir","spazieren","gegangen"],"answer":"obwohl es regnete sind wir spazieren gegangen"}'::jsonb)
) as c(level, payload)
where key = 'word_order';

insert into game_content (game_template_id, language_code, cefr_level, payload, source, source_license)
select id, 'de', c.level::cefr_level, c.payload, 'Lingua Match', 'hand-authored'
from game_templates, (values
  ('A2', '{"prompt":"Was ist dein Traumberuf und warum?"}'::jsonb),
  ('A2', '{"prompt":"Wie sieht ein perfekter Sonntag für dich aus?"}'::jsonb),
  ('B1', '{"prompt":"Was verstehen Ausländer oft falsch an deinem Land?"}'::jsonb),
  ('B1', '{"prompt":"Was war das beste Essen, das du je hattest?"}'::jsonb),
  ('B2', '{"prompt":"Welche Fähigkeit würdest du lernen, wenn Zeit und Geld keine Rolle spielten?"}'::jsonb)
) as c(level, payload)
where key = 'ask_your_partner';

insert into game_content (game_template_id, language_code, cefr_level, payload, source, source_license)
select id, 'de', c.level::cefr_level, c.payload, 'Lingua Match', 'hand-authored'
from game_templates, (values
  ('A2', '{"instructions":"Stelle deinem Partner drei Fragen über seine Stadt.","suggested_questions":["Wie ist dein Viertel?","Wohin gehst du an einem freien Nachmittag?","Was würdest du einem Besucher zuerst zeigen?"],"target_exchanges":3}'::jsonb),
  ('B1', '{"instructions":"Plant zusammen ein Wochenende auf Deutsch.","suggested_questions":["Wohin fahren wir?","Wie kommen wir dorthin?","Was machen wir am ersten Abend?"],"target_exchanges":3}'::jsonb),
  ('B1', '{"instructions":"Vergleicht, wie in euren Ländern Geburtstage gefeiert werden.","suggested_questions":["Wer organisiert die Feier?","Gibt es ein traditionelles Essen?","Was würde einen Ausländer überraschen?"],"target_exchanges":3}'::jsonb)
) as c(level, payload)
where key = 'conversation_mission';

insert into game_content (game_template_id, language_code, cefr_level, payload, source, source_license)
select id, 'de', c.level::cefr_level, c.payload, 'Lingua Match', 'hand-authored'
from game_templates, (values
  ('A1', '{"instructions":"Nimm dich auf: dein Name, deine Stadt und ein Hobby."}'::jsonb),
  ('A2', '{"instructions":"Beschreibe per Sprachnachricht, was du aus deinem Fenster siehst."}'::jsonb),
  ('B1', '{"instructions":"Fasse in 30 Sekunden den letzten Film zusammen, den du gesehen hast."}'::jsonb)
) as c(level, payload)
where key = 'voice_challenge';

insert into game_content (game_template_id, language_code, cefr_level, payload, source, source_license)
select id, 'de', c.level::cefr_level, c.payload, 'Lingua Match', 'hand-authored'
from game_templates, (values
  ('A1', '{"seed_sentence":"Gestern ich habe zur Schule gegangen mit meine Freund.","hint":"Wortstellung und Hilfsverb."}'::jsonb),
  ('A2', '{"seed_sentence":"Sie mag nicht früh aufstehen am Montag nicht.","hint":"Eine Verneinung zu viel."}'::jsonb),
  ('B1', '{"seed_sentence":"Ich wohne hier seit zwei Jahren und spreche noch nicht gut Deutsch nicht.","hint":"Verneinung und Satzbau."}'::jsonb)
) as c(level, payload)
where key = 'correction_challenge';
