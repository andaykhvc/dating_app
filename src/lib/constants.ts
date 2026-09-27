import type { Intention } from "@/types/domain";

export const APP_NAME = "Lingua Match";
export const APP_TAGLINE = "Learn a language with someone real.";

/** The three-line pitch, shared by the landing page and the auth screens. */
export const VALUE_PROPS = [
  {
    title: "Find someone worth talking to",
    body: "Swipe through people who speak what you are learning — and are learning what you speak.",
  },
  {
    title: "Never stare at an empty chat",
    body: "Every match arrives with a mission. A real thing to talk about, from the first message.",
  },
  {
    title: "Fix each other's mistakes",
    body: "Tap any message to suggest a correction. You both earn XP — no robot marking your grammar.",
  },
] as const;

export const MAX_PHOTOS = 6;
export const MAX_PHOTO_DIMENSION = 1280;
export const PHOTO_QUALITY = 0.75;
/** Avatars and gallery tiles never render above ~120px, so 320px covers 3x screens. */
export const THUMB_DIMENSION = 320;
export const THUMB_QUALITY = 0.7;
export const MESSAGE_PAGE_SIZE = 30;
export const DISCOVERY_BATCH_SIZE = 10;
/** Fetch the next batch before the deck empties, so swiping never stalls. */
export const DISCOVERY_REFILL_AT = 3;

export const XP_PER_LEVEL = 100;

export const INTENTION_LABELS: Record<Intention, string> = {
  language_buddy: "Language Buddy",
  friendship: "Friendship",
  cultural_exchange: "Cultural Exchange",
  open_to_dating: "Open to Dating",
};

export const INTENTION_DESCRIPTIONS: Record<Intention, string> = {
  language_buddy: "Here to practise, nothing else.",
  friendship: "Happy to make friends along the way.",
  cultural_exchange: "Curious about how people actually live.",
  open_to_dating: "Optional. Others can filter this out entirely.",
};

export const CEFR_DESCRIPTIONS: Record<string, string> = {
  A1: "Just starting",
  A2: "Basic phrases",
  B1: "Everyday conversation",
  B2: "Comfortable and fluent-ish",
  C1: "Advanced",
  C2: "Near native",
};

/** Europe and the US first — that is where the product is aimed. */
export const COUNTRIES: { code: string; name: string; flag: string }[] = [
  { code: "AT", name: "Austria", flag: "🇦🇹" },
  { code: "BE", name: "Belgium", flag: "🇧🇪" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "CZ", name: "Czechia", flag: "🇨🇿" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "DK", name: "Denmark", flag: "🇩🇰" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "FI", name: "Finland", flag: "🇫🇮" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "GR", name: "Greece", flag: "🇬🇷" },
  { code: "HU", name: "Hungary", flag: "🇭🇺" },
  { code: "IE", name: "Ireland", flag: "🇮🇪" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "NO", name: "Norway", flag: "🇳🇴" },
  { code: "PL", name: "Poland", flag: "🇵🇱" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "RO", name: "Romania", flag: "🇷🇴" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "TR", name: "Türkiye", flag: "🇹🇷" },
  { code: "US", name: "United States", flag: "🇺🇸" },
];

export const COUNTRY_BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));

export const REPORT_REASON_LABELS: Record<string, string> = {
  spam: "Spam or scam",
  harassment: "Harassment",
  inappropriate_content: "Inappropriate content",
  fake_profile: "Fake profile",
  underage: "Appears to be under 18",
  other: "Something else",
};
