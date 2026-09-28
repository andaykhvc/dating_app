import { PageBody } from "@/components/layout/Page";

export default function ProfileLoading() {
  return (
    <PageBody width="narrow">
      <p role="status" className="mb-4 text-sm text-muted">
        Loading profile…
      </p>
      <div
        aria-hidden="true"
        className="h-96 animate-pulse rounded-3xl bg-sunken"
      />
    </PageBody>
  );
}
