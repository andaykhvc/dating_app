import { TopBar } from "@/components/layout/TopBar";

export default function EditProfileLoading() {
  return (
    <>
      <TopBar title="Edit profile" width="wide" />
      <div
        aria-busy
        className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 px-gutter py-5 md:py-8 lg:grid-cols-2 lg:items-start lg:gap-6"
      >
        <div className="space-y-4 lg:space-y-6">
          <div className="skeleton h-72 rounded-3xl" />
          <div className="skeleton h-80 rounded-3xl" />
        </div>
        <div className="space-y-4 lg:space-y-6">
          <div className="skeleton h-56 rounded-3xl" />
          <div className="skeleton h-72 rounded-3xl" />
        </div>
      </div>
    </>
  );
}
