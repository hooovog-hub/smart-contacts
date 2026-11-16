// Profile photo: pick (library or camera) → square crop → upload to Storage avatars/<uid>/… → profiles.avatar_url.
// Files live only under the user's own folder (security-privacy §6); delete-account removes them.
import * as ImagePicker from "expo-image-picker";
import { SUPABASE_URL } from "./config";
import { supabase } from "./supabase";

export type PhotoSource = "library" | "camera";

/** Returns the new public URL, or null if the user cancelled. Throws on upload errors. */
export async function changeAvatar(userId: string, source: PhotoSource): Promise<string | null> {
  const perm =
    source === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error("permission_denied");

  const opts: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  };
  const res =
    source === "camera" ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
  if (res.canceled || !res.assets?.[0]) return null;
  const asset = res.assets[0];

  const body = await (await fetch(asset.uri)).arrayBuffer();
  const contentType = asset.mimeType === "image/png" ? "image/png" : "image/jpeg";
  // New file name each time: avoids stale CDN caches showing the old photo.
  const path = `${userId}/avatar-${Date.now()}.${contentType === "image/png" ? "png" : "jpg"}`;
  const { error } = await supabase.storage.from("avatars").upload(path, body, { contentType, upsert: false });
  if (error) throw error;

  const url = `${SUPABASE_URL}/storage/v1/object/public/avatars/${path}`;
  const { error: upErr } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", userId);
  if (upErr) throw upErr;

  // Remove older photos of this user (best effort).
  const { data: files } = await supabase.storage.from("avatars").list(userId);
  const old = (files ?? []).map((f) => `${userId}/${f.name}`).filter((p) => p !== path);
  if (old.length) await supabase.storage.from("avatars").remove(old);
  return url;
}

export async function removeAvatar(userId: string): Promise<void> {
  await supabase.from("profiles").update({ avatar_url: null }).eq("id", userId);
  const { data: files } = await supabase.storage.from("avatars").list(userId);
  const all = (files ?? []).map((f) => `${userId}/${f.name}`);
  if (all.length) await supabase.storage.from("avatars").remove(all);
}
