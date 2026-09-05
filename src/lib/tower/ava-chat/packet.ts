// Tower aVa chat — deterministic packet builder.
//
// Reads an already-built TowerContextPack and narrows it to what a
// conversational answer may use. The rule this file exists to enforce: a
// figure reaches aVa only if the deterministic layer already published it AND
// marked it safe to display. Nothing here computes, derives, sums, or
// converts a value. A withheld metric is named without its number so aVa can
// say the metric exists and is not yet displayable.

import {
  buildAvaModuleCaveats,
  type AvaModuleOptionalInputField,
  collectMissingAvaModuleInputs,
} from "@/lib/agent/module-expert-contract";
import type {
  TowerContextPack,
  TowerValueClaim,
} from "@/lib/enterprise-knowledge/contracts";
import type {
  TowerAvaChatPacket,
  TowerAvaDisplayableMetric,
  TowerAvaValueClaimSummary,
} from "./types";

export interface BuildTowerAvaChatPacketInput {
  contextPack: TowerContextPack;
  adoptionEvidence?: string[];
  fundingGateNotes?: string[];
}

const OPTIONAL_FIELD_LABELS: ReadonlyArray<
  AvaModuleOptionalInputField<BuildTowerAvaChatPacketInput>
> = [
  { key: "adoptionEvidence", label: "adoption evidence" },
  { key: "fundingGateNotes", label: "funding-gate notes" },
];

const ALLOWED_ACTIONS = [
  "Explain what a published metric or value claim currently says.",
  "Explain why a value claim is blocked and what evidence would unblock it.",
  "Name the evidence gaps that limit what Tower can report.",
  "Point to the surface that owns work Tower only observes.",
];

const DISALLOWED_ACTIONS = [
  "Calculate, sum, convert, or restate a figure the deterministic layer did not publish.",
  "Describe a value as realized unless the claim allows realized-value language.",
  "Say Tower certifies value; Tower tracks evidence for the accountable owner to certify.",
  "Advance a funding gate or approve an outcome.",
];

/** The deterministic layer owns the number; this only renders what it published. */
function displayValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "";
}

function summarizeClaim(claim: TowerValueClaim): TowerAvaValueClaimSummary {
  return {
    claimId: claim.claimId,
    label: claim.label,
    gateStatus: String(claim.gateStatus),
    realizedValueLanguageAllowed: claim.realizedValueLanguageAllowed === true,
    reason: claim.reason,
    requiredEvidence: [...(claim.requiredEvidence ?? [])],
  };
}

export function buildTowerAvaChatPacket(
  input: BuildTowerAvaChatPacketInput,
  questionText: string,
): TowerAvaChatPacket {
  void questionText;
  const pack = input.contextPack;

  const displayableMetrics: TowerAvaDisplayableMetric[] = [];
  const withheldMetricLabels: string[] = [];
  for (const metric of pack.towerMetricRecords ?? []) {
    if (metric.safeToDisplay !== true) {
      withheldMetricLabels.push(metric.label);
      continue;
    }
    const rendered = displayValue(metric.value);
    if (!rendered) {
      withheldMetricLabels.push(metric.label);
      continue;
    }
    displayableMetrics.push({
      metricId: metric.metricId,
      label: metric.label,
      displayValue: rendered,
      basis: String(metric.projectionStatus),
    });
  }

  const missingInputs = collectMissingAvaModuleInputs(input, OPTIONAL_FIELD_LABELS);

  return {
    surface: "tower",
    tenant: pack.tenantKey,
    displayableMetrics,
    withheldMetricLabels,
    valueClaims: (pack.towerValueClaims ?? []).map(summarizeClaim),
    blockedValueClaims: (pack.blockedValueClaims ?? []).map(summarizeClaim),
    truthCaveats: [...(pack.towerTruthCaveats ?? []), ...(pack.caveats ?? [])],
    evidenceGaps: (pack.gaps ?? [])
      .map((gap) => gap.description || gap.title)
      .filter((text): text is string => Boolean(text)),
    projectionStatus: String(pack.projectionStatus),
    missingInputs,
    caveats: buildAvaModuleCaveats(missingInputs),
    allowedActions: [...ALLOWED_ACTIONS],
    disallowedActions: [...DISALLOWED_ACTIONS],
  };
}

/** Every figure aVa is permitted to state, for the quality gate to check against. */
export function permittedFigures(packet: TowerAvaChatPacket): string[] {
  return packet.displayableMetrics.map((m) => m.displayValue);
}
