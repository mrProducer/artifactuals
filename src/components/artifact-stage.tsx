"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  Heart,
  ChatCircle,
  PaperPlaneTilt,
  ArrowsOut,
  ArrowsIn,
} from "@phosphor-icons/react";
import { Avatar } from "@/components/avatar";
import { ArtifactFrame } from "@/components/artifact-frame";
import { toggleLike } from "@/app/actions/social";
import { shareArtifactImage } from "@/lib/share";
import { toast } from "@/components/ui/toast";

/**
 * Full-viewport artifact stage: the live artifact fills the space under the
 * site header, with a bottom action bar (like / comment / share / fullscreen)
 * — thumb-reachable on mobile. Fullscreen expands to a fixed overlay that
 * covers the site chrome; the bottom bar stays so the user can act and exit.
 */
export function ArtifactStage({
  src,
  title,
  shareUrl,
  artifactId,
  creatorName,
  creatorUsername,
  creatorAvatarUrl,
  previewImageUrl,
  initialLiked,
  initialLikeCount,
  viewCount,
  commentCount,
  signedIn,
}: {
  src: string;
  title: string;
  shareUrl: string;
  artifactId: string;
  creatorName: string | null;
  creatorUsername: string | null;
  creatorAvatarUrl: string | null;
  previewImageUrl: string | null;
  initialLiked: boolean;
  initialLikeCount: number;
  viewCount: number;
  commentCount: number;
  signedIn: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [popKey, setPopKey] = useState(0);
  const [shared, setShared] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) setFullscreen(false);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") exitFullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  function enterFullscreen() {
    setFullscreen(true);
    containerRef.current?.requestFullscreen?.().catch(() => {});
  }
  function exitFullscreen() {
    setFullscreen(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }

  function handleLike() {
    if (!signedIn) {
      window.location.href = "/login";
      return;
    }
    const wasLiked = liked;
    setLiked(!wasLiked);
    if (!wasLiked) setPopKey((k) => k + 1);
    setLikeCount((c) => c + (wasLiked ? -1 : 1));
    startTransition(async () => {
      const { error } = await toggleLike(artifactId, wasLiked);
      if (error) {
        setLiked(wasLiked);
        setLikeCount((c) => c + (wasLiked ? 1 : -1));
      }
    });
  }

  async function handleShare() {
    const outcome = await shareArtifactImage({
      title,
      url: shareUrl,
      imageUrl: previewImageUrl,
    });
    if (outcome === "shared" || outcome === "cancelled") return;
    // No native share (desktop) → copy the link and nudge toward the buttons.
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
      toast("Link copied — scroll down to post on X or LinkedIn.");
    } catch {
      /* ignore */
    }
  }

  function goToComments() {
    exitFullscreen();
    document.getElementById("comments")?.scrollIntoView({ behavior: "smooth" });
  }

  const barButton =
    "flex items-center gap-1.5 rounded-none px-3 py-2 text-small font-medium text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg active:scale-[0.97]";

  return (
    <div
      ref={containerRef}
      className={
        fullscreen
          ? "fixed inset-0 z-50 flex flex-col bg-bg"
          : "flex h-[calc(100dvh-3.5rem)] flex-col border-b border-border bg-surface"
      }
    >
      {/* Compact context strip */}
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-surface px-3 sm:px-4">
        {creatorUsername ? (
          <Link
            href={`/${creatorUsername}`}
            className="flex min-w-0 items-center gap-2"
          >
            <Avatar name={creatorName ?? "?"} imageUrl={creatorAvatarUrl} size="sm" />
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-small font-semibold text-fg">
                {title}
              </span>
              <span className="truncate font-mono text-meta text-fg-subtle">
                @{creatorUsername} · {viewCount} views
              </span>
            </span>
          </Link>
        ) : (
          <span className="truncate text-small font-semibold text-fg">
            {title}
          </span>
        )}
      </div>

      <ArtifactFrame
        src={src}
        title={title}
        className="w-full flex-1 border-0 bg-surface"
      />

      {/* Bottom action bar */}
      <div className="flex shrink-0 items-center justify-between border-t border-border bg-surface px-1 sm:px-3">
        <div className="flex items-center">
          <button
            onClick={handleLike}
            aria-pressed={liked}
            aria-label={liked ? "Unlike" : "Like"}
            className={barButton}
          >
            <Heart
              key={popKey}
              size={22}
              weight={liked ? "fill" : "regular"}
              className={liked ? "animate-like-pop text-like" : undefined}
            />
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>

          <button onClick={goToComments} aria-label="Comments" className={barButton}>
            <ChatCircle size={22} />
            {commentCount > 0 && <span>{commentCount}</span>}
          </button>

          <button onClick={handleShare} aria-label="Share" className={barButton}>
            <PaperPlaneTilt size={22} />
            <span className="hidden sm:inline">{shared ? "Copied" : "Share"}</span>
          </button>
        </div>

        <button
          onClick={fullscreen ? exitFullscreen : enterFullscreen}
          aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          className={barButton}
        >
          {fullscreen ? <ArrowsIn size={20} /> : <ArrowsOut size={20} />}
          <span className="hidden sm:inline">
            {fullscreen ? "Exit" : "Fullscreen"}
          </span>
        </button>
      </div>
    </div>
  );
}
