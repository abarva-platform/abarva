export interface SourcePortfolioFallbackInput {
  message: string;
  surface: string;
  activeClientDisplayName: string;
  surfaceContext?: Record<string, unknown> | null;
}

export interface SelectedSourceContractContext {
  contractId: string;
  contractName: string | null;
  vendorName: string | null;
  annualValue: number | null;
  actualAnnualSpend: number | null;
  endDate: string | null;
  evidencePosture: string | null;
  nextAction: string | null;
  datasetSummary: string | null;
  cubeSummary: string | null;
  topVendorSummary: string | null;
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

function hasSelectedSourceEvent(
  surfaceContext: Record<string, unknown> | null | undefined,
): boolean {
  return (
    typeof surfaceContext?.sourceEventId === "string" &&
    surfaceContext.sourceEventId.trim().length > 0
  );
}

function isSourceIntakeSurface(
  surfaceContext: Record<string, unknown> | null | undefined,
): boolean {
  return surfaceContext?.sourceIntakeMode === true;
}

export function readSelectedSourceContractContext(
  surfaceContext: Record<string, unknown> | null | undefined,
): SelectedSourceContractContext | null {
  const direct = readDirectContract360Context(surfaceContext);
  if (direct) return direct;
  return readWorkspaceSelectedContractContext(surfaceContext);
}

function readDirectContract360Context(
  surfaceContext: Record<string, unknown> | null | undefined,
): SelectedSourceContractContext | null {
  if (surfaceContext?.sourceContract360Mode !== true) return null;
  const contractId = stringValue(surfaceContext.contractId);
  if (!contractId) return null;

  return {
    contractId,
    contractName: stringValue(surfaceContext.contractName),
    vendorName: stringValue(surfaceContext.vendorName),
    annualValue: numberValue(surfaceContext.annualValue),
    actualAnnualSpend: numberValue(surfaceContext.actualAnnualSpend),
    endDate: stringValue(surfaceContext.endDate),
    evidencePosture: stringValue(surfaceContext.evidencePosture),
    nextAction: stringValue(surfaceContext.nextAction),
    datasetSummary: stringValue(surfaceContext.contractDatasetSummary),
    cubeSummary: stringValue(surfaceContext.contractCubeSummary),
    topVendorSummary: stringValue(surfaceContext.contractTopVendorSummary),
  };
}

function readWorkspaceSelectedContractContext(
  surfaceContext: Record<string, unknown> | null | undefined,
): SelectedSourceContractContext | null {
  if (!isRecord(surfaceContext?.sourceV4)) return null;
  const sourceV4 = surfaceContext.sourceV4;
  if (!isRecord(sourceV4.selectedContract)) return null;

  const selected = sourceV4.selectedContract;
  const contractId = stringValue(selected.contractId);
  if (!contractId) return null;

  return {
    contractId,
    contractName: stringValue(selected.contractName),
    vendorName: stringValue(selected.vendorName),
    annualValue: numberValue(selected.annualValueUsd),
    actualAnnualSpend: numberValue(selected.actualAnnualSpendUsd),
    endDate: stringValue(selected.endDate),
    evidencePosture: stringValue(surfaceContext.evidence),
    nextAction: readWorkspaceNextAction(surfaceContext, contractId),
    datasetSummary: formatWorkspaceDatasetSummary(sourceV4, surfaceContext),
    cubeSummary: formatWorkspaceCubeSummary(sourceV4, surfaceContext),
    topVendorSummary: formatWorkspaceTopVendorSummary(sourceV4),
  };
}

function formatWorkspaceDatasetSummary(
  sourceV4: Record<string, unknown>,
  surfaceContext: Record<string, unknown>,
): string | null {
  const portfolio = isRecord(sourceV4.executivePortfolio)
    ? sourceV4.executivePortfolio
    : null;
  const coverage = isRecord(sourceV4.contextCoverage)
    ? sourceV4.contextCoverage
    : null;
  const parts = [
    numberValue(portfolio?.contracts) != null
      ? `${numberValue(portfolio?.contracts)} contracts`
      : null,
    numberValue(coverage?.vendors) != null
      ? `${numberValue(coverage?.vendors)} vendors`
      : null,
    stringValue(portfolio?.annualValue)
      ? `${stringValue(portfolio?.annualValue)} annual value`
      : null,
    stringValue(portfolio?.totalCommittedValue)
      ? `${stringValue(portfolio?.totalCommittedValue)} total committed value`
      : null,
  ].filter(Boolean);

  const facts = Array.isArray(surfaceContext.pageFacts)
    ? surfaceContext.pageFacts.map(stringValue).filter(Boolean)
    : [];
  const totalsFact = facts.find((fact) => fact?.startsWith("Portfolio totals:"));
  return parts.length > 0 ? `${parts.join(" / ")}.` : (totalsFact ?? null);
}

function formatWorkspaceCubeSummary(
  sourceV4: Record<string, unknown>,
  surfaceContext: Record<string, unknown>,
): string | null {
  const coverage = isRecord(sourceV4.contextCoverage)
    ? sourceV4.contextCoverage
    : null;
  const valueProof = isRecord(sourceV4.valueProof) ? sourceV4.valueProof : null;
  const grounding = isRecord(surfaceContext.groundingStatus)
    ? surfaceContext.groundingStatus
    : null;
  const parts = [
    numberValue(coverage?.scopeRows) != null
      ? `${numberValue(coverage?.scopeRows)} scope rows`
      : null,
    numberValue(coverage?.performanceRows) != null
      ? `${numberValue(coverage?.performanceRows)} performance rows`
      : null,
    numberValue(coverage?.invoiceLines) != null
      ? `${numberValue(coverage?.invoiceLines)} invoice lines`
      : null,
    numberValue(grounding?.actionCandidates) != null
      ? `${numberValue(grounding?.actionCandidates)} action candidates`
      : null,
    numberValue(grounding?.avaGroundingBundles) != null
      ? `${numberValue(grounding?.avaGroundingBundles)} aVa grounding bundles`
      : null,
    numberValue(valueProof?.claimableRows) != null
      ? `${numberValue(valueProof?.claimableRows)} claimable value rows`
      : null,
  ].filter(Boolean);
  return parts.length > 0 ? `${parts.join(" / ")}.` : null;
}

function formatWorkspaceTopVendorSummary(
  sourceV4: Record<string, unknown>,
): string | null {
  if (!Array.isArray(sourceV4.contractDirectory)) return null;
  const rows = sourceV4.contractDirectory
    .filter(isRecord)
    .map((row) => ({
      vendorName: stringValue(row.vendorName),
      annualValue: numberValue(row.annualValueUsd),
    }))
    .filter(
      (row): row is { vendorName: string; annualValue: number } =>
        Boolean(row.vendorName) && row.annualValue != null,
    )
    .sort((a, b) => b.annualValue - a.annualValue);
  const top = rows[0];
  if (!top) return null;
  return `${top.vendorName} is the largest loaded contract-directory vendor by annual value at ${formatUsdCompact(top.annualValue)}.`;
}

function readWorkspaceNextAction(
  surfaceContext: Record<string, unknown>,
  contractId: string,
): string | null {
  if (!isRecord(surfaceContext.sourceV4)) return null;
  const opportunities = Array.isArray(
    surfaceContext.sourceV4.contractOpportunityDirectory,
  )
    ? surfaceContext.sourceV4.contractOpportunityDirectory
    : [];
  const matched = opportunities
    .filter(isRecord)
    .find((row) => stringValue(row.contractId) === contractId);
  return stringValue(matched?.recommendationDetail) ?? stringValue(matched?.label);
}

export function isReadOnlySourcePortfolioSurface(
  input: SourcePortfolioFallbackInput,
): boolean {
  const surface = input.surface.startsWith("/")
    ? input.surface
    : `/${input.surface}`;
  const context = input.surfaceContext ?? {};

  if (!surface.startsWith("/source")) return false;
  if (hasSelectedSourceEvent(context)) return false;
  if (isSourceIntakeSurface(context)) return false;

  return (
    surface === "/source/events" ||
    surface === "/source/portfolio" ||
    surface.startsWith("/source/preview/workspace") ||
    surface.startsWith("/source/vendor-portfolio") ||
    surface.startsWith("/source/sourcing-opportunities") ||
    context.sourcePortfolioMode === true ||
    context.sourceSourcingOpportunitiesMode === true
  );
}

export function buildSourcePortfolioFallbackAnswer(
  input: SourcePortfolioFallbackInput,
): string | null {
  if (!isReadOnlySourcePortfolioSurface(input)) return null;

  const q = input.message.trim().toLowerCase();
  if (!q) return null;

  const tenant = input.activeClientDisplayName || "the active tenant";
  const selectedContract = readSelectedSourceContractContext(input.surfaceContext);
  if (selectedContract) return null;
  const prefix = `I am scoped to ${tenant}'s Source workspace, but no single Source event is selected in this chat.`;

  if (/\b(total\s+)?savings\b|\bvalue\s+real/i.test(q)) {
    return [
      prefix,
      "I cannot state total savings from the portfolio view or invent a finance-confirmed value.",
      "Select the event and its Value stage, or attach the finance-approved realization evidence; until then, savings stays missing rather than estimated.",
    ].join(" ");
  }

  if (/\b(chart|graph|plot|comparison)\b/i.test(q)) {
    return [
      prefix,
      "A pricing comparison chart needs reconciled vendor-bid rows for one selected event.",
      "Open the event's Pricing stage; if the rows are absent or inconsistent, the chart should stay unavailable instead of rendering filler.",
    ].join(" ");
  }

  if (/\b(pricing|commercials?|rate card|vendor bid|bid price|price)\b/i.test(q)) {
    return [
      prefix,
      "I will only discuss vendor pricing when it is tied to the active tenant, selected event, and uploaded commercial evidence.",
      "Select the event/vendor and use the Pricing evidence; if the bid or reconciliation is missing, I will say it is missing.",
    ].join(" ");
  }

  if (/\b(which vendor|pick|select|recommend|winner|award)\b/i.test(q)) {
    return [
      prefix,
      "I cannot recommend a supplier from this portfolio-level context.",
      "The recommendation needs completed scoring, pricing reconciliation, trap-log exceptions, and BAFO evidence on the selected event before the decision brief can make a cited call.",
    ].join(" ");
  }

  if (/\bbafo\b|\bbest and final\b/i.test(q)) {
    return [
      prefix,
      "A BAFO evidence answer needs the selected event, vendor, and BAFO ask.",
      "Use the event BAFO stage so I can cite the uploaded response, pricing workbook, scorecard, or trap log instead of paraphrasing assumptions.",
    ].join(" ");
  }

  if (/\bevidence\b|\bmissing\b|\bgap\b|\bready\b|\bblock/i.test(q)) {
    return [
      prefix,
      "At this level I can point you to portfolio readiness, but event-specific evidence gaps require a selected event or contract.",
      "Open the event or contract detail and I will keep absent evidence explicit rather than filling it in.",
    ].join(" ");
  }

  return [
    prefix,
    "I can help triage events, renewal exposure, sourcing opportunities, evidence gaps, and approval blockers from this workspace.",
    "Choose an event or contract for cited answers; portfolio-level answers stay directional and do not calculate savings or expose pricing without selected evidence.",
  ].join(" ");
}

export function buildSourceContract360PromptBlock(
  surfaceContext: Record<string, unknown> | null | undefined,
  tenant: string,
): string {
  const contract = readSelectedSourceContractContext(surfaceContext);
  if (!contract) return "";
  const lines = [
    "SOURCE CONTRACT 360 SELECTED-CONTRACT CONTEXT (authoritative page-local contract scope):",
    formatSelectedContractPrefix(tenant, contract),
    formatSelectedContractFinancialBasis(contract),
    contract.datasetSummary ? `Contract dataset: ${contract.datasetSummary}` : null,
    contract.cubeSummary ? `Contract cubes: ${contract.cubeSummary}` : null,
    contract.topVendorSummary ? `Top vendor cube: ${contract.topVendorSummary}` : null,
    contract.evidencePosture
      ? `Evidence posture: ${contract.evidencePosture}.`
      : "Evidence posture: not established in page context.",
    contract.nextAction
      ? `Page next action: ${contract.nextAction}.`
      : "Page next action: not established in page context.",
    "",
    "SOURCE AVA CONTRACT ANSWER FORMAT:",
    "Paragraph 1, Strategic read: state the answer directly, name the selected contract/vendor, and quote the relevant contract-book fact or cube rollup.",
    "Paragraph 2, Consultant diagnosis: explain the commercial, renewal, scope, performance, risk, or evidence implication. If a chart or table would help, include a compact markdown table or an allowed ```abarva-chart JSON block for the Recharts-backed answer renderer, using only figures from the selected contract context, dataset summary, cubes, or grounding blocks.",
    "Paragraph 3, Decision / next move: state the recommended next action, the governing caveat, and the single evidence item or event stage needed if the ask requires pricing, BAFO, award, or realized-value proof.",
    "Do not answer as if no contract is selected. Do not say to open Contract 360; it is already open. If the user asks beyond Contract 360, say exactly which Source event evidence is needed while still answering from the selected contract and dataset context.",
  ];
  return lines.filter((line): line is string => Boolean(line)).join("\n");
}

function formatSelectedContractPrefix(
  tenant: string,
  contract: SelectedSourceContractContext,
): string {
  const title = [contract.vendorName, contract.contractName]
    .filter(Boolean)
    .join(" / ");
  return `I am scoped to ${tenant}'s Contract 360 record for ${contract.contractId}${title ? ` (${title})` : ""}.`;
}

function formatSelectedContractFinancialBasis(
  contract: SelectedSourceContractContext,
): string {
  const facts = [
    contract.annualValue == null
      ? null
      : `annual value ${formatUsdCompact(contract.annualValue)}`,
    contract.actualAnnualSpend == null
      ? null
      : `actual annual spend ${formatUsdCompact(contract.actualAnnualSpend)}`,
    contract.endDate ? `end date ${contract.endDate}` : null,
  ].filter(Boolean);

  return facts.length
    ? `The page-scoped financial basis is ${facts.join(", ")}.`
    : "No page-scoped financial basis is established for this contract.";
}

function formatUsdCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value)}`;
}
