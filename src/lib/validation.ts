export const USERNAME_REGEX = /^[a-z0-9][a-z0-9_-]{2,29}$/;

// Route names and confusing handles that can never be usernames, since
// profiles live at the URL root (artifactuals.com/username).
const RESERVED_USERNAMES = new Set([
  "login",
  "logout",
  "signup",
  "auth",
  "onboarding",
  "settings",
  "api",
  "feed",
  "trending",
  "following",
  "new",
  "compose",
  "artifact",
  "artifacts",
  "a",
  "u",
  "admin",
  "about",
  "terms",
  "privacy",
  "help",
  "support",
  "artifactuals",
]);

export function validateUsername(username: string): string | null {
  if (!USERNAME_REGEX.test(username)) {
    return "3-30 characters; lowercase letters, numbers, hyphens, underscores; must start with a letter or number.";
  }
  if (RESERVED_USERNAMES.has(username)) {
    return "That username is reserved.";
  }
  return null;
}
