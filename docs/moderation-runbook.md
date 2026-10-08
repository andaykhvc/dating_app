# Moderation runbook (for the owner, no database knowledge needed)

Everything below is pasted into the Supabase dashboard → **SQL Editor** and run
with the green button. The app cannot run any of it, only you can.

**Your promise to users** (it is written on the Help & Guidelines pages): every
report is looked at **within 24 hours**, and reports about someone **under 18**
or **explicit content** come first. Check the queue at least twice a day while
the app is new, for example morning and evening.

## 1. See what needs attention

```sql
select * from moderation_open_reports;
```

One row per open report, oldest first, **underage reports on top**. Columns:
`report_id`, `reason`, `details` (what the reporter wrote), who reported
(`reporter_name`), who was reported (`reported_name`, `reported_id`,
`reported_status`), `times_reported` (how many reports that person has in total)
and `match_id` (the conversation, if there was one).

## 2. Read the conversation for context

Copy the `match_id` from the row (skip this if it is empty):

```sql
select * from moderation_messages('PASTE-MATCH-ID-HERE');
```

Shows the last 20 messages with sender and time. Add a second number for more:
`moderation_messages('…', 100)`.

To look at the reported person's profile and photos:

```sql
select id, first_name, bio, city, country_code, account_status, created_at
from profiles where id = 'PASTE-REPORTED-ID-HERE';
select storage_path from profile_photos where user_id = 'PASTE-REPORTED-ID-HERE' order by position;
```

A photo is at `https://YOUR-PROJECT.supabase.co/storage/v1/object/public/profile-photos/` followed by its `storage_path`.

## 3. Decide

| What you found | What to do |
| --- | --- |
| Under 18, explicit photos or messages, threats, scams | **Suspend now** (step 4) and mark the report handled. |
| Rude or annoying but not serious | Dismiss the report (step 5). The reporter can already block them. |
| Several different people reported the same person (`times_reported` 3+) | Suspend, even if each report is mild. |
| You are unsure | Dismiss, and look again if another report comes. |

## 4. Suspend someone

```sql
select moderation_suspend('PASTE-REPORTED-ID-HERE', 'PASTE-REPORT-ID-HERE');
```

What happens at once: they can no longer swipe or send anything and see a
"Your account is not available" screen with the support address; their matches
end (the other people see the conversation as ended and can still read it);
they disappear from Discover and the ranking; the report is marked *reviewed*.
Leave out the second value if there is no report to close.

**Undo** (a mistake or an appeal you accept):

```sql
select moderation_reinstate('PASTE-USER-ID-HERE');
```

They can use the app again. Their old conversations stay ended; they have to match
again.

## 5. Close a report without suspending

```sql
select moderation_resolve_report('PASTE-REPORT-ID-HERE', 'dismissed');
```

Use `'reviewed'` instead of `'dismissed'` when you did something else (for example
you warned them by email).

## 6. People who wrote to the support address

Answer from the support mailbox. If someone says they were suspended by mistake,
find them with `select id, first_name, account_status from profiles where id in (select id from auth.users where email = 'their@email.com');`
and use step 4's undo if you agree.

## Evidence and privacy

Reports and messages stay in the database; do not copy them elsewhere. Do not
share a reported person's details with the reporter. If the police ask for
information, answer only on a written request and tell the person whose data it
is only if the law allows.

## What is NOT automatic yet

- Photos are not checked by a machine (see #49 and #50); only reports reveal them.
- Nobody is notified when a report arrives. Open the queue on your schedule, or
  say the word and we can add an email or push alert.
