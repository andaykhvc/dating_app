/**
 * Completed years since a "YYYY-MM-DD" date of birth, by the calendar in the
 * viewer's timezone.
 *
 * `new Date("2008-05-15")` is midnight UTC, which is still the 14th west of
 * Greenwich, so reading its local month and day shifted the birthday by a day
 * for anyone in the Americas. The date is split by hand instead.
 */
export function ageFromDateOfBirth(dob: string, now: Date = new Date()): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(dob);
  if (!match) return Number.NaN;
  const [year, month, day] = match.slice(1).map(Number);
  let age = now.getFullYear() - year;
  const monthDiff = now.getMonth() + 1 - month;
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < day)) {
    age -= 1;
  }
  return age;
}

export function isAtLeast18(dob: string, now: Date = new Date()): boolean {
  return ageFromDateOfBirth(dob, now) >= 18;
}

/**
 * The latest date of birth that still counts as 18, for a date input's max.
 * Today's date is read in local time (toISOString would use UTC), and 29
 * February lands on the 28th in a year without one, matching the database's
 * `current_date - interval '18 years'`.
 */
export function maxDateOfBirth(now: Date = new Date()): string {
  const year = now.getFullYear() - 18;
  const month = now.getMonth() + 1;
  const day = Math.min(now.getDate(), new Date(year, month, 0).getDate());
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeDay(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  // Calendar days, not 24-hour blocks: a message from 23:00 last night is
  // "Yesterday" at breakfast, and one from 08:00 two days ago is not.
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);

  if (days <= 0) return formatMessageTime(iso);
  if (days === 1) return "Yesterday";
  if (days < 7) return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { day: "numeric", month: "short" });
}

export function formatDayDivider(iso: string): string {
  const date = new Date(iso);
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86_400_000).toDateString();

  if (date.toDateString() === today) return "Today";
  if (date.toDateString() === yesterday) return "Yesterday";
  return date.toLocaleDateString([], {
    day: "numeric",
    month: "long",
    year:
      date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}
