import { createClient } from "@/lib/supabase/server";
import { PhotosStep } from "@/features/onboarding/components/PhotosStep";
import type { StoredPhoto } from "@/features/profile/PhotoManager";

export default async function PhotosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: photos } = await supabase
    .from("profile_photos")
    .select("id, storage_path, position")
    .eq("user_id", user!.id)
    .order("position");

  return (
    <PhotosStep userId={user!.id} initialPhotos={(photos ?? []) as StoredPhoto[]} />
  );
}
