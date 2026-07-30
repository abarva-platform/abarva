/**
 * The single wrapper every Knowledge UI component uses to consume a
 * ViewModelEnvelope from KnowledgeUiViewModelAssembler. It is the enforcement
 * point for the render-gate rule: a component given a non-renderable envelope
 * (data === null) renders the safe empty state, keyed off the real 11-value
 * ComponentReadinessState, and the `children` render-prop is never invoked
 * with fabricated or partial data.
 *
 * Usage:
 *   <GatedSection envelope={identityEnvelope} label="Enterprise identity">
 *     {(identity) => <IdentityCards identity={identity} />}
 *   </GatedSection>
 */
"use client";

import type { ReactNode } from "react";

import type { ViewModelEnvelope } from "@/lib/knowledge/view-model";
import { readinessPresentation } from "./gate-utils";
import { StateBanner } from "./StateBanner";

export interface GatedSectionProps<T> {
  readonly envelope: ViewModelEnvelope<T> | null | undefined;
  /** Human label for what this section is, used only for the loading state. */
  readonly label: string;
  /** Render prop invoked ONLY when the envelope is renderable. Receives the
   * narrowed non-null data. */
  readonly children: (data: T, envelope: ViewModelEnvelope<T>) => ReactNode;
  readonly compact?: boolean;
  readonly emptyAction?: {
    readonly label: string;
    readonly onClick: () => void;
  };
  /** Optional override empty-state copy for a specific component's own
   * framing -- when omitted, the envelope's own `unavailableReason` (already
   * field-specific and honest, computed by the assembler) is used. */
  readonly emptyTitle?: string;
  readonly emptyBody?: string;
}

export function GatedSection<T>({
  envelope,
  label,
  children,
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

  if (envelope.data === null) {
    const presentation = readinessPresentation(envelope.readiness);
    return (
      <StateBanner
        compact={compact}
        decision={{
          tone: presentation.tone,
          title:
            emptyTitle ?? `${label} -- ${presentation.title.toLowerCase()}`,
          body: emptyBody ?? envelope.unavailableReason ?? "",
        }}
        detail={envelope.warnings[0]?.message}
        action={emptyAction}
      />
    );
  }

  return <>{children(envelope.data, envelope)}</>;
}
