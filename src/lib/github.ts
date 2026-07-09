export type GitHubProfile = {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
};

export type GitHubRepo = {
  name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
};

// Unauthenticated GitHub API: 60 req/hr/IP, so cache aggressively
// (handoff §7 suggests a few hours).
const REVALIDATE_SECONDS = 4 * 60 * 60;

export async function fetchGitHubProfile(
  username: string
): Promise<{ profile: GitHubProfile; repos: GitHubRepo[] } | null> {
  try {
    const headers = { Accept: "application/vnd.github+json" };

    const profileRes = await fetch(`https://api.github.com/users/${username}`, {
      headers,
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!profileRes.ok) return null;
    const profile = (await profileRes.json()) as GitHubProfile;

    const reposRes = await fetch(
      `https://api.github.com/users/${username}/repos?sort=pushed&per_page=4`,
      { headers, next: { revalidate: REVALIDATE_SECONDS } }
    );
    const repos = reposRes.ok ? ((await reposRes.json()) as GitHubRepo[]) : [];

    return { profile, repos };
  } catch {
    return null;
  }
}
