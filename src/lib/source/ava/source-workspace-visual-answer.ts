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
  noticePeriodDays: number | null;
  autoRenew: boolean | null;
  renewalOwnerRef: string | null;
  scopeSummary: string | null;
  scopeRowCount: number | null;
  performanceObservationCount: number | null;
  documentExtractionCount: number | null;
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
  stage: string;
  confidence: string;
  evidenceClass: string;
  evidenceGrade: string;
  evidence: string;
  blockingGap: string;
  nextAction: string;
  owner: string | null;
  sourceRefs: string[];
  buyerAsk: string | null;
  negotiationLanguage: string | null;
  vendorConcession: string | null;
  timingDependency: string | null;
  priority: string | null;
  riskIfIgnored: string | null;
}

interface SourceConnection {
  id: string;
  sourceSystem: string;
  ledgers: string[];
  extract: string;
  fields: string[];
  outcome: string;
}

interface SourceCommercialPostureLine {
  label: string;
  value: string;
  detail: string;
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
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/,/g, "");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
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

function publicEvidenceLabel(value: string | null | undefined): string | null {
  const text = stringValue(value);
  if (!text) return null;
  const normalized = text.toLowerCase().replace(/[_-]+/g, " ");
  if (normalized.includes("performance") || normalized.includes("sla")) {
    return "SLA performance history";
  }
  if (normalized.includes("spend monthly") || normalized.includes("spend")) {
    return "Monthly spend history";
  }
  if (normalized.includes("opportunity")) return "Opportunity evidence";
  if (normalized.includes("contract scope")) return "Contract scope evidence";
  if (normalized.includes("contract 360")) return "Contract record evidence";
  if (normalized.includes("invoice")) return "Invoice detail";
  if (normalized.includes("usage") || normalized.includes("entitlement")) {
    return "Usage and entitlement evidence";
  }
  if (normalized.includes("clause")) return "Contract clause evidence";
  if (normalized.includes("pricing") || normalized.includes("rate card")) {
    return "Pricing schedule evidence";
  }
  if (normalized.includes("finance")) return "Finance confirmation evidence";
  if (normalized.includes("reconciliation")) return "Reconciliation evidence";
  if (/^(source|consumption)\./i.test(text) || /_v\d+\b/i.test(text)) {
    return null;
  }
  return text
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function countNestedRows(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    return Number(value.trim());
  }
  if (!isRecord(value)) return null;
  const nested = Object.values(value)
    .map(countNestedRows)
    .filter((count): count is number => count != null);
  if (nested.length === 0) return null;
  return nested.reduce((total, count) => total + count, 0);
}

function publicEvidenceRefs(value: unknown): string[] {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(value.flatMap((item) => publicEvidenceRefs(item))),
    );
  }
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return [];
    if (text.startsWith("{") || text.startsWith("[")) {
      try {
        return publicEvidenceRefs(JSON.parse(text));
      } catch {
        return [];
      }
    }
    const label = publicEvidenceLabel(text);
    return label ? [label] : [];
  }
  if (!isRecord(value)) return [];

  const refs: string[] = [];
  if (stringValue(value.contract_ref) ?? stringValue(value["Contract Ref"])) {
    refs.push("Contract record");
  }
  if (
    stringValue(value.opportunity_ref) ??
    stringValue(value["Opportunity Ref"])
  ) {
    refs.push("Opportunity record");
  }
  const financeState =
    stringValue(value.finance_confirmation_state) ??
    stringValue(value["Finance Confirmation State"]);
  if (financeState) {
    refs.push(
      financeState.toLowerCase().includes("confirmed") &&
        !financeState.toLowerCase().includes("not")
        ? "Finance confirmation complete"
        : "Finance confirmation not complete",
    );
  }
  const coverage = isRecord(value.evidence_coverage)
    ? value.evidence_coverage
    : isRecord(value["Evidence Coverage"])
      ? value["Evidence Coverage"]
      : null;
  if (coverage) {
    for (const [key, rawCount] of Object.entries(coverage)) {
      const label = publicEvidenceLabel(key);
      const rowCount = countNestedRows(rawCount);
      if (label && rowCount != null && rowCount > 0) {
        refs.push(`${label}: ${rowCount} rows`);
      }
    }
  }
  return Array.from(new Set(refs));
}

function sourceV4(context: AskSurfaceContext): Record<string, unknown> | null {
  const raw = (context as { sourceV4?: unknown }).sourceV4;
  return isRecord(raw) ? raw : null;
}

function lineMatchesContract(
  line: Record<string, unknown>,
  contractId: string | null | undefined,
): boolean {
  if (!contractId) return true;
  const expected = contractId.toUpperCase();
  const explicit = stringValue(line.contractId)?.toUpperCase();
  if (explicit) return explicit === expected;
  return Boolean(
    stringValue(line.id)?.toUpperCase().startsWith(`${expected}:`) ||
    stringValue(line.opportunityId)?.toUpperCase().startsWith(`${expected}:`),
  );
}

function contractIdFromQuery(query: string): string | null {
  const match = query.match(/\b(?:CTR|MER)(?:-[A-Z0-9]+)+\b/i);
  return match ? match[0].toUpperCase() : null;
}

function contractContextFromRecord(
  raw: Record<string, unknown>,
): SourceContractContext | null {
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
    noticePeriodDays: numberValue(raw.noticePeriodDays),
    autoRenew: booleanValue(raw.autoRenew),
    renewalOwnerRef: stringValue(raw.renewalOwnerRef),
    scopeSummary: stringValue(raw.scopeSummary),
    scopeRowCount: numberValue(raw.scopeRowCount),
    performanceObservationCount: numberValue(raw.performanceObservationCount),
    documentExtractionCount: numberValue(raw.documentExtractionCount),
  };
}

function directContractContextFrom(
  context: AskSurfaceContext,
): SourceContractContext | null {
  if (context.sourceContract360Mode !== true) return null;
  const contractId = stringValue(context.contractId);
  if (!contractId) return null;

  return {
    contractId,
    vendorName: stringValue(context.vendorName) ?? "Requested contract",
    contractName: stringValue(context.contractName) ?? "Contract 360 record",
    annualValueUsd: numberValue(context.annualValue),
    actualAnnualSpendUsd: numberValue(context.actualAnnualSpend),
    totalCommittedValueUsd: null,
    contractedToActualVarianceUsd: null,
    endDate: stringValue(context.endDate),
    noticeDate: null,
    noticePeriodDays: null,
    autoRenew: null,
    renewalOwnerRef: null,
    scopeSummary: stringValue(context.evidencePosture),
    scopeRowCount: null,
    performanceObservationCount: null,
    documentExtractionCount: null,
  };
}

function selectedContractFrom(
  context: AskSurfaceContext,
  query?: string,
): SourceContractContext | null {
  const direct = directContractContextFrom(context);
  const source = sourceV4(context);
  const raw = isRecord(source?.selectedContract)
    ? source.selectedContract
    : null;
  const selected = raw ? contractContextFromRecord(raw) : null;
  const requestedContractId = query ? contractIdFromQuery(query) : null;
  if (
    direct &&
    (!requestedContractId ||
      direct.contractId.toUpperCase() === requestedContractId)
  ) {
    if (
      selected &&
      selected.contractId.toUpperCase() === direct.contractId.toUpperCase()
    ) {
      return {
        ...selected,
        contractId: direct.contractId,
        vendorName: direct.vendorName,
        contractName: direct.contractName,
        annualValueUsd: direct.annualValueUsd ?? selected.annualValueUsd,
        actualAnnualSpendUsd:
          direct.actualAnnualSpendUsd ?? selected.actualAnnualSpendUsd,
        totalCommittedValueUsd:
          direct.totalCommittedValueUsd ?? selected.totalCommittedValueUsd,
        contractedToActualVarianceUsd:
          direct.contractedToActualVarianceUsd ??
          selected.contractedToActualVarianceUsd,
        endDate: direct.endDate ?? selected.endDate,
        noticeDate: direct.noticeDate ?? selected.noticeDate,
        noticePeriodDays: direct.noticePeriodDays ?? selected.noticePeriodDays,
        autoRenew: direct.autoRenew ?? selected.autoRenew,
        renewalOwnerRef: direct.renewalOwnerRef ?? selected.renewalOwnerRef,
        scopeSummary: selected.scopeSummary ?? direct.scopeSummary,
      };
    }
    return direct;
  }
  if (
    selected &&
    (!requestedContractId ||
      selected.contractId.toUpperCase() === requestedContractId)
  ) {
    return selected;
  }
  const directory = Array.isArray(source?.contractDirectory)
    ? source.contractDirectory
    : [];
  const directoryMatch = directory.find(
    (item) =>
      isRecord(item) &&
      stringValue(item.contractId)?.toUpperCase() === requestedContractId,
  );
  if (isRecord(directoryMatch))
    return contractContextFromRecord(directoryMatch);
  const opportunityMatch = requestedContractId
    ? contractContextFromOpportunityRows(source, requestedContractId)
    : null;
  if (opportunityMatch) return opportunityMatch;
  if (requestedContractId) return null;
  return selected;
}

function contractContextFromOpportunityRows(
  source: Record<string, unknown> | null,
  contractId: string,
): SourceContractContext | null {
  const opportunities = isRecord(source?.optimizationOpportunities)
    ? source.optimizationOpportunities
    : null;
  const richRows = Array.isArray(opportunities?.opportunities)
    ? opportunities.opportunities
    : [];
  const directoryRows = Array.isArray(source?.contractOpportunityDirectory)
    ? source.contractOpportunityDirectory
    : [];
  const rows = [...directoryRows, ...richRows];
  const match = rows.find(
    (row) => isRecord(row) && lineMatchesContract(row, contractId),
  );
  if (!isRecord(match)) return null;
  return {
    contractId,
    vendorName: stringValue(match.vendorName) ?? "Selected vendor",
    contractName:
      stringValue(match.contractName) ?? "Contract optimization case",
    annualValueUsd: numberValue(match.annualValueUsd),
    actualAnnualSpendUsd: numberValue(match.actualAnnualSpendUsd),
    totalCommittedValueUsd: numberValue(match.totalCommittedValueUsd),
    contractedToActualVarianceUsd: numberValue(
      match.contractedToActualVarianceUsd,
    ),
    endDate: stringValue(match.endDate),
    noticeDate: stringValue(match.noticeDate),
    noticePeriodDays: numberValue(match.noticePeriodDays),
    autoRenew:
      typeof match.autoRenew === "boolean" ? match.autoRenew : null,
    renewalOwnerRef: stringValue(match.renewalOwnerRef),
    scopeSummary: stringValue(match.scopeSummary),
    scopeRowCount: numberValue(match.scopeRowCount),
    performanceObservationCount: numberValue(
      match.performanceObservationCount,
    ),
    documentExtractionCount: numberValue(match.documentExtractionCount),
  };
}

function buildMissingContractAnswer(
  contractId: string,
): SourceWorkspaceVisualAnswer {
  return {
    directAnswer: `${contractId} is not present in the current Source aVa contract packet, so I cannot answer it with another contract's facts. Open that Contract 360 record or refresh the governed Source context before making an actionability, value, pricing, SLA, or renewal claim for this contract.`,
    artifacts: [],
    citations: [
      {
        id: "source-contract-not-in-packet",
        label: "Current Source aVa contract packet",
        sourceClass: "tenant-fact",
        recordId: contractId,
        excerpt:
          "The named contract ID was requested but was not available in the current Source aVa context.",
        confidence: "high",
      },
    ],
    factsUsed: [
      {
        id: "requested-contract",
        label: "Requested contract",
        value: contractId,
        citationIds: ["source-contract-not-in-packet"],
      },
    ],
    metricsUsed: [],
    relationshipsUsed: [],
    caveats: [
      {
        id: "no-substitute-contract",
        label: "No substitute contract",
        detail:
          "Source aVa must not answer a named-contract question from a different selected or higher-ranked contract.",
      },
    ],
    nextSteps: [
      {
        id: "open-contract",
        label: "Open the named Contract 360 record",
        rationale:
          "Refreshing the Source context around the requested contract is required before citing contract-specific facts.",
        targetSurface: "source",
      },
    ],
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
  contractId?: string | null,
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
      if (!lineMatchesContract(opportunity, contractId)) {
        return [];
      }
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
          stage:
            stringValue(opportunity.stage) ??
            stringValue(opportunity.stageRaw) ??
            "Not established",
          confidence: confidenceLabel(opportunity.confidence),
          evidenceClass: stringValue(opportunity.grade) ?? "Not established",
          evidenceGrade: stringValue(opportunity.grade) ?? "Not established",
          evidence:
            stringValue(opportunity.blockingGap) ??
            "Governed Source opportunity row with calculation and evidence references.",
          blockingGap:
            stringValue(opportunity.blockingGap) ?? "Not established",
          nextAction:
            stringValue(opportunity.nextAction) ??
            "Confirm evidence owner and decision path.",
          owner: stringValue(opportunity.owner),
          sourceRefs: stringArray(opportunity.sourceRefs),
          buyerAsk: stringValue(opportunity.buyerAsk),
          negotiationLanguage: stringValue(opportunity.negotiationLanguage),
          vendorConcession: stringValue(opportunity.vendorConcession),
          timingDependency: stringValue(opportunity.timingDependency),
          priority: stringValue(opportunity.priority),
          riskIfIgnored: stringValue(opportunity.riskIfIgnored),
        },
      ];
    },
  );
  const directory = Array.isArray(source?.contractOpportunityDirectory)
    ? source.contractOpportunityDirectory
    : [];
  const directoryLines = directory.flatMap((line): SourceOpportunityLine[] => {
    if (!isRecord(line)) return [];
    if (!lineMatchesContract(line, contractId)) {
      return [];
    }
    const id = stringValue(line.id);
    const label = stringValue(line.label);
    if (!id || !label) return [];
    return [
      {
        id,
        kind: "commercial_opportunity",
        label,
        amount:
          numberValue(line.amountUsd) == null
            ? "Not established"
            : currencyLabel(numberValue(line.amountUsd)),
        amountUsd: numberValue(line.amountUsd),
        state: stringValue(line.state) ?? "Not established",
        stage:
          stringValue(line.stage) ??
          stringValue(line.stageRaw) ??
          stringValue(line.state) ??
          "Not established",
        confidence: confidenceLabel(line.confidence),
        evidenceClass: stringValue(line.evidenceClass) ?? "Not established",
        evidenceGrade:
          stringValue(line.evidenceGrade) ??
          stringValue(line.grade) ??
          stringValue(line.evidenceClass) ??
          "Not established",
        evidence:
          "Governed Source action-candidate row tied to the named contract.",
        blockingGap: stringValue(line.blockingGap) ?? "Not established",
        nextAction:
          stringValue(line.nextAction) ??
          "Confirm evidence owner and decision path.",
        owner: null,
        sourceRefs: stringArray(line.sourceRefs),
        buyerAsk: stringValue(line.buyerAsk),
        negotiationLanguage: stringValue(line.negotiationLanguage),
        vendorConcession: stringValue(line.vendorConcession),
        timingDependency: stringValue(line.timingDependency),
        priority: stringValue(line.priority),
        riskIfIgnored: stringValue(line.riskIfIgnored),
      },
    ];
  });
  if (mapped.length > 0) return mapped.slice(0, 8);
  if (directoryLines.length > 0) return directoryLines.slice(0, 8);
  return ledgerLinesFrom(context)
    .filter(
      (line) =>
        !contractId || line.id.toUpperCase().includes(contractId.toUpperCase()),
    )
    .map((line) => ({
      ...line,
      stage: line.state,
      confidence: "Not established",
      evidenceGrade: line.evidenceClass,
      blockingGap: line.evidence,
      owner: null,
      buyerAsk: null,
      negotiationLanguage: null,
      vendorConcession: null,
      timingDependency: null,
      priority: null,
      riskIfIgnored: null,
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

function commercialPostureLinesFrom(
  context: AskSurfaceContext,
): SourceCommercialPostureLine[] {
  const source = sourceV4(context);
  const posture = isRecord(source?.commercialPosture)
    ? source.commercialPosture
    : null;
  const items = Array.isArray(posture?.items) ? posture.items : [];
  return items
    .flatMap((item): SourceCommercialPostureLine[] => {
      if (!isRecord(item)) return [];
      const label = stringValue(item.label);
      const value = stringValue(item.value);
      if (!label || !value) return [];
      return [
        {
          label,
          value,
          detail:
            stringValue(item.detail) ??
            "No additional posture detail was supplied.",
        },
      ];
    })
    .slice(0, 8);
}

function wantsSourceVisualAnswer(query: string): boolean {
  return /\b(chart|visual|graph|relationship|table|tabular|ledger|evidence|source systems?|where.*data|contract context|contract details?|contract facts?|summari[sz]e|summary|tell me about.*contract|what(?:'s| is).*contract|renewal|notice period|auto[-\s]?renew|annual value|actual spend|vendor|lever(?:s)?|outside[-\s]?in|industry|actionable|actionability|why.*action|optimi[sz]e|opportunit(?:y|ies)|claim value|claim savings|realized? value|what.*missing|missing.*before|before.*claim)\b/i.test(
    query,
  );
}

export function canBuildSourceWorkspaceVisualAnswer(input: {
  query: string;
  surfaceContext?: AskSurfaceContext | null;
}): boolean {
  const context = input.surfaceContext;
  const requestedContractId = contractIdFromQuery(input.query);
  return Boolean(
    context &&
    stringValue(context.module)?.toLowerCase() === "source" &&
    wantsSourceVisualAnswer(input.query) &&
    (selectedContractFrom(context, input.query) || requestedContractId),
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

function confidenceLabel(value: unknown): string {
  const numeric = numberValue(value);
  if (numeric != null) {
    if (numeric >= 0 && numeric <= 1) {
      return `${numeric.toFixed(2)} (${(numeric * 100).toFixed(0)}%)`;
    }
    if (numeric > 1 && numeric <= 100) {
      return `${(numeric / 100).toFixed(2)} (${numeric.toFixed(0)}%)`;
    }
    return numeric.toString();
  }
  return stringValue(value) ?? "Not established";
}

function opportunityClassName(kind: string): string {
  return kind
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function sentenceFragment(value: string): string {
  return value.trim().replace(/[.!?]+$/g, "");
}

function lineCount(value: number): string {
  return `${value} ${value === 1 ? "line" : "lines"}`;
}

function leverCount(value: number): string {
  return `${value} ${value === 1 ? "lever" : "levers"}`;
}

function signalStageClause(value: number): string {
  return `${leverCount(value)} ${value === 1 ? "is" : "are"} signal-stage`;
}

function isSignalStage(stage: string): boolean {
  return /\bsignal\b/i.test(stage);
}

function buildOpportunityRows(lines: SourceOpportunityLine[]) {
  return lines.map((line) => ({
    class: opportunityClassName(line.kind),
    opportunity: line.label,
    value: isSignalStage(line.stage)
      ? "Not sized"
      : line.amountUsd == null
        ? line.amount
        : currencyLabel(line.amountUsd),
    valueUsd: isSignalStage(line.stage) ? null : line.amountUsd,
    state: line.state,
    stage: line.stage,
    confidence: line.confidence,
    evidence: line.evidenceClass,
    evidenceGrade: line.evidenceGrade,
    blockingGap: line.blockingGap,
    owner: line.owner ?? "Not established",
    sourceRefs:
      publicEvidenceRefs(line.sourceRefs).join(", ") || "Not established",
    nextAction: line.nextAction,
  }));
}

function markdownTableCell(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 0
    ? normalized.replace(/\|/g, "\\|")
    : "Not established";
}

function opportunityEvidenceGate(
  row: ReturnType<typeof buildOpportunityRows>[number],
): string {
  const status = isSignalStage(row.stage)
    ? "Signal-stage; not sized until evidence closes"
    : `Stage ${row.stage}`;
  return `${status}; confidence ${row.confidence}; evidence ${row.evidenceGrade}; gate ${sentenceFragment(row.blockingGap)}`;
}

function buildExecutiveLeverTable(
  rows: ReturnType<typeof buildOpportunityRows>,
): string {
  const header =
    "| Lever | Action | Value | Owner | Status / evidence gate |\n| --- | --- | ---: | --- | --- |";
  const body = rows
    .slice(0, 8)
    .map(
      (row) =>
        `| ${markdownTableCell(row.opportunity)} | ${markdownTableCell(
          sentenceFragment(row.nextAction),
        )} | ${markdownTableCell(row.value)} | ${markdownTableCell(
          row.owner,
        )} | ${markdownTableCell(opportunityEvidenceGate(row))} |`,
    )
    .join("\n");
  return `${header}\n${body}`;
}

function wantsContractOptimizationExport(query: string): boolean {
  return (
    /\b(optimi[sz]e|lever(?:s)?|negotiat(?:e|ion|ing)|client\s+sample|pdf|export|memo|report)\b/i.test(
      query,
    ) &&
    !/\b(chart|graph|map|visuali[sz]e|relationship\s+map)\b/i.test(query)
  );
}

function exportEvidenceBasis(line: SourceOpportunityLine): string {
  const refs = publicEvidenceRefs(line.sourceRefs);
  return [
    refs.join(", "),
    line.evidenceGrade,
    line.priority ? `priority ${line.priority}` : null,
  ]
    .filter((part): part is string => Boolean(part?.trim()))
    .join("; ");
}

function isNotSizedLine(line: SourceOpportunityLine): boolean {
  return (
    isSignalStage(line.stage) ||
    line.amountUsd == null ||
    /\bnot\s*sized\b/i.test(line.amount)
  );
}

function exportValueState(line: SourceOpportunityLine): string {
  if (isNotSizedLine(line)) {
    return "Not sized - needs evidence before it carries a number";
  }
  return `${currencyLabel(line.amountUsd)} candidate; not finance-confirmed`;
}

function exportOwnerTiming(line: SourceOpportunityLine): string {
  return [
    line.owner,
    line.timingDependency,
    line.nextAction && !line.timingDependency ? line.nextAction : null,
  ]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(" / ");
}

function exportDoNotClaim(line: SourceOpportunityLine): string {
  return [
    "Do not call this realized or finance-confirmed",
    isNotSizedLine(line)
      ? "do not attach value until the evidence gate is loaded"
      : null,
    line.blockingGap && !/not established/i.test(line.blockingGap)
      ? line.blockingGap
      : null,
    line.riskIfIgnored,
  ]
    .filter((part): part is string => Boolean(part?.trim()))
    .join("; ");
}

function authoredVendorRationale(line: SourceOpportunityLine): string | null {
  const haystack = [
    line.id,
    line.label,
    line.buyerAsk,
    line.negotiationLanguage,
    line.nextAction,
  ]
    .filter(Boolean)
    .join(" ");
  if (/carry[-_\s]?forward|unused/i.test(haystack)) {
    return "Carry-forward preserves the vendor relationship and future revenue while avoiding a forced competitive review over unused first-year capacity.";
  }
  if (/commit[-_\s]?ramp|ramp schedule|re-time/i.test(haystack)) {
    return "The vendor keeps the long-term platform commitment, but the Year 2 drawdown moves to the production pace the buyer can actually consume.";
  }
  if (/support[-_\s]?rebase|support fee/i.test(haystack)) {
    return "The support tier can stay intact while the fee basis follows observed consumption and support demand instead of unused committed capacity.";
  }
  if (/marketplace|private offer|edp/i.test(haystack)) {
    return "Databricks still captures the future commitment while the buyer tests whether private-offer routing improves broader cloud portfolio economics.";
  }
  if (/serverless|classic|compute mode/i.test(haystack)) {
    return "The vendor can preserve committed-discount economics across the migrated workload if the buyer proves the per-SKU serverless and classic comparison first.";
  }
  if (/discount|re[-_\s]?price|pricing band/i.test(haystack)) {
    return "The vendor can evaluate repricing after an accepted comparable is loaded; holding this ask back avoids opening with an unsupported rate demand.";
  }
  return null;
}

function buildOptimizationExportRows(lines: SourceOpportunityLine[]) {
  return lines.slice(0, 8).map((line, index) => ({
    sequence: String(index + 1),
    lever: line.label,
    action:
      [line.buyerAsk, line.negotiationLanguage]
        .filter((part): part is string => Boolean(part?.trim()))
        .join(" ") || line.nextAction,
    vendorRationale:
      line.vendorConcession ??
      authoredVendorRationale(line) ??
      "Not established in the governed opportunity detail.",
    evidenceBasis: exportEvidenceBasis(line) || "Not established",
    valueState: exportValueState(line),
    ownerTiming: exportOwnerTiming(line) || "Not established",
    doNotClaim: exportDoNotClaim(line),
  }));
}

function buildOptimizationExportMarkdownTable(
  rows: ReturnType<typeof buildOptimizationExportRows>,
): string {
  const header = [
    "| Sequence | Lever | Action / buyer ask | Why vendor can agree | Evidence basis | Value state | Owner / timing | What not to claim yet |",
    "| ---: | --- | --- | --- | --- | --- | --- | --- |",
  ].join("\n");
  const body = rows
    .map(
      (row) =>
        `| ${markdownTableCell(row.sequence)} | ${markdownTableCell(row.lever)} | ${markdownTableCell(row.action)} | ${markdownTableCell(row.vendorRationale)} | ${markdownTableCell(row.evidenceBasis)} | ${markdownTableCell(row.valueState)} | ${markdownTableCell(row.ownerTiming)} | ${markdownTableCell(row.doNotClaim)} |`,
    )
    .join("\n");
  return `${header}\n${body}`;
}

export function canBuildSourceContractOptimizationExportAnswer(input: {
  query: string;
  surfaceContext?: AskSurfaceContext | null;
}): boolean {
  const context = input.surfaceContext;
  const requestedContractId = contractIdFromQuery(input.query);
  return Boolean(
    context &&
      stringValue(context.module)?.toLowerCase() === "source" &&
      wantsContractOptimizationExport(input.query) &&
      (selectedContractFrom(context, input.query) || requestedContractId),
  );
}

export function buildSourceContractOptimizationExportAnswer(input: {
  query: string;
  surfaceContext: AskSurfaceContext;
}): SourceWorkspaceVisualAnswer | null {
  const requestedContractId = contractIdFromQuery(input.query);
  const contract = selectedContractFrom(input.surfaceContext, input.query);
  if (!contract) {
    return requestedContractId
      ? buildMissingContractAnswer(requestedContractId)
      : null;
  }

  const lines = opportunityLinesFrom(input.surfaceContext, contract.contractId);
  const rows = buildOptimizationExportRows(lines);
  const sizedRows = lines.filter((line) => !isNotSizedLine(line));
  const signalRows = lines.filter((line) => isNotSizedLine(line));
  const sizedTotalUsd = sizedRows.reduce(
    (total, line) => total + (line.amountUsd ?? 0),
    0,
  );
  const tableMarkdown =
    rows.length > 0
      ? buildOptimizationExportMarkdownTable(rows)
      : "No governed optimization levers are loaded for this contract.";
  const contractCitationId = "source-contract-context";
  const opportunityCitationId = "source-contract-lever-export";
  const directAnswer = [
    `Executive read: ${contract.vendorName} ${contract.contractName} (${contract.contractId}) is an optimization case, not realized savings. Work the ${sizedRows.length} sized levers first (${currencyLabel(sizedTotalUsd)} candidate value) and keep ${signalRows.length} signal-stage ${signalRows.length === 1 ? "lever" : "levers"} unsized until the named evidence gates close. Finance-confirmed value remains $0 until Finance/Tower approval is loaded.`,
    tableMarkdown,
  ].join("\n\n");

  return {
    directAnswer,
    artifacts:
      rows.length > 0
        ? [
            {
              artifact: "table",
              id: "source-contract-optimization-export-table",
              title: "Contract Optimization Lever Table",
              columns: [
                { key: "sequence", label: "Sequence", align: "right" },
                { key: "lever", label: "Lever" },
                { key: "action", label: "Action / buyer ask" },
                {
                  key: "vendorRationale",
                  label: "Why vendor can agree",
                },
                { key: "evidenceBasis", label: "Evidence basis" },
                { key: "valueState", label: "Value state" },
                { key: "ownerTiming", label: "Owner / timing" },
                {
                  key: "doNotClaim",
                  label: "What not to claim yet",
                },
              ],
              rows,
              note: "Rows are governed Source opportunity rows. Signal-stage rows deliberately carry no dollar value until the named evidence gate closes.",
              citationIds: [opportunityCitationId],
            },
          ]
        : [],
    citations: [
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
        label: "Contract optimization opportunity rows",
        sourceClass: "tenant-fact",
        recordId: contract.contractId,
        excerpt:
          "Lever, ask, rationale, owner, timing, value state, and evidence gates are read from governed Source opportunity rows.",
        confidence: rows.length > 0 ? "high" : "medium",
      },
    ],
    factsUsed: [
      {
        id: "selected-contract",
        label: "Selected contract",
        value: `${contract.contractId} ${contract.vendorName}`,
        citationIds: [contractCitationId],
      },
      {
        id: "optimization-lever-count",
        label: "Governed optimization levers",
        value: rows.length,
        citationIds: [opportunityCitationId],
      },
    ],
    metricsUsed: [
      {
        id: "sized-candidate-total",
        label: "Sized candidate value",
        value: sizedRows.length > 0 ? sizedTotalUsd : "Not established",
        unit: sizedRows.length > 0 ? "USD" : undefined,
        citationIds: [opportunityCitationId],
      },
      {
        id: "signal-stage-levers",
        label: "Signal-stage levers",
        value: signalRows.length,
        unit: "levers",
        citationIds: [opportunityCitationId],
      },
    ],
    relationshipsUsed: [],
    caveats: [
      {
        id: "candidate-not-realized",
        label: "Candidate value only",
        detail:
          "The memo may show candidate and signal-stage opportunities, but it must not call any amount realized or finance-confirmed until Finance/Tower confirmation is loaded.",
      },
      {
        id: "no-extra-market-benchmark",
        label: "No invented benchmarks",
        detail:
          "The answer must not invent market discount percentages, pricing benchmarks, page quotes, or missing scope.",
      },
    ],
    nextSteps: [
      {
        id: "export-client-memo",
        label: "Export the governed lever table as a client memo",
        rationale:
          "The answer packet is structured as one table plus a short executive read so it can be rendered directly to PDF.",
        targetSurface: "source",
      },
    ],
  };
}

export function buildSourceWorkspaceVisualAnswer(input: {
  query: string;
  surfaceContext: AskSurfaceContext;
}): SourceWorkspaceVisualAnswer | null {
  const requestedContractId = contractIdFromQuery(input.query);
  const contract = selectedContractFrom(input.surfaceContext, input.query);
  if (!contract) {
    return requestedContractId
      ? buildMissingContractAnswer(requestedContractId)
      : null;
  }
  const lines = opportunityLinesFrom(input.surfaceContext, contract.contractId);
  const connections = connectionsFrom(input.surfaceContext);
  const commercialPostureLines = commercialPostureLinesFrom(
    input.surfaceContext,
  );
  const contractMismatch =
    requestedContractId &&
    contract.contractId.toUpperCase() !== requestedContractId;

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
  const sizedRows = opportunityRows
    .filter((row) => typeof row.valueUsd === "number")
    .map((row) => ({
      opportunity: row.opportunity,
      valueUsd: row.valueUsd as number,
      state: row.state,
    }));
  const signalRows = opportunityRows.filter((row) => isSignalStage(row.stage));

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
        { key: "stage", label: "Stage" },
        { key: "confidence", label: "Confidence" },
        { key: "evidence", label: "Evidence" },
        { key: "evidenceGrade", label: "Evidence grade" },
        { key: "blockingGap", label: "Blocking gap" },
        { key: "owner", label: "Owner" },
        { key: "sourceRefs", label: "Evidence basis" },
        { key: "nextAction", label: "Next action" },
      ],
      rows: opportunityRows.map((row) => ({
        class: row.class,
        opportunity: row.opportunity,
        value: row.value,
        state: row.state,
        stage: row.stage,
        confidence: row.confidence,
        evidence: row.evidence,
        evidenceGrade: row.evidenceGrade,
        blockingGap: row.blockingGap,
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

  if (sizedRows.length >= 2) {
    artifacts.splice(1, 0, {
      artifact: "chart",
      id: "source-contract-opportunity-value-chart",
      kind: "horizontal-bar",
      title: "Sized Commercial Opportunities",
      subtitle:
        "Signal-stage levers are listed as evidence gates, not plotted.",
      data: {
        type: "horizontal-bar",
        data: sizedRows,
        xKey: "opportunity",
        yKey: "valueUsd",
        unit: "USD",
        note: "Chart excludes signal-stage opportunities and rows without a governed numeric value rather than rendering them as zero.",
      },
      builder: "inlineChart",
      xKey: "opportunity",
      yKey: "valueUsd",
      unit: "USD",
      sourceNote:
        "Sized values come from governed Source opportunity rows for the selected contract; signal-stage rows remain evidence gates.",
      citationIds: [opportunityCitationId],
    });
  }

  const evidencePresentCount = lines.filter((line) =>
    /\bpresent\b|quantified|validated|evidenced/i.test(
      `${line.state} ${line.evidenceClass}`,
    ),
  ).length;
  const gapCount = lines.filter((line) =>
    /baseline_conflict|evidence_required|workflow_required|review_required|finance_confirmation_required|finance confirmation required|not_confirmed|not confirmed|missing|needs evidence|not established|requires_/i.test(
      `${line.state} ${line.evidenceClass} ${line.nextAction}`,
    ),
  ).length;
  const sizedCount = sizedRows.length;
  const candidateTotalUsd = sizedRows.reduce(
    (total, row) => total + row.valueUsd,
    0,
  );
  const topOpportunity =
    lines.find(
      (line) => line.amountUsd != null && !isSignalStage(line.stage),
    ) ??
    lines[0] ??
    null;
  const topOpportunityValue =
    topOpportunity?.amountUsd == null
      ? (topOpportunity?.amount ?? "Not established")
      : currencyLabel(topOpportunity.amountUsd);
  const topOpportunitySummary = topOpportunity
    ? ` The top governed opportunity is ${topOpportunity.label} (${topOpportunityValue}), with evidence state ${topOpportunity.evidenceClass} and next action: ${sentenceFragment(topOpportunity.nextAction)}.`
    : ` No governed opportunity row is tied to this contract in the current Source aVa packet, so candidate opportunity value is not established; treat actionability and value as missing until the contract-specific evidence is loaded or opened.${contract.scopeSummary ? ` Evidence posture: ${contract.scopeSummary}.` : ""}`;
  const postureSummary =
    commercialPostureLines.length > 0
      ? ` Commercial posture: ${commercialPostureLines
          .map((line) => `${line.label} = ${line.value}`)
          .join("; ")}.`
      : "";
  const postureDetailSummary =
    commercialPostureLines.length > 0
      ? ` Contract 360 posture detail: ${commercialPostureLines
          .map(
            (line) =>
              `${line.label} = ${line.value} (${sentenceFragment(line.detail)})`,
          )
          .join("; ")}.`
      : "";
  const leverTableSummary =
    opportunityRows.length > 0
      ? `Lever table:\n${buildExecutiveLeverTable(opportunityRows)}`
      : "Lever table: no governed contract-specific opportunity rows are loaded.";

  const loadedContractFacts = [
    `vendor ${contract.vendorName}`,
    `contract ID ${contract.contractId}`,
    `recorded annual value ${currencyLabel(contract.annualValueUsd)}`,
    `actual annual spend ${currencyLabel(contract.actualAnnualSpendUsd)}`,
    `end date ${contract.endDate ?? "not established"}`,
    `notice date ${contract.noticeDate ?? "not established"}`,
    `notice period ${
      contract.noticePeriodDays == null
        ? "not established"
        : `${contract.noticePeriodDays} days`
    }`,
    `auto-renew ${
      contract.autoRenew == null
        ? "not established"
        : contract.autoRenew
          ? "yes"
          : "no"
    }`,
    `renewal owner ${contract.renewalOwnerRef ?? "not assigned"}`,
    contract.scopeRowCount == null
      ? "scope coverage not established"
      : `${contract.scopeRowCount} scope rows`,
    contract.performanceObservationCount == null
      ? "performance coverage not established"
      : `${contract.performanceObservationCount} active performance observations`,
  ].join(", ");
  const candidateSummary =
    sizedCount > 0
      ? `${sizedCount} sized ${sizedCount === 1 ? "line" : "lines"} of contract-specific candidate commercial opportunities total ${currencyLabel(candidateTotalUsd)}. ${signalRows.length > 0 ? `${signalStageClause(signalRows.length)} and excluded from sized totals and charts until evidence gates close. ` : ""}Evidence is present for ${lineCount(evidencePresentCount)}, and ${lineCount(gapCount)} ${gapCount === 1 ? "still requires" : "still require"} explicit workflow, review, or finance confirmation. These amounts are candidates, not realized savings.`
      : `There are no sized contract-specific candidate commercial opportunity lines with governed numeric values. ${signalRows.length > 0 ? `${signalStageClause(signalRows.length)} and excluded from sized totals and charts until evidence gates close. ` : ""}Evidence is present for ${lineCount(evidencePresentCount)}, and ${lineCount(gapCount)} ${gapCount === 1 ? "still requires" : "still require"} explicit workflow, review, or finance confirmation.`;
  const negotiationStance =
    topOpportunity && opportunityRows.length > 0
      ? `Negotiation stance: lead with ${topOpportunity.label} because it is the clearest governed lever in the current packet; ask the owner to ${sentenceFragment(topOpportunity.nextAction).toLowerCase()}. ${postureSummary}${postureDetailSummary}`
      : `Negotiation stance: do not make a commercial ask until a contract-specific opportunity row is loaded. ${postureSummary}${postureDetailSummary}`;

  return {
    directAnswer: [
      `Verdict: ${contract.vendorName} ${contract.contractName} (${contract.contractId}) is a candidate commercial optimization case, not realized savings, unless finance-confirmed outcome rows are explicitly loaded. ${contractMismatch ? "It is the current selected contract, but it does not match the contract ID named in the question; do not use it to answer that contract-specific question." : "It is bound from the governed Source contract context."}`,
      `Rationale: loaded contract facts are ${loadedContractFacts}. ${candidateSummary}${topOpportunitySummary}`,
      leverTableSummary,
      negotiationStance,
      "Caveat: Source will not convert candidate, avoidable, recoverable, or negotiable value into realized savings without explicit finance confirmation; outside-in market practice is advisory pattern context only and must not replace Source/Tower evidence.",
    ].join("\n\n"),
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
      {
        id: "scope-row-count",
        label: "Contract scope rows",
        value: contract.scopeRowCount ?? "Not established",
        unit: contract.scopeRowCount == null ? undefined : "rows",
        citationIds: [contractCitationId],
      },
      {
        id: "performance-observation-count",
        label: "Active performance observations",
        value: contract.performanceObservationCount ?? "Not established",
        unit: contract.performanceObservationCount == null ? undefined : "rows",
        citationIds: [contractCitationId],
      },
      {
        id: "candidate-opportunity-total",
        label: "Sized candidate opportunity total",
        value: sizedCount > 0 ? candidateTotalUsd : "Not established",
        unit: sizedCount > 0 ? "USD" : undefined,
        citationIds: [opportunityCitationId],
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
      ...(sizedRows.length < 2
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
