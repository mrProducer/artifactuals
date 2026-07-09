"use client";

import { useSyncExternalStore } from "react";
import { Sun, Moon } from "@phosphor-icons/react";

type Theme = "light" | "dark";

function subscribe(callback: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", callback);
  window.addEventListener("themechange", callback);
  return () => {
    mq.removeEventListener("change", callback);
    window.removeEventListener("themechange", callback);
  };
}

function getSnapshot(): Theme {
  const attr = document.documentElement.dataset.theme;
  if (attr === "light" || attr === "dark") return attr;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeToggle() {
  // Reading the DOM/OS theme through an external store keeps SSR and client in
  // sync without a setState-in-effect. Server renders "light"; the pre-paint
  // script + this store correct it on the client with no flash.
  const effective = useSyncExternalStore(subscribe, getSnapshot, () => "light");

  function toggle() {
    const next: Theme = effective === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    document.documentElement.dataset.theme = next;
    window.dispatchEvent(new Event("themechange"));
  }

  return (
    <button
      onClick={toggle}
      aria-label={
        effective === "dark" ? "Switch to light theme" : "Switch to dark theme"
      }
      className="flex size-9 items-center justify-center text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg"
    >
      {effective === "dark" ? (
        <Sun size={18} weight="bold" />
      ) : (
        <Moon size={18} weight="bold" />
      )}
    </button>
  );
}
