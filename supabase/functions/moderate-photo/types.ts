/** What a provider adapter returns. Image bytes go in; labels and scores come out. */
export type Verdict = "safe" | "unsafe" | "review";

export type ModerationResult = {
  verdict: Verdict;
  /** Human-readable reason for 'unsafe', shown to the photo's owner. */
  reason?: string;
  labels: string[];
  scores: Record<string, number>;
};

export interface ModerationProvider {
  readonly name: string;
  moderate(imageBytes: Uint8Array): Promise<ModerationResult>;
}

export type ModerationMode = "off" | "shadow" | "enforce";

export function parseMode(value: string | undefined | null): ModerationMode {
  return value === "shadow" || value === "enforce" ? value : "off";
}
