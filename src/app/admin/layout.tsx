import { redirect } from "next/navigation";
import { getViewer, isModerator } from "@/lib/moderation";

export const metadata = { title: "Admin" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role } = await getViewer();
  if (!user) redirect("/login");
  if (!isModerator(role)) redirect("/");

  return (
    <div className="flex-1 bg-bg">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <header className="mb-6 flex items-baseline justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="font-mono text-label uppercase text-fg-subtle">
              Moderation
            </p>
            <h1 className="text-h1 text-fg">Admin</h1>
          </div>
          <span className="font-mono text-meta uppercase text-fg-subtle">
            {role}
          </span>
        </header>
        {children}
      </div>
    </div>
  );
}
