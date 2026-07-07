"use client";

import { COLORS, RADIUS, TYPOGRAPHY } from "@/lib/design/design-tokens";

/**
 * LandingZonePanel — the Azure Storage on-ramp.
 *
 * Shows the client-scoped landing-zone path operators can drop files
 * into directly (outside the browser), helper links (how to connect /
 * copy the path), and — when the loader has detected new files in the
 * zone — a calm "N new files detected — Review & ingest" call to
 * action. Pure presentational: copy/connect/review are emitted as
 * events. No fetch, no SDK.
 *
 * Locked design system: cream surface, serif display, hairline borders,
 * black + ghost buttons, mono for paths.
 */

export interface LandingZoneHelperLink {
  label: string;
  onClick: () => void;
}

export interface LandingZonePanelProps {
  /** The full container/path operators drop files into. */
  storagePath: string;
  /** Number of new, not-yet-ingested files detected in the zone. */
  newFileCount?: number;
  /** Operator copied the storage path. */
  onCopyPath?: () => void;
  /** Operator chose to review + ingest the detected files. */
  onReviewAndIngest?: () => void;
  /** Extra helper links (rendered as ghost links). */
  helperLinks?: LandingZoneHelperLink[];
  className?: string;
}

export function LandingZonePanel({
  storagePath,
  newFileCount = 0,
  onCopyPath,
  onReviewAndIngest,
  helperLinks = [],
  className,
}: LandingZonePanelProps) {
  const hasNew = newFileCount > 0;
  return (
    <section
      className={className}
      aria-label="Azure Storage landing zone"
      style={{
        border: `1px solid ${COLORS.ink}1A`,
        borderRadius: RADIUS.lg,
        background: COLORS.cream,
        padding: "20px 22px",
        fontFamily: TYPOGRAPHY.sans,
      }}
    >
      <div
        style={{ fontFamily: TYPOGRAPHY.serif, fontSize: 20, color: COLORS.ink }}
      >
        Azure Storage landing zone
      </div>
      <div style={{ fontSize: 13, color: `${COLORS.ink}99`, marginTop: 4 }}>
        Drop files straight into your private container — they appear here for
        review.
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 16,
          padding: "10px 12px",
          borderRadius: RADIUS.md,
          border: `1px solid ${COLORS.ink}1A`,
          background: COLORS.white,
        }}
      >
        <code
          style={{
            flex: 1,
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 12,
            color: COLORS.ink,
            wordBreak: "break-all",
          }}
        >
          {storagePath}
        </code>
        {onCopyPath ? (
          <button
            type="button"
            onClick={onCopyPath}
            style={{
              flexShrink: 0,
              padding: "6px 12px",
              borderRadius: RADIUS.sm,
              border: `1px solid ${COLORS.ink}33`,
              background: "transparent",
              color: COLORS.ink,
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Copy
          </button>
        ) : null}
      </div>

      {helperLinks.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 12 }}>
          {helperLinks.map((link) => (
            <button
              key={link.label}
              type="button"
              onClick={link.onClick}
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
                color: COLORS.navy,
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              {link.label}
            </button>
          ))}
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginTop: 18,
          paddingTop: 16,
          borderTop: `1px solid ${COLORS.ink}14`,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            color: hasNew ? COLORS.amberInk : `${COLORS.ink}99`,
          }}
        >
          {hasNew ? (
            <span
              aria-hidden
              style={{
                width: 7,
                height: 7,
                borderRadius: RADIUS.pill,
                background: COLORS.amberInk,
              }}
            />
          ) : null}
          {hasNew
            ? `${newFileCount} new ${
                newFileCount === 1 ? "file" : "files"
              } detected`
            : "No new files detected"}
        </span>
        <button
          type="button"
          disabled={!hasNew || !onReviewAndIngest}
          onClick={onReviewAndIngest}
          style={{
            padding: "9px 18px",
            borderRadius: RADIUS.md,
            border: "none",
            background: COLORS.ink,
            color: COLORS.white,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            fontWeight: 500,
            cursor: hasNew ? "pointer" : "not-allowed",
            opacity: hasNew ? 1 : 0.5,
          }}
        >
          Review &amp; ingest
        </button>
      </div>
    </section>
  );
}

export default LandingZonePanel;
