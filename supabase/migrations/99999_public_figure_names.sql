-- 99999_public_figure_names.sql
-- Stops profiles from using the name of a Turkish political figure as their
-- name (impersonation / trolling). This is a safety rule about names, not a
-- statement about anyone. It reuses the name filter from 99998_name_moderation.sql
-- (same normalisation, same trigger, same error), so Turkish letters, accents,
-- separators ("R.T. Erdoğan") and stretched letters are all handled.
--
-- The rule for what goes in this list matters more than the list itself, because
-- many of these are very common ordinary names (Recep, Ekrem, Özel, Yılmaz,
-- İmamoğlu ...). So:
--   * FULL-NAME PHRASES are blocked ("recep tayyip erdogan"), matched as whole
--     words in that order. A bare given name or a bare common surname is NOT
--     blocked, so Recep, Tayyip, Erdoğan, "Recep Erdoğan" and "Ayşe Özel" all
--     stay usable.
--   * A surname alone is blocked only where it is rare enough that it is
--     practically the politician's (Kılıçdaroğlu, Hatimoğulları).
--   * Historical figures such as Atatürk are NOT included: his name is common
--     and culturally normal, and using it is not impersonation.
--   * Only names. No opinions, nicknames or insults.
--
-- Who and why (checked 2026-10-08; offices change, the list is easy to edit):
--   Recep Tayyip Erdoğan  President; AKP chair
--   Devlet Bahçeli        MHP chair
--   Kemal Kılıçdaroğlu    CHP chair, reinstated by court order 2026-05-21
--   Özgür Özel            former CHP chair; announced a new party 2026-07-21
--   Ekrem İmamoğlu        mayor of Istanbul (CHP)
--   Mansur Yavaş          mayor of Ankara (CHP)
--   Cevdet Yılmaz         Vice President since 2023-06-04
--   Müsavat Dervişoğlu    İYİ Party chair
--   Tuncer Bakırhan, Tülay Hatimoğulları   DEM Party co-chairs (from general
--                         knowledge, NOT confirmed in a 2026 source: verify)
--   Ahmet Davutoğlu, Ali Babacan   leaders of opposition parties (general
--                         knowledge: verify)
--   Sources: https://en.wikipedia.org/wiki/67th_cabinet_of_Turkey ,
--   https://pukmedia.com/EN/Details/81564 , https://yetkinreport.com/en/2026/07/21/ozgur-ozel-leaves-chp-to-form-a-new-party/ ,
--   https://www.hurriyet.com.tr/gundem/dervisoglundan-27-haziran-cikisi-43200918
--
-- Edit it with SQL, see docs/moderation-names.md.

insert into blocked_terms (term, language, category, match_mode) values
  ('Recep Tayyip Erdoğan', 'tr', 'public_figure', 'word'),
  ('Tayyip Erdoğan',       'tr', 'public_figure', 'word'),
  ('R T Erdoğan',          'tr', 'public_figure', 'word'),
  ('Devlet Bahçeli',       'tr', 'public_figure', 'word'),
  ('Kemal Kılıçdaroğlu',   'tr', 'public_figure', 'word'),
  ('Kılıçdaroğlu',         'tr', 'public_figure', 'word'),
  ('Özgür Özel',           'tr', 'public_figure', 'word'),
  ('Ekrem İmamoğlu',       'tr', 'public_figure', 'word'),
  ('Mansur Yavaş',         'tr', 'public_figure', 'word'),
  ('Cevdet Yılmaz',        'tr', 'public_figure', 'word'),
  ('Müsavat Dervişoğlu',   'tr', 'public_figure', 'word'),
  ('Tuncer Bakırhan',      'tr', 'public_figure', 'word'),
  ('Hatimoğulları',        'tr', 'public_figure', 'word'),
  ('Ahmet Davutoğlu',      'tr', 'public_figure', 'word'),
  ('Ali Babacan',          'tr', 'public_figure', 'word')
on conflict (term_norm, match_mode) do nothing;
