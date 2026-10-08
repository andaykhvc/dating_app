export type InfoLocale = "en" | "de";

export type InfoSection = { heading: string; body: string[] };

export type InfoContent = Record<
  InfoLocale,
  { title: string; intro: string; sections: InfoSection[] }
>;

export function pickLocale(value: string | string[] | undefined): InfoLocale {
  return (Array.isArray(value) ? value[0] : value) === "de" ? "de" : "en";
}
