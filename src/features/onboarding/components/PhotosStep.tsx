"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepShell } from "@/features/onboarding/components/StepShell";
import { PhotoManager, type StoredPhoto } from "@/features/profile/PhotoManager";

export function PhotosStep({
  userId,
  initialPhotos,
}: {
  userId: string;
  initialPhotos: StoredPhoto[];
}) {
  const router = useRouter();
  const [photos, setPhotos] = useState(initialPhotos);
  // Pending is fine (review happens in the background); a rejected photo is not a photo.
  const hasUsablePhoto = photos.some((p) => p.moderation_status !== "rejected");

  return (
    <StepShell
      title="Add a photo or two"
      subtitle="Photos are shrunk on your phone before upload, so this works fine on a slow connection."
      onContinue={() => router.push("/onboarding/interests")}
      canContinue={hasUsablePhoto}
      continueLabel={hasUsablePhoto ? "Continue" : "Add at least one photo"}
    >
      <PhotoManager userId={userId} photos={photos} onChange={setPhotos} />
      <p className="mt-4 text-xs leading-relaxed text-faint">
        The first approved photo is the one people see while swiping. Up to six in total.
      </p>
    </StepShell>
  );
}
