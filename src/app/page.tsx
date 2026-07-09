export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <span className="text-lg font-semibold tracking-tight">
          Artifactuals
        </span>
        <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Early build
        </span>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-5 pb-24 text-center sm:px-8">
        <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          A home for the things you build with AI
        </h1>
        <p className="max-w-xl text-base leading-7 text-zinc-600 sm:text-lg dark:text-zinc-400">
          Publish your interactive artifacts, build a portfolio tied to your
          name, and discover what other creators are making.
        </p>
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          Under construction — the core loop is being built right now.
        </p>
      </main>
    </div>
  );
}
