/**
 * The single wrapper every Knowledge UI component should use to consume a
 * ConsumptionEnvelope. It is the enforcement point for the render-gate rule:
 * a component given a withheld/not_loaded/blocked envelope renders the safe
 * empty state and the `children` render-prop is never invoked with
 * fabricated or partial data.
 *
 * Usage:
 *   <GatedSection envelope={identityEnvelope} label="Enterprise identity">
 *     {(identity) => <IdentityCards identity={identity} />}
 *   </GatedSection>
 */
"use client";

import type { ReactNode } from "react";

import type { ConsumptionEnvelope } from "@/lib/knowledge/providers/types";
import { gateEnvelope } from "./gate-utils";
import { StateBanner } from "./StateBanner";

export interface GatedSectionProps<T> {
  readonly envelope: ConsumptionEnvelope<T> | null | undefined;
  /** Human label for what this section is, used only for the loading state. */
  readonly label: string;
  /** Render prop invoked ONLY when the envelope is renderable. Receives the
   * narrowed non-null data. */
  readonly children: (data: T, envelope: ConsumptionEnvelope<T>) => ReactNode;
  /** Set true for the one legitimate opt-in case (Relationships "Show
   * candidates" toggle) where candidate/proposed authority content may render,
   * visually marked, rather than being blocked outright. */
  readonly allowCandidate?: boolean;
  readonly compact?: boolean;
  readonly emptyAction?: {
    readonly label: string;
    readonly onClick: () => void;
  };
  /** Optional override empty-state copy for a specific matrix row's
   * `safe_empty_state_behavior` -- when omitted, gate-utils' generic copy is
   * used. */
  readonly emptyTitle?: string;
  readonly emptyBody?: string;
}

export function GatedSection<T>({
  envelope,
  label,
  children,
  allowCandidate = false,
  compact = false,
  emptyAction,
  emptyTitle,
  emptyBody,
}: GatedSectionProps<T>) {
  if (!envelope) {
    return (
      <StateBanner
        compact={compact}
        decision={{ tone: "neutral", title: `${label}: loading`, body: "" }}
      />
    );
  }

  const decision = gateEnvelope(envelope, { allowCandidate });

  if (
    !decision.renderable ||
    envelope.data === null ||
    envelope.data === undefined
  ) {
    return (
      <StateBanner
        compact={compact}
        decision={{
          tone: decision.tone,
          title: emptyTitle ?? `${label} -- ${decision.title.toLowerCase()}`,
          body: emptyBody ?? decision.body,
        }}
        detail={envelope.warnings[0]}
        action={emptyAction}
      />
    );
  }

  return <>{children(envelope.data, envelope)}</>;
}
