import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { EditProfileForm } from "@/features/profile/EditProfileForm";
import type { StoredPhoto } from "@/features/profile/PhotoManager";
import type { CefrLevel, Intention, Interest, Language } from "@/types/domain";

export const metadata: Metadata = { title: "Edit profile" };

export default async function EditProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: profile },
    { data: photos },
    { data: languages },
    { data: userLanguages },
    { data: interests },
    { data: myInterests },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "first_name, city, country_code, bio, intentions, preferred_age_min, preferred_age_max, preferred_countries, hide_dating_profiles",
      )
      .eq("id", user!.id)
      .single(),
    supabase
      .from("profile_photos")
      .select("id, storage_path, position")
      .eq("user_id", user!.id)
      .order("position"),
    supabase
      .from("languages")
      .select("code, name, native_name, flag_emoji, is_launch_language")
      .order("is_launch_language", { ascending: false })
      .order("name"),
    supabase
      .from("user_languages")
      .select("language_code, role, cefr_level")
      .eq("user_id", user!.id),
    supabase.from("interests").select("id, key, label, emoji").order("id"),
    supabase.from("user_interests").select("interest_id").eq("user_id", user!.id),
  ]);

  const native = userLanguages?.find((l) => l.role === "native");
  const learning = userLanguages?.find((l) => l.role === "learning");

  return (
    <EditProfileForm
      userId={user!.id}
      languages={(languages ?? []) as Language[]}
      interests={(interests ?? []) as Interest[]}
      initial={{
        firstName: profile?.first_name ?? "",
        city: profile?.city ?? "",
        countryCode: profile?.country_code ?? "",
        bio: profile?.bio ?? "",
        intentions: (profile?.intentions ?? []) as Intention[],
        ageMin: profile?.preferred_age_min ?? 18,
        ageMax: profile?.preferred_age_max ?? 45,
        countries: profile?.preferred_countries ?? [],
        hideDating: profile?.hide_dating_profiles ?? false,
        native: native?.language_code ?? "",
        learning: learning?.language_code ?? "",
        level: (learning?.cefr_level as CefrLevel) ?? "A1",
        photos: (photos ?? []) as StoredPhoto[],
        interestIds: (myInterests ?? []).map((r) => r.interest_id as number),
      }}
    />
  );
}
