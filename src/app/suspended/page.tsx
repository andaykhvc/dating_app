import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/app/suspended/SignOutButton";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/queries";
import { SUPPORT_EMAIL } from "@/lib/support";

export const metadata: Metadata = { title: "Account unavailable" };

/** Where a suspended (or deleted) account lands instead of the app. */
export default async function SuspendedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_status")
    .eq("id", user.id)
    .single();

  // Anyone in good standing has no business here.
  if (!profile || profile.account_status === "active") redirect("/discover");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-gutter py-16 text-center">
      <h1 className="text-2xl font-bold tracking-tight text-ink">
        Your account is not available
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        {profile.account_status === "suspended"
          ? "Your account has been suspended because it did not follow our community guidelines."
          : "This account has been closed."}{" "}
        If you think this is a mistake, write to us
        {SUPPORT_EMAIL ? (
          <>
            {" "}at{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-brand hover:underline">
              {SUPPORT_EMAIL}
            </a>
          </>
        ) : null}
        .
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <Link
          href="/guidelines"
          className="flex h-12 items-center justify-center rounded-full border border-line bg-raised text-sm font-semibold text-ink hover:border-brand/40"
        >
          Community guidelines
        </Link>
        <SignOutButton />
      </div>
    </main>
  );
}
