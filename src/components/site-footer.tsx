import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row sm:px-6">
        <p className="font-mono text-meta text-fg-subtle">
          © {new Date().getFullYear()} Artifactuals
        </p>
        <nav className="flex items-center gap-5 text-small text-fg-muted">
          <Link href="/feed" className="transition-colors hover:text-fg">
            Feed
          </Link>
          <Link href="/guidelines" className="transition-colors hover:text-fg">
            Guidelines
          </Link>
        </nav>
      </div>
    </footer>
  );
}
