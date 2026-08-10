"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DiscoverIcon,
  MatchesIcon,
  MessagesIcon,
  PlayIcon,
  ProfileIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/discover", label: "Discover", Icon: DiscoverIcon },
  { href: "/matches", label: "Matches", Icon: MatchesIcon },
  { href: "/play", label: "Play", Icon: PlayIcon },
  { href: "/messages", label: "Messages", Icon: MessagesIcon },
  { href: "/profile", label: "Profile", Icon: ProfileIcon },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  // An open chat or a challenge in progress owns the bottom of the screen.
  const immersive =
    /^\/messages\/[^/]+$/.test(pathname) ||
    /^\/play\/session\/[^/]+$/.test(pathname);
  if (immersive) return null;

  return (
    <nav className="safe-bottom sticky bottom-0 z-30 border-t border-line bg-raised/95 backdrop-blur-lg">
      <ul className="mx-auto flex max-w-md items-stretch">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 transition-colors",
                  active ? "text-brand" : "text-faint hover:text-muted",
                )}
              >
                <Icon className="size-6" filled={active} />
                <span className="text-[0.6875rem] font-medium">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
