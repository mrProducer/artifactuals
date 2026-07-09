/**
 * A profile's picture is the uploaded avatar when present, otherwise the
 * GitHub avatar (github.com/<user>.png redirects to their profile image).
 * Every surface that renders a profile picture should resolve through this
 * so the same person never shows two different avatars.
 */
export function resolveAvatarUrl(profile: {
  avatar_url: string | null;
  github_username?: string | null;
}): string | null {
  if (profile.avatar_url) return profile.avatar_url;
  if (profile.github_username) {
    return `https://github.com/${profile.github_username}.png?size=96`;
  }
  return null;
}
