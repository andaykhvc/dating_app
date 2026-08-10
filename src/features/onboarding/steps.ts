export const ONBOARDING_STEPS = [
  { path: "/onboarding/basics", label: "About you" },
  { path: "/onboarding/location", label: "Where you are" },
  { path: "/onboarding/languages", label: "Languages" },
  { path: "/onboarding/photos", label: "Photos" },
  { path: "/onboarding/interests", label: "Interests" },
  { path: "/onboarding/bio", label: "Your line" },
  { path: "/onboarding/preferences", label: "Who you meet" },
  { path: "/onboarding/complete", label: "Done" },
] as const;

export function stepIndex(pathname: string): number {
  return ONBOARDING_STEPS.findIndex((s) => s.path === pathname);
}

export function nextStep(pathname: string): string {
  const i = stepIndex(pathname);
  return ONBOARDING_STEPS[Math.min(i + 1, ONBOARDING_STEPS.length - 1)].path;
}
