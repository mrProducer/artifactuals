"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { PushPin, PencilSimple, Trash, Camera } from "@phosphor-icons/react";
import {
  deleteArtifact,
  regenerateArtifactPreview,
  togglePin,
} from "@/app/actions/artifact-owner";
import { buttonClass, Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

export function ArtifactOwnerToolbar({
  artifactId,
  isPinned,
}: {
  artifactId: string;
  isPinned: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const onPin = () =>
    startTransition(async () => {
      const result = await togglePin(artifactId, isPinned);
      if (result.error) toast(result.error);
      else toast(isPinned ? "Unpinned from profile." : "Pinned to profile.");
    });

  const onDelete = () =>
    startTransition(async () => {
      const result = await deleteArtifact(artifactId);
      // A successful delete redirects; only errors return here.
      if (result?.error) toast(result.error);
    });

  const onRegenerate = () =>
    startTransition(async () => {
      toast("Regenerating preview...");
      const result = await regenerateArtifactPreview(artifactId);
      if (result.error) toast(result.error);
      else toast("Preview updated.");
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={`/a/${artifactId}/edit`}
        className={buttonClass({ variant: "secondary", size: "sm" })}
      >
        <PencilSimple size={16} weight="bold" />
        Edit
      </Link>
      <Button variant="secondary" size="sm" disabled={pending} onClick={onPin}>
        <PushPin size={16} weight={isPinned ? "fill" : "bold"} />
        {isPinned ? "Unpin" : "Pin"}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={onRegenerate}
        title="Re-render the share/preview image"
      >
        <Camera size={16} weight="bold" />
        Regenerate preview
      </Button>
      {confirmingDelete ? (
        <span className="flex items-center gap-2">
          <Button
            variant="danger"
            size="sm"
            disabled={pending}
            onClick={onDelete}
          >
            <Trash size={16} weight="bold" />
            {pending ? "Deleting..." : "Delete permanently"}
          </Button>
          <button
            type="button"
            onClick={() => setConfirmingDelete(false)}
            className="text-meta text-fg-subtle transition-colors hover:text-fg"
          >
            Cancel
          </button>
        </span>
      ) : (
        <Button
          variant="danger"
          size="sm"
          disabled={pending}
          onClick={() => setConfirmingDelete(true)}
        >
          <Trash size={16} weight="bold" />
          Delete
        </Button>
      )}
    </div>
  );
}
