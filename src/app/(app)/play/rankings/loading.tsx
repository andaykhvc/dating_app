import { PageBody } from "@/components/layout/Page";

export default function RankingsLoading() {
  return (
    <PageBody className="space-y-4">
      <p role="status" className="text-sm text-muted">
        Loading rankings…
      </p>
      <div aria-hidden="true" className="animate-pulse space-y-3">
        <div className="h-40 rounded-3xl bg-sunken" />
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-sunken" />
        ))}
      </div>
    </PageBody>
  );
}
