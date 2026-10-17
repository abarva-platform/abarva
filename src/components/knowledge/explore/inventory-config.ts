/**
 * Config-driven Explore inventory framework. Per the reconciliation matrix's
 * `ExploreInventoryViewModel` classification, only two of the original eight
 * inventory kinds are DIRECTLY_SUPPORTED by the real consumption contract
 * today (`applications` -> domainKey "technology", `infrastructure` ->
 * domainKey "technology_estate", `dataProducts` -> domainKey "data_products",
 * `vendors` -> domainKey "vendors", backed by real registered projections).
 * The other four (integrations, programs, risks, measures)
 * have no real projection behind them at any layer of the registered
 * contract -- their `fetch` returns an honest PROJECTION_UNAVAILABLE
 * envelope directly, without an assembler call, rather than pretending a
 * query exists. See CURRENTLY_RENDERABLE_COMPONENTS.md /
 * KNOWLEDGE_PROVIDER_RECONCILIATION_MATRIX.csv for the full classification.
 *
 * Every `numeric` column is the ONLY kind of column the chart toggle may
 * aggregate over -- kinds with no numeric column declare `chartable: false`
 * so the toggle never appears for them.
 */
import type {
  AssemblerQuery,
  ComponentReadinessState,
  KnowledgeUiViewModelAssembler,
  ViewModelEnvelope,
} from "@/lib/knowledge/view-model";
import { deriveReadiness } from "@/lib/knowledge/view-model";
import type {
  EntityFieldValue,
  EntitySummaryV1,
} from "@/lib/knowledge/consumption-contracts";

export type InventoryCell = string | number | null;
export type InventoryRecord = Record<string, InventoryCell>;

export type ExploreInventoryKind =
  | "applications"
  | "dataProducts"
  | "integrations"
  | "infrastructure"
  | "vendors"
  | "programs"
  | "risks"
  | "measures";

export interface InventoryColumn {
  readonly key: string;
  readonly label: string;
  readonly align: "left" | "right";
  readonly numeric: boolean;
}

export interface InventoryFacetConfig {
  readonly key: string;
  readonly label: string;
  readonly options: readonly string[];
}

export interface InventoryKindConfig {
  readonly kind: ExploreInventoryKind;
  readonly label: string;
  readonly domainId: string;
  readonly columns: readonly InventoryColumn[];
  readonly facets: readonly InventoryFacetConfig[];
  readonly readinessKey: string;
  readonly primaryKey: string;
  readonly chartable: boolean;
  fetch(
    assembler: KnowledgeUiViewModelAssembler,
    query: AssemblerQuery,
  ): Promise<ViewModelEnvelope<readonly InventoryRecord[]>>;
}

function fieldValue(entity: EntitySummaryV1, key: string): InventoryCell {
  const field = entity.fields.find((f: EntityFieldValue) => f.key === key);
  if (!field || field.availabilityState !== "available") return null;
  return field.value;
}

function entityReadiness(entity: EntitySummaryV1): ComponentReadinessState {
  return deriveReadiness({
    availabilityState: entity.availabilityState,
    authorityState: "accepted",
    freshnessState: "fresh",
    warnings: [],
    // No per-row cite-render test exists yet -- every row is, at best,
    // DATA_RECONCILED_BUT_UI_UNPROVEN, never ENABLED_AND_PROVEN.
    proven: false,
  });
}

/** Real, contract-backed fetch: assembler.getExploreInventory scoped to one
 * domainKey, entities further narrowed to the one real entityType this
 * inventory kind represents (a domainKey can carry more than one entityType
 * -- e.g. "vendors" also carries "contract" rows -- which the original
 * per-kind duplicate methods never mixed together). */
function realFetch(
  domainKey: string,
  entityType: string,
  toRecord: (entity: EntitySummaryV1) => InventoryRecord,
) {
  return async (
    assembler: KnowledgeUiViewModelAssembler,
    query: AssemblerQuery,
  ): Promise<ViewModelEnvelope<readonly InventoryRecord[]>> => {
    const env = await assembler.getExploreInventory({ ...query, domainKey });
    if (env.data === null) {
      return { ...env, data: null };
    }
    const entities = env.data.entities.filter(
      (e) => e.entityType === entityType,
    );
    return { ...env, data: entities.map(toRecord) };
  };
}

/** No real projection exists for this inventory kind at any layer of the
 * registered consumption contract today -- return an honest
 * PROJECTION_UNAVAILABLE envelope without ever calling the assembler for a
 * domain it cannot support. */
function unavailableFetch(reason: string) {
  return async (): Promise<ViewModelEnvelope<readonly InventoryRecord[]>> => ({
    readiness: "PROJECTION_UNAVAILABLE",
    unavailableReason: reason,
    data: null,
    evidenceRefs: [],
    knownGapRefs: [],
    asOf: new Date(0).toISOString(),
    knowledgeBaselineRef: "not-applicable",
    warnings: [],
  });
}

export const INVENTORY_KINDS: readonly InventoryKindConfig[] = [
  {
    kind: "applications",
    label: "Systems",
    domainId: "tech",
    primaryKey: "name",
    chartable: true,
    readinessKey: "readinessState",
    columns: [
      { key: "name", label: "System", align: "left", numeric: false },
      { key: "owner", label: "Owner", align: "left", numeric: false },
      { key: "hosting", label: "Hosting", align: "left", numeric: false },
      {
        key: "criticality",
        label: "Criticality",
        align: "left",
        numeric: false,
      },
      { key: "vendor", label: "Vendor", align: "left", numeric: false },
      {
        key: "annualCost",
        label: "Annual cost $M",
        align: "right",
        numeric: true,
      },
      {
        key: "readinessState",
        label: "Readiness",
        align: "left",
        numeric: false,
      },
    ],
    facets: [
      {
        key: "criticality",
        label: "Criticality",
        options: ["tier_1", "tier_2"],
      },
    ],
    fetch: realFetch("technology", "application", (e) => ({
      name: e.displayName,
      owner: fieldValue(e, "owner") ?? "Owner not assigned",
      hosting: fieldValue(e, "hosting"),
      criticality: fieldValue(e, "criticality"),
      vendor: fieldValue(e, "vendor"),
      annualCost: fieldValue(e, "annual_cost"),
      readinessState: entityReadiness(e),
    })),
  },
  {
    kind: "dataProducts",
    label: "Data products",
    domainId: "data",
    primaryKey: "name",
    chartable: false,
    readinessKey: "readinessState",
    columns: [
      { key: "name", label: "Data product", align: "left", numeric: false },
      {
        key: "readinessState",
        label: "Readiness",
        align: "left",
        numeric: false,
      },
    ],
    facets: [],
    fetch: realFetch("data_products", "data_product", (e) => ({
      name: e.displayName,
      readinessState: entityReadiness(e),
    })),
  },
  {
    kind: "integrations",
    label: "Integrations",
    domainId: "tech",
    primaryKey: "name",
    chartable: false,
    readinessKey: "readinessState",
    columns: [
      { key: "name", label: "Integration", align: "left", numeric: false },
      {
        key: "readinessState",
        label: "Readiness",
        align: "left",
        numeric: false,
      },
    ],
    facets: [],
    fetch: unavailableFetch(
      "No integration-inventory projection exists in the consumption registry or the foundation-closure projection counts at any layer yet.",
    ),
  },
  {
    kind: "infrastructure",
    label: "Infrastructure and cloud",
    domainId: "tech",
    primaryKey: "name",
    chartable: false,
    readinessKey: "readinessState",
    columns: [
      { key: "name", label: "Platform", align: "left", numeric: false },
      {
        key: "readinessState",
        label: "Readiness",
        align: "left",
        numeric: false,
      },
    ],
    facets: [],
    fetch: realFetch("technology_estate", "technology_estate", (e) => ({
      name: e.displayName,
      readinessState: entityReadiness(e),
    })),
  },
  {
    kind: "vendors",
    label: "Vendors",
    domainId: "finance",
    primaryKey: "vendorName",
    chartable: true,
    readinessKey: "readinessState",
    columns: [
      { key: "vendorName", label: "Vendor", align: "left", numeric: false },
      { key: "category", label: "Category", align: "left", numeric: false },
      {
        key: "annualSpend",
        label: "Committed $M",
        align: "right",
        numeric: true,
      },
      {
        key: "readinessState",
        label: "Readiness",
        align: "left",
        numeric: false,
      },
    ],
    facets: [{ key: "category", label: "Category", options: [] }],
    fetch: realFetch("vendors", "vendor", (e) => ({
      vendorName: e.displayName,
      category: fieldValue(e, "category"),
      annualSpend: fieldValue(e, "spend"),
      readinessState: entityReadiness(e),
    })),
  },
  {
    kind: "programs",
    label: "Programmes",
    domainId: "risk",
    primaryKey: "name",
    chartable: false,
    readinessKey: "readinessState",
    columns: [
      { key: "name", label: "Programme", align: "left", numeric: false },
      {
        key: "readinessState",
        label: "Readiness",
        align: "left",
        numeric: false,
      },
    ],
    facets: [],
    fetch: unavailableFetch(
      "No program-inventory projection exists in the consumption registry or the foundation-closure projection counts at any layer yet.",
    ),
  },
  {
    kind: "risks",
    label: "Risks and controls",
    domainId: "risk",
    primaryKey: "title",
    chartable: false,
    readinessKey: "readinessState",
    columns: [
      { key: "title", label: "Risk", align: "left", numeric: false },
      {
        key: "readinessState",
        label: "Readiness",
        align: "left",
        numeric: false,
      },
    ],
    facets: [],
    fetch: unavailableFetch(
      "No risk-inventory projection (distinct from evidence_gap_v1, a data-quality gap concept, not an operational-risk register) exists in the consumption registry yet.",
    ),
  },
  {
    kind: "measures",
    label: "Measures",
    domainId: "ops",
    primaryKey: "name",
    chartable: false,
    readinessKey: "readinessState",
    columns: [
      { key: "name", label: "Measure", align: "left", numeric: false },
      {
        key: "readinessState",
        label: "Readiness",
        align: "left",
        numeric: false,
      },
    ],
    facets: [],
    fetch: unavailableFetch(
      "consumption.metric_observation_v1 is registered but no UI-facing explore query reads it yet, and the foundation-closure record shows zero metric_catalog_v1 rows for this baseline today.",
    ),
  },
];

export const EXPLORE_DOMAINS: readonly {
  readonly id: string;
  readonly label: string;
  readonly kinds: readonly ExploreInventoryKind[];
}[] = [
  { id: "ops", label: "Flight and network operations", kinds: ["measures"] },
  {
    id: "tech",
    label: "Systems and technology",
    kinds: ["applications", "integrations", "infrastructure"],
  },
  { id: "data", label: "Data and analytics", kinds: ["dataProducts"] },
  { id: "finance", label: "Vendors and commercial", kinds: ["vendors"] },
  {
    id: "risk",
    label: "Programmes, risk and outcomes",
    kinds: ["programs", "risks", "measures"],
  },
];

export function findInventoryKindConfig(kind: string): InventoryKindConfig {
  const found = INVENTORY_KINDS.find((k) => k.kind === kind);
  return found ?? INVENTORY_KINDS[0];
}
