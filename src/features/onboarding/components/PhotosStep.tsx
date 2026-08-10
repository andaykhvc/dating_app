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

  return (
    <StepShell
      title="Add a photo or two"
      subtitle="Photos are shrunk on your phone before upload, so this works fine on a slow connection."
      onContinue={() => router.push("/onboarding/interests")}
      canContinue={photos.length > 0}
      continueLabel={photos.length > 0 ? "Continue" : "Add at least one photo"}
    >
      <PhotoManager userId={userId} photos={photos} onChange={setPhotos} />
      <p className="mt-4 text-xs leading-relaxed text-faint">
        The first photo is the one people see while swiping. Up to six in total.
      </p>
    </StepShell>
  );
}
