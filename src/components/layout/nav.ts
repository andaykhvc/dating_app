import {
  DiscoverIcon,
  MatchesIcon,
  MessagesIcon,
  PlayIcon,
  ProfileIcon,
} from "@/components/icons";

export const TABS = [
  { href: "/discover", label: "Discover", Icon: DiscoverIcon },
  { href: "/matches", label: "Matches", Icon: MatchesIcon },
  { href: "/play", label: "Learn", Icon: PlayIcon },
  { href: "/messages", label: "Messages", Icon: MessagesIcon },
  { href: "/profile", label: "Profile", Icon: ProfileIcon },
] as const;

export function isTabActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** An open chat, a challenge or a lesson in progress owns the whole phone screen. */
export function isImmersive(pathname: string) {
  return (
    /^\/messages\/[^/]+$/.test(pathname) ||
    /^\/play\/session\/[^/]+$/.test(pathname) ||
    /^\/play\/lesson\/[^/]+$/.test(pathname) ||
    /^\/play\/practice\/[^/]+$/.test(pathname)
  );
}
