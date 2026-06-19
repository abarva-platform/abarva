// Source reasoning · context adapter (Phase 1, Slice 1.2)
//
// Derives framework inputs from the live SourceGenerationContext. The reasoning
// frameworks (§5.2) were originally written for the chat-path SourceAgentContextBundle;
// this adapter is the connective tissue that lets the Analysis stage (Slice 1.3)
// run them on the generate path WITHOUT coupling generation to that heavy bundle.
// Pure; no I/O. The live generate path (generate-from-claude/route.ts) is untouched.

import type { SourceGenerationContext } from "@/lib/source/agent-generation/types";
import type { SourceRigorLevel } from "@/lib/source/types";
import type {
  SourcingEventAttributes,
  TenantContextSignals,
} from "@/lib/source/classifier/category-classifier";

export interface ClassifierInput {
  attributes: SourcingEventAttributes;
  signals: TenantContextSignals;
}

/** Build the classifier's inputs from generation context. */
export function toClassifierInput(
  ctx: SourceGenerationContext,
): ClassifierInput {
  const description =
    [ctx.event.scopeDescription, ctx.event.triggerDescription]
      .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      .join(" — ") || undefined;
  return {
    attributes: {
      name: ctx.event.name,
      archetype: ctx.event.archetype ?? undefined,
      description,
    },
    // The generate path does not yet carry loaded-segment signals; an empty set
    // is honest — the classifier surfaces every needed segment as an evidence
    // gap, which the grounded-refusal path (Slice 1.7) will consume.
    signals: { loadedSegments: [] },
  };
}

/** The vendor-quoted / value-at-stake figure should-cost reasons from, if present. */
export function toValueAtStakeUsd(
  ctx: SourceGenerationContext,
): number | null {
  return ctx.event.estimatedValueUsd ?? null;
}

const RIGOR_LEVELS: readonly SourceRigorLevel[] = [
  "standard",
  "enhanced",
  "strategic",
];

/** Coerce the event's free-text rigor to a known level (defaults to standard). */
export function toRigorLevel(ctx: SourceGenerationContext): SourceRigorLevel {
  const r = ctx.event.rigor ?? "";
  return (RIGOR_LEVELS as readonly string[]).includes(r)
    ? (r as SourceRigorLevel)
    : "standard";
}
