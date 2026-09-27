import { TopBar } from "@/components/layout/TopBar";

export default function SettingsLoading() {
  return (
    <>
      <TopBar title="Settings" width="narrow" />
      <div aria-busy className="mx-auto w-full max-w-xl space-y-4 px-gutter py-5 md:space-y-5 md:py-8">
        <div className="skeleton h-32 rounded-3xl" />
        <div className="skeleton h-36 rounded-3xl" />
        <div className="skeleton h-11 rounded-full" />
      </div>
    </>
  );
}
