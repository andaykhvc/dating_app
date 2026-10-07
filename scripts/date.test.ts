import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ageFromDateOfBirth,
  formatMessageTime,
  formatRelativeDay,
  isAtLeast18,
  maxDateOfBirth,
} from "../src/lib/date.ts";

// Local-time constructors on purpose: the code under test works in the
// viewer's timezone, and these tests are run under several (see PR).
const local = (y: number, m: number, d: number, h = 12, min = 0) =>
  new Date(y, m - 1, d, h, min);

test("age turns over on the birthday itself, in the viewer's calendar", () => {
  assert.equal(ageFromDateOfBirth("2008-05-15", local(2026, 5, 14)), 17);
  assert.equal(ageFromDateOfBirth("2008-05-15", local(2026, 5, 15, 0, 5)), 18);
  assert.equal(ageFromDateOfBirth("2008-05-15", local(2026, 5, 15, 23, 59)), 18);
  assert.equal(ageFromDateOfBirth("2008-05-15", local(2026, 12, 31)), 18);
});

test("18+ check agrees with the database rule on the day before and the day of", () => {
  assert.equal(isAtLeast18("2008-05-15", local(2026, 5, 14)), false);
  assert.equal(isAtLeast18("2008-05-15", local(2026, 5, 15)), true);
  assert.equal(isAtLeast18("not-a-date", local(2026, 5, 15)), false);
  assert.equal(isAtLeast18("", local(2026, 5, 15)), false);
});

test("a 29 February birthday is 18 on 1 March, like current_date - interval '18 years'", () => {
  assert.equal(isAtLeast18("2008-02-29", local(2026, 2, 28)), false);
  assert.equal(isAtLeast18("2008-02-29", local(2026, 3, 1)), true);
});

test("max date of birth is today minus 18 years, in local time", () => {
  assert.equal(maxDateOfBirth(local(2026, 5, 15, 0, 30)), "2008-05-15");
  assert.equal(maxDateOfBirth(local(2026, 5, 15, 23, 30)), "2008-05-15");
  assert.equal(maxDateOfBirth(local(2026, 1, 1)), "2008-01-01");
  // 2010 has no 29 February; the 28th is the latest valid birthday that day.
  assert.equal(maxDateOfBirth(local(2028, 2, 29)), "2010-02-28");
  assert.equal(isAtLeast18(maxDateOfBirth(local(2026, 5, 15)), local(2026, 5, 15)), true);
});

test("relative day counts calendar days, not 24-hour blocks", () => {
  const now = local(2026, 5, 15, 8, 0);
  const at = (d: Date) => d.toISOString();

  // Last night at 23:00 is only 9 hours ago, but it is yesterday.
  assert.equal(formatRelativeDay(at(local(2026, 5, 14, 23, 0)), now), "Yesterday");
  // Earlier today shows the time.
  const today = local(2026, 5, 15, 1, 0);
  assert.equal(formatRelativeDay(at(today), now), formatMessageTime(at(today)));
  // Two days ago at 08:30 is 47.5 hours ago; it must not be "Yesterday".
  const twoDays = local(2026, 5, 13, 8, 30);
  assert.notEqual(formatRelativeDay(at(twoDays), now), "Yesterday");
  assert.equal(
    formatRelativeDay(at(twoDays), now),
    twoDays.toLocaleDateString([], { weekday: "short" }),
  );
  // A week or more shows the date.
  const old = local(2026, 5, 1, 10, 0);
  assert.equal(
    formatRelativeDay(at(old), now),
    old.toLocaleDateString([], { day: "numeric", month: "short" }),
  );
});

test("a timestamp slightly in the future (clock skew) shows the time, not a negative day count", () => {
  const now = local(2026, 5, 15, 8, 0);
  const soon = local(2026, 5, 15, 8, 2);
  assert.equal(formatRelativeDay(soon.toISOString(), now), formatMessageTime(soon.toISOString()));
});
