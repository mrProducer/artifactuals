import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-5 pb-24 text-center sm:px-8">
      <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
        A home for the things you build with AI
      </h1>
      <p className="max-w-xl text-base leading-7 text-zinc-600 sm:text-lg dark:text-zinc-400">
        Publish your interactive artifacts, build a portfolio tied to your
        name, and discover what other creators are making.
      </p>
      <Link
        href="/login"
        className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        Get started
      </Link>
    </main>
  );
}
