import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditArtifactForm } from "./edit-form";

export const metadata = { title: "Edit artifact" };

type Props = { params: Promise<{ id: string }> };

export default async function EditArtifactPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: artifact } = await supabase
    .from("artifacts")
    .select("id, owner_id, title, description, tags")
    .eq("id", id)
    .maybeSingle();

  if (!artifact) notFound();
  if (artifact.owner_id !== user.id) redirect(`/a/${id}`);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6 sm:px-6">
      <h1 className="text-h1 text-fg">Edit artifact</h1>
      <p className="mt-1 text-body text-fg-muted">
        Update the title, description, and tags. To change the artifact itself,
        publish a new one.
      </p>
      <EditArtifactForm
        artifactId={artifact.id}
        initialTitle={artifact.title}
        initialDescription={artifact.description ?? ""}
        initialTags={artifact.tags ?? []}
      />
    </main>
  );
}
