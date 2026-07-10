"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";

// Square crop editor for profile photos. Shows the current avatar, lets the
// user pick a replacement, reposition/zoom it inside a square viewport, then
// bakes a fixed-size JPEG and assigns it to the hidden file input the profile
// form already submits — so the server action stays unchanged.

const VIEW = 256; // on-screen crop viewport (px)
const OUT = 512; // exported image size (px)

type XY = { x: number; y: number };
type Dim = { w: number; h: number };

function coverScale(nat: Dim) {
  return Math.max(VIEW / nat.w, VIEW / nat.h);
}

function clampOffset(o: XY, s: number, nat: Dim): XY {
  const dispW = nat.w * s;
  const dispH = nat.h * s;
  return {
    x: Math.min(0, Math.max(VIEW - dispW, o.x)),
    y: Math.min(0, Math.max(VIEW - dispH, o.y)),
  };
}

export function AvatarEditor({
  currentUrl,
  name,
}: {
  currentUrl: string | null;
  name: string;
}) {
  const submitInputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);
  const loadedImgRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<(XY & { ox: number; oy: number }) | null>(null);

  const [srcUrl, setSrcUrl] = useState<string | null>(null);
  const [natural, setNatural] = useState<Dim | null>(null);
  const [editing, setEditing] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<XY>({ x: 0, y: 0 });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (srcUrl) URL.revokeObjectURL(srcUrl);
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [srcUrl, previewUrl]);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file later
    if (!file) return;
    setError(null);
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Choose a PNG, JPEG, or WebP image.");
      return;
    }

    if (srcUrl) URL.revokeObjectURL(srcUrl);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const nat = { w: img.naturalWidth, h: img.naturalHeight };
      const s = coverScale(nat);
      loadedImgRef.current = img;
      setNatural(nat);
      setScale(1);
      setOffset({ x: (VIEW - nat.w * s) / 2, y: (VIEW - nat.h * s) / 2 });
      setSrcUrl(url);
      setEditing(true);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setError("That image couldn't be loaded. Try another.");
    };
    img.src = url;
  }

  function onZoom(next: number) {
    if (!natural) return;
    const bs = coverScale(natural);
    const oldS = bs * scale;
    const newS = bs * next;
    setOffset((o) =>
      clampOffset(
        {
          x: VIEW / 2 - (VIEW / 2 - o.x) * (newS / oldS),
          y: VIEW / 2 - (VIEW / 2 - o.y) * (newS / oldS),
        },
        newS,
        natural
      )
    );
    setScale(next);
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!natural) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d || !natural) return;
    const s = coverScale(natural) * scale;
    setOffset(
      clampOffset(
        { x: d.ox + (e.clientX - d.x), y: d.oy + (e.clientY - d.y) },
        s,
        natural
      )
    );
  }

  function endDrag(e: React.PointerEvent) {
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  }

  function applyCrop() {
    const img = loadedImgRef.current;
    if (!img || !natural) return;
    const s = coverScale(natural) * scale;
    const sSize = VIEW / s;
    const sx = -offset.x / s;
    const sy = -offset.y / s;

    const canvas = document.createElement("canvas");
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, OUT, OUT);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Couldn't process the image. Try again.");
          return;
        }
        const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
        const dt = new DataTransfer();
        dt.items.add(file);
        if (submitInputRef.current) submitInputRef.current.files = dt.files;
        if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(blob));
        setEditing(false);
      },
      "image/jpeg",
      0.9
    );
  }

  function cancelEdit() {
    setEditing(false);
    if (srcUrl) URL.revokeObjectURL(srcUrl);
    setSrcUrl(null);
    setNatural(null);
    loadedImgRef.current = null;
  }

  function clearSelection() {
    if (submitInputRef.current) submitInputRef.current.files = new DataTransfer().files;
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }

  const displayUrl = previewUrl ?? currentUrl;
  const dispScale = natural ? coverScale(natural) * scale : 1;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-small font-medium text-fg">Photo</span>

      {/* Hidden input the profile form actually submits. */}
      <input ref={submitInputRef} type="file" name="avatar" className="hidden" tabIndex={-1} />
      {/* Hidden picker (no name → never submitted directly). */}
      <input
        ref={pickerRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={onPick}
      />

      {editing && srcUrl && natural ? (
        <div className="flex flex-col gap-3">
          <div
            className="relative overflow-hidden rounded-full border border-border bg-surface-muted"
            style={{ width: VIEW, height: VIEW, touchAction: "none", maxWidth: "100%" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={srcUrl}
              alt="Selected photo"
              draggable={false}
              className="pointer-events-none absolute max-w-none select-none"
              style={{
                width: natural.w * dispScale,
                height: natural.h * dispScale,
                left: offset.x,
                top: offset.y,
              }}
            />
            <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-black/10" />
          </div>

          <label className="flex items-center gap-3 text-meta text-fg-muted">
            <span className="font-mono uppercase">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={scale}
              onChange={(e) => onZoom(Number(e.target.value))}
              className="w-48 accent-[var(--accent)]"
            />
          </label>

          <p className="font-mono text-meta text-fg-subtle">
            Drag to reposition · zoom to fit.
          </p>

          <div className="flex items-center gap-2">
            <Button type="button" size="sm" onClick={applyCrop}>
              Use photo
            </Button>
            <button
              type="button"
              onClick={cancelEdit}
              className="text-meta text-fg-subtle transition-colors hover:text-fg"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <Avatar name={name} imageUrl={displayUrl} size="xl" />
          <div className="flex flex-col items-start gap-1.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => pickerRef.current?.click()}
            >
              {displayUrl ? "Replace photo" : "Add photo"}
            </Button>
            {previewUrl && (
              <button
                type="button"
                onClick={clearSelection}
                className="text-meta text-fg-subtle transition-colors hover:text-fg"
              >
                Undo new photo
              </button>
            )}
            <span className="text-meta text-fg-subtle">
              {previewUrl
                ? "New photo ready — click Save changes to keep it."
                : "PNG, JPEG, or WebP up to 2 MB."}
            </span>
          </div>
        </div>
      )}

      {error && <span className="text-small text-danger">{error}</span>}
    </div>
  );
}
