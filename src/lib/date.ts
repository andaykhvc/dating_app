export function ageFromDateOfBirth(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

export function isAtLeast18(dob: string): boolean {
  return ageFromDateOfBirth(dob) >= 18;
}

/** The latest date of birth that still counts as 18, for a date input's max. */
export function maxDateOfBirth(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().slice(0, 10);
}

export function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeDay(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const days = Math.floor((now.getTime() - date.getTime()) / 86_400_000);

  if (days === 0) return formatMessageTime(iso);
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
