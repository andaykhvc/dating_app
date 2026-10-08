import { MIN_CONFIDENCE, REJECT_AT, REJECT_REASON, REVIEW_AT } from "./thresholds.ts";
import type { ModerationResult } from "./types.ts";

/** A label as the provider reports it (shape of Rekognition's ModerationLabel). */
export type RawLabel = {
  Name?: unknown;
  ParentName?: unknown;
  Confidence?: unknown;
  TaxonomyLevel?: unknown;
};

/**
 * Turns the provider's labels into a verdict. Anything it does not understand
 * (a missing or malformed list) is 'review', never 'safe': the function fails
 * closed.
 */
export function verdictFromLabels(raw: unknown): ModerationResult {
  if (!Array.isArray(raw)) {
    return { verdict: "review", labels: [], scores: {} };
  }

  const labels = raw.filter(
    (l): l is { Name: string; ParentName?: string; Confidence: number } =>
      typeof l === "object" &&
      l !== null &&
      typeof (l as RawLabel).Name === "string" &&
      typeof (l as RawLabel).Confidence === "number" &&
      Number.isFinite((l as RawLabel).Confidence),
  );
  if (labels.length !== raw.length) {
    return { verdict: "review", labels: [], scores: {} };
  }

  // Resolve every label to its top-level category by following ParentName
  // through the labels that came back with it.
  const byName = new Map(labels.map((l) => [l.Name, l]));
  const topLevel = (label: { Name: string; ParentName?: string }): string => {
    let current = label;
    for (let hops = 0; hops < 4 && current.ParentName; hops++) {
      const parent = byName.get(current.ParentName);
      if (!parent) return current.ParentName;
      current = parent;
    }
    return current.Name;
  };

  const scores: Record<string, number> = {};
  for (const label of labels) {
    if (label.Confidence < MIN_CONFIDENCE) continue;
    const category = topLevel(label);
    scores[category] = Math.max(scores[category] ?? 0, label.Confidence);
  }
  const names = Object.keys(scores).sort();

  if (names.some((c) => c in REJECT_AT && scores[c] >= REJECT_AT[c])) {
    return { verdict: "unsafe", reason: REJECT_REASON, labels: names, scores };
  }
  if (names.some((c) => c in REVIEW_AT && scores[c] >= REVIEW_AT[c])) {
    return { verdict: "review", labels: names, scores };
  }
  return { verdict: "safe", labels: names, scores };
}
