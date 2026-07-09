"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowsIn, ArrowsOut } from "@phosphor-icons/react";
import { ArtifactFrame } from "@/components/artifact-frame";

/**
 * Live artifact with a fullscreen toggle. Uses the native Fullscreen API
 * where available; the fixed-overlay styling doubles as the fallback for
 * browsers that don't support it on arbitrary elements (iOS Safari).
 */
export function ArtifactViewer({ src, title }: { src: string; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) setFullscreen(false);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const enterFullscreen = () => {
    setFullscreen(true);
    containerRef.current?.requestFullscreen?.().catch(() => {
      /* CSS overlay still applies */
    });
  };

  const exitFullscreen = () => {
    setFullscreen(false);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Esc for the CSS-fallback mode (native fullscreen handles Esc itself)
  useEffect(() => {
    if (!fullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFullscreen(false);
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fullscreen]);

  return (
    <div
      ref={containerRef}
      className={
        fullscreen
          ? "fixed inset-0 z-50 flex flex-col bg-white dark:bg-zinc-950"
          : "flex flex-col border border-zinc-200 dark:border-zinc-800"
      }
    >
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-zinc-200 pl-4 pr-2 dark:border-zinc-800">
        <span className="truncate text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          Live artifact
        </span>
        <button
          onClick={fullscreen ? exitFullscreen : enterFullscreen}
          className="flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
        >
          {fullscreen ? (
            <>
              <ArrowsIn size={16} />
              Exit
            </>
          ) : (
            <>
              <ArrowsOut size={16} />
              Fullscreen
            </>
          )}
        </button>
      </div>

      <ArtifactFrame
        src={src}
        title={title}
        className={
          fullscreen
            ? "w-full flex-1 border-0 bg-white"
            : "h-[70vh] min-h-[420px] w-full border-0 bg-white"
        }
      />
    </div>
  );
}
