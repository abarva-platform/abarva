"use client";

import { useState, type CSSProperties } from "react";
import { normalizeArtifactBlockers, type ArtifactBlockerLike } from "@/lib/source/contracts/blocker-copy";

// Replaces the bare `<a href download>` export/download pattern (PR 4D,
// ADR-0015). Before this component, a contract-blocked export (the
// render/download routes' real `409 export_not_eligible`, shipped in PR 4C)
// was invisible to the user — clicking the anchor just downloaded or
// opened the JSON error body as if it were the file. This component fetches
// first, and only ever triggers a real file save/open on a real 2xx byte
// response; a blocked response instead reports its blockers to the caller
// so they render through the same ArtifactBlockerList every other
// contract-driven surface uses.

interface ExportLinkProps {
  href: string;
  mode: "download" | "view";
  children: React.ReactNode;
  style?: CSSProperties;
  dataTestId?: string;
  title?: string;
  onBlocked: (blockers: ArtifactBlockerLike[]) => void;
  onSuccess?: () => void;
}

function filenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null;
  const starMatch = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (starMatch) {
    try {
      return decodeURIComponent(starMatch[1]);
    } catch {
      /* fall through to the plain match below */
    }
  }
  const plainMatch = /filename="?([^";]+)"?/i.exec(header);
  return plainMatch ? plainMatch[1] : null;
}

export function ExportLink({
  href,
  mode,
  children,
  style,
  dataTestId,
  title,
  onBlocked,
  onSuccess,
}: ExportLinkProps) {
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    setPending(true);
    onBlocked([]);
    try {
      const response = await fetch(href);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        onBlocked(
          normalizeArtifactBlockers(
            payload,
            `This export could not be completed (HTTP ${response.status}).`,
          ),
        );
        return;
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      if (mode === "view") {
        window.open(objectUrl, "_blank", "noopener,noreferrer");
      } else {
        const filename =
          filenameFromContentDisposition(
            response.headers.get("content-disposition"),
          ) ?? "download";
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
      }
      // Object URLs are only needed for the instant the browser acts on
      // them; revoke shortly after so the popup/download has time to start.
      setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
      onSuccess?.();
    } catch {
      onBlocked([
        {
          code: "network_error",
          detail: "Could not reach the server to complete this export.",
        },
      ]);
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      data-testid={dataTestId}
      title={title}
      style={{ ...style, opacity: pending ? 0.6 : (style?.opacity ?? 1), cursor: pending ? "wait" : "pointer" }}
    >
      {pending ? "Working…" : children}
    </button>
  );
}
