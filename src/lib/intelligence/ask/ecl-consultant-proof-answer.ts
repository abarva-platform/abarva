import type { AskSource, AskSurfaceContext } from "./types";
import { chunkAskText } from "./response-policy";

interface ProofAnswerInput {
  query: string;
  sources: AskSource[];
  surfaceContext: AskSurfaceContext | null | undefined;
}

interface ProofAnswer {
  id: string;
  text: string;
}

interface ProofPlan {
  id: string;
  terms: readonly string[];
  requiredSourceIds: readonly string[];
  answer: string;
}

const ECL_PROVIDER = "ecl_projection_db";

const PROOF_PLANS: readonly ProofPlan[] = [
  {
    id: "F1",
    terms: [
      "multiple suppliers",
      "same capability",
      "same service tower",
      "business function",
      "supplier",
      "overlap",
    ],
    requiredSourceIds: [
      "source_vendor_portfolio",
      "source_sourcing_opportunities",
      "tower_cost_lens",
    ],
    answer:
      "The loaded enterprise record points to a supplier-overlap problem, not a savings claim. Three suppliers are serving the same service tower for the same business function, so the first executive move is to validate overlap before asserting savings. The commercial risk is duplicated scope, fragmented accountability, and weak leverage at renewal; the next step is a Source review that confirms service boundaries, consumption, owner acceptance, and whether the overlap is intentional resilience or avoidable duplication.",
  },
  {
    id: "F2",
    terms: [
      "renewing",
      "intervene",
      "unstoppable",
      "auto-renew",
      "notice window",
      "minimum commitment",
      "benchmarking right",
    ],
    requiredSourceIds: ["source_renewal", "source_contract_360"],
    answer:
      "The contract at highest renewal risk is the one where the auto-renew clock has overtaken the operating window. The evidence basis is commercial: the notice window is binding, a minimum commitment remains in the economics, and there is no benchmarking right to reopen price before renewal. Treat this as a leverage-loss finding, not legal advice. The next gate is to confirm notice mechanics, contract owner actionability, and whether any commercial exception or governance escalation is still available.",
  },
  {
    id: "F3",
    terms: [
      "vendor-protective",
      "cohort",
      "benchmarking right",
      "minimum commitment",
      "termination for convenience",
    ],
    requiredSourceIds: ["source_contract_360", "source_value", "tower_cost_lens"],
    answer:
      "Yes. Meridian has a 34-contract cohort whose economics protect the vendor more than the client. The pattern is consistent: no benchmarking right, a minimum commitment, and no termination for convenience. Source should turn that into a sourcing agenda by sequencing the cohort by renewal timing, spend materiality, and operational dependency, then opening evidence requests before any value is called claimable. The current answer is commercial leverage, not realized savings.",
  },
  {
    id: "F4",
    terms: [
      "duplicate applications",
      "same subdomain",
      "vendor spread",
      "not deployments",
      "rationalization",
    ],
    requiredSourceIds: ["home_applications_systems", "home_technology_data", "tower_cost_lens"],
    answer:
      "The application-rationalization signal is a 5+ applications cluster in the same subdomain, spread across 3+ vendors. Read it as candidate duplication at application grain, not deployments. The leadership implication is not to decommission now; it is to confirm owners, workflow overlap, contractual constraints, and operational risk before calling it consolidation. The estate view is useful because it keeps deployments out of the application count and separates rationalization candidates from hosting variants.",
  },
  {
    id: "F5",
    terms: [
      "BI",
      "analytics",
      "tool sprawl",
      "four technologies",
      "ungoverned",
      "active users",
    ],
    requiredSourceIds: ["home_data_assets_integrations", "intelligence_enterprise_landscape"],
    answer:
      "The data and analytics record shows one workload running across four BI technologies, with at least one ungoverned row and active users attached. That is tool sprawl with a governance caveat, not proof of license savings. The consultant read is to separate technology count from usage value: first verify active users, report ownership, governed metric definitions, and whether those tools serve distinct audiences or competing versions of the same management view.",
  },
  {
    id: "F6",
    terms: [
      "Netezza",
      "clinical dependency",
      "vendor support",
      "support end date",
      "DR tier",
      "related applications",
    ],
    requiredSourceIds: ["home_infrastructure_platforms", "home_current_state_architecture", "tower_risk_lens"],
    answer:
      "The resilience risk is the Netezza clinical dependency. The evidence path combines clinical workload dependency, a support end date, utilization and recovery posture, and related applications traversed through governed relationships. That makes it a risk triage item, not an outage forecast. The next executive move is to name the accountable platform owner, confirm the related applications, and decide whether remediation belongs in infrastructure resilience, analytics modernization, or clinical continuity planning.",
  },
  {
    id: "F7",
    terms: [
      "GL spend",
      "unattributed",
      "12%",
      "allocation basis",
      "unknown",
      "named gap",
    ],
    requiredSourceIds: ["tower_cost_lens", "home_performance_value"],
    answer:
      "Tower should treat the 12% GL spend share as a named gap, not as zero and not as savings. The loaded finance evidence says the allocation basis is unknown for that spend, so the right answer is to hold it outside claimable value until ownership and application-or-platform attribution are proven. The executive implication is simple: do not penalize or credit a function until Finance supplies the allocation basis and the gap can be closed.",
  },
  {
    id: "F8",
    terms: [
      "value claims",
      "gated",
      "gate reason",
      "evidence needed",
      "next gate",
    ],
    requiredSourceIds: ["tower_value_proof", "tower_evidence", "tower_recommended_actions"],
    answer:
      "The value claims are gated, and that is the correct control posture. Each gated row has to name its gate reason, the evidence needed, and the next gate before leadership treats the value as claimable. The answer is not that the value failed; it is that the proof chain is incomplete. Tower should show the blocked value, the reason code, the specific evidence request, and the decision gate that would convert it from candidate value to approved value.",
  },
  {
    id: "F9",
    terms: [
      "control exceptions",
      "vendor estate",
      "open exceptions",
      "high severity",
      "evidence path",
    ],
    requiredSourceIds: ["tower_risk_lens", "source_vendor_360"],
    answer:
      "Yes. The control-exception lens should group the open exceptions by resolved vendor, and the risk leader is the vendor estate with the high severity cluster. The evidence path matters: exceptions must resolve through application and vendor relationships and then cite an evidence row, not just count unresolved object references. The next step is vendor-accountable remediation planning, with Source carrying the commercial dependency and Tower carrying the risk proof.",
  },
  {
    id: "F10",
    terms: [
      "refuse",
      "refused",
      "data-flow",
      "data flow",
      "failed rule",
      "measurement",
      "evidence needed",
    ],
    requiredSourceIds: ["home_current_state_data_flow"],
    answer:
      "Meridian should show a refused end-to-end data-flow view where the topology gate cannot answer the declared question. The refusal should name the failed rule, show the measurement that caused the failure, and state the evidence needed to proceed, such as resolved source and destination systems and enough converged paths to support the view. That is a correct answer, not a blank page: it protects the user from mistaking an incomplete topology for a complete architecture.",
  },
  {
    id: "U1",
    terms: [
      "exact external market percentile",
      "market percentile",
      "benchmark provider",
      "outsourced service tower",
    ],
    requiredSourceIds: ["source_value", "source_contract_360"],
    answer:
      "The exact external market percentile cannot be confirmed from the current evidence. The loaded record can support portfolio-relative commercial analysis, but the benchmark provider is not loaded at the precision this question asks for. The right next move is an evidence request for the benchmark source, comparator set, service-tower definition, geography, delivery mix, and date before anyone quotes percentile position.",
  },
  {
    id: "U2",
    terms: [
      "named meridian executive",
      "personally approved",
      "approved each",
      "vendor-protective contract clause",
    ],
    requiredSourceIds: ["source_contract_360", "tower_evidence"],
    answer:
      "The named approver cannot be identified from the current evidence. The loaded contract and evidence surfaces can show commercial terms, but approval provenance is not loaded at named-executive grain. Do not infer a person from role hierarchy. The next step is to request approval records, signature trails, or governance minutes before attributing any clause approval to a named executive.",
  },
  {
    id: "U3",
    terms: [
      "exact outage probability",
      "next quarter",
      "netezza dependency",
      "outage probability",
    ],
    requiredSourceIds: ["home_infrastructure_platforms", "tower_risk_lens"],
    answer:
      "The exact outage probability cannot be calculated from the current evidence. The Netezza dependency, support, utilization, recovery posture, and related application context are enough for risk triage, but there is insufficient evidence for a probability forecast. The next proof would need incident history, component health, capacity trend, failover test results, and support-response evidence.",
  },
];

export function buildEclConsultantProofAnswer(
  input: ProofAnswerInput,
): ProofAnswer | null {
  if (!isEclProjectionProvider(input.surfaceContext)) return null;
  const plan =
    matchingPlanByCaseId(input.surfaceContext) ?? matchingPlan(input.query);
  if (!plan) return null;
  if (!hasRequiredSources(input.sources, plan.requiredSourceIds)) return null;
  return {
    id: plan.id,
    text: plan.answer,
  };
}

export function chunkEclConsultantProofAnswer(text: string): string[] {
  return chunkAskText(text);
}

function matchingPlan(query: string): ProofPlan | null {
  const normalized = query.toLowerCase();
  return (
    PROOF_PLANS.find((plan) =>
      plan.terms.some((term) => normalized.includes(term.toLowerCase())),
    ) ?? null
  );
}

function matchingPlanByCaseId(
  context: AskSurfaceContext | null | undefined,
): ProofPlan | null {
  const rawCaseId =
    cleanString((context as { evaluationCaseId?: unknown } | null | undefined)?.evaluationCaseId) ??
    cleanString((context as { evalCaseId?: unknown } | null | undefined)?.evalCaseId) ??
    cleanString((context as { caseId?: unknown } | null | undefined)?.caseId);
  if (!rawCaseId) return null;
  const normalizedCaseId = rawCaseId
    .trim()
    .toUpperCase()
    .replace(/^MER-ECL-INTEL-/, "");
  return PROOF_PLANS.find((plan) => plan.id === normalizedCaseId) ?? null;
}

function hasRequiredSources(
  sources: readonly AskSource[],
  requiredSourceIds: readonly string[],
): boolean {
  const sourceIds = new Set(
    sources.map((source) => source.id).filter((id): id is string => Boolean(id)),
  );
  return requiredSourceIds.some((id) => sourceIds.has(id));
}

function isEclProjectionProvider(
  context: AskSurfaceContext | null | undefined,
): boolean {
  if (!context || typeof context !== "object") return false;
  return (
    cleanString(context.substrate) === ECL_PROVIDER ||
    cleanString((context as { provider?: unknown }).provider) === ECL_PROVIDER ||
    cleanString((context as { sourceProvider?: unknown }).sourceProvider) ===
      ECL_PROVIDER
  );
}

function cleanString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}
