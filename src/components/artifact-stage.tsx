"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  Heart,
  ChatCircle,
  ShareNetwork,
  XLogo,
  LinkedinLogo,
  LinkSimple,
  CaretDown,
  CaretUp,
  ArrowsOut,
  ArrowsIn,
} from "@phosphor-icons/react";
import { Avatar } from "@/components/avatar";
import { ArtifactFrame } from "@/components/artifact-frame";
import { toggleLike } from "@/app/actions/social";
import {
  canShareImageFiles,
  shareArtifactImage,
  xIntentUrl,
  linkedInShareUrl,
} from "@/lib/share";

/**
 * Full-viewport artifact stage. The live artifact fills the space under the
 * site header; a persistent bottom bar holds the primary actions — like,
 * comment, and sharing (native app sheet on touch, per-network buttons on
 * desktop) — so nothing important sits below an invisible fold. A prominent
 * "Details" toggle reveals the description/tags/comments (passed as children)
 * on demand. Fullscreen expands the artifact to a fixed overlay.
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
  children,
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
  children?: ReactNode;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [popKey, setPopKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  // On touch devices that can share image files, the native sheet is the route
  // into the LinkedIn/X apps (with the screenshot attached) — prefer it there.
  const preferNative = useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(pointer: coarse)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(pointer: coarse)").matches && canShareImageFiles(),
    () => false
  );

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
    stageRef.current?.requestFullscreen?.().catch(() => {});
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

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  async function handleNativeShare() {
    const outcome = await shareArtifactImage({
      title,
      url: shareUrl,
      imageUrl: previewImageUrl,
    });
    if (outcome === "error" || outcome === "unsupported") await copyLink();
  }

  function handleX() {
    window.open(xIntentUrl(title, shareUrl), "_blank", "noopener,noreferrer");
  }

  function handleLinkedIn() {
    // Opens LinkedIn's composer with the artifact unfurled as a rich card
    // (screenshot + title from our OG tags). LinkedIn doesn't allow prefilled
    // text, so the user adds their own note — this is the seamless standard.
    window.open(linkedInShareUrl(shareUrl), "_blank", "noopener,noreferrer");
  }

  function revealDetails(target?: "comments") {
    setExpanded(true);
    // Wait for the children to mount before scrolling to them.
    requestAnimationFrame(() =>
      setTimeout(() => {
        const el =
          target === "comments"
            ? document.getElementById("comments")
            : detailsRef.current;
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 40)
    );
  }

  function toggleDetails() {
    if (expanded) {
      setExpanded(false);
      stageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      revealDetails();
    }
  }

  function goToComments() {
    exitFullscreen();
    if (expanded) {
      document.getElementById("comments")?.scrollIntoView({ behavior: "smooth" });
    } else {
      revealDetails("comments");
    }
  }

  const barButton =
    "flex items-center gap-1.5 px-2.5 py-2 text-small font-medium text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg active:scale-[0.97] sm:px-3";

  return (
    <div className="flex flex-col">
      <div
        ref={stageRef}
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
              <Avatar
                name={creatorName ?? "?"}
                imageUrl={creatorAvatarUrl}
                size="sm"
              />
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

        {/* Persistent action bar */}
        <div className="flex shrink-0 items-center justify-between gap-1 border-t border-border bg-surface px-1 sm:px-2">
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
          </div>

          <div className="flex items-center">
            {/* Sharing — native app sheet on touch, web composers on desktop */}
            {preferNative ? (
              <button
                onClick={handleNativeShare}
                aria-label="Share"
                className={barButton}
              >
                <ShareNetwork size={22} weight="bold" />
                Share
              </button>
            ) : (
              <>
                <button onClick={handleX} aria-label="Post on X" className={barButton}>
                  <XLogo size={20} weight="bold" />
                  <span className="hidden md:inline">X</span>
                </button>
                <button
                  onClick={handleLinkedIn}
                  aria-label="Post on LinkedIn"
                  className={barButton}
                >
                  <LinkedinLogo size={20} weight="bold" />
                  <span className="hidden md:inline">LinkedIn</span>
                </button>
                <button
                  onClick={copyLink}
                  aria-label="Copy link"
                  className={barButton}
                >
                  <LinkSimple size={20} weight="bold" />
                  <span className="hidden md:inline">
                    {copied ? "Copied!" : "Copy"}
                  </span>
                </button>
              </>
            )}

            {!fullscreen && (
              <button
                onClick={toggleDetails}
                aria-expanded={expanded}
                className="flex items-center gap-1.5 border-l border-border px-2.5 py-2 text-small font-semibold text-fg transition-colors hover:bg-surface-muted sm:px-3"
              >
                {expanded ? <CaretUp size={18} /> : <CaretDown size={18} />}
                {expanded ? "Hide" : "Details"}
              </button>
            )}

            <button
              onClick={fullscreen ? exitFullscreen : enterFullscreen}
              aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              className={barButton}
            >
              {fullscreen ? <ArrowsIn size={20} /> : <ArrowsOut size={20} />}
            </button>
          </div>
        </div>
      </div>

      {!fullscreen && expanded && <div ref={detailsRef}>{children}</div>}
    </div>
  );
}
