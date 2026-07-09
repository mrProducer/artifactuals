import { serveArtifactHtml } from "../../../serve";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * Compose-time preview. The client uploads the draft to
 * artifact-source/{userId}/drafts/{draftId}.html (RLS restricts writes to the
 * owner's folder) and points the preview iframe here. The draftId is a
 * client-generated random UUID, so draft URLs are unguessable.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string; draftId: string }> }
) {
  const { userId, draftId } = await params;

  if (!UUID_RE.test(userId) || !UUID_RE.test(draftId)) {
    return new Response("Not found", { status: 404 });
  }

  return serveArtifactHtml(request, `${userId}/drafts/${draftId}.html`);
}
