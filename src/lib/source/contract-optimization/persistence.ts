import type {
  ContractOptimizationFinding,
  ContractOptimizationLever,
  ContractOptimizationMveProfile,
} from "./types";

export interface ContractOptimizationProfileRow {
  tenant_key: string;
  source_event_id: string;
  incumbent_vendor_name: string;
  contract_name: string;
  source_type: "synthetic_demo" | "client_uploaded";
  synthetic_demo: boolean;
  decision_use: ContractOptimizationMveProfile["decisionUse"];
  current_annual_run_rate_usd: number;
  term_start: string;
  term_end: string;
  renewal_notice_date: string;
  ready_for_optimization: ContractOptimizationMveProfile["readyForOptimization"];
  ready_reason: string;
  extraction_boundary: string;
  profile_payload: ContractOptimizationMveProfile;
  evidence_refs: Array<{ label: string }>;
}

export interface ContractOptimizationFindingRow {
  tenant_key: string;
  source_event_id: string;
  finding_key: string;
  category: ContractOptimizationFinding["category"];
  severity: ContractOptimizationFinding["severity"];
  title: string;
  current_state: string;
  sourcing_implication: string;
  recommended_action: string;
  estimated_annual_impact_usd: number | null;
  confidence: ContractOptimizationFinding["confidence"];
  evidence_refs: string[];
}

export interface ContractOptimizationLeverRow {
  tenant_key: string;
  source_event_id: string;
  lever_key: string;
  lever_type: ContractOptimizationLever["leverType"];
  finding_key: string;
  priority: ContractOptimizationLever["priority"];
  buyer_ask: string;
  negotiation_language: string;
  value_basis: ContractOptimizationLever["valueBasis"];
  annual_impact_low_usd: number | null;
  annual_impact_high_usd: number | null;
  owner_role: string;
}

export interface ContractOptimizationPersistenceRows {
  profile: ContractOptimizationProfileRow;
  findings: ContractOptimizationFindingRow[];
  levers: ContractOptimizationLeverRow[];
}

export function toContractOptimizationPersistenceRows(
  profile: ContractOptimizationMveProfile,
): ContractOptimizationPersistenceRows {
  return {
    profile: {
      tenant_key: profile.tenantKey,
      source_event_id: profile.sourceEventId,
      incumbent_vendor_name: profile.incumbentVendorName,
      contract_name: profile.contractName,
      source_type: profile.syntheticDemo ? "synthetic_demo" : "client_uploaded",
      synthetic_demo: profile.syntheticDemo,
      decision_use: profile.decisionUse,
      current_annual_run_rate_usd: profile.contractBaseline.currentAnnualRunRateUsd,
      term_start: profile.contractBaseline.termStart,
      term_end: profile.contractBaseline.termEnd,
      renewal_notice_date: profile.contractBaseline.renewalNoticeDate,
      ready_for_optimization: profile.readyForOptimization,
      ready_reason: profile.readyReason,
      extraction_boundary: profile.extractionBoundary,
      profile_payload: profile,
      evidence_refs: profile.minimumViableExtractionAreas.flatMap((area) =>
        area.evidenceLabels.map((label) => ({ label })),
      ),
    },
    findings: profile.findings.map((finding) => ({
      tenant_key: profile.tenantKey,
      source_event_id: profile.sourceEventId,
      finding_key: finding.findingId,
      category: finding.category,
      severity: finding.severity,
      title: finding.title,
      current_state: finding.currentState,
      sourcing_implication: finding.sourcingImplication,
      recommended_action: finding.recommendedAction,
      estimated_annual_impact_usd: finding.estimatedAnnualImpactUsd,
      confidence: finding.confidence,
      evidence_refs: finding.evidenceLabels,
    })),
    levers: profile.levers.map((lever) => ({
      tenant_key: profile.tenantKey,
      source_event_id: profile.sourceEventId,
      lever_key: lever.leverId,
      lever_type: lever.leverType,
      finding_key: lever.findingId,
      priority: lever.priority,
      buyer_ask: lever.buyerAsk,
      negotiation_language: lever.negotiationLanguage,
      value_basis: lever.valueBasis,
      annual_impact_low_usd: lever.annualImpactLowUsd,
      annual_impact_high_usd: lever.annualImpactHighUsd,
      owner_role: lever.ownerRole,
    })),
  };
}
