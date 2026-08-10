-- 0004_chat_tables.sql
-- Messages and peer-authored language corrections.

-- bigint identity PK doubles as the keyset pagination cursor.
create table messages (
  id bigint generated always as identity primary key,
  match_id uuid not null references matches (id) on delete cascade,
  sender_id uuid not null references profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  reply_to_message_id bigint references messages (id) on delete set null,
  delivery_state text not null default 'sent' check (delivery_state in ('sent', 'delivered')),
  created_at timestamptz not null default now()
);

alter table reports
  add constraint reports_message_id_fkey
  foreign key (message_id) references messages (id) on delete set null;

-- One correction per message keeps rendering unambiguous; a second attempt
-- upserts over the first rather than stacking.
create table message_corrections (
  id uuid primary key default gen_random_uuid(),
  message_id bigint not null unique references messages (id) on delete cascade,
  corrector_id uuid not null references profiles (id) on delete cascade,
  corrected_text text not null check (char_length(corrected_text) between 1 and 2000),
  note text check (char_length(note) <= 300),
  created_at timestamptz not null default now()
);
