import {
  isAllowedSandboxHost,
  sandboxResponseHeaders,
} from "@/lib/sandbox";

/**
 * The ONE function that turns stored artifact HTML into a response — used by
 * both the published-artifact route and the compose-preview route so the two
 * can never drift (handoff §3).
 */
export async function serveArtifactHtml(
  request: Request,
  storagePath: string
): Promise<Response> {
  if (!isAllowedSandboxHost(request.headers.get("host"))) {
    return new Response("Not found", { status: 404 });
  }

  const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/artifact-source/${storagePath}`;
  const res = await fetch(publicUrl, { cache: "no-store" });

  if (!res.ok) {
    return new Response("Artifact not found", { status: 404 });
  }

  const html = await res.text();
  return new Response(html, { status: 200, headers: sandboxResponseHeaders() });
}
