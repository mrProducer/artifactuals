import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-24 text-center sm:px-6">
      <p className="font-mono text-label uppercase text-fg-subtle">404</p>
      <h1 className="mt-3 text-h1 text-fg">This page doesn&apos;t exist</h1>
      <p className="mt-3 max-w-md text-body text-fg-muted">
        The artifact or profile you&apos;re looking for may have been moved,
        removed, or never existed.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/feed" className={buttonClass()}>
          Browse the feed
        </Link>
        <Link href="/" className={buttonClass({ variant: "secondary" })}>
          Go home
        </Link>
      </div>
    </main>
  );
}
