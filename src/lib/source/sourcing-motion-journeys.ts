import {
  SOURCE_STAGE_LABELS,
  SOURCE_STAGE_ORDER,
  normalizeSourceStageKey,
} from "./constants";
import type { SourceStageKey, SourcingEventSummary } from "./types";
import type { StageAnalyticsView } from "@/components/source/canvas/analytics/view-model";

export type SourceSourcingMotion = "competitive_rfp" | "contract_optimization";

export interface SourceJourneyStageDefinition {
  key: SourceStageKey;
  label: string;
  purpose: string;
}

export interface SourceJourneyDefinition {
  id: SourceSourcingMotion;
  label: string;
  summary: string;
  stages: readonly SourceJourneyStageDefinition[];
  skippedStageKeys: readonly SourceStageKey[];
}

export interface ResolveSourceJourneyInput {
  event?: Partial<
    Pick<
      SourcingEventSummary,
      "code" | "name" | "archetype" | "classifiedCategory" | "sourcingMotion"
    >
  > | null;
  sourcingMotion?: SourceSourcingMotion | string | null;
  eventType?: string | null;
  classifiedCategory?: string | null;
  archetype?: string | null;
  eventName?: string | null;
  eventCode?: string | null;
  triggerDescription?: string | null;
  hasContractOptimizationProfile?: boolean;
}

const COMPETITIVE_RFP_STAGES: readonly SourceJourneyStageDefinition[] =
  SOURCE_STAGE_ORDER.map((key) => ({
    key,
    label: SOURCE_STAGE_LABELS[key],
    purpose: defaultPurposeForStage(key),
  }));

const CONTRACT_OPTIMIZATION_STAGES: readonly SourceJourneyStageDefinition[] = [
  {
    key: "strategy",
    label: "Strategy",
    purpose:
      "Confirm the renegotiation mandate, leverage thesis, and owner before work begins.",
  },
  {
    key: "scope",
    label: "Scope",
    purpose:
      "Define the contract boundary, renewal window, current obligations, and evidence required for a negotiation position.",
  },
  {
    key: "pricing",
    label: "Commercial Baseline",
    purpose:
      "Establish the current spend, utilization, SLA performance, renewal economics, and benchmark anchors before asking for concessions.",
  },
  {
    key: "bafo",
    label: "Negotiation Plan",
    purpose:
      "Translate the baseline into asks, walk-away logic, concession sequencing, and a vendor discussion script.",
  },
  {
    key: "executive_decision",
    label: "Executive Decision",
    purpose:
      "Choose the commercial posture: accept, counter, escalate, or trigger a competitive re-bid.",
  },
  {
    key: "transition",
    label: "Agreement",
    purpose:
      "Lock agreed terms, controls, owners, renewal protections, and implementation commitments.",
  },
  {
    key: "value",
    label: "Value",
    purpose:
      "Track realized concessions, avoided uplift, credits, and risk reduction against the signed agreement.",
  },
];

export const SOURCE_JOURNEYS: Record<
  SourceSourcingMotion,
  SourceJourneyDefinition
> = {
  competitive_rfp: {
    id: "competitive_rfp",
    label: "Competitive sourcing",
    summary:
      "Multi-vendor sourcing journey with RFP, responses, evaluation, BAFO, selection, transition, and value tracking.",
    stages: COMPETITIVE_RFP_STAGES,
    skippedStageKeys: [],
  },
  contract_optimization: {
    id: "contract_optimization",
    label: "Contract optimization",
    summary:
      "Incumbent-renegotiation journey focused on baseline, negotiation, decision, agreement, and value proof.",
    stages: CONTRACT_OPTIMIZATION_STAGES,
    skippedStageKeys: ["rfp", "responses", "evaluation", "selection"],
  },
};

export function getSourceJourneyForEvent(
  input: ResolveSourceJourneyInput,
): SourceJourneyDefinition {
  return SOURCE_JOURNEYS[resolveSourceSourcingMotion(input)];
}

export function resolveSourceSourcingMotion(
  input: ResolveSourceJourneyInput,
): SourceSourcingMotion {
  const explicitMotion =
    parseSourceSourcingMotion(input.sourcingMotion) ??
    parseSourceSourcingMotion(input.event?.sourcingMotion);
  if (explicitMotion) return explicitMotion;

  if (input.hasContractOptimizationProfile) return "contract_optimization";

  const classifiedCategory =
    input.classifiedCategory ?? input.event?.classifiedCategory ?? null;
  if (classifiedCategory === "saas_renewal") return "contract_optimization";

  const text = [
    input.archetype,
    input.event?.archetype,
    input.eventName,
    input.event?.name,
    input.eventCode,
    input.event?.code,
    input.triggerDescription,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    classifiedCategory !== "saas_renewal" &&
    /\b(rfp|rfi|competitive|multi[-\s]?vendor|market\s+event|vendor\s+selection)\b/.test(
      text,
    )
  ) {
    return "competitive_rfp";
  }

  if (
    /\b(contract\s+optimization|optimi[sz]e\s+(?:a\s+)?contract|renewal|renegotiat\w*|incumbent\s+negotiation|sole[-\s]?source)\b/.test(
      text,
    )
  ) {
    return "contract_optimization";
  }

  return "competitive_rfp";
}

function parseSourceSourcingMotion(
  value: string | null | undefined,
): SourceSourcingMotion | null {
  if (value === "competitive_rfp" || value === "contract_optimization") {
    return value;
  }
  return null;
}

export function sourceJourneyStageKeys(
  journey: SourceJourneyDefinition,
): readonly SourceStageKey[] {
  return journey.stages.map((stage) => stage.key);
}

export function isStageInSourceJourney(
  journey: SourceJourneyDefinition,
  stageKey: unknown,
): stageKey is SourceStageKey {
  const canonical = normalizeSourceStageKey(stageKey);
  return Boolean(
    canonical && journey.stages.some((stage) => stage.key === canonical),
  );
}

export function coerceStageToSourceJourney(
  journey: SourceJourneyDefinition,
  requestedStageKey: unknown,
  currentStageKey: unknown,
): SourceStageKey {
  const requested = normalizeSourceStageKey(requestedStageKey);
  if (requested && isStageInSourceJourney(journey, requested)) return requested;
  if (requested) return nearestVisibleStageInJourney(journey, requested);

  const current = normalizeSourceStageKey(currentStageKey);
  if (current && isStageInSourceJourney(journey, current)) return current;
  if (current) return nearestVisibleStageInJourney(journey, current);

  return journey.stages[0]?.key ?? "strategy";
}

export function sourceJourneyLabelForStage(
  journey: SourceJourneyDefinition | null | undefined,
  stageKey: unknown,
): string {
  const canonical = normalizeSourceStageKey(stageKey);
  if (!canonical) return "Source stage";
  return (
    journey?.stages.find((stage) => stage.key === canonical)?.label ??
    SOURCE_STAGE_LABELS[canonical] ??
    canonical
  );
}

export function sourceJourneyPurposeForStage(
  journey: SourceJourneyDefinition | null | undefined,
  stageKey: unknown,
): string | null {
  const canonical = normalizeSourceStageKey(stageKey);
  if (!canonical) return null;
  return (
    journey?.stages.find((stage) => stage.key === canonical)?.purpose ?? null
  );
}

export function nextSourceStageForJourney(
  stageKey: unknown,
  journey: SourceJourneyDefinition | null | undefined,
): SourceStageKey | null {
  const canonical = normalizeSourceStageKey(stageKey);
  if (!canonical) return null;
  const stages =
    journey?.stages.map((stage) => stage.key) ?? SOURCE_STAGE_ORDER;
  const index = stages.indexOf(canonical);
  if (index < 0 || index >= stages.length - 1) return null;
  return stages[index + 1] ?? null;
}

export function adaptStageViewToSourceJourney(
  stageView: StageAnalyticsView,
  journey: SourceJourneyDefinition | null | undefined,
): StageAnalyticsView {
  const canonical = normalizeSourceStageKey(stageView.stageKey);
  if (!journey || !canonical) return stageView;
  const label = sourceJourneyLabelForStage(journey, canonical);
  const purpose =
    sourceJourneyPurposeForStage(journey, canonical) ?? stageView.purpose;
  const nextStage = nextSourceStageForJourney(canonical, journey);
  const nextStageName = nextStage
    ? sourceJourneyLabelForStage(journey, nextStage)
    : null;

  if (journey.id !== "contract_optimization") {
    return {
      ...stageView,
      stageName: label,
      purpose,
      gate: { ...stageView.gate, nextStageName },
    };
  }

  return {
    ...stageView,
    stageName: label,
    purpose,
    intel: {
      ...stageView.intel,
      lead: journeySpecificLead(stageView.intel.lead, canonical),
      points: stageView.intel.points.map((point) => ({
        ...point,
        text: contractOptimizationText(point.text),
      })),
    },
    tasks: stageView.tasks.map((task) => ({
      ...task,
      title: contractOptimizationText(task.title),
      subtitle: contractOptimizationText(task.subtitle),
      guide: contractOptimizationText(task.guide),
      cta: contractOptimizationText(task.cta),
      template: task.template
        ? {
            ...task.template,
            name: contractOptimizationText(task.template.name),
            meta: contractOptimizationText(task.template.meta),
          }
        : task.template,
      file: task.file
        ? {
            ...task.file,
            name: contractOptimizationText(task.file.name),
            meta: contractOptimizationText(task.file.meta),
          }
        : task.file,
      rows: task.rows?.map((row) => ({
        ...row,
        key: contractOptimizationText(row.key),
        value: contractOptimizationText(row.value),
      })),
    })),
    gate: {
      ...stageView.gate,
      confirms: stageView.gate.confirms.map((confirm) => ({
        ...confirm,
        label: contractOptimizationText(confirm.label),
        detail: contractOptimizationText(confirm.detail),
      })),
      generates: stageView.gate.generates
        .filter((deliverable) => !/\brfp\b/i.test(deliverable.label))
        .map((deliverable) => ({
          ...deliverable,
          label: contractOptimizationText(deliverable.label),
        })),
      nextStageName,
    },
  };
}

function defaultPurposeForStage(stageKey: SourceStageKey): string {
  switch (stageKey) {
    case "strategy":
      return "Confirm the mandate, decision owner, value thesis, and sourcing rigor.";
    case "scope":
      return "Define what is in, what is out, and what evidence must support the market event.";
    case "rfp":
      return "Convert the strategy and scope into vendor-ready requirements and commercial instructions.";
    case "responses":
      return "Collect vendor responses and normalize them into comparable evidence.";
    case "evaluation":
      return "Compare vendors against the scorecard, risk posture, and value thesis.";
    case "pricing":
      return "Normalize commercial offers and isolate the value levers worth negotiating.";
    case "bafo":
      return "Run final negotiation rounds and capture concessions against the value plan.";
    case "executive_decision":
      return "Present the recommended decision, options, risks, and approval asks.";
    case "selection":
      return "Record the award decision and committed value baseline.";
    case "transition":
      return "Mobilize the contract, owners, controls, and implementation plan.";
    case "value":
      return "Track realized value against the approved sourcing decision.";
    default:
      return SOURCE_STAGE_LABELS[stageKey] ?? "Source stage";
  }
}

function nearestVisibleStageInJourney(
  journey: SourceJourneyDefinition,
  stageKey: SourceStageKey,
): SourceStageKey {
  const canonicalIndex = SOURCE_STAGE_ORDER.indexOf(stageKey);
  if (canonicalIndex < 0) return journey.stages[0]?.key ?? "strategy";

  const forward = SOURCE_STAGE_ORDER.slice(canonicalIndex + 1).find(
    (candidate) => isStageInSourceJourney(journey, candidate),
  );
  if (forward) return forward;

  const backward = SOURCE_STAGE_ORDER.slice(0, canonicalIndex)
    .reverse()
    .find((candidate) => isStageInSourceJourney(journey, candidate));
  return backward ?? journey.stages[0]?.key ?? "strategy";
}

function journeySpecificLead(lead: string, stageKey: SourceStageKey): string {
  if (stageKey === "scope") {
    return "Here's the incumbent-renegotiation boundary: current contract, renewal window, utilization, SLA history, and walk-away evidence.";
  }
  if (stageKey === "pricing") {
    return "Here's the commercial baseline that will carry the negotiation: what is paid, consumed, credited, benchmarked, and at risk.";
  }
  if (stageKey === "bafo") {
    return "Here's the negotiation plan: quantified asks, concession order, walk-away guardrails, and executive escalation points.";
  }
  return contractOptimizationText(lead);
}

function contractOptimizationText(value: string | undefined): string {
  if (!value) return value ?? "";
  return value
    .replace(/\bRFP readiness pack\b/g, "negotiation readiness pack")
    .replace(/\bYour RFP readiness pack\b/g, "Negotiation readiness pack")
    .replace(/\bRFP clause checklist\b/g, "contract term checklist")
    .replace(/\bRFP clause\b/g, "contract term")
    .replace(/\bRFP clauses\b/g, "contract terms")
    .replace(/\bthe RFP\b/g, "the negotiation")
    .replace(/\bRFP\b/g, "negotiation")
    .replace(/\brfp\b/g, "negotiation")
    .replace(/\bvendors\b/g, "the incumbent")
    .replace(/\bVendors\b/g, "The incumbent")
    .replace(/\bvendor\b/g, "incumbent")
    .replace(/\bVendor\b/g, "Incumbent")
    .replace(/\bbids\b/g, "commercial positions")
    .replace(/\bBids\b/g, "Commercial positions");
}
