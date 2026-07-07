// Phase 7 — end-to-end proof scenario: SkyHarbor (airline) AMS sourcing event.
//
// Composes the WHOLE Source spine on the real framework code — classify →
// evidence readiness → strategy questions → event-specific RFP → vendor guide →
// should-cost + TCO normalization → negotiation plan → grounded executive
// recommendation. It uses a realistic, PARTIALLY-loaded evidence snapshot (some
// families promoted to agent_ready, some still missing) so the proof shows the
// honest behavior the brief demands: event-specific output, missing evidence
// visible, citations + confidence + source basis, no cross-tenant leakage, no
// fabrication.
//
// This is a CODE-LEVEL end-to-end proof. It does not by itself prove the runtime
// path on ACA against the private DB — that operator wiring is tracked
// separately and stated as such in the war-room report (truth-standard: do not
// collapse "composes in code" and "ran live on the private data plane").

import { archetypeForEventType } from "../registry";
import {
  buildSourceEvidenceReadiness,
  type EvidenceStateMap,
} from "../evidence-readiness";
import { buildArchetypeRfp, renderRfpMarkdown } from "../rfp-canon";
import {
  negotiationPlan,
  normalizeProposals,
  shouldCostModel,
} from "../pricing-engine";
import {
  buildGroundedSourceAnswer,
  type SourceEvidenceCandidate,
} from "../grounded-answer";
import {
  evaluateGovernedObject,
  POLICY_VERSION,
} from "@/lib/governance/context-corpus-policy";

export const SKYHARBOR_TENANT = "skyharbor-air";
export const SKYHARBOR_EVENT_ID = "evt-skyharbor-ams-2026";

/** Realistic partial readiness: 6 families agent_ready, the rest still missing. */
const SKYHARBOR_EVIDENCE_STATES: EvidenceStateMap = {
  application_inventory: "agent_ready",
  service_tower_scope: "agent_ready",
  run_cost_baseline: "agent_ready",
  ticket_volumes: "agent_ready",
  sla_baseline: "agent_ready",
  staffing_baseline: "agent_ready",
  // not yet promoted / missing:
  incident_problem_change: "committed", // committed, not promoted
  tooling_landscape: "indexed",
  contract_baseline: "retrievable",
  transition_constraints: "missing",
  retained_org_model: "missing",
};

function agentReadyCandidate(familyKey: string): SourceEvidenceCandidate {
  const candidate: SourceEvidenceCandidate = {
    id: `sky-${familyKey}`,
    client_key: SKYHARBOR_TENANT,
    tenant_id: "tenant-skyharbor",
    source_layer: "uploaded_evidence",
    source_basis: `SkyHarbor ${familyKey} export`,
    classification: "confidential",
    retrievability: "search_indexed",
    agent_readiness_status: "agent_ready",
    confidence_level: "high",
    cited_render_verified_at: "2026-06-10T00:00:00Z",
    citations: [`ev:${familyKey}#skyharbor`],
    familyKey,
  };
  const evaluation = evaluateGovernedObject({
    ...candidate,
    object_type: candidate.source_layer,
    industry: "airline",
    enterprise_area: "back_office",
    function: "technology",
    process_area: "application_management",
    use_case_category: "source_event",
    strategic_move_phase_applicability: ["P2"],
    applicable_agents: ["source"],
    source_references: candidate.citations ?? [],
    compliance_basis: null,
    confidence_rationale:
      "Scenario fixture only uses promoted, cited, retrievable evidence.",
    last_reviewed_at: "2026-06-10T00:00:00Z",
    owner: "source-governance",
    data_domains: ["sourcing", "technology_operations"],
    required_kpis: [],
    baseline_requirements: [],
    measurement_method: null,
    value_levers: [],
    known_failure_modes: [],
    guardrails: ["tenant_fence", "citation_required"],
    human_in_loop_controls: ["source_event_review"],
    allowed_agent_actions: ["draft_recommendation"],
    blocked_agent_actions: ["auto_award"],
    provenance: { source_file: candidate.source_basis },
    policy_version: POLICY_VERSION,
    contract_hash: null,
    created_at: "2026-06-10T00:00:00Z",
    updated_at: "2026-06-10T00:00:00Z",
  });
  if (!evaluation.agentReady) {
    throw new Error(
      `SkyHarbor AMS scenario attempted to use non-governed evidence for ${familyKey}: ` +
        [...evaluation.errors, ...evaluation.warnings].join("; "),
    );
  }
  return candidate;
}

export interface SkyHarborScenarioResult {
  archetypeId: string;
  archetypeName: string;
  readinessVerdict: string;
  missingRequired: string[];
  scopeGateBlockers: string[];
  rfpBlockedSections: string[];
  shouldCostTotal: number;
  tcoBestVendor: string | null;
  negotiationFirstMove: string | null;
  envelope: ReturnType<typeof buildGroundedSourceAnswer>["envelope"];
  mayAnswer: boolean;
  narrativeMarkdown: string;
}

export function runSkyHarborAmsScenario(): SkyHarborScenarioResult {
  // 1 · Classify the event by its type → archetype (no hardcoded branching).
  const archetype = archetypeForEventType("ams");
  if (!archetype) throw new Error("AMS archetype not registered");

  // 2 · Evidence readiness (promotion-only ladder, honest partial state).
  const readiness = buildSourceEvidenceReadiness(
    archetype,
    SKYHARBOR_EVIDENCE_STATES,
    SKYHARBOR_EVENT_ID,
  );
  const scopeGate = readiness.stages.find((s) => s.stage === "scope");

  // 3 · Event-specific RFP — sections needing un-promoted evidence are blocked.
  const rfp = buildArchetypeRfp(archetype, readiness);

  // 4 · Should-cost from the agent-ready run-cost evidence (cited).
  const sc = shouldCostModel(archetype, {
    components: [
      {
        value: 6_200_000,
        citation: "ev:run_cost_baseline#labor",
        label: "labor",
      },
      {
        value: 1_100_000,
        citation: "ev:run_cost_baseline#tooling",
        label: "tooling",
      },
      {
        value: 900_000,
        citation: "ev:run_cost_baseline#shift",
        label: "shift",
      },
    ],
    productivityGlidePath: 0.08,
  });

  // 5 · TCO normalization across two airline-MSP proposals. SkyManage's headline
  // (7.6M) looks cheaper than NorthOps' all-in (8.1M) — but SkyManage EXCLUDED
  // transition. Add back the peer price for transition (0.7M) and SkyManage is
  // 8.3M vs NorthOps 8.1M: NorthOps is the true low bidder. This is exactly the
  // trap a generic price comparison misses.
  const tco = normalizeProposals(archetype, [
    {
      vendor: "NorthOps",
      lines: [
        { value: 7_400_000, citation: "p:northops#base", label: "base" },
        {
          value: 700_000,
          citation: "p:northops#transition",
          label: "transition",
        },
      ],
    },
    {
      vendor: "SkyManage",
      lines: [
        { value: 7_600_000, citation: "p:skymanage#base", label: "base" },
      ],
      excludedComponents: ["transition"],
    },
  ]);

  // 6 · Negotiation plan (levers sequenced by timing).
  const plan = negotiationPlan(archetype);
  const firstMove = plan.sequence[0]?.levers[0]?.label ?? null;

  // 7 · Grounded executive recommendation envelope (tenant-fenced, derived confidence).
  const candidates = Object.entries(SKYHARBOR_EVIDENCE_STATES)
    .filter(([, state]) => state === "agent_ready")
    .map(([family]) => agentReadyCandidate(family));
  // Received vendor proposals are themselves governed evidence (tenant-scoped).
  candidates.push(
    {
      ...agentReadyCandidate("vendor_proposal"),
      id: "sky-northops",
      citations: ["p:northops#base", "p:northops#transition"],
    },
    {
      ...agentReadyCandidate("vendor_proposal"),
      id: "sky-skymanage",
      citations: ["p:skymanage#base"],
    },
  );
  // Inject a cross-tenant candidate to prove the fence holds end-to-end.
  candidates.push({
    ...agentReadyCandidate("ticket_volumes"),
    id: "leak",
    client_key: "apex-retail",
  });

  const grounded = buildGroundedSourceAnswer({
    archetype,
    tenantKey: SKYHARBOR_TENANT,
    eventId: SKYHARBOR_EVENT_ID,
    candidates,
    draftClaims: [
      {
        text: `Independent should-cost is $${(sc.totalShouldCost / 1e6).toFixed(1)}M/yr`,
        backedByCitation: "ev:run_cost_baseline#skyharbor",
      },
      {
        text: "On a normalized basis NorthOps is the true low bidder despite a lower SkyManage headline",
        backedByCitation: "p:northops#base",
      },
    ],
  });

  const narrativeMarkdown = renderNarrative({
    archetypeName: archetype.name,
    readinessVerdict: readiness.overall,
    missingRequired: readiness.missingRequired,
    scopeBlockers:
      scopeGate?.blockers.map((b) => `${b.family} (${b.reason})`) ?? [],
    rfpMd: renderRfpMarkdown(rfp),
    shouldCost: sc,
    tco,
    negotiation: plan,
    envelope: grounded.envelope,
  });

  return {
    archetypeId: archetype.id,
    archetypeName: archetype.name,
    readinessVerdict: readiness.overall,
    missingRequired: readiness.missingRequired,
    scopeGateBlockers: scopeGate?.blockers.map((b) => b.family) ?? [],
    rfpBlockedSections: rfp.blockedSections,
    shouldCostTotal: sc.totalShouldCost,
    tcoBestVendor: tco.bestVendor,
    negotiationFirstMove: firstMove,
    envelope: grounded.envelope,
    mayAnswer: grounded.mayAnswer,
    narrativeMarkdown,
  };
}

function renderNarrative(x: {
  archetypeName: string;
  readinessVerdict: string;
  missingRequired: string[];
  scopeBlockers: string[];
  rfpMd: string;
  shouldCost: ReturnType<typeof shouldCostModel>;
  tco: ReturnType<typeof normalizeProposals>;
  negotiation: ReturnType<typeof negotiationPlan>;
  envelope: ReturnType<typeof buildGroundedSourceAnswer>["envelope"];
}): string {
  const m = (n: number) => `$${(n / 1e6).toFixed(2)}M`;
  const L: string[] = [];
  L.push("# SkyHarbor — AMS Sourcing Event (end-to-end proof)");
  L.push("");
  L.push(
    `**Archetype resolved:** ${x.archetypeName}  |  **Tenant:** ${x.envelope.tenantResolved}  |  **Confidence:** ${x.envelope.confidence}`,
  );
  L.push("");
  L.push("## 1 · Evidence readiness");
  L.push(
    `Overall: **${x.readinessVerdict}**. Required families still missing: ${x.missingRequired.join(", ") || "none"}.`,
  );
  L.push(`Scope-gate blockers: ${x.scopeBlockers.join("; ") || "none"}.`);
  L.push("");
  L.push("## 2 · Event-specific RFP");
  L.push(x.rfpMd);
  L.push("## 3 · Should-cost (independent baseline)");
  L.push(
    `Total: **${m(x.shouldCost.totalShouldCost)}/yr** (confidence ${x.shouldCost.confidence}; cited ${x.shouldCost.citations.join(", ")}).`,
  );
  if (x.shouldCost.glidePathYear2)
    L.push(
      `Year-2 after 8% productivity glide-path: **${m(x.shouldCost.glidePathYear2)}**.`,
    );
  L.push("");
  L.push("## 4 · Proposal TCO normalization");
  for (const v of x.tco.vendors) {
    L.push(
      `- **${v.vendor}** — stated ${m(v.statedTotal)}, normalized **${m(v.normalizedTotal)}**${v.excludedComponents.length ? ` (added back: ${v.excludedComponents.join(", ")})` : ""}`,
    );
  }
  L.push(
    `On a true apples-to-apples basis the low bidder is **${x.tco.bestVendor}**.`,
  );
  L.push("");
  L.push("## 5 · Negotiation plan");
  for (const g of x.negotiation.sequence) {
    L.push(`- **${g.timing}**: ${g.levers.map((l) => l.label).join("; ")}`);
  }
  L.push("");
  L.push("## 6 · Grounded executive recommendation (envelope)");
  L.push("```json");
  L.push(JSON.stringify(x.envelope, null, 2));
  L.push("```");
  if (x.envelope.unsupportedClaims.length === 0)
    L.push(
      "_No unsupported claims. Cross-tenant evidence was fenced. Missing evidence is named, not hidden._",
    );
  return L.join("\n");
}
