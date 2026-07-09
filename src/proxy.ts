import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const sandboxHost = process.env.SANDBOX_HOST;
  const host = request.headers.get("host");

  if (sandboxHost && host === sandboxHost) {
    // The artifact host serves ONLY sandbox content — no app pages, no auth.
    if (!request.nextUrl.pathname.startsWith("/sandbox/")) {
      return new NextResponse("Not found", { status: 404 });
    }
    return NextResponse.next();
  }

  // Conversely, the main app origin never serves raw artifact HTML in prod.
  if (sandboxHost && request.nextUrl.pathname.startsWith("/sandbox/")) {
    return new NextResponse("Not found", { status: 404 });
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    // Run on all routes except static assets and images.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
