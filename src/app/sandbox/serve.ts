import {
  isAllowedSandboxHost,
  sandboxResponseHeaders,
} from "@/lib/sandbox";

// Injected into every served artifact: on click, any anchor pointing at a
// different host (an external link) opens in a new tab. Relative links and
// in-page #anchors are left alone so the artifact still behaves normally.
// Runs in capture phase so target is set before the browser handles the click.
const EXTERNAL_LINK_SCRIPT = `<script>(function(){document.addEventListener("click",function(e){var t=e.target;var a=t&&t.closest?t.closest("a[href]"):null;if(!a)return;try{var u=new URL(a.getAttribute("href"),location.href);if((u.protocol==="http:"||u.protocol==="https:")&&u.host!==location.host){a.target="_blank";a.rel="noopener noreferrer";}}catch(_){}} ,true);})();</script>`;

function withExternalLinkHandling(html: string): string {
  const marker = "</body>";
  const idx = html.toLowerCase().lastIndexOf(marker);
  if (idx !== -1) {
    return html.slice(0, idx) + EXTERNAL_LINK_SCRIPT + html.slice(idx);
  }
  return html + EXTERNAL_LINK_SCRIPT;
}

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
  return new Response(withExternalLinkHandling(html), {
    status: 200,
    headers: sandboxResponseHeaders(),
  });
}
