import type { MoveEvidenceNeedPacket } from "@/lib/programs/evidence-readiness/move-evidence-need-packet";
import type { ReadinessReport } from "@/lib/programs/current-state-readiness";
import type { GateCriterionView } from "@/lib/programs/gate-readiness-step";
import { parseDiagnosisFacts } from "@/lib/programs/diagnosis-facts";
import { hasUncitedPlanningFigure } from "@/lib/programs/capture-text-step-record";
import type { AssumptionView } from "@/lib/programs/assumption-register/register-request";
import { effectiveFigure } from "@/lib/programs/assumption-register/model";

export const P2_HARD_CHECK_IDS = [
  "discovery_report_signed_off",
  "discovery_notes_ingested",
  "discovery_baseline_attested",
  "discovery_stakeholders_named",
  "p2_readiness_cleared",
  "solution_route_validated",
] as const;

export type P2HardCheckId = (typeof P2_HARD_CHECK_IDS)[number];

/** Only a visible, answered register figure may support a numeric baseline. */
export function citableP2RegisterIds(
  rows: readonly AssumptionView[] | null,
): string[] | null {
  if (rows === null) return null;
  return rows
    .filter(
      (row) =>
        !row.figuresRedacted &&
        (row.status === "confirmed" || row.status === "corrected") &&
        /\d/.test(effectiveFigure(row) ?? ""),
    )
    .flatMap((row) => [row.registerId, row.id]);
}

export function numberedP2EvidenceReferences(
  references: ReadonlyArray<{ evidenceId: string; title: string }>,
) {
  return references.map((reference, index) => ({
    ...reference,
    citation: `[E:${index + 1}]`,
  }));
}

export function p2CheckState(
  criteria: readonly GateCriterionView[],
  id: P2HardCheckId,
): "met" | "open" | "unavailable" {
  const criterion = criteria.find((item) => item.id === id);
  if (!criterion || !criterion.verified || criterion.severity !== "hard")
    return "unavailable";
  return criterion.completed ? "met" : "open";
}

/** Coverage and the signed-report decision are independent requirements. */
export function p2EvidencePlanReady(input: {
  packets: readonly MoveEvidenceNeedPacket[];
  readiness: ReadinessReport | null;
  readable: boolean;
  criteria: readonly GateCriterionView[];
}): boolean {
  const required = input.packets.filter(
    (packet) => packet.phase === 2 && packet.priority === "required",
  );
  return (
    input.readable &&
    input.readiness !== null &&
    input.readiness.hardGaps.length === 0 &&
    required.length > 0 &&
    required.every((packet) => packet.status === "covered") &&
    p2CheckState(input.criteria, "p2_readiness_cleared") === "met"
  );
}

function citationIds(text: string, prefix: "A" | "E"): string[] {
  return Array.from(
    text.matchAll(new RegExp(`\\[${prefix}:([A-Za-z0-9_-]+)\\]`, "g")),
    (match) => match[1],
  );
}

/**
 * A number is usable as a P2 baseline only with a resolvable register row or
 * an approved evidence reference. The cited source remains visible beside it.
 */
export function uncitedP2BaselineReasons(input: {
  findings: string;
  baseline: string;
  registerIds: readonly string[] | null;
  approvedEvidenceIds: readonly string[];
}): string[] {
  const reasons: string[] = [];
  const knownAssumptions = new Set(input.registerIds ?? []);
  const knownEvidence = new Set(input.approvedEvidenceIds);
  const evidenceCitationValid = (id: string) =>
    knownEvidence.has(id) ||
    (/^[1-9]\d*$/.test(id) && Number(id) <= input.approvedEvidenceIds.length);
  const cited = (text: string) =>
    citationIds(text, "A").some((id) => knownAssumptions.has(id)) ||
    citationIds(text, "E").some(evidenceCitationValid);
  const missingCitationReason = (subject: string, text: string) =>
    input.registerIds === null && citationIds(text, "A").length > 0
      ? `${subject}: The assumptions register could not be read, so its citation cannot be checked.`
      : `${subject} has a figure without a resolvable [A:ID] or approved [E:n] citation.`;

  for (const [index, line] of input.findings.split(/[\n;]/).entries()) {
    if (
      hasUncitedPlanningFigure(line, { allowEvidence: true }) ||
      (/\d/.test(line.replace(/\bP[0-5](?:\.\d+)?\b/g, "")) && !cited(line))
    ) {
      reasons.push(missingCitationReason(`Finding ${index + 1}`, line));
    }
  }
  for (const [index, fact] of parseDiagnosisFacts(input.baseline).entries()) {
    if (!/\d/.test(fact.value)) continue;
    if (!cited(`${fact.value} ${fact.source}`)) {
      reasons.push(
        missingCitationReason(
          `Baseline row ${index + 1}`,
          `${fact.value} ${fact.source}`,
        ),
      );
    }
  }
  return reasons;
}
