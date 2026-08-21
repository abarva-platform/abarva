import type { TechnologySemanticType } from "./technology-semantic-taxonomy";

/**
 * The Architecture View System.
 *
 * One semantic model, six projections. No view reinterprets what Caboodle, SSIS, SQL Server or
 * MuleSoft are -- they all read the same canonical classification and differ only in what they
 * choose to show and at what altitude. A view that classified independently would be a second
 * truth, and two truths on one page is how a diagram becomes indefensible.
 *
 *   Canonical source rows
 *          ↓  semantic classification
 *   Canonical architecture graph
 *          ↓  format policy
 *   landscape · flow · topology · movement · trace · evidence
 */

export type ArchitectureViewFormat =
  | "executive_landscape"
  | "end_to_end_data_flow"
  | "platform_topology"
  | "movement_profile"
  | "lineage_trace"
  | "estate_evidence";

export interface ArchitectureViewFormatPolicy {
  format: ArchitectureViewFormat;
  /** The question the view exists to answer. If a view cannot state its question, it should not
   * be a view. */
  executiveQuestion: string;
  label: string;
  /** Semantic types the view is meaningless without. Checked before rendering, so a view is
   * offered only when the record can populate it. */
  requiredSemanticTypes: TechnologySemanticType[];
  /** Density ceiling. An executive landscape of three hundred nodes is not an executive view. */
  maximumVisibleNodes: number;
  supportsAggregation: boolean;
  /** Whether the view asserts relationships. Only these need a topology that can carry them. */
  requiresTopologyFitness: boolean;
  /** Where to send the reader when this view cannot be justified. */
  fallbackFormat?: ArchitectureViewFormat;
}

export const ARCHITECTURE_VIEW_POLICIES: Readonly<Record<ArchitectureViewFormat, ArchitectureViewFormatPolicy>> = {
  executive_landscape: {
    format: "executive_landscape",
    label: "Overview",
    executiveQuestion: "What are the major architectural layers, concentrations and dependencies?",
    // Needs nothing in particular: any classified estate has a landscape.
    requiredSemanticTypes: [],
    maximumVisibleNodes: 18,
    supportsAggregation: true,
    // Bands, not relationships. A landscape stays honest even where topology does not.
    requiresTopologyFitness: false,
  },
  end_to_end_data_flow: {
    format: "end_to_end_data_flow",
    label: "Data Flow",
    executiveQuestion: "Where does data originate, how does it move, where does it land, and where is it consumed?",
    requiredSemanticTypes: [],
    maximumVisibleNodes: 40,
    supportsAggregation: true,
    // The only view that asserts relationships as its subject, so the only one that must refuse a
    // topology which cannot carry them.
    requiresTopologyFitness: true,
    fallbackFormat: "executive_landscape",
  },
  platform_topology: {
    format: "platform_topology",
    label: "Platforms",
    executiveQuestion: "Which platforms exist, and what role does each play?",
    requiredSemanticTypes: [],
    maximumVisibleNodes: 120,
    supportsAggregation: false,
    // Cards grouped by zone. No connectors, so no hairball and no topology dependency.
    requiresTopologyFitness: false,
  },
  movement_profile: {
    format: "movement_profile",
    label: "Movement",
    executiveQuestion: "How is data actually transported — HL7, API, ETL, events, replication, file transfer?",
    requiredSemanticTypes: [],
    maximumVisibleNodes: 0,
    supportsAggregation: true,
    // A matrix of mechanisms. Tells an architect more than a dense network diagram, and stays
    // meaningful even when destinations do not converge.
    requiresTopologyFitness: false,
  },
  lineage_trace: {
    format: "lineage_trace",
    label: "Trace a Path",
    executiveQuestion: "For one mart, warehouse, dashboard or application, what is its exact upstream and downstream path?",
    requiredSemanticTypes: [],
    maximumVisibleNodes: 24,
    supportsAggregation: false,
    // A single path is defensible even in an estate with no global convergence: it shows the
    // neighbourhood the record does establish.
    requiresTopologyFitness: false,
  },
  estate_evidence: {
    format: "estate_evidence",
    label: "Evidence",
    executiveQuestion: "What source records support this architecture, and what remains unclassified?",
    requiredSemanticTypes: [],
    maximumVisibleNodes: 0,
    supportsAggregation: false,
    requiresTopologyFitness: false,
  },
};

export const ARCHITECTURE_VIEW_ORDER: ReadonlyArray<ArchitectureViewFormat> = [
  "executive_landscape",
  "end_to_end_data_flow",
  "platform_topology",
  "movement_profile",
  "lineage_trace",
  "estate_evidence",
];

export interface FormatAvailability {
  format: ArchitectureViewFormat;
  available: boolean;
  /** Why it is unavailable, in the reader's language. Shown instead of the view. */
  reason?: string;
  fallbackFormat?: ArchitectureViewFormat;
}

/**
 * Decides which views the record can defensibly support.
 *
 * This is the gate that stops a polished, meaningless diagram from shipping. A tenant whose
 * destinations never converge loses the flow view and keeps the landscape, the platform map, the
 * movement profile and the evidence browser -- four views that remain true -- rather than being
 * handed a beautified hairball asserting a structure the record does not contain.
 */
export function resolveAvailableFormats(input: {
  topologyFitPasses: boolean;
  topologyFindings: string[];
}): FormatAvailability[] {
  return ARCHITECTURE_VIEW_ORDER.map((format) => {
    const policy = ARCHITECTURE_VIEW_POLICIES[format];
    if (policy.requiresTopologyFitness && !input.topologyFitPasses) {
      return {
        format,
        available: false,
        reason:
          "A defensible relationship map cannot yet be rendered because the recorded target topology contains no meaningful destination convergence. The technology estate and movement profile remain available while the topology is remediated.",
        fallbackFormat: policy.fallbackFormat,
      };
    }
    return { format, available: true };
  });
}
