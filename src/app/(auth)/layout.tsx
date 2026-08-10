import Link from "next/link";
import { LogoMark } from "@/components/icons";
import { APP_NAME } from "@/lib/constants";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-10 pt-14">
      <Link href="/" className="flex items-center gap-2.5 text-brand">
        <LogoMark className="size-8" />
        <span className="font-bold tracking-tight text-ink">{APP_NAME}</span>
      </Link>
      <div className="flex flex-1 flex-col justify-center py-8">{children}</div>
    </main>
  );
}
