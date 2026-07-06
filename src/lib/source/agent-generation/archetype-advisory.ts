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

  const valueLevers = archetype.valueLeverRules ?? [];
  if (valueLevers.length > 0) {
    lines.push(
      "Value levers — classify, do not chase a single savings %. The first vendor bid is the vendor's OPENING POSITION, not the baseline; a price drop is not automatically value we created. Classify every lever by its value TYPE (expected_concession = giveback already in the first bid; incremental_negotiated = value earned beyond it; solution_tightening = a better solution, not just a lower price; protected = post-award leakage avoided; risk_adjusted = value net of delivery/underpricing/solution risk).",
    );
    lines.push(
      "Numbers are DETERMINISTIC and DEFENSIBLE: derive each figure only from the stated inputs using the stated formula — never invent or round a number the inputs do not support. If a required input is missing, state 'insufficient evidence' for that lever; do NOT guess. Always present a range with a confidence band and show the derivation (inputs → formula), never a bare guaranteed number. Do not sum protected/risk-adjusted value into a headline savings figure.",
    );
    for (const r of valueLevers) {
      const inputList = r.computation.inputs
        .map((i) => `${i.key} (${i.unit}, ${i.source}${i.citationRequired ? ", cited" : ""})`)
        .join("; ");
      lines.push(
        `- ${r.name} [type ${r.valueType}, ${r.category}, confidence ${r.defaultConfidence}]: watch — ${r.whatToWatch} Value basis — ${r.valueBasis} Formula — ${r.computation.method}. Inputs — ${inputList}. Range — ${r.computation.rangeMethod} BAFO ask — ${r.bafoAsk} Executive implication — ${r.executiveImplication}${r.commercialRisk ? ` Commercial risk — ${r.commercialRisk}` : ""}`,
      );
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}
