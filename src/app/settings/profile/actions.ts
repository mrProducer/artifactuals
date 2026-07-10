"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type SettingsState = { error: string } | { success: true } | null;

const URL_FIELDS = ["linkedin_url", "instagram_url"] as const;

function normalizeUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    return new URL(withScheme).toString();
  } catch {
    return null;
  }
}

export async function updateProfile(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const displayName = String(formData.get("display_name") ?? "").trim();
  if (displayName.length < 1 || displayName.length > 60) {
    return { error: "Display name must be 1-60 characters." };
  }

  const bio = String(formData.get("bio") ?? "").trim();
  if (bio.length > 280) {
    return { error: "Bio must be 280 characters or fewer." };
  }

  const githubUsername =
    String(formData.get("github_username") ?? "")
      .trim()
      .replace(/^@/, "") || null;

  const urls: Record<string, string | null> = {};
  for (const field of URL_FIELDS) {
    const raw = String(formData.get(field) ?? "");
    if (raw.trim()) {
      const normalized = normalizeUrl(raw);
      if (!normalized) {
        return { error: `Invalid URL for ${field.replace("_url", "")}.` };
      }
      urls[field] = normalized;
    } else {
      urls[field] = null;
    }
  }

  const customLinks: { label: string; url: string }[] = [];
  for (const i of [0, 1]) {
    const label = String(formData.get(`custom_label_${i}`) ?? "").trim();
    const url = String(formData.get(`custom_url_${i}`) ?? "").trim();
    if (label && url) {
      const normalized = normalizeUrl(url);
      if (!normalized) {
        return { error: `Invalid URL for custom link "${label}".` };
      }
      customLinks.push({ label: label.slice(0, 30), url: normalized });
    }
  }

  // Avatar upload (optional)
  let avatarUrl: string | undefined;
  const avatar = formData.get("avatar") as File | null;
  if (avatar && avatar.size > 0) {
    if (avatar.size > 2 * 1024 * 1024) {
      return { error: "Avatar must be 2 MB or smaller." };
    }
    if (!["image/png", "image/jpeg", "image/webp"].includes(avatar.type)) {
      return { error: "Avatar must be a PNG, JPEG, or WebP image." };
    }
    const ext = avatar.type.split("/")[1] === "jpeg" ? "jpg" : avatar.type.split("/")[1];
    const path = `${user.id}/avatar.${ext}`;
    // Upload with the service-role client: the user is verified above and the
    // path is locked to their own folder. The cookie-based server client's
    // token isn't accepted by Storage RLS, which is what threw before.
    const admin = createAdminClient();
    const { error: uploadError } = await admin.storage
      .from("avatars")
      .upload(path, avatar, { upsert: true, contentType: avatar.type });
    if (uploadError) {
      return { error: "Avatar upload failed. Please try again." };
    }
    const { data } = admin.storage.from("avatars").getPublicUrl(path);
    // Cache-bust so the new image shows immediately
    avatarUrl = `${data.publicUrl}?v=${Date.now()}`;
  }

  const { data: updated, error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      bio: bio || null,
      github_username: githubUsername,
      linkedin_url: urls.linkedin_url,
      instagram_url: urls.instagram_url,
      custom_links: customLinks,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    })
    .eq("user_id", user.id)
    .select("username")
    .single();

  if (error || !updated) {
    return { error: "Could not save profile. Please try again." };
  }

  revalidatePath(`/${updated.username}`);
  revalidatePath("/settings/profile");
  return { success: true };
}
