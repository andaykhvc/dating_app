# UI audit (issue #30)

Scope and method: a code-level audit of every screen's source plus a browser check
of the public screens (landing, login, signup) at 360 / 390 / 768 / 1280 px in light
and dark. Screens behind sign-in (Discover, Matches, Messages, Play, Profile,
Settings, onboarding) could not be opened in a browser here because they need a live
Supabase project, so they were audited from the code, and are marked *code review*.
The owner can steer: add anything you know is ugly and it goes on the checklist.

## Findings

| # | Screen / component | Problem | Severity | Status |
| :-- | :-- | :-- | :-- | :-- |
| 1 | All (token `--ink-faint`) | Secondary text contrast 3.1:1 on paper, 2.8:1 on the sunken surface (light), 3.6-3.9:1 (dark); fails AA 4.5:1. Used for timestamps, hints, labels | High | Fixed: `#6b6679` (4.7:1) light, `#8f8aa0` (5.3:1) dark |
| 2 | All (`text-accent`) | Orange accent used as text: 2.7:1 on paper, 2.5:1 on its soft tint | High | Fixed: new `--accent-ink` token (`#b34f08`, 4.6-4.9:1) for text; the orange stays for fills and bars |
| 3 | All (`--positive`) | Green text on its soft tint 4.39:1 | Medium | Fixed: `#0d7248` (5.3:1) |
| 4 | 31 places across nav, chat, lessons, cards | Text at 10-11 px (`text-[0.625rem]`, `text-[0.6875rem]`), below the 12 px floor | High | Fixed: all now `text-xs` (12 px) |
| 5 | All interactive elements | Only 5 files defined a keyboard focus style; most buttons, links and inputs had the browser default or none | High | Fixed: one zero-specificity `:focus-visible` ring in `globals.css`; component styles still win |
| 6 | Back / close / menu icon buttons (settings, lesson, chat, report menu, discovery card, onboarding, edit profile, game session) | 40 px tap targets (`size-10`) | High | Fixed: `size-11` (44 px) |
| 7 | Chips, mission buttons, Unblock, syllabus lesson pills, type-exercise letter keys, Edit profile Save | 36-40 px tap targets | Medium | Fixed: `min-h-11` / `h-11` |
| 8 | Landing footer "Licenses" link | 16 px tall tap target | Medium | Fixed: 44 px target |
| 9 | Icon-only buttons without a name | None found: every icon-only button has an `aria-label` | - | OK |
| 10 | Public screens at 360 px | No horizontal overflow on landing, login, signup | - | OK |
| 11 | Chat (*code review*) | Long unbroken words in messages: bubbles use `[overflow-wrap:anywhere]` | - | OK |
| 12 | Photo badges ("Main", "In review") over photos | White-on-photo text relies on the badge background, not contrast against the photo | Low | Left: checklist |
| 13 | Discovery card / hero text on photos | `bg-black/45-55` scrims; legible, but not measured per photo | Low | Left: checklist |
| 14 | `<kbd>` hints (`hidden ... md:flex`) | Decorative on desktop only | Low | Left |
| 15 | Missing loading/empty/error states (*code review*) | Lists have empty states (matches, messages, blocked people, missions); the Discover deck shows a clear exhausted state; chat has skeletons | - | OK |
| 16 | Safe areas (*code review*) | `safe-top` / `safe-bottom` used in the headers, nav and sticky footers | - | OK |
| 17 | Spacing/radius consistency | Cards use `rounded-3xl border-line bg-raised`; buttons come from `Button`; a few one-off radii (`rounded-2xl` vs `rounded-3xl` in sub-cards) are intentional nesting | Low | Left |

## Not verified (needs the app running against Supabase)

Pixel-level checks of the signed-in screens at each width and in dark mode, the
installed-app (standalone) notch behaviour, and contrast of text placed directly
on user photos. Suggested owner pass: open each tab on a phone in light and dark and
note anything that still looks off, then add it here.
