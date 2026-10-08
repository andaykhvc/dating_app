import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/queries";
import { PhotosStep } from "@/features/onboarding/components/PhotosStep";
import type { StoredPhoto } from "@/features/profile/PhotoManager";
import { STORED_PHOTO_COLUMNS } from "@/lib/photos";

export default async function PhotosPage() {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);

  const { data: photos } = await supabase
    .from("profile_photos")
    .select(STORED_PHOTO_COLUMNS)
    .eq("user_id", user!.id)
    .order("position");

  return (
    <PhotosStep userId={user!.id} initialPhotos={(photos ?? []) as StoredPhoto[]} />
  );
}
