// Agent generation · archetype advisory block
//
// Formats the resolved sourcing archetype's commercial intelligence (pricing
// traps, negotiation levers by timing, vendor assumptions to challenge,
// evaluation disqualifiers) into the prompt block that makes a deliverable
// archetype-SPECIFIC instead of generic advisor prose. Pure — the archetype
// registry already holds the content; this just projects it for the prompt.

import type { SourceEventArchetype } from "@/lib/source/archetypes/types";

/**
 * Build the archetype advisory block for a generation prompt. Returns "" when
 * no archetype resolved (unmapped category / legacy event) — the template then
 * falls back to its generic advisor voice rather than inventing archetype
 * specifics.
 */
export function buildArchetypeAdvisoryBlock(
  archetype: SourceEventArchetype | null | undefined,
): string {
  if (!archetype) return "";

  const lines: string[] = [
    `Sourcing archetype: ${archetype.name}. Apply THIS archetype's specific commercial intelligence below — do not substitute generic sourcing advice.`,
    "",
  ];

  const traps = archetype.pricingModel?.traps ?? [];
  if (traps.length > 0) {
    lines.push("Pricing traps to surface and force vendors to close:");
    for (const t of traps) lines.push(`- ${t}`);
    lines.push("");
  }

  const leversAt = (timing: string) =>
    (archetype.negotiationLevers ?? []).filter((l) => l.timing === timing);
  const rfpLevers = [...leversAt("pre_rfp"), ...leversAt("rfp")];
  const bafoLevers = leversAt("bafo");
  if (rfpLevers.length > 0) {
    lines.push("Negotiation leverage to build in at the RFP stage:");
    for (const l of rfpLevers) lines.push(`- ${l.label}: ${l.rationale}`);
    lines.push("");
  }
  if (bafoLevers.length > 0) {
    lines.push("Negotiation leverage to reserve for BAFO:");
    for (const l of bafoLevers) lines.push(`- ${l.label}: ${l.rationale}`);
    lines.push("");
  }

  const challenges = archetype.vendorDiscussionGuide?.challengeAssumptions ?? [];
  if (challenges.length > 0) {
    lines.push("Vendor assumptions to challenge (do not accept at face value):");
    for (const c of challenges) lines.push(`- ${c}`);
    lines.push("");
  }

  const disqualifiers = archetype.evaluationModel?.disqualifiers ?? [];
  if (disqualifiers.length > 0) {
    lines.push("Evaluation disqualifiers (auto-fail conditions):");
    for (const d of disqualifiers) lines.push(`- ${d}`);
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}
