import type { EnterpriseSignalPacket, GroundedClaim } from "@/lib/home/preview/types";
import { resolveEvidence } from "@/components/home/preview/evidence-resolver";

/**
 * The v4 evidence sidenote names its source in the reader's language -- "Vendor register",
 * "44 leader interviews" -- rather than printing a raw domain key. The mapping below is the only
 * place that translation happens.
 *
 * These are the *names of the registers the facts came from*, derived deterministically from the
 * canonical domain each piece of evidence already declares. Nothing here invents a source or
 * decides what a claim means; if a domain has no entry, the raw key is shown rather than a guess,
 * because a wrong source name is worse than an unpolished one.
 */
const DOMAIN_LABEL: Record<string, string> = {
  ai_automation_use_case: "AI portfolio",
  ai_tool_usage_observation: "AI tool usage",
  ai_value_interview_evidence: "AI value testimony",
  ai_value_realization_signal: "AI value ledger",
  application_system: "Application register",
  business_function: "Business functions",
  data_asset_or_integration: "Integration register",
  evidence_source: "Declared evidence sources",
  infrastructure_platform: "Infrastructure register",
  managed_service_scope: "Managed service scope",
  metric_outcome: "Metric register",
  operational_process_evidence: "Process evidence",
  platform_maturity_assessment: "Platform maturity",
  program_initiative: "Program portfolio",
  relationship_source_row: "Relationship records",
  risk_or_control: "Risk register",
  spend_value_fact: "Spend records",
  tenant_profile: "Enterprise profile",
  vendor_contract: "Vendor register",
  workforce_role: "Workforce records",
};

export interface ClaimSource {
  /** Human-readable register names, joined with the design's separator. */
  label: string;
  /** The evidence ids themselves, shown beneath the label in mono. */
  ids: string;
  /** True when any cited id failed to resolve. The sidenote must say so rather than omit it. */
  hasUnresolved: boolean;
}

export function claimSource(claim: GroundedClaim, signalPacket: EnterpriseSignalPacket): ClaimSource {
  return sourceForIds(claim.evidence_ids, signalPacket);
}

/** Same resolution for anything that cites evidence without being a claim -- an exhibit, for
 * instance. Kept separate so callers never have to fake a claim shape to name a source. */
export function sourceForIds(evidenceIds: string[], signalPacket: EnterpriseSignalPacket): ClaimSource {
  const resolved = resolveEvidence(evidenceIds, signalPacket);
  const labels: string[] = [];
  for (const item of resolved) {
    for (const domain of item.domains) {
      const label = DOMAIN_LABEL[domain] ?? domain;
      if (!labels.includes(label)) labels.push(label);
    }
  }
  return {
    // Two register names is the most the sidenote can carry without wrapping past the claim it
    // annotates; beyond that the count is more honest than a truncated list.
    label:
      labels.length === 0
        ? "Source not resolved"
        : labels.length <= 2
          ? labels.join(" · ")
          : `${labels[0]} · ${labels[1]} + ${labels.length - 2} more`,
    ids: evidenceIds.join(" · "),
    hasUnresolved: resolved.some((r) => r.unresolved),
  };
}
