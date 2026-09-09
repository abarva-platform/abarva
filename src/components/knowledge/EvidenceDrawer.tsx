/**
 * Shared evidence drawer, opened from Explore row clicks, Relationships node/edge
 * clicks, and Brief cards. One component so evidence always looks and behaves
 * the same regardless of where it was opened from (matrix rows: "Row detail
 * drawer", "Node click evidence drawer", "Edge click evidence drawer").
 *
 * Per the Graph Binding Contract Section 3: a drawer with a citation but no
 * confidence/review/authority must show those rows as "Not yet captured,"
 * never a defaulted plausible-looking value. Per Section "Restricted evidence
 * access": existence/state/owner are visible for restricted evidence; content
 * is not.
 *
 * Props carry the REAL contract's EvidenceDescriptor/EvidenceGapV1 shapes
 * (src/lib/knowledge/consumption-contracts) -- already resolved via
 * runtime.resolveEvidence -- rather than the duplicate provider's invented
 * EvidenceRef/KnownGapRef types.
 */
"use client";

import { useEffect, useId, useRef } from "react";
import type {
  EvidenceDescriptor,
  EvidenceGapV1,
} from "@/lib/knowledge/consumption-contracts";
import { StateBanner } from "./state/StateBanner";
import { CurrentVsTargetPanel } from "./compare/CurrentVsTargetPanel";

export interface EvidenceDrawerAttribute {
  readonly label: string;
  readonly value: string;
}

export interface EvidenceDrawerProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly kind: string;
  readonly title: string;
  readonly subtitle?: string;
  /** Real row/node/edge attributes -- rendered even when evidence provenance
   * is not yet captured, per the row-detail-drawer render gate. */
  readonly attributes?: readonly EvidenceDrawerAttribute[];
  readonly evidence: readonly EvidenceDescriptor[];
  readonly gaps?: readonly EvidenceGapV1[];
  readonly onAskAva?: () => void;
  readonly onRequestAccess?: () => void;
  /** Real canonical id for the row/node this drawer opened for. When present,
   * the drawer offers a current-vs-target comparison for that exact entity --
   * never rendered without a real id (see KnowledgeDrawerState.entityId). */
  readonly entityId?: string;
}

export function EvidenceDrawer({
  open,
  onClose,
  kind,
  title,
  subtitle,
  attributes,
  evidence,
  gaps,
  onAskAva,
  onRequestAccess,
  entityId,
}: EvidenceDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const subtitleId = useId();

  useEffect(() => {
    if (!open) return;

    returnFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = getFocusableElements(panelRef.current);
      if (focusable.length === 0) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      const target = returnFocusRef.current;
      if (target?.isConnected) target.focus();
    };
  }, [onClose, open]);

  if (!open) return null;

  const restricted = evidence.some(
    (e) =>
      e.accessRestriction === "restricted" ||
      e.accessRestriction === "withheld",
  );
  const visibleEvidence = evidence.filter(
    (e) =>
      e.accessRestriction !== "restricted" &&
      e.accessRestriction !== "withheld",
  );

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={subtitle ? subtitleId : undefined}
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(10,10,11,0.28)]"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-[rgba(10,10,11,0.12)] bg-[#faf7f1] p-5 shadow-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[#888780]">
              {kind}
            </p>
            <h2
              id={titleId}
              className="mt-0.5 text-lg font-semibold text-[#0c1a3a]"
            >
              {title}
            </h2>
            {subtitle ? (
              <p id={subtitleId} className="mt-1 text-sm text-[#5f5e5a]">
                {subtitle}
              </p>
            ) : null}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={`Close evidence drawer for ${title}`}
            className="rounded-md border border-[rgba(10,10,11,0.18)] bg-white px-2 py-1 text-sm text-[#5f5e5a] hover:bg-[rgba(10,10,11,0.04)]"
          >
            Close
          </button>
        </div>

        {attributes && attributes.length > 0 ? (
          <section className="mb-5">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#0066CC]">
              Attributes
            </h3>
            <dl className="divide-y divide-[rgba(10,10,11,0.08)] rounded-md border border-[rgba(10,10,11,0.1)] bg-white">
              {attributes.map((a) => (
                <div
                  key={a.label}
                  className="flex items-baseline justify-between gap-4 px-3 py-2 text-sm"
                >
                  <dt className="text-[#888780]">{a.label}</dt>
                  <dd className="text-right text-[#2c2c2a]">{a.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {entityId ? (
          <section className="mb-5">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#0066CC]">
              Current vs. target
            </h3>
            <CurrentVsTargetPanel entityId={entityId} />
          </section>
        ) : null}

        <section className="mb-5">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#0066CC]">
            Evidence
          </h3>
          {restricted ? (
            <StateBanner
              decision={{
                tone: "restricted",
                title: "This evidence is classified board-only",
                body: "Your role can see that it exists, its state and its owner, but not its content.",
              }}
              action={
                onRequestAccess
                  ? { label: "Request access", onClick: onRequestAccess }
                  : undefined
              }
            />
          ) : visibleEvidence.length === 0 ? (
            <StateBanner
              decision={{
                tone: "neutral",
                title: "Provenance not yet captured",
                body: "This item does not yet resolve to a source reference. Attributes above are real; evidence lineage is not yet available for it.",
              }}
            />
          ) : (
            <ul className="space-y-2">
              {visibleEvidence.map((e, i) => (
                <li
                  key={`${e.evidenceRef}-${i}`}
                  className="rounded-md border border-[rgba(10,10,11,0.1)] bg-white p-3"
                >
                  <p className="text-sm font-medium text-[#2c2c2a]">
                    {e.sourceName ?? "Not yet captured"}
                  </p>
                  {e.citation ? (
                    <p className="mt-0.5 text-sm text-[#5f5e5a]">
                      {e.citation}
                    </p>
                  ) : null}
                  <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-[#5f5e5a]">
                    <Row
                      label="State"
                      value={e.reviewState ?? "Not yet captured"}
                    />
                    <Row
                      label="Confidence"
                      value={
                        e.confidence === null
                          ? "Not yet captured"
                          : `${Math.round(e.confidence * 100)}%`
                      }
                    />
                    <Row
                      label="Source date"
                      value={e.sourceDate ?? "Not yet captured"}
                    />
                    <Row
                      label="Effective period"
                      value={e.effectivePeriod ?? "Not yet captured"}
                    />
                  </dl>
                  {e.relatedConflicts.length > 0 ? (
                    <p className="mt-2 text-xs font-medium text-[#a32d2d]">
                      Conflicts with: {e.relatedConflicts.join(", ")}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        {gaps && gaps.length > 0 ? (
          <section className="mb-5">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#0066CC]">
              Known gaps
            </h3>
            <ul className="space-y-2">
              {gaps.map((g) => (
                <li
                  key={g.gapId}
                  className="rounded-md border border-[rgba(163,45,45,0.24)] bg-[rgba(163,45,45,0.05)] p-3 text-sm"
                >
                  <p className="font-medium text-[#a32d2d]">{g.title}</p>
                  <p className="mt-1 text-xs text-[#5f5e5a]">
                    {g.businessImpact}
                  </p>
                  <p className="mt-1 text-xs text-[#5f5e5a]">
                    Closes with: {g.requestedSource ?? "Not specified"}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {onAskAva ? (
          <button
            type="button"
            onClick={onAskAva}
            className="mt-auto rounded-md bg-[#0066CC] px-3 py-2 text-sm font-medium text-white hover:bg-[#0058b3]"
          >
            Ask aVa about this
          </button>
        ) : null}
      </div>
    </div>
  );
}

function getFocusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      [
        "a[href]",
        "button:not([disabled])",
        "input:not([disabled])",
        "select:not([disabled])",
        "textarea:not([disabled])",
        "[tabindex]:not([tabindex='-1'])",
      ].join(","),
    ),
  ).filter(
    (el) =>
      !el.hasAttribute("disabled") &&
      el.getAttribute("aria-hidden") !== "true",
  );
}

function Row({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <>
      <dt className="text-[#888780]">{label}</dt>
      <dd className="text-[#2c2c2a]">{value}</dd>
    </>
  );
}
