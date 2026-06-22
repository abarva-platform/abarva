import type { DeliverablePlan, ObservedGap } from "@/lib/deliverables/planning/deliverable-plan";
import {
  ARCHITECTURE_V2_EXHIBITS,
  type ArchFlow,
  type ArchNode,
  type ArchitectureExhibitKey,
  type ArchitectureLevelModel,
  type ArchitectureModel,
} from "./architecture-model";

export interface GroundedArchitectureFallbackRequest {
  engagement: string;
  client: string;
  contextText: string;
  plan?: DeliverablePlan;
  failureReason?: string;
}

const OPEN_INPUTS = [
  "Confirm source systems and integration ownership for the operating event.",
  "Confirm target cloud/runtime, network zones, identity model, and data residency constraints.",
  "Confirm production telemetry, audit retention, and human override approval policy.",
];

function text(value: unknown): string {
  return typeof value === "string" ? clientSafeText(value.trim()) : "";
}

function clientSafeText(value: string): string {
  return value
    .replace(/\bsource register\b/gi, "evidence appendix")
    .replace(/\bevidence register\b/gi, "evidence appendix")
    .replace(/\bcontext rows\b/gi, "client records")
    .replace(/\btower rows\b/gi, "operating records")
    .replace(/\bsubstrate\b/gi, "context foundation")
    .replace(/\bentity graph\b/gi, "relationship map")
    .replace(/\benterprise_context\b/gi, "enterprise context")
    .replace(/\bclient[-\s]to[-\s]complete\b/gi, "open input")
    .replace(/\bnot authorized to build\b/gi, "do not approve build yet")
    .replace(/\bnot authorized\b/gi, "not approved")
    .replace(/\bauthorized to build\b/gi, "approved for build")
    .replace(/\bgovernance-correct\b/gi, "control-ready")
    .replace(/(?<![A-Za-z0-9])P([0-5])(?![A-Za-z0-9])/g, "phase $1");
}

function firstSentence(value: string, fallback: string): string {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (!cleaned) return fallback;
  const sentence = cleaned.match(/[^.!?]+[.!?]/)?.[0] ?? cleaned;
  return sentence.slice(0, 220).trim();
}

function uniqueNonEmpty(values: ReadonlyArray<string | undefined>): string[] {
  return Array.from(
    new Set(values.map((v) => text(v)).filter((v): v is string => v.length > 0)),
  );
}

function baseNodes(): { current: ArchNode[]; target: ArchNode[] } {
  const current: ArchNode[] = [
    {
      id: "ops-team",
      label: "Operations decision teams",
      kind: "channel",
      layer: "experience",
      status: "existing",
      note: "Current disruption decisions rely on human coordination.",
    },
    {
      id: "recovery-bridge",
      label: "Recovery command bridge",
      kind: "application",
      layer: "application",
      status: "existing",
      note: "Shared workflow and decision telemetry need confirmation.",
    },
    {
      id: "flight-ops",
      label: "Flight operations system",
      kind: "system",
      layer: "core_systems",
      status: "existing",
      note: "[Client to confirm] authoritative schedule and aircraft status.",
    },
    {
      id: "crew-ops",
      label: "Crew operations system",
      kind: "system",
      layer: "core_systems",
      status: "existing",
      note: "[Client to confirm] crew legality and assignment source.",
    },
    {
      id: "customer-ops",
      label: "Customer/passenger operations",
      kind: "system",
      layer: "core_systems",
      status: "existing",
      note: "[Client to confirm] passenger impact and recovery actions.",
    },
    {
      id: "manual-data",
      label: "Manual data extracts",
      kind: "data_store",
      layer: "data_platform",
      status: "existing",
      note: "Evidence and decisions are not yet consistently governed.",
    },
  ];

  const target: ArchNode[] = [
    {
      id: "ops-command",
      label: "Recovery command workspace",
      kind: "channel",
      layer: "experience",
      status: "changed",
      note: "Single surface for recommendations, decisions, and overrides.",
    },
    {
      id: "recovery-agent",
      label: "Recovery recommendation agent",
      kind: "agent",
      layer: "agentic",
      status: "new",
      note: "Recommends actions but does not bypass human approval.",
    },
    {
      id: "context-store",
      label: "Operational context store",
      kind: "data_store",
      layer: "data_platform",
      status: "new",
      note: "Grounded evidence, constraints, and decision history.",
    },
    {
      id: "recommendation-service",
      label: "Recommendation service",
      kind: "service",
      layer: "application",
      status: "new",
      note: "Scores recovery options against policy and operational constraints.",
    },
    {
      id: "integration-gateway",
      label: "Integration gateway",
      kind: "integration",
      layer: "integration",
      status: "new",
      note: "API/event/file handoffs; exact protocols require confirmation.",
    },
    {
      id: "flight-system",
      label: "Flight operations system",
      kind: "system",
      layer: "core_systems",
      status: "existing",
      note: "[Architecture detail required] schedule, aircraft, and gate state.",
    },
    {
      id: "crew-system",
      label: "Crew operations system",
      kind: "system",
      layer: "core_systems",
      status: "existing",
      note: "[Architecture detail required] legality and assignment state.",
    },
    {
      id: "passenger-system",
      label: "Customer operations system",
      kind: "system",
      layer: "core_systems",
      status: "existing",
      note: "[Architecture detail required] reaccommodation and notification state.",
    },
    {
      id: "approval-control",
      label: "Human approval and override control",
      kind: "control",
      layer: "application",
      status: "new",
      note: "Captures approval, rejection, override reason, and authority.",
    },
    {
      id: "audit-telemetry",
      label: "Audit and telemetry ledger",
      kind: "control",
      layer: "data_platform",
      status: "new",
      note: "Decision trace, model output, operator action, and KPI evidence.",
    },
    {
      id: "platform-zone",
      label: "Secure runtime and network zone",
      kind: "service",
      layer: "infrastructure",
      provider: "hybrid",
      status: "new",
      note: "[Security to validate] hosting, identity, encryption, and network boundary.",
    },
  ];

  return { current, target };
}

const currentFlows: ArchFlow[] = [
  {
    id: "cur-1",
    from: "flight-ops",
    to: "manual-data",
    kind: "data",
    label: "status extracts",
  },
  {
    id: "cur-2",
    from: "crew-ops",
    to: "manual-data",
    kind: "data",
    label: "crew constraints",
  },
  {
    id: "cur-3",
    from: "manual-data",
    to: "recovery-bridge",
    kind: "event",
    label: "manual reconciliation",
  },
  {
    id: "cur-4",
    from: "recovery-bridge",
    to: "ops-team",
    kind: "event",
    label: "decision handoff",
  },
];

const targetFlows: ArchFlow[] = [
  {
    id: "tar-1",
    from: "flight-system",
    to: "integration-gateway",
    kind: "data",
    label: "flight status",
  },
  {
    id: "tar-2",
    from: "crew-system",
    to: "integration-gateway",
    kind: "data",
    label: "crew constraints",
  },
  {
    id: "tar-3",
    from: "passenger-system",
    to: "integration-gateway",
    kind: "data",
    label: "customer impact",
  },
  {
    id: "tar-4",
    from: "integration-gateway",
    to: "context-store",
    kind: "data",
    label: "governed context",
  },
  {
    id: "tar-5",
    from: "context-store",
    to: "recovery-agent",
    kind: "control",
    label: "grounding",
  },
  {
    id: "tar-6",
    from: "recovery-agent",
    to: "recommendation-service",
    kind: "control",
    label: "option scoring",
  },
  {
    id: "tar-7",
    from: "recommendation-service",
    to: "approval-control",
    kind: "human_approval",
    label: "approve / override",
  },
  {
    id: "tar-8",
    from: "approval-control",
    to: "ops-command",
    kind: "control",
    label: "operator decision",
  },
  {
    id: "tar-9",
    from: "approval-control",
    to: "audit-telemetry",
    kind: "event",
    label: "decision trace",
  },
  {
    id: "tar-10",
    from: "platform-zone",
    to: "audit-telemetry",
    kind: "event",
    label: "runtime telemetry",
  },
];

function level(
  title: string,
  thesis: string,
  soWhat: string,
  nodeIds: string[],
  nodes: ArchNode[],
  flows: ArchFlow[],
): ArchitectureLevelModel {
  const selected = nodes.filter((n) => nodeIds.includes(n.id));
  const ids = new Set(selected.map((n) => n.id));
  return {
    title,
    thesis,
    soWhat,
    nodes: selected,
    flows: flows.filter((f) => ids.has(f.from) && ids.has(f.to)),
  };
}

function fallbackGaps(plan: DeliverablePlan | undefined): ObservedGap[] {
  const planned = Array.isArray(plan?.majorGaps)
    ? plan.majorGaps.filter(
        (g) => text(g.observation) && text(g.gap) && text(g.designImplication),
      ).map((g) => ({
        id: text(g.id),
        observation: text(g.observation),
        gap: text(g.gap),
        designImplication: text(g.designImplication),
      }))
    : [];
  const defaults: ObservedGap[] = [
    {
      id: "gap-1",
      observation: text(plan?.currentStateInterpretation) || "Current-state decisions are coordinated across teams and systems.",
      gap: "Shared operational context and decision telemetry are not yet governed end to end.",
      designImplication: "Create a governed context layer before AI recommendations are trusted operationally.",
    },
    {
      id: "gap-2",
      observation: "Recovery actions depend on several systems of record and handoffs.",
      gap: "Integration paths, retry behavior, and system ownership need explicit design.",
      designImplication: "Introduce an integration gateway with observable data, event, and exception flows.",
    },
    {
      id: "gap-3",
      observation: "Human operators remain accountable for disruption decisions.",
      gap: "Approval, override, audit, and model-risk controls must be visible in the target state.",
      designImplication: "Separate AI recommendation flow from human approval and control flow.",
    },
  ];
  return [...planned, ...defaults]
    .slice(0, 3)
    .map((g, i) => ({ ...g, id: g.id || `gap-${i + 1}` }));
}

const EXHIBIT_TITLE: Record<ArchitectureExhibitKey, string> = {
  current_state_operating_flow: "Current-state operating flow",
  current_state_system_data_flow: "Current-state system and data flow",
  current_state_gaps_map: "Current-state gaps map",
  target_conceptual_architecture: "Target conceptual architecture",
  target_logical_architecture: "Target logical architecture",
  target_physical_deployment: "Target physical and deployment architecture",
  end_to_end_data_flow: "End-to-end data flow",
  ai_recommendation_control_flow: "AI recommendation and control flow",
  human_approval_override_model: "Human approval and override model",
  integration_map: "Integration pattern map",
  governance_audit_telemetry_flow: "Governance, audit, and telemetry flow",
  implementation_waves: "Implementation waves",
  architecture_decision_log: "Architecture decision log",
};

export function buildGroundedArchitectureFallback(
  req: GroundedArchitectureFallbackRequest,
): ArchitectureModel {
  const { current, target } = baseNodes();
  const gaps = fallbackGaps(req.plan);
  const bridge = gaps.map((g, i) => ({
    id: `bridge-${i + 1}`,
    gapId: g.id,
    observation: g.observation,
    gap: g.gap,
    designImplication: g.designImplication,
    targetCapability:
      i === 0
        ? "Governed context and recommendation layer"
        : i === 1
          ? "Observable integration and exception handling"
          : "Human approval, override, and audit control",
    architectureResponse:
      i === 0
        ? "Operational context store grounds the recovery recommendation agent."
        : i === 1
          ? "Integration gateway standardizes data, event, and exception flow to systems of record."
          : "Approval control and telemetry ledger keep operators accountable for every AI-assisted decision.",
  }));

  const planSummary = firstSentence(
    text(req.plan?.storyline) || text(req.plan?.targetStateHypothesis),
    `${req.client} should move from fragmented operating decisions to a governed AI-assisted decision architecture.`,
  );
  const targetThesis = firstSentence(
    text(req.plan?.targetStateHypothesis),
    "The target state creates a governed recommendation, approval, action, and audit loop.",
  );

  return {
    engagement: req.engagement,
    client: req.client,
    decisionHeadline:
      text(req.plan?.decisionPurpose) ||
      "Approve the minimum viable target architecture and the open inputs required before build.",
    currentStateFlow: [
      {
        id: "step-1",
        label: "Operational event detected",
        actor: "Operations teams",
        systems: ["Flight operations", "Crew operations", "Customer operations"],
        dataSources: ["Status extracts", "Manual updates", "System alerts"],
        bottleneck: "Common context is not yet governed across decision teams.",
      },
      {
        id: "step-2",
        label: "Recovery options assembled",
        actor: "Recovery command bridge",
        manualWork: "Teams reconcile constraints, impacts, and policy exceptions.",
        missingTelemetry: "Option scoring, reversal, and acceptance telemetry require confirmation.",
      },
      {
        id: "step-3",
        label: "Decision communicated",
        actor: "Operations leaders",
        decision: "Approve recovery action or escalate.",
        controlGap: "Audit trail and override reason capture require explicit target design.",
      },
    ],
    gapsMap: gaps,
    gapToTargetBridge: bridge,
    architectureLevels: {
      conceptual: level(
        "Conceptual architecture",
        `${planSummary} Business capabilities, operators, AI recommendations, governed context, and controls are separated so leadership can inspect the decision model.`,
        "The decision is not whether to add AI; it is where AI may recommend, where humans approve, and which evidence makes the recommendation trustworthy.",
        [
          "ops-command",
          "recovery-agent",
          "context-store",
          "approval-control",
          "audit-telemetry",
        ],
        target,
        targetFlows,
      ),
      logical: level(
        "Logical architecture",
        "The solution separates source-system ingestion, context grounding, recommendation, approval, integration, and audit services.",
        "Logical separation makes the pilot testable: each flow has an owner, a control point, and a failure mode to validate.",
        [
          "ops-command",
          "recovery-agent",
          "recommendation-service",
          "context-store",
          "integration-gateway",
          "flight-system",
          "crew-system",
          "passenger-system",
          "approval-control",
          "audit-telemetry",
        ],
        target,
        targetFlows,
      ),
      physical: level(
        "Physical and deployment architecture",
        "The runtime, network, identity, telemetry, and data boundaries must be confirmed before production build.",
        "The physical view makes the risk conversation concrete: hosting, connectivity, observability, and trust boundaries are explicit open decisions.",
        [
          "platform-zone",
          "integration-gateway",
          "context-store",
          "recommendation-service",
          "approval-control",
          "audit-telemetry",
        ],
        target,
        targetFlows,
      ),
    },
    exhibitPlan: ARCHITECTURE_V2_EXHIBITS.map((id) => ({
      id,
      title: EXHIBIT_TITLE[id],
      soWhat:
        id === "target_physical_deployment"
          ? "The deployment view exposes the security, identity, and network decisions that must be validated before production build."
          : "This exhibit turns the current-to-target reasoning into a visible decision aid for architecture leadership.",
      decisionImplication:
        "Approve the target pattern where confirmed; assign owners to the open inputs before executive release.",
    })),
    decisionLog: [
      {
        id: "dec-1",
        decision: "AI recommendation boundary",
        recommendation: "Use AI for recommendations and prioritization; keep final operational approval with accountable operators.",
        rationale: "The evidence supports governed assistance, not autonomous write authority.",
        status: "recommended",
      },
      {
        id: "dec-2",
        decision: "Integration pattern",
        recommendation: "Confirm API/event/file patterns per system of record before build.",
        rationale: "The source systems are known at a functional level, but protocol and ownership details remain open.",
        status: "open",
      },
      {
        id: "dec-3",
        decision: "Production trust boundary",
        recommendation: "Validate runtime, identity, data residency, encryption, and telemetry controls before production cutover.",
        rationale: "Security and audit controls are release-critical for an AI-assisted operations workflow.",
        status: "open",
      },
    ],
    current: {
      title: "Current state (as-is)",
      thesis: firstSentence(
        text(req.plan?.currentStateInterpretation),
        "The current state coordinates disruption decisions through teams, extracts, and system-specific handoffs.",
      ),
      nodes: current,
      flows: currentFlows,
    },
    target: {
      title: "Target state (to-be)",
      thesis: targetThesis,
      nodes: target,
      flows: targetFlows,
    },
    agentic: [
      {
        agentId: "recovery-agent",
        role: "Recommend recovery options grounded in governed operating context.",
        callsTools: ["recommendation-service", "integration-gateway", "audit-telemetry"],
        grounding: ["context-store"],
        guardrails: ["approval-control", "audit-telemetry"],
        humanInLoop: "Operations leader approves, rejects, or overrides before action.",
      },
    ],
    patterns: [
      {
        id: "pat-1",
        name: "Grounded recommendation loop",
        appliesTo: ["recovery-agent", "context-store", "recommendation-service"],
        implication: "Recommendations stay tied to visible evidence and constraints.",
      },
      {
        id: "pat-2",
        name: "Human-in-the-loop control",
        appliesTo: ["approval-control", "ops-command"],
        implication: "Operators remain accountable for operational decisions.",
      },
      {
        id: "pat-3",
        name: "Observable integration rail",
        appliesTo: ["integration-gateway", "audit-telemetry"],
        implication: "Each handoff can be tested, retried, and audited.",
      },
    ],
    controlPoints: [
      {
        id: "ctrl-1",
        label: "Approval authority",
        what: "Defines who can approve, reject, or override AI-assisted recovery recommendations.",
        owner: "Operations leadership",
      },
      {
        id: "ctrl-2",
        label: "Evidence lineage",
        what: "Links recommendation inputs, model output, operator decision, and final action.",
        owner: "Data governance / architecture",
      },
      {
        id: "ctrl-3",
        label: "Security boundary",
        what: "Validates runtime identity, network access, encryption, and audit retention.",
        owner: "Security architecture",
      },
    ],
    waves: [
      {
        id: "wave-1",
        label: "Wave 1 - Architecture confirmation",
        window: "0-30 days",
        scope: ["Confirm systems", "Confirm integration protocols", "Confirm approval model"],
        outcome: "Target architecture decisions ready for build planning.",
      },
      {
        id: "wave-2",
        label: "Wave 2 - Pilot foundation",
        window: "31-90 days",
        scope: ["context-store", "integration-gateway", "approval-control"],
        outcome: "A governed pilot can test data, recommendation, approval, and audit flow.",
      },
      {
        id: "wave-3",
        label: "Wave 3 - Production readiness",
        window: "90+ days",
        scope: ["platform-zone", "audit-telemetry", "ops-command"],
        outcome: "Production trust boundary, observability, and operator runbook are validated.",
      },
    ],
    openInputs: uniqueNonEmpty([
      ...(req.plan?.missingInputs ?? []),
      ...OPEN_INPUTS,
      req.failureReason
        ? "Confirm the architecture details marked for validation before executive release."
        : undefined,
    ]),
    provenanceNote:
      "Based on governed client context and deliverable reasoning. Where source detail is incomplete, the visual uses explicit client-confirmation placeholders instead of invented implementation facts.",
  };
}
