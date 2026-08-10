"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image/compressImage";
import { photoUrl, PHOTO_BUCKET } from "@/lib/photos";
import { MAX_PHOTOS } from "@/lib/constants";

export type StoredPhoto = { id: string; storage_path: string; position: number };

/**
 * Shared by onboarding and profile editing.
 *
 * Photos are compressed to WebP in the browser first, so a 6 MB camera roll
 * photo lands in Storage at roughly 100-150 KB. Position 0 is the card photo;
 * a trigger keeps profiles.primary_photo_path pointing at it.
 */
export function PhotoManager({
  userId,
  photos,
  onChange,
}: {
  userId: string;
  photos: StoredPhoto[];
  onChange: (photos: StoredPhoto[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextPosition = () => {
    const used = new Set(photos.map((p) => p.position));
    for (let i = 0; i < MAX_PHOTOS; i++) if (!used.has(i)) return i;
    return null;
  };

  async function upload(file: File) {
    const position = nextPosition();
    if (position === null) return;

    setBusy(true);
    setError(null);
    try {
      const blob = await compressImage(file);
      const supabase = createClient();
      const path = `${userId}/${crypto.randomUUID()}.webp`;

      const { error: uploadError } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(path, blob, { contentType: "image/webp", upsert: false });
      if (uploadError) throw uploadError;

      const { data, error: insertError } = await supabase
        .from("profile_photos")
        .insert({ user_id: userId, storage_path: path, position })
        .select("id, storage_path, position")
        .single();
      if (insertError) throw insertError;

      onChange([...photos, data as StoredPhoto].sort((a, b) => a.position - b.position));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Try another photo.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(photo: StoredPhoto) {
    setBusy(true);
    setError(null);
    const supabase = createClient();

    const { error: deleteError } = await supabase
      .from("profile_photos")
      .delete()
      .eq("id", photo.id);

    if (deleteError) {
      setError(deleteError.message);
      setBusy(false);
      return;
    }

    await supabase.storage.from(PHOTO_BUCKET).remove([photo.storage_path]);
    onChange(photos.filter((p) => p.id !== photo.id));
    setBusy(false);
  }

  const slots = Array.from({ length: MAX_PHOTOS }, (_, i) =>
    photos.find((p) => p.position === i),
  );

  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        {slots.map((photo, i) => {
          const url = photoUrl(photo?.storage_path);
          return (
            <div
              key={i}
              className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-line bg-sunken"
            >
              {photo && url ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className="size-full object-cover"
                    loading="lazy"
                  />
                  {i === 0 && (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-brand px-2 py-0.5 text-[0.625rem] font-semibold text-brand-ink">
                      Main
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(photo)}
                    disabled={busy}
                    aria-label="Remove photo"
                    className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-black/60 text-sm text-white"
                  >
                    ×
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={busy}
                  className="flex size-full items-center justify-center text-2xl text-faint transition-colors hover:bg-brand-soft hover:text-brand disabled:opacity-50"
                  aria-label="Add photo"
                >
                  +
                </button>
              )}
            </div>
          );
        })}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />

      {busy && <p className="mt-3 text-xs text-faint">Working…</p>}
      {error && <p className="mt-3 text-xs text-negative">{error}</p>}
    </div>
  );
}
