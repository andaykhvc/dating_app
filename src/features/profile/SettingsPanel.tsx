"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/constants";
import { InstallSettings } from "@/features/install/InstallSettings";

type BlockedUser = {
  user_id: string;
  first_name: string | null;
  primary_photo_path: string | null;
  blocked_at: string;
};

export function SettingsPanel({ blocked }: { blocked: BlockedUser[] }) {
  const router = useRouter();
  const [list, setList] = useState(blocked);
  const [busy, setBusy] = useState<string | null>(null);

  async function unblock(userId: string) {
    setBusy(userId);
    const supabase = createClient();
    const { error } = await supabase
      .from("blocks")
      .delete()
      .eq("blocked_id", userId);

    if (!error) setList((prev) => prev.filter((b) => b.user_id !== userId));
    setBusy(null);
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 px-gutter py-5 md:space-y-5 md:py-8">
      <InstallSettings />
      <section className="rounded-3xl border border-line bg-raised p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-faint">
          Blocked people
        </h2>
        {list.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            You have not blocked anyone. Blocking someone ends the match and
            stops them appearing in Discover.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {list.map((person) => (
              <li
                key={person.user_id}
                className="flex items-center gap-3 rounded-2xl bg-sunken p-3"
              >
                <Avatar
                  storagePath={person.primary_photo_path}
                  name={person.first_name}
                  userId={person.user_id}
                  size={40}
                />
                <span className="flex-1 truncate text-sm font-medium text-ink">
                  {person.first_name ?? "Someone"}
                </span>
                <button
                  type="button"
                  onClick={() => unblock(person.user_id)}
                  disabled={busy === person.user_id}
                  className="min-h-11 shrink-0 rounded-full px-3.5 text-xs font-semibold text-brand hover:bg-brand-soft disabled:opacity-50"
                >
                  Unblock
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-3xl border border-line bg-raised p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-faint">
          Safety
        </h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
          <li>{APP_NAME} is 18+. Report anyone who appears to be underage.</li>
          <li>Your exact location is never stored or shown — city and country only.</li>
          <li>Report and block are in the menu at the top of every chat.</li>
        </ul>
      </section>

      <Link
        href="/licenses"
        className="flex items-center justify-between rounded-3xl border border-line bg-raised p-5 text-sm font-semibold text-ink transition-colors hover:border-brand/40"
      >
        Licenses &amp; attributions
        <span aria-hidden className="text-faint">›</span>
      </Link>

      <Button variant="secondary" fullWidth onClick={signOut}>
        Sign out
      </Button>
    </div>
  );
}
