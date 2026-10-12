import { getSourceArchetype } from "../archetypes/registry";
import type { SourceEventArchetype } from "../archetypes/types";

interface ContractPlaybookMapping {
  readonly contractArchetype: string;
  readonly playbookId: string;
  readonly label: string;
  readonly focus: string;
  readonly rationale: string;
  readonly version: "1.0.0";
  readonly declaredOn: "2026-10-11";
  readonly declaredBy: "AbarVa Source engineering";
  readonly reviewState: "engineering_declared";
  readonly reviewedBy: null;
  readonly sourceRef: string;
}

const declarations = [
  [
    "legacy_analytics_managed_services",
    "AMS_MANAGED_SERVICES",
    "Managed services",
    "An application run-and-enhance agreement uses the managed-services scope, demand and SLA playbook.",
  ],
  [
    "application_managed_services",
    "AMS_MANAGED_SERVICES",
    "Managed services",
    "Application management uses the managed-services playbook; scope and pricing evidence establish which levers apply.",
  ],
  [
    "infra_service_desk_managed_services",
    "AMS_MANAGED_SERVICES",
    "Managed services",
    "Service-desk operations share the managed-services demand and SLA economics; application-specific levers still require scoped evidence.",
  ],
  [
    "cloud_consumption",
    "CLOUD_FINOPS",
    "Cloud consumption",
    "Consumption-based cloud agreements use commitment, workload and net-rate analysis, not fixed-FTE economics.",
  ],
  [
    "consumption_commit",
    "CLOUD_FINOPS",
    "Cloud consumption",
    "A committed consumption agreement uses cloud commitment and utilization analysis; support-specific claims need their own evidence.",
  ],
  [
    "productivity_platform",
    "CONTRACT_RENEWAL",
    "Renewal & SaaS",
    "Seat-based productivity agreements use renewal and entitlement analysis; inactive use alone does not establish avoidable cost.",
  ],
  [
    "cloud_consumption_commit",
    "CLOUD_FINOPS",
    "Cloud consumption",
    "An explicitly declared cloud consumption commitment uses workload and commitment economics; it does not imply seat-based pricing.",
  ],
  [
    "crm_saas",
    "CONTRACT_RENEWAL",
    "Renewal & SaaS",
    "CRM subscriptions use renewal and entitlement analysis; contractual minimums and true-down terms constrain the action.",
  ],
] as const;

const focus: Record<string, string> = {
  AMS_MANAGED_SERVICES:
    "Test scope leakage, demand-linked fees and service remedies.",
  CLOUD_FINOPS: "Align commitment with workloads, net rates and demand.",
  CONTRACT_RENEWAL:
    "Review quantities, uplift and notice terms before renewal.",
};

export const CONTRACT_PLAYBOOK_CROSSWALK: readonly ContractPlaybookMapping[] =
  declarations.map(([contractArchetype, playbookId, label, rationale]) => ({
    contractArchetype,
    playbookId,
    label,
    focus: focus[playbookId],
    rationale,
    version: "1.0.0",
    declaredOn: "2026-10-11",
    declaredBy: "AbarVa Source engineering",
    reviewState: "engineering_declared",
    reviewedBy: null,
    sourceRef: `src/lib/source/contract-intelligence/playbook-crosswalk.ts#${contractArchetype}`,
  }));

export type ContractPlaybookResolution =
  | {
      readonly state: "mapped";
      readonly mapping: ContractPlaybookMapping;
      readonly archetype: SourceEventArchetype;
    }
  | { readonly state: "unmapped" | "conflicted" };

function declaredKey(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

// This selects guidance from declared fields. It neither classifies a contract
// from its name nor upgrades the classification to a reviewed client decision.
export function resolveContractPlaybook(
  contractArchetype: unknown,
  coverageArchetype?: unknown,
): ContractPlaybookResolution {
  const registerKey = declaredKey(contractArchetype);
  const coverageKey = declaredKey(coverageArchetype);
  if (registerKey && coverageKey && registerKey !== coverageKey) {
    return { state: "conflicted" };
  }
  const mapping = CONTRACT_PLAYBOOK_CROSSWALK.find(
    (entry) => entry.contractArchetype === (registerKey ?? coverageKey),
  );
  if (!mapping) return { state: "unmapped" };
  const archetype = getSourceArchetype(mapping.playbookId);
  if (!archetype || !archetype.valueLeverRules?.length)
    return { state: "unmapped" };
  return { state: "mapped", mapping, archetype };
}
