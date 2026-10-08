import type { MessageKey } from "@/i18n/messages";
import {
  DiscoverIcon,
  MatchesIcon,
  MessagesIcon,
  PlayIcon,
  ProfileIcon,
} from "@/components/icons";

export const TABS = [
  { href: "/discover", labelKey: "nav.discover", Icon: DiscoverIcon },
  { href: "/matches", labelKey: "nav.matches", Icon: MatchesIcon },
  { href: "/play", labelKey: "nav.learn", Icon: PlayIcon },
  { href: "/messages", labelKey: "nav.messages", Icon: MessagesIcon },
  { href: "/profile", labelKey: "nav.profile", Icon: ProfileIcon },
] as const satisfies readonly { href: string; labelKey: MessageKey; Icon: unknown }[];

export function isTabActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** An open chat, a challenge or a lesson in progress owns the whole phone screen. */
export function isImmersive(pathname: string) {
  return (
    /^\/messages\/[^/]+$/.test(pathname) ||
    /^\/play\/session\/[^/]+$/.test(pathname) ||
    /^\/play\/lesson\/[^/]+$/.test(pathname)
  );
}
