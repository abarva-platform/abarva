import type {
  ValueLeverCategory,
  ValueType,
} from "@/lib/source/archetypes/types";
import type { ContractOptimizationOpportunity } from "@/lib/source/data-model/contract-optimization-opportunity";
import { buildValueBridge } from "@/lib/source/door1/bridge";
import type {
  LeakageDiagnosis,
  LeakageFinding,
  RecoveryBucket,
  SourceOptimization,
} from "@/lib/source/door1/types";

export function withGovernedOpportunityFinding(input: {
  readonly optimization: SourceOptimization;
  readonly opportunity: ContractOptimizationOpportunity | null;
}): SourceOptimization {
  const { optimization, opportunity } = input;
  if (optimization.diagnosis.findings.length > 0) return optimization;
  if (!opportunity || opportunity.amountUsd == null || opportunity.amountUsd <= 0) {
    return optimization;
  }
  if (
    opportunity.stage === "baseline_conflict" ||
    opportunity.stage === "evidence_required"
  ) {
    return optimization;
  }

  const finding = findingFromOpportunity(opportunity);
  const diagnosis: LeakageDiagnosis = {
    ...optimization.diagnosis,
    findings: [finding],
  };
  const bridge = buildValueBridge(diagnosis);
  return {
    ...optimization,
    diagnosis,
    bridge,
    play: {
      kind:
        opportunity.valueType === "avoided_cost"
          ? "restructure"
          : "renegotiate",
      rationale:
        "Door 1 is using the selected governed Source opportunity because the legacy event-fact diagnosis did not produce a finding for this contract-specific optimization event.",
      asks: [
        {
          ruleKey: opportunity.opportunityId,
          ask: opportunity.nextAction,
          bucket: recoveryBucketFor(opportunity),
          low: opportunity.amountUsd,
          high: opportunity.amountUsd,
        },
      ],
      handoff: null,
    },
  };
}

function findingFromOpportunity(
  opportunity: ContractOptimizationOpportunity,
): LeakageFinding {
  const amount = opportunity.amountUsd ?? 0;
  return {
    ruleKey: opportunity.opportunityId,
    name: opportunity.label,
    category: categoryFor(opportunity),
    valueType: valueTypeFor(opportunity),
    status: "computed",
    low: amount,
    high: amount,
    unit: "usd",
    confidence: confidenceFor(opportunity.confidence),
    basis: opportunity.narrative,
    citations: opportunity.evidenceRefs.map((ref) => ({
      factKey: opportunity.opportunityId,
      doc: ref.sourceFileReport ?? ref.tableName,
      locator: ref.pageSpan ?? ref.sourceRecordId ?? ref.tableName,
    })),
    missingFactKeys: [],
    recoveryBucket: recoveryBucketFor(opportunity),
  };
}

function categoryFor(
  opportunity: ContractOptimizationOpportunity,
): ValueLeverCategory {
  const text = `${opportunity.opportunityId} ${opportunity.label}`.toLowerCase();
  if (text.includes("sla") || text.includes("credit")) return "sla_economics";
  if (text.includes("scope") || text.includes("shelfware")) return "scope_leakage";
  if (text.includes("renewal")) return "renewal_leverage";
  if (text.includes("negotiat") || text.includes("term")) return "commercial_posture";
  return "pricing";
}

function valueTypeFor(opportunity: ContractOptimizationOpportunity): ValueType {
  if (opportunity.valueType === "negotiable_improvement") {
    return "incremental_negotiated";
  }
  if (opportunity.valueType === "avoided_cost") return "protected";
  return "risk_adjusted";
}

function recoveryBucketFor(
  opportunity: ContractOptimizationOpportunity,
): RecoveryBucket {
  if (opportunity.valueType === "negotiable_improvement") return "incremental";
  if (opportunity.valueType === "avoided_cost") return "protected";
  return "risk_adjusted";
}

function confidenceFor(value: number | null): "low" | "med" | "high" {
  if (value == null) return "med";
  if (value >= 0.9) return "high";
  if (value >= 0.7) return "med";
  return "low";
}
