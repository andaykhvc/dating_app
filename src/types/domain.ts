export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

export const INTENTIONS = [
  "language_buddy",
  "friendship",
  "cultural_exchange",
  "open_to_dating",
] as const;
export type Intention = (typeof INTENTIONS)[number];

export type LanguageRole = "native" | "learning";
export type SwipeAction = "like" | "pass";
export type League = "bronze" | "silver" | "gold";

export type Language = {
  code: string;
  name: string;
  native_name: string | null;
  flag_emoji: string | null;
  is_launch_language: boolean;
};

export type Interest = {
  id: number;
  key: string;
  label: string;
  emoji: string | null;
};

export type UserLanguage = {
  role: LanguageRole;
  language_code: string;
  language_name: string;
  flag_emoji: string | null;
  cefr_level: CefrLevel | null;
};

/** Own profile row. Only ever readable by its owner. */
export type Profile = {
  id: string;
  first_name: string | null;
  date_of_birth: string | null;
  is_18_plus_confirmed: boolean;
  country_code: string | null;
  city: string | null;
  bio: string | null;
  intentions: Intention[];
  preferred_age_min: number;
  preferred_age_max: number;
  preferred_countries: string[];
  hide_dating_profiles: boolean;
  primary_photo_path: string | null;
  account_status: string;
  is_photo_verified: boolean;
  onboarding_completed_at: string | null;
};

/** Someone else, as returned by discover_profiles(). */
export type DiscoveryCard = {
  id: string;
  first_name: string;
  age: number;
  country_code: string;
  city: string | null;
  bio: string | null;
  intentions: Intention[];
  primary_photo_path: string | null;
  is_photo_verified: boolean;
  languages: UserLanguage[];
  interests: Pick<Interest, "key" | "label" | "emoji">[];
};

/** get_profile_card() — the discovery card plus the full gallery. */
export type ProfileCard = DiscoveryCard & {
  photos: { id: string; storage_path: string }[];
  progress: { level: number; league: League } | null;
};

export type MatchMission = {
  match_mission_id: string;
  title: string;
  description: string;
  steps_completed: number;
  target_steps: number;
  xp_reward_per_step: number;
  game_template_id: number | null;
};

export type MatchSummary = {
  match_id: string;
  status: "active" | "unmatched";
  matched_at: string;
  partner: {
    id: string;
    first_name: string;
    age: number;
    country_code: string;
    city: string | null;
    primary_photo_path: string | null;
    languages: UserLanguage[];
  };
  last_message: {
    id: number;
    body: string;
    created_at: string;
    is_mine: boolean;
  } | null;
  mission: MatchMission | null;
};

export type Message = {
  id: number;
  match_id: string;
  sender_id: string;
  body: string;
  reply_to_message_id: number | null;
  delivery_state: "sent" | "delivered";
  created_at: string;
};

export type MessageCorrection = {
  id: string;
  message_id: number;
  corrector_id: string;
  corrected_text: string;
  note: string | null;
  created_at: string;
};

export type ChatMessage = Message & {
  reply_to: Pick<Message, "id" | "body" | "sender_id"> | null;
  correction: MessageCorrection | null;
};

export type UserProgress = {
  total_xp: number;
  level: number;
  league: League;
  current_streak_days: number;
  longest_streak_days: number;
  last_activity_date: string | null;
  xp_into_level: number;
  xp_for_next_level: number;
};

export type SwipeResult = {
  matched: boolean;
  match_id: string | null;
  is_new?: boolean;
};

export const REPORT_REASONS = [
  "spam",
  "harassment",
  "inappropriate_content",
  "fake_profile",
  "underage",
  "other",
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];
