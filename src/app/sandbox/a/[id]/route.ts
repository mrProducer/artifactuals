import { createClient } from "@/lib/supabase/server";
import { serveArtifactHtml } from "../../serve";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // RLS only exposes published artifacts (or the owner's own) to this client.
  const supabase = await createClient();
  const { data: artifact } = await supabase
    .from("artifacts")
    .select("source_path, status")
    .eq("id", id)
    .maybeSingle();

  if (!artifact || artifact.status !== "published") {
    return new Response("Artifact not found", { status: 404 });
  }

  return serveArtifactHtml(request, artifact.source_path);
}
