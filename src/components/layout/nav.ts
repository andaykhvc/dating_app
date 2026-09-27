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
  { href: "/play", label: "Play", Icon: PlayIcon },
  { href: "/messages", label: "Messages", Icon: MessagesIcon },
  { href: "/profile", label: "Profile", Icon: ProfileIcon },
] as const;

export function isTabActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** An open chat or a challenge in progress owns the whole phone screen. */
export function isImmersive(pathname: string) {
  return (
    /^\/messages\/[^/]+$/.test(pathname) ||
    /^\/play\/session\/[^/]+$/.test(pathname)
  );
}
