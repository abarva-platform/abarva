"use client";

// Thin wrapper so TowerPage stays a Server Component.
// Problem: once the user clicks inside the Tower iframe, the iframe gains
// document focus. The browser then treats the NEXT click on the outer page
// (including AppTopBar nav links) as a "blur" click rather than an action
// click, so navigation requires two clicks.
// Fix: listen in capture phase for any pointerdown outside the iframe and
// pre-emptively blur it, so the very next click on the nav goes straight
// to navigation.

import { useEffect, useRef } from "react";

export function TowerIframeContainer({ src }: { src: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handle = (e: PointerEvent) => {
      const iframe = iframeRef.current;
      if (iframe && !iframe.contains(e.target as Node)) {
        iframe.blur();
      }
    };
    document.addEventListener("pointerdown", handle, true);
    return () => document.removeEventListener("pointerdown", handle, true);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      src={src}
      title="AbarVa IT Investment Tower"
      style={{
        width: "100%",
        height: "100%",
        border: 0,
        display: "block",
        background: "#f7f5ef",
      }}
    />
  );
}
