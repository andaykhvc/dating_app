-- 0006_game_content_es.sql
-- Playable content for learners of Spanish.

insert into game_content (game_template_id, language_code, cefr_level, payload, source, source_license)
select id, 'es', c.level::cefr_level, c.payload, 'Lingua Match', 'hand-authored'
from game_templates, (values
  ('A1', '{"sentence":"Yo ____ en Madrid.","choices":["vivo","bebo","compro","duermo"],"answer":"vivo"}'::jsonb),
  ('A1', '{"sentence":"Ella ____ café todas las mañanas.","choices":["bebe","beber","bebido","bebí"],"answer":"bebe"}'::jsonb),
  ('A2', '{"sentence":"Ayer ____ al cine con mis amigos.","choices":["fui","voy","iba","iré"],"answer":"fui"}'::jsonb),
  ('A2', '{"sentence":"El libro ____ encima de la mesa.","choices":["está","es","hay","tiene"],"answer":"está"}'::jsonb),
  ('B1', '{"sentence":"Espero que ____ un buen viaje.","choices":["tengas","tienes","tendrás","tenías"],"answer":"tengas"}'::jsonb),
  ('B1', '{"sentence":"Llevo tres años ____ español.","choices":["estudiando","estudiar","estudiado","estudio"],"answer":"estudiando"}'::jsonb),
  ('B2', '{"sentence":"Si hubiera salido antes, no ____ perdido el tren.","choices":["habría","habrá","había","haya"],"answer":"habría"}'::jsonb)
) as c(level, payload)
where key = 'missing_word';

insert into game_content (game_template_id, language_code, cefr_level, payload, source, source_license)
select id, 'es', c.level::cefr_level, c.payload, 'Lingua Match', 'hand-authored'
from game_templates, (values
  ('A1', '{"prompt":"How are you?","prompt_language":"en","choices":["¿Cómo estás?","¿Dónde vives?","¿Qué haces?","¿Quién eres?"],"answer":"¿Cómo estás?"}'::jsonb),
  ('A1', '{"prompt":"Thank you very much","prompt_language":"en","choices":["Muchas gracias","De nada","Buenos días","Hasta luego"],"answer":"Muchas gracias"}'::jsonb),
  ('A2', '{"prompt":"The bill, please","prompt_language":"en","choices":["La cuenta, por favor","Otra cerveza","Está muy rico","¿Dónde está el baño?"],"answer":"La cuenta, por favor"}'::jsonb),
  ('B1', '{"prompt":"It depends on the weather","prompt_language":"en","choices":["Depende del tiempo","Hace buen tiempo","No me gusta el tiempo","Llueve mucho"],"answer":"Depende del tiempo"}'::jsonb),
  ('B1', '{"prompt":"I am looking forward to it","prompt_language":"en","choices":["Tengo muchas ganas","Lo estoy pensando","Estoy esperando","Me preocupa"],"answer":"Tengo muchas ganas"}'::jsonb),
  ('B2', '{"prompt":"That is beside the point","prompt_language":"en","choices":["Eso no viene al caso","Me da igual","Eso depende","No pasa nada"],"answer":"Eso no viene al caso"}'::jsonb)
) as c(level, payload)
where key = 'translation_choice';

insert into game_content (game_template_id, language_code, cefr_level, payload, source, source_license)
select id, 'es', c.level::cefr_level, c.payload, 'Lingua Match', 'hand-authored'
from game_templates, (values
  ('A1', '{"tokens":["hoy","voy","a","la","playa"],"answer":"hoy voy a la playa"}'::jsonb),
  ('A1', '{"tokens":["ella","vive","en","Sevilla"],"answer":"ella vive en Sevilla"}'::jsonb),
  ('A2', '{"tokens":["nunca","hemos","estado","en","Italia"],"answer":"nunca hemos estado en Italia"}'::jsonb),
  ('B1', '{"tokens":["la","película","fue","mejor","de","lo","que","esperaba"],"answer":"la película fue mejor de lo que esperaba"}'::jsonb),
  ('B2', '{"tokens":["aunque","llovía","salimos","a","dar","un","paseo"],"answer":"aunque llovía salimos a dar un paseo"}'::jsonb)
) as c(level, payload)
where key = 'word_order';

insert into game_content (game_template_id, language_code, cefr_level, payload, source, source_license)
select id, 'es', c.level::cefr_level, c.payload, 'Lingua Match', 'hand-authored'
from game_templates, (values
  ('A2', '{"prompt":"¿Cuál es tu trabajo soñado y por qué?"}'::jsonb),
  ('A2', '{"prompt":"¿Cómo es un domingo perfecto para ti?"}'::jsonb),
  ('B1', '{"prompt":"¿Qué malentiende la gente sobre tu país?"}'::jsonb),
  ('B1', '{"prompt":"¿Cuál es la mejor comida que has probado?"}'::jsonb),
  ('B2', '{"prompt":"¿Qué habilidad aprenderías si el tiempo y el dinero no importaran?"}'::jsonb)
) as c(level, payload)
where key = 'ask_your_partner';

insert into game_content (game_template_id, language_code, cefr_level, payload, source, source_license)
select id, 'es', c.level::cefr_level, c.payload, 'Lingua Match', 'hand-authored'
from game_templates, (values
  ('A2', '{"instructions":"Hazle tres preguntas a tu pareja sobre la ciudad donde vive.","suggested_questions":["¿Cómo es tu barrio?","¿Adónde vas una tarde libre?","¿Qué le enseñarías primero a un visitante?"],"target_exchanges":3}'::jsonb),
  ('B1', '{"instructions":"Planead juntos un fin de semana, todo en español.","suggested_questions":["¿Adónde vamos?","¿Cómo llegamos?","¿Qué hacemos la primera noche?"],"target_exchanges":3}'::jsonb),
  ('B1', '{"instructions":"Comparad cómo se celebran los cumpleaños en vuestros países.","suggested_questions":["¿Quién organiza la fiesta?","¿Hay una comida típica?","¿Qué sorprendería a un extranjero?"],"target_exchanges":3}'::jsonb)
) as c(level, payload)
where key = 'conversation_mission';

insert into game_content (game_template_id, language_code, cefr_level, payload, source, source_license)
select id, 'es', c.level::cefr_level, c.payload, 'Lingua Match', 'hand-authored'
from game_templates, (values
  ('A1', '{"instructions":"Grábate diciendo tu nombre, tu ciudad y una afición."}'::jsonb),
  ('A2', '{"instructions":"Graba un audio describiendo lo que ves desde tu ventana."}'::jsonb),
  ('B1', '{"instructions":"Resume en 30 segundos la última película o serie que viste."}'::jsonb)
) as c(level, payload)
where key = 'voice_challenge';

insert into game_content (game_template_id, language_code, cefr_level, payload, source, source_license)
select id, 'es', c.level::cefr_level, c.payload, 'Lingua Match', 'hand-authored'
from game_templates, (values
  ('A1', '{"seed_sentence":"Ayer yo fui a la escuela con mi amigo y comimos mucho comida.","hint":"Concordancia de género."}'::jsonb),
  ('A2', '{"seed_sentence":"Ella no le gusta levantarse temprano los lunes.","hint":"Fíjate en el pronombre."}'::jsonb),
  ('B1', '{"seed_sentence":"Estoy viviendo aquí desde dos años y todavía no hablo bien.","hint":"Cómo se expresa la duración."}'::jsonb)
) as c(level, payload)
where key = 'correction_challenge';
