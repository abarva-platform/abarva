/**
 * Config-driven Explore inventory framework. Rather than 8 near-duplicate
 * table components (one per matrix row: Applications, Data products,
 * Integrations, Infrastructure, Vendors, Programmes, Risks, Measures), each
 * inventory kind declares its columns + a normalizer from its typed provider
 * row into a generic display record. InventoryTable.tsx then stays generic
 * over any inventory kind.
 *
 * Every `numeric` column is the ONLY kind of column the chart toggle may
 * aggregate over (matrix row "Chart toggle": disabled when the underlying
 * numeric field is not governed/populated) -- kinds with no numeric column
 * declare `chartable: false` so the toggle never appears for them.
 */
import type { GovernedKnowledgeProvider } from "@/lib/knowledge/providers/governed-knowledge-provider";
import type { ConsumptionEnvelope } from "@/lib/knowledge/providers/types";
import type { ExploreInventoryKind } from "@/lib/knowledge/providers/read-models";

export type InventoryCell = string | number | null;
export type InventoryRecord = Record<string, InventoryCell>;

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
    provider: GovernedKnowledgeProvider,
    ctx: Parameters<GovernedKnowledgeProvider["listApplications"]>[0],
  ): Promise<ConsumptionEnvelope<readonly InventoryRecord[]>>;
}

function mapEnvelope<T>(
  envelope: ConsumptionEnvelope<readonly T[]>,
  toRecord: (row: T) => InventoryRecord,
): ConsumptionEnvelope<readonly InventoryRecord[]> {
  return {
    ...envelope,
    data: envelope.data ? envelope.data.map(toRecord) : null,
  };
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
      {
        key: "applicationType",
        label: "Function",
        align: "left",
        numeric: false,
      },
      { key: "owner", label: "Owner", align: "left", numeric: false },
      {
        key: "lifecycleState",
        label: "Lifecycle",
        align: "left",
        numeric: false,
      },
      { key: "domain", label: "Domain", align: "left", numeric: false },
      {
        key: "readinessState",
        label: "Readiness",
        align: "left",
        numeric: false,
      },
    ],
    facets: [
      {
        key: "lifecycleState",
        label: "Lifecycle",
        options: ["Retain", "Supported", "Emerging"],
      },
      {
        key: "readinessState",
        label: "Readiness",
        options: [
          "Accepted",
          "Awaiting review",
          "Sources disagree",
          "Needs refresh",
          "Owner not assigned",
        ],
      },
    ],
    fetch: async (provider, ctx) =>
      mapEnvelope(await provider.listApplications(ctx), (row) => ({
        name: row.name,
        applicationType: row.applicationType,
        owner: row.owner ?? "Owner not assigned",
        lifecycleState: row.lifecycleState,
        domain: row.domain,
        readinessState: "Not yet captured",
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
      { key: "domain", label: "Domain", align: "left", numeric: false },
      { key: "steward", label: "Steward", align: "left", numeric: false },
      {
        key: "certificationState",
        label: "Certification",
        align: "left",
        numeric: false,
      },
      {
        key: "sensitivity",
        label: "Sensitivity",
        align: "left",
        numeric: false,
      },
      {
        key: "consumerCount",
        label: "Consumers",
        align: "right",
        numeric: true,
      },
      {
        key: "refreshCadence",
        label: "Refresh",
        align: "left",
        numeric: false,
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
        key: "certificationState",
        label: "Certification",
        options: ["certified", "provisional", "uncertified"],
      },
    ],
    fetch: async (provider, ctx) =>
      mapEnvelope(await provider.listDataProducts(ctx), (row) => ({
        name: row.name,
        domain: row.domain,
        steward: row.steward ?? "Owner not assigned",
        certificationState: row.certificationState,
        sensitivity: row.sensitivity,
        consumerCount: row.consumerCount,
        refreshCadence: row.refreshCadence ?? "Not loaded",
        readinessState: row.readinessState,
      })),
  },
  {
    kind: "integrations",
    label: "Integrations",
    domainId: "tech",
    primaryKey: "name",
    chartable: true,
    readinessKey: "readinessState",
    columns: [
      { key: "name", label: "Integration", align: "left", numeric: false },
      { key: "sourceSystem", label: "Source", align: "left", numeric: false },
      { key: "targetSystem", label: "Target", align: "left", numeric: false },
      { key: "pattern", label: "Pattern", align: "left", numeric: false },
      {
        key: "criticality",
        label: "Criticality",
        align: "left",
        numeric: false,
      },
      {
        key: "messagesPerDay",
        label: "Messages / day",
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
        key: "pattern",
        label: "Pattern",
        options: ["api", "batch", "streaming"],
      },
    ],
    fetch: async (provider, ctx) =>
      mapEnvelope(await provider.listIntegrations(ctx), (row) => ({
        name: row.name,
        sourceSystem: row.sourceSystem,
        targetSystem: row.targetSystem,
        pattern: row.pattern,
        criticality: row.criticality,
        messagesPerDay: row.messagesPerDay,
        readinessState: row.readinessState,
      })),
  },
  {
    kind: "infrastructure",
    label: "Infrastructure and cloud",
    domainId: "tech",
    primaryKey: "name",
    chartable: true,
    readinessKey: "readinessState",
    columns: [
      { key: "name", label: "Platform", align: "left", numeric: false },
      { key: "owner", label: "Owner", align: "left", numeric: false },
      { key: "hostingModel", label: "Model", align: "left", numeric: false },
      {
        key: "criticality",
        label: "Criticality",
        align: "left",
        numeric: false,
      },
      {
        key: "runCostThousands",
        label: "Run cost $K",
        align: "right",
        numeric: true,
      },
      {
        key: "recoveryObjective",
        label: "Recovery objective",
        align: "left",
        numeric: false,
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
        key: "hostingModel",
        label: "Model",
        options: ["public_cloud", "vendor_hosted", "on_prem", "hybrid"],
      },
    ],
    fetch: async (provider, ctx) =>
      mapEnvelope(await provider.listInfrastructure(ctx), (row) => ({
        name: row.name,
        owner: row.owner ?? "Owner not assigned",
        hostingModel: row.hostingModel,
        criticality: row.criticality,
        runCostThousands: row.runCostThousands,
        recoveryObjective: row.recoveryObjective ?? "Not set",
        readinessState: row.readinessState,
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
        label: "Committed $K",
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
    fetch: async (provider, ctx) =>
      mapEnvelope(await provider.listVendorContracts(ctx), (row) => ({
        vendorName: row.vendorName,
        category: row.category,
        annualSpend: row.annualSpend,
        readinessState: "Not yet captured",
      })),
  },
  {
    kind: "programs",
    label: "Programmes",
    domainId: "risk",
    primaryKey: "name",
    chartable: true,
    readinessKey: "readinessState",
    columns: [
      { key: "name", label: "Programme", align: "left", numeric: false },
      {
        key: "executiveOwner",
        label: "Executive owner",
        align: "left",
        numeric: false,
      },
      { key: "stage", label: "Stage", align: "left", numeric: false },
      {
        key: "fundedThousands",
        label: "Funded $K",
        align: "right",
        numeric: true,
      },
      {
        key: "outcomeBaselineState",
        label: "Outcome baseline",
        align: "left",
        numeric: false,
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
        key: "stage",
        label: "Stage",
        options: ["proposed", "planning", "funded", "execution"],
      },
    ],
    fetch: async (provider, ctx) =>
      mapEnvelope(await provider.listPrograms(ctx), (row) => ({
        name: row.name,
        executiveOwner: row.executiveOwner,
        stage: row.stage,
        fundedThousands: row.fundedThousands,
        outcomeBaselineState: row.outcomeBaselineState,
        readinessState: row.readinessState,
      })),
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
      { key: "owner", label: "Owner", align: "left", numeric: false },
      { key: "severity", label: "Severity", align: "left", numeric: false },
      {
        key: "controlState",
        label: "Control state",
        align: "left",
        numeric: false,
      },
      { key: "controlCount", label: "Controls", align: "right", numeric: true },
      {
        key: "lastTestedDate",
        label: "Last tested",
        align: "left",
        numeric: false,
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
        key: "severity",
        label: "Severity",
        options: ["critical", "high", "medium"],
      },
    ],
    fetch: async (provider, ctx) =>
      mapEnvelope(await provider.listRisks(ctx), (row) => ({
        title: row.title,
        owner: row.owner ?? "Owner not assigned",
        severity: row.severity,
        controlState: row.controlState,
        controlCount: row.controlCount,
        lastTestedDate: row.lastTestedDate ?? "Never",
        readinessState: row.readinessState,
      })),
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
      { key: "owner", label: "Owner", align: "left", numeric: false },
      { key: "currentValue", label: "Current", align: "left", numeric: false },
      { key: "targetValue", label: "Target", align: "left", numeric: false },
      {
        key: "disclosureLevel",
        label: "Disclosure",
        align: "left",
        numeric: false,
      },
      { key: "observedDate", label: "Observed", align: "left", numeric: false },
      {
        key: "readinessState",
        label: "Readiness",
        align: "left",
        numeric: false,
      },
    ],
    facets: [
      {
        key: "disclosureLevel",
        label: "Disclosure",
        options: ["board", "operational"],
      },
    ],
    fetch: async (provider, ctx) =>
      mapEnvelope(await provider.listMeasures(ctx), (row) => ({
        name: row.name,
        owner: row.owner,
        currentValue: row.currentValue ?? "Not measured",
        targetValue: row.targetValue ?? "Not set",
        disclosureLevel: row.disclosureLevel,
        observedDate: row.observedDate ?? "-",
        readinessState: row.readinessState,
      })),
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
