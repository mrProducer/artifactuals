"use client";

import { useEffect, useState } from "react";

type ToastItem = { id: number; message: string };

const TOAST_EVENT = "artifactuals:toast";

/**
 * Minimal toast for optimistic-action failures (DESIGN.md §8.11). Fire from
 * anywhere with `toast("message")`; a single <Toaster /> in the root layout
 * renders a sharp --surface card, bottom-center, auto-dismissing.
 */
export function toast(message: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: message }));
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    let counter = 0;
    function onToast(e: Event) {
      const message = (e as CustomEvent<string>).detail;
      const id = ++counter;
      setToasts((prev) => [...prev, { id, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    }
    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
      role="region"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="animate-rise pointer-events-auto max-w-sm border border-border bg-surface px-4 py-2.5 text-small text-fg shadow-md"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
