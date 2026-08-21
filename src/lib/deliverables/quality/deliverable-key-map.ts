// Maps an orchestrator deliverableType → the profiled DeliverableKey, and builds
// a ContractInput from a generated RenderableDeliverable. Tenant-agnostic: the
// same mapping for every client. Used to run the Deliverable Quality Contract in
// the persistence path.

import type { RenderableDeliverable } from "@/lib/deliverables/orchestrator/types";
import type {
  DeliverableKey,
  ExhibitId,
} from "@/lib/deliverables/profiles/types";
import { DELIVERABLE_PROFILES } from "@/lib/deliverables/profiles/registry";
import type { ContractInput } from "./deliverable-quality-contract";
import type { OutputFormat } from "@/lib/deliverables/orchestrator/types";

/** Orchestrator deliverableType → profiled DeliverableKey. */
const ORCH_TYPE_TO_KEY: Readonly<Record<string, DeliverableKey>> = {
  charter: "charter",
  discovery_report: "discovery_report",
  root_cause: "root_cause_worksheet",
  root_cause_worksheet: "root_cause_worksheet",
  target_architecture: "target_state_architecture",
  target_state_architecture: "target_state_architecture",
  solution_design: "solution_design",
  operating_model: "operating_model_design",
  operating_model_design: "operating_model_design",
  sourcing_strategy: "sourcing_strategy",
  roadmap: "execution_roadmap",
  execution_roadmap: "execution_roadmap",
  business_case: "business_case",
  estimate_model: "financial_model",
  financial_model: "financial_model",
  value_model: "tower_metrics_plan",
  tower_metrics_plan: "tower_metrics_plan",
  readiness_and_change_plan: "readiness_and_change_plan",
  value_measurement_contract: "value_measurement_contract",
  handoff_pack: "handoff_package",
  handoff_package: "handoff_package",
};

export function deliverableKeyForOrchestratorType(
  deliverableType: string,
): DeliverableKey | undefined {
  return ORCH_TYPE_TO_KEY[deliverableType];
}

export function deliverableKeyForRegistryKey(
  registryKey?: string | null,
): DeliverableKey | undefined {
  if (!registryKey) return undefined;
  return registryKey in DELIVERABLE_PROFILES
    ? (registryKey as DeliverableKey)
    : undefined;
}

const VALID_EXHIBITS = new Set<string>(
  Object.values(DELIVERABLE_PROFILES).flatMap((p) => p.requiredExhibits),
);

/**
 * Best-effort map of a generated document's exhibits to known ExhibitIds. The
 * prose path carries loosely-typed exhibits; only ids that match a known
 * ExhibitId count. (When the structured generation passes land, this becomes
 * exact — until then the contract correctly reports missing required exhibits.)
 */
function renderedExhibitsFromDoc(doc: RenderableDeliverable): ExhibitId[] {
  const ids: ExhibitId[] = [];
  for (const ex of doc.exhibits ?? []) {
    const id =
      (ex as { id?: string; key?: string }).id ?? (ex as { key?: string }).key;
    if (id && VALID_EXHIBITS.has(id)) ids.push(id as ExhibitId);
  }
  return ids;
}

const PLACEHOLDER_RE =
  /\[CLIENT TO COMPLETE[^\]]*\]|\bTBC\b|\bto be confirmed\b/gi;

/** Build the quality-contract input from a generated deliverable. */
export function buildContractInput(args: {
  doc: RenderableDeliverable;
  deliverableKey: DeliverableKey;
  outputFormat?: OutputFormat;
  tenantTerms?: ReadonlyArray<string>;
  governanceOk?: boolean;
  /** Exhibits the structured generation passes produced (stage 4). */
  additionalExhibits?: ReadonlyArray<ExhibitId>;
  /** Visible final text, when a profile renderer replaces the generated prose. */
  narrativeTextOverride?: string;
}): ContractInput {
  const { doc } = args;
  const generatedNarrativeText = [
    doc.title,
    doc.recommendation,
    ...doc.generatedSections.map((s) => `${s.title}\n${s.bodyMarkdown}`),
  ]
    .filter(Boolean)
    .join("\n\n");
  const narrativeText = args.narrativeTextOverride ?? generatedNarrativeText;

  const scattered = (narrativeText.match(PLACEHOLDER_RE) ?? []).length;
  const citationCount = doc.generatedSections.reduce(
    (n, s) => n + (s.citationsUsed?.length ?? 0),
    0,
  );

  const renderedExhibits = [
    ...renderedExhibitsFromDoc(doc),
    ...(args.additionalExhibits ?? []),
  ];

  return {
    profile: DELIVERABLE_PROFILES[args.deliverableKey],
    narrativeText,
    renderedExhibits,
    outputFormat: args.outputFormat,
    scatteredPlaceholderCount: scattered,
    citationCount,
    ...(args.tenantTerms ? { tenantTerms: args.tenantTerms } : {}),
    ...(args.governanceOk !== undefined
      ? { governanceOk: args.governanceOk }
      : {}),
  };
}
