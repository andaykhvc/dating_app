export type LeaderboardEntry = {
  id: string;
  first_name: string;
  primary_photo_path: string | null;
  total_xp: number;
  level: number;
  rank: number;
};

export type Leaderboard = {
  entries: LeaderboardEntry[];
  current_user: LeaderboardEntry | null;
};
