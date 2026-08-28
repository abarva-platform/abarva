import type { AskSurfaceContext } from "@/lib/intelligence/ask/types";
import type {
  AvaArtifact,
  AvaCaveat,
  AvaCitation,
  AvaFactRef,
  AvaMetricRef,
  AvaNextStep,
  AvaRelationshipRef,
} from "@/lib/ava-answer/contract";

interface SourceWorkspaceVisualAnswer {
  directAnswer: string;
  artifacts: AvaArtifact[];
  citations: AvaCitation[];
  factsUsed: AvaFactRef[];
  metricsUsed: AvaMetricRef[];
  relationshipsUsed: AvaRelationshipRef[];
  caveats: AvaCaveat[];
  nextSteps: AvaNextStep[];
}

interface SourceContractContext {
  contractId: string;
  vendorName: string;
  contractName: string;
  annualValueUsd: number | null;
  actualAnnualSpendUsd: number | null;
  totalCommittedValueUsd: number | null;
  contractedToActualVarianceUsd: number | null;
  endDate: string | null;
  noticeDate: string | null;
  autoRenew: boolean | null;
  renewalOwnerRef: string | null;
  scopeSummary: string | null;
  scopeRowCount: number | null;
}

interface SourceLedgerLine {
  id: string;
  kind: string;
  label: string;
  amount: string;
  amountUsd: number | null;
  state: string;
  evidenceClass: string;
  evidence: string;
  nextAction: string;
  sourceRefs: string[];
}

interface SourceOpportunityLine {
  id: string;
  kind: string;
  label: string;
  amount: string;
  amountUsd: number | null;
  state: string;
  evidenceClass: string;
  evidence: string;
  nextAction: string;
  owner: string | null;
  sourceRefs: string[];
}

interface SourceConnection {
  id: string;
  sourceSystem: string;
  ledgers: string[];
  extract: string;
  fields: string[];
  outcome: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function booleanValue(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => stringValue(item))
    .filter((item): item is string => Boolean(item));
}

function sourceV4(context: AskSurfaceContext): Record<string, unknown> | null {
  const raw = (context as { sourceV4?: unknown }).sourceV4;
  return isRecord(raw) ? raw : null;
}

function selectedContractFrom(
  context: AskSurfaceContext,
): SourceContractContext | null {
  const source = sourceV4(context);
  const raw = isRecord(source?.selectedContract)
    ? source.selectedContract
    : null;
  if (!raw) return null;
  const contractId = stringValue(raw.contractId);
  const vendorName = stringValue(raw.vendorName);
  const contractName = stringValue(raw.contractName);
  if (!contractId || !vendorName || !contractName) return null;
  return {
    contractId,
    vendorName,
    contractName,
    annualValueUsd: numberValue(raw.annualValueUsd),
    actualAnnualSpendUsd: numberValue(raw.actualAnnualSpendUsd),
    totalCommittedValueUsd: numberValue(raw.totalCommittedValueUsd),
    contractedToActualVarianceUsd: numberValue(
      raw.contractedToActualVarianceUsd,
    ),
    endDate: stringValue(raw.endDate),
    noticeDate: stringValue(raw.noticeDate),
    autoRenew: booleanValue(raw.autoRenew),
    renewalOwnerRef: stringValue(raw.renewalOwnerRef),
    scopeSummary: stringValue(raw.scopeSummary),
    scopeRowCount: numberValue(raw.scopeRowCount),
  };
}

function ledgerLinesFrom(context: AskSurfaceContext): SourceLedgerLine[] {
  const source = sourceV4(context);
  const ledger = isRecord(source?.optimizationLedger)
    ? source.optimizationLedger
    : null;
  const rawLines = Array.isArray(ledger?.lines) ? ledger.lines : [];
  return rawLines
    .flatMap((line): SourceLedgerLine[] => {
      if (!isRecord(line)) return [];
      const id = stringValue(line.id);
      const kind = stringValue(line.kind);
      const label = stringValue(line.label);
      if (!id || !kind || !label) return [];
      return [
        {
          id,
          kind,
          label,
          amount: stringValue(line.amount) ?? "Not established",
          amountUsd: numberValue(line.amountUsd),
          state: stringValue(line.state) ?? "Not established",
          evidenceClass: stringValue(line.evidenceClass) ?? "Not established",
          evidence: stringValue(line.evidence) ?? "No evidence note supplied.",
          nextAction: stringValue(line.nextAction) ?? "Confirm evidence owner.",
          sourceRefs: stringArray(line.sourceRefs),
        },
      ];
    })
    .slice(0, 8);
}

function opportunityLinesFrom(
  context: AskSurfaceContext,
): SourceOpportunityLine[] {
  const source = sourceV4(context);
  const opportunities = isRecord(source?.optimizationOpportunities)
    ? source.optimizationOpportunities
    : null;
  const rawOpportunities = Array.isArray(opportunities?.opportunities)
    ? opportunities.opportunities
    : [];
  const mapped = rawOpportunities.flatMap(
    (opportunity): SourceOpportunityLine[] => {
      if (!isRecord(opportunity)) return [];
      const id = stringValue(opportunity.id);
      const label = stringValue(opportunity.label);
      if (!id || !label) return [];
      return [
        {
          id,
          kind: stringValue(opportunity.valueType) ?? "commercial_opportunity",
          label,
          amount: stringValue(opportunity.amount) ?? "Not established",
          amountUsd: numberValue(opportunity.amountUsd),
          state:
            stringValue(opportunity.stageRaw) ??
            stringValue(opportunity.stage) ??
            "Not established",
          evidenceClass: stringValue(opportunity.grade) ?? "Not established",
          evidence:
            stringValue(opportunity.blockingGap) ??
            "Governed Source opportunity row with calculation and evidence references.",
          nextAction:
            stringValue(opportunity.nextAction) ??
            "Confirm evidence owner and decision path.",
          owner: stringValue(opportunity.owner),
          sourceRefs: stringArray(opportunity.sourceRefs),
        },
      ];
    },
  );
  if (mapped.length > 0) return mapped.slice(0, 8);
  return ledgerLinesFrom(context).map((line) => ({
    ...line,
    owner: null,
  }));
}

function connectionsFrom(context: AskSurfaceContext): SourceConnection[] {
  const source = sourceV4(context);
  const spine = isRecord(source?.optimizationSpine)
    ? source.optimizationSpine
    : null;
  const rawConnections = Array.isArray(spine?.sourceConnections)
    ? spine.sourceConnections
    : [];
  return rawConnections
    .flatMap((connection): SourceConnection[] => {
      if (!isRecord(connection)) return [];
      const id = stringValue(connection.id);
      const sourceSystem = stringValue(connection.sourceSystem);
      if (!id || !sourceSystem) return [];
      return [
        {
          id,
          sourceSystem,
          ledgers: stringArray(connection.ledgers),
          extract: stringValue(connection.extract) ?? "Governed extract",
          fields: stringArray(connection.fields).slice(0, 6),
          outcome:
            stringValue(connection.outcome) ?? "Supports evidence review.",
        },
      ];
    })
    .slice(0, 6);
}

function wantsSourceVisualAnswer(query: string): boolean {
  return /\b(chart|visual|graph|relationship|table|tabular|ledger|evidence|source systems?|where.*data|contract context|outside[-\s]?in|industry|actionable|actionability|why.*action|optimi[sz]e|opportunit(?:y|ies)|claim value|claim savings|realized? value|what.*missing|missing.*before|before.*claim)\b/i.test(
    query,
  );
}

export function canBuildSourceWorkspaceVisualAnswer(input: {
  query: string;
  surfaceContext?: AskSurfaceContext | null;
}): boolean {
  const context = input.surfaceContext;
  return Boolean(
    context &&
    stringValue(context.module)?.toLowerCase() === "source" &&
    wantsSourceVisualAnswer(input.query) &&
    selectedContractFrom(context),
  );
}

function currencyLabel(value: number | null): string {
  if (value == null) return "Not established";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000_000)
    return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

function opportunityClassName(kind: string): string {
  return kind
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function buildOpportunityRows(lines: SourceOpportunityLine[]) {
  return lines.map((line) => ({
    class: opportunityClassName(line.kind),
    opportunity: line.label,
    value: line.amountUsd == null ? line.amount : currencyLabel(line.amountUsd),
    valueUsd: line.amountUsd,
    state: line.state,
    evidence: line.evidenceClass,
    owner: line.owner ?? "Not established",
    sourceRefs: line.sourceRefs.join(", ") || "Not established",
    nextAction: line.nextAction,
  }));
}

export function buildSourceWorkspaceVisualAnswer(input: {
  query: string;
  surfaceContext: AskSurfaceContext;
}): SourceWorkspaceVisualAnswer | null {
  const contract = selectedContractFrom(input.surfaceContext);
  if (!contract) return null;
  const lines = opportunityLinesFrom(input.surfaceContext);
  const connections = connectionsFrom(input.surfaceContext);
  if (lines.length === 0 && connections.length === 0) return null;

  const contractCitationId = "source-contract-context";
  const opportunityCitationId = "source-opportunity-context";
  const graphCitationId = "source-relationship-context";
  const outsideInCitationId = "outside-in-pattern-context";
  const citations: AvaCitation[] = [
    {
      id: contractCitationId,
      label: `${contract.vendorName} ${contract.contractName}`,
      sourceClass: "tenant-fact",
      recordId: contract.contractId,
      excerpt:
        "Selected contract facts come from the governed Source Contract 360 surface context.",
      confidence: "high",
    },
    {
      id: opportunityCitationId,
      label: "Atomic commercial opportunity evidence",
      sourceClass: "tenant-fact",
      recordId: contract.contractId,
      excerpt:
        "Opportunity values, evidence states, source references, and next actions are read from the current governed Source opportunity set.",
      confidence: lines.some((line) => line.amountUsd != null)
        ? "high"
        : "medium",
    },
    {
      id: graphCitationId,
      label: "Source-system evidence map",
      sourceClass: "graph",
      recordId: contract.contractId,
      excerpt:
        "Source-system connections map the contract to CLM, AP/ERP, ITSM, usage, procurement, and finance evidence classes.",
      confidence: connections.length > 0 ? "high" : "medium",
    },
    {
      id: outsideInCitationId,
      label: "Outside-in sourcing pattern",
      sourceClass: "worldview",
      excerpt:
        "Outside-in guidance is treated as negotiation pattern context only; it does not certify tenant value.",
      confidence: "medium",
    },
  ];

  const opportunityRows = buildOpportunityRows(lines);
  const numericRows = opportunityRows
    .filter((row) => typeof row.valueUsd === "number")
    .map((row) => ({
      opportunity: row.opportunity,
      valueUsd: row.valueUsd as number,
      state: row.state,
    }));

  const artifacts: AvaArtifact[] = [
    {
      artifact: "table",
      id: "source-contract-opportunity-table",
      title: "Contract Commercial Opportunities",
      columns: [
        { key: "class", label: "Class" },
        { key: "opportunity", label: "Opportunity" },
        { key: "value", label: "Value", format: "currency", align: "right" },
        { key: "state", label: "State" },
        { key: "evidence", label: "Evidence" },
        { key: "owner", label: "Owner" },
        { key: "sourceRefs", label: "Source refs" },
        { key: "nextAction", label: "Next action" },
      ],
      rows: opportunityRows.map((row) => ({
        class: row.class,
        opportunity: row.opportunity,
        value: row.value,
        state: row.state,
        evidence: row.evidence,
        owner: row.owner,
        sourceRefs: row.sourceRefs,
        nextAction: row.nextAction,
      })),
      note: "Rows are governed Source opportunity rows. Missing evidence remains explicit and is not converted to zero.",
      citationIds: [opportunityCitationId],
    },
    {
      artifact: "graph",
      id: "source-contract-evidence-relationship-graph",
      title: "Contract Evidence Relationship",
      nodes: [
        {
          id: "contract",
          label: `${contract.contractId}\n${contract.vendorName}`,
          kind: "contract",
        },
        {
          id: "scope",
          label: `Scope\n${contract.scopeRowCount ?? 0} rows`,
          kind: "scope",
        },
        ...connections.map((connection) => ({
          id: `source-${connection.id}`,
          label: connection.sourceSystem,
          kind: "source system",
        })),
        {
          id: "opportunities",
          label: "Commercial opportunities",
          kind: "opportunity set",
        },
        { id: "door1", label: "Door 1 action", kind: "workflow" },
      ],
      edges: [
        { from: "contract", to: "scope", label: "defines scope" },
        ...connections.map((connection) => ({
          from: `source-${connection.id}`,
          to: "opportunities",
          label: connection.ledgers.join(", ") || "feeds evidence",
        })),
        { from: "contract", to: "opportunities", label: "anchors values" },
        { from: "opportunities", to: "door1", label: "gates action" },
      ],
      citationIds: [contractCitationId, graphCitationId],
    },
  ];

  if (numericRows.length >= 2) {
    artifacts.splice(1, 0, {
      artifact: "chart",
      id: "source-contract-opportunity-value-chart",
      kind: "horizontal-bar",
      title: "Commercial Opportunities With Quantified Evidence",
      subtitle: "Only numeric, governed opportunity values are plotted.",
      data: {
        type: "horizontal-bar",
        data: numericRows,
        xKey: "opportunity",
        yKey: "valueUsd",
        unit: "USD",
        note: "Chart excludes opportunities without a governed numeric value rather than rendering them as zero.",
      },
      builder: "inlineChart",
      xKey: "opportunity",
      yKey: "valueUsd",
      unit: "USD",
      sourceNote:
        "Numeric values come from governed Source opportunity rows for the selected contract.",
      citationIds: [opportunityCitationId],
    });
  }

  const evidenceReadyCount = lines.filter((line) =>
    /quantified|validated|evidenced/i.test(
      `${line.state} ${line.evidenceClass}`,
    ),
  ).length;
  const gapCount = lines.filter((line) =>
    /baseline_conflict|evidence_required|workflow_required|missing|needs evidence|not established|requires_/i.test(
      `${line.state} ${line.evidenceClass} ${line.nextAction}`,
    ),
  ).length;
  const quantified = numericRows.length;

  return {
    directAnswer:
      `${contract.vendorName} ${contract.contractName} (${contract.contractId}) is ready for an evidence-led optimization conversation when the opportunity rows below are visible: ${quantified} commercial opportunity line(s) carry governed numeric values, ${evidenceReadyCount} line(s) are evidence-ready, and ${gapCount} line(s) still require explicit workflow, review, or evidence if shown. ` +
      `The outside-in pattern is advisory only: for large enterprise software and managed-service renewals, the strongest negotiation story usually combines contract terms, AP/ERP invoice proof, SLA/service-credit proof, usage or entitlement data, and a finance-confirmed value gate. It should guide the ask, not replace Source/Tower evidence.`,
    artifacts,
    citations,
    factsUsed: [
      {
        id: "selected-contract",
        label: "Selected contract",
        value: `${contract.contractId} ${contract.vendorName}`,
        citationIds: [contractCitationId],
      },
      {
        id: "contract-scope-summary",
        label: "Scope summary",
        value: contract.scopeSummary,
        citationIds: [contractCitationId],
      },
    ],
    metricsUsed: [
      {
        id: "annual-value",
        label: "Annual contract value",
        value: contract.annualValueUsd ?? "Not established",
        unit: contract.annualValueUsd == null ? undefined : "USD",
        citationIds: [contractCitationId],
      },
      {
        id: "actual-annual-spend",
        label: "Actual annual spend",
        value: contract.actualAnnualSpendUsd ?? "Not established",
        unit: contract.actualAnnualSpendUsd == null ? undefined : "USD",
        citationIds: [contractCitationId],
      },
    ],
    relationshipsUsed: connections.map((connection) => ({
      id: connection.id,
      label: `${connection.sourceSystem} feeds ${connection.ledgers.join(", ") || "contract evidence"}`,
      fromLabel: connection.sourceSystem,
      toLabel: "Commercial opportunity evidence",
      relationshipType: "feeds_evidence",
      citationIds: [graphCitationId],
    })),
    caveats: [
      {
        id: "outside-in-boundary",
        label: "Outside-in boundary",
        detail:
          "Industry context is pattern guidance only. It cannot create recoverable leakage, avoided future spend, negotiated improvement, or finance-confirmed value without governed evidence.",
      },
      ...(numericRows.length < 2
        ? [
            {
              id: "chart-evidence-threshold",
              label: "Chart threshold",
              detail:
                "An opportunity chart was withheld because fewer than two governed numeric opportunity values are available.",
            },
          ]
        : []),
    ],
    nextSteps: [
      {
        id: "door1",
        label: "Open Door 1 with the current evidence pack",
        rationale:
          "Use the table and relationship graph as the starting packet for baseline, diagnosis, levers, approval, and finance proof.",
        targetSurface: "source",
      },
    ],
  };
}
