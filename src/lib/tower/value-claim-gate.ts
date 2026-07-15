import type {
  CanonicalFact,
  FactValue,
  TowerValueClaim,
  TowerValueClaimGateStatus,
  TowerValueClaimKind,
} from "@/lib/enterprise-knowledge/contracts";

export const TOWER_REALIZED_VALUE_REQUIRES_MEASURED_EVIDENCE =
  "Realized value requires finance-attested measured evidence. Until then, Tower must describe the row as a plan, forecast, promise, or measurement-readiness signal.";

export interface TowerValueClaimGateInput {
  claimId: string;
  claimKind: TowerValueClaimKind;
  label: string;
  value: FactValue;
  valueType: CanonicalFact["valueType"];
  sourceFactIds: string[];
  evidenceIds: string[];
  evidenceAuthorities?: string[];
  v3Reconciled?: boolean;
}

function hasMeasuredEvidence(input: TowerValueClaimGateInput): boolean {
  if (input.v3Reconciled === false) return false;
  if (input.evidenceIds.length === 0) return false;
  if (input.evidenceAuthorities?.some((authority) => authority === "authoritative")) {
    return true;
  }
  return input.evidenceAuthorities?.some((authority) => authority === "derived" || authority === "supporting") ?? false;
}

function gateStatusForClaim(input: TowerValueClaimGateInput): TowerValueClaimGateStatus {
  if (input.claimKind === "realized_value" || input.claimKind === "measured_value") {
    return hasMeasuredEvidence(input) ? "allowed" : "blocked";
  }
  return input.evidenceIds.length > 0 ? "caveated" : "blocked";
}

function requiredEvidenceForClaim(input: TowerValueClaimGateInput): string[] {
  if (input.claimKind === "realized_value" || input.claimKind === "measured_value") {
    return [
      "finance-attested actual value extract",
      "v3 canonical fact reconciliation",
      "source-owner attestation",
      "measurement period and formula lineage",
      "citable evidence reference",
    ];
  }
  return [
    "business-case owner",
    "baseline assumption",
    "measurement plan",
    "citable evidence reference",
  ];
}

function reasonForClaim(
  input: TowerValueClaimGateInput,
  gateStatus: TowerValueClaimGateStatus,
): string {
  if (gateStatus === "allowed") {
    return "The claim has measured evidence and can be described as measured value.";
  }
  if (input.claimKind === "realized_value" || input.claimKind === "measured_value") {
    return TOWER_REALIZED_VALUE_REQUIRES_MEASURED_EVIDENCE;
  }
  if (gateStatus === "caveated") {
    return "The value can be shown as planned, promised, or forecast value, but not as realized value.";
  }
  return "The value claim is missing citable evidence and must stay blocked.";
}

export function evaluateTowerValueClaimGate(
  input: TowerValueClaimGateInput,
): TowerValueClaim {
  const gateStatus = gateStatusForClaim(input);
  const realizedValueLanguageAllowed =
    (input.claimKind === "realized_value" || input.claimKind === "measured_value") &&
    gateStatus === "allowed";
  return {
    claimId: input.claimId,
    claimKind: input.claimKind,
    label: input.label,
    value: input.value,
    valueType: input.valueType,
    sourceFactIds: input.sourceFactIds,
    evidenceIds: input.evidenceIds,
    gateStatus,
    realizedValueLanguageAllowed,
    reason: reasonForClaim(input, gateStatus),
    requiredEvidence: requiredEvidenceForClaim(input),
  };
}

export function realizedValueLanguageAllowed(claims: readonly TowerValueClaim[]): boolean {
  return claims.some((claim) => claim.realizedValueLanguageAllowed);
}
