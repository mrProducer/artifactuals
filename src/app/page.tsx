import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/feed");
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 pb-24 sm:px-6">
      <div className="max-w-3xl">
        <h1 className="text-5xl font-semibold leading-[1.05] tracking-tighter text-zinc-950 sm:text-7xl dark:text-zinc-50">
          The things you build with AI deserve a home.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-500 dark:text-zinc-400">
          Publish interactive artifacts, live and running. Build a portfolio
          under your own name. See what everyone else is making.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href="/login"
            className="border border-zinc-950 bg-zinc-950 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 active:translate-y-px dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-300"
          >
            Get started
          </Link>
          <Link
            href="/feed"
            className="border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:border-zinc-950 active:translate-y-px dark:border-zinc-700 dark:text-zinc-50 dark:hover:border-zinc-50"
          >
            Browse trending
          </Link>
        </div>
      </div>
    </main>
  );
}
