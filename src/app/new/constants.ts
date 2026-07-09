// Plain module (NOT "use server"): a file marked "use server" may only export
// async functions — every other export gets turned into a server-action
// reference. Keeping the tag list and state type here lets the compose form
// import them as real values.

export const ARTIFACT_TAGS = [
  "game",
  "tool",
  "data-viz",
  "education",
  "art",
  "other",
] as const;

export type PublishState = { error: string } | null;
