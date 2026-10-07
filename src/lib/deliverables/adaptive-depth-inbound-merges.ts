// Which artifacts were folded INTO the one now being written.
//
// Adaptive depth can resolve an artifact to `merge_into_parent`: the document is
// not built on its own, and its subject matter is supposed to appear inside a
// named parent instead. The decisions say so in their own words — "include the
// run/change ownership note inside Solution Design", "Root-cause analysis is
// simple enough to embed in the Current-State Assessment".
//
// Nothing carried that promise to the parent. The merge was announced in exactly
// one place: `renderAdaptiveDepthPrompt` renders `Merge into <parent>` into the
// prompt of the CHILD — the artifact the generate-phase route has already
// filtered out of the build, so that prompt is never built. The parent's own
// prompt got its own applicability line and no mention of the child, and
// `adaptArtifactBriefForDepth` only ever FILTERS the parent's recommended
// structure, so it cannot add a home for the absorbed content either.
//
// Measured, not inferred: the parent briefs have no section covering the child's
// ground. `discovery_report` is exec_summary / approach / current_state /
// maturity_gaps / readiness_implications / recommendation — no root-cause
// section, while the child owns symptom_cause_table, root_cause_tree and
// confidence_gaps. `solution_design` is exec_decision / journey_workflow /
// solution_components / controls_operability / acceptance_traceability /
// recommendation — no operating-model section, while the child declares one
// explicitly. So on a straightforward-tier Move the merged subject matter was
// dropped outright: absent from the child (never built) and unrequested in the
// parent, while the route's response reported `mergeInto` as though it had been
// handled.
//
// This module computes the inbound side of that relation so the parent's prompt
// can state it. It does not change which artifacts are built — only what the
// surviving parent is told to cover.
//
// Two traps, both measured rather than reasoned about:
//
//   • The same child can appear TWICE. The generate-phase route passes both key
//     spellings into `artifactKeys` (`spec.deliverableTypeKey` and its
//     `orchestratorDeliverableType`), and `operating_model_design` maps to
//     `operating_model` — the one pair in play here that actually differs. At P3
//     the applicability map therefore carries both spellings of that single
//     artifact, each with `merge_into_parent` → `solution_design`. Enumerating
//     raw entries would instruct the model to absorb one document twice, so
//     children are de-duplicated on their canonical (orchestrator) key.
//
//   • The parent is matched on its canonical key too, so a caller holding either
//     spelling resolves the same inbound set. Both of today's merge targets
//     (`solution_design`, `discovery_report`) happen to be identity under that
//     map; relying on that would make this correct only by luck.
//
// Order is the applicability map's own iteration order, which is the order the
// route declared the phase's build set — deterministic for a given decision, so
// the rendered prompt text is stable.

import { orchestratorDeliverableType } from "@/lib/programs/orchestrated-deliverable-map";
import type { AdaptiveDepthDecision } from "@/lib/deliverables/adaptive-depth";

export interface InboundArtifactMerge {
  /** Canonical (orchestrator) key of the artifact folded into the parent. */
  artifactKey: string;
  /** Adaptive depth's own reason, which names the content to carry over. */
  reason: string;
}

/**
 * The artifacts adaptive depth folded into `parentArtifactKey`, de-duplicated on
 * their canonical key. Empty when nothing merged into this artifact — which is
 * the common case, and the reason callers can render nothing at all.
 */
export function inboundArtifactMerges(
  decision: AdaptiveDepthDecision | undefined,
  parentArtifactKey: string | undefined,
): InboundArtifactMerge[] {
  if (!decision || !parentArtifactKey) return [];
  const parent = orchestratorDeliverableType(parentArtifactKey);
  const merges: InboundArtifactMerge[] = [];
  const seen = new Set<string>();
  for (const [artifactKey, value] of Object.entries(
    decision.artifactApplicability,
  )) {
    if (value?.applicability !== "merge_into_parent") continue;
    if (!value.mergeInto) continue;
    if (orchestratorDeliverableType(value.mergeInto) !== parent) continue;
    const canonical = orchestratorDeliverableType(artifactKey);
    // An artifact merged into itself has no content to carry anywhere, and
    // would instruct the model to absorb the document it is already writing.
    if (canonical === parent) continue;
    if (seen.has(canonical)) continue;
    seen.add(canonical);
    merges.push({ artifactKey: canonical, reason: value.reason });
  }
  return merges;
}

/**
 * The instruction block for the parent's prompt. Empty string when nothing
 * merged in, so the caller can concatenate unconditionally.
 *
 * The wording has to beat two of the hard adaptive-depth rules already in the
 * prompt — "Do not add empty Not Applicable sections" and the instruction not to
 * include operating-model or sourcing content "unless triggered above". A merge
 * IS that trigger, and saying so is the point: without it a model obeying the
 * surrounding rules will correctly leave the absorbed subject matter out.
 */
export function renderInboundMergeInstruction(
  merges: readonly InboundArtifactMerge[],
): string {
  if (merges.length === 0) return "";
  return [
    "ABSORBED ARTIFACTS - CONTENT THIS DOCUMENT MUST NOW CARRY:",
    "These artifacts are not being produced separately for this Move. Their subject matter belongs in THIS document and must be covered here, as integrated sections of this document's own argument:",
    ...merges.map((merge) => `- ${merge.artifactKey}: ${merge.reason}`),
    "Cover each one at a depth proportional to the resolved complexity tier — a compact, evidence-honest treatment, not a separate appendix and not a restatement of this document's other sections. This instruction overrides any rule above that would otherwise exclude that subject matter: the merge IS the trigger for including it.",
  ].join("\n");
}
