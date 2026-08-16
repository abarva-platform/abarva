// ─────────────────────────────────────────────────────────────────────────────
// aVa DETERMINISTIC GROUNDING for a single Source contract — the missing wire
// for contract-grain questions asked from the Optimize Contract surface.
//
// Live-found (2026-08-12, docs/testing/source-ava-hard-qa-2026-08-12.md): every
// contract-grain question asked while on `/source/optimize?contractId=CTR-090`
// came back with an empty context bundle (facts 0, chunks 0, provenance 0). The
// page sends `surfaceContext.contractId`, but nothing read it, so aVa could not
// answer a single question about the page the user was looking at — the evidence
// readiness board, the opportunity rows, the reproducible/non-reproducible split,
// or the baseline state, all of which were rendered on screen beside it.
//
// It then told the user to go look at Contract 360. That is not a hallucination:
// `ava-portfolio-grounding-context.ts` deliberately instructs aVa to deflect
// single-contract questions to Contract 360, because portfolio grounding has no
// contract detail to offer. Correct for portfolio-only turns; wrong once the
// surface actually carries a contract. This module supplies the missing detail
// and cancels that deflection for the one contract in scope.
//
// Same wire pattern as the portfolio and event grounding modules: it calls the
// exact read-adapter functions and pure builders the Optimize Contract page
// itself renders from, so the numbers aVa quotes cannot diverge from the numbers
// on screen. It re-implements no calculation.
//
// Governing rule (AGENTS.md): read models own values, the agent owns narrative.
// Missing evidence stays missing — never a zero — and an amount with no
// calculation run behind it is reported as not reproducible rather than quoted
// as validated value.
//
// Additive and best-effort: no contract id, an unknown contract, or a read
// failure leaves the block empty and the turn behaves exactly as before.
// ─────────────────────────────────────────────────────────────────────────────

import { buildContractOptimizationEvidenceReadiness } from "@/lib/source/data-model/contract-optimization-evidence-readiness";
import { summarizeOpportunityTraceability } from "@/lib/source/data-model/contract-optimization-traceability";
import { deriveOptimizeWorkflowPosition } from "@/lib/source/data-model/contract-optimization-workflow-step";
import type { OptimizationOpportunityValueType } from "@/lib/source/data-model/contract-optimization-opportunity";
import {
  getContract360,
  getContractOptimizationEvidencePack,
  getContractOptimizationOpportunitySet,
} from "@/lib/source/data-model/read-adapter";

const USD_COMPACT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 1,
  notation: "compact",
});

function fmtUsd(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "not established";
  return USD_COMPACT.format(value);
}

const VALUE_TYPE_LABEL: Record<OptimizationOpportunityValueType, string> = {
  recoverable_leakage: "Recoverable leakage",
  avoided_cost: "Avoided cost",
  negotiable_improvement: "Negotiated improvement",
};

export interface AvaSourceContractGrounding {
  /** Grounding block for the agent system prompt. Empty when unavailable. */
  block: string;
  /** True when the block carries at least one read-derived number. */
  hasLiveNumbers: boolean;
}

/**
 * Build the contract-grain grounding block for a Source-surface chat turn.
 *
 * Best-effort by contract: any read failure or unknown contract returns an empty
 * block rather than throwing, so a chat turn can never break because grounding
 * was unavailable.
 */
export async function buildAvaSourceContractGrounding(
  tenantKey: string,
  contractId: string,
): Promise<AvaSourceContractGrounding> {
  const trimmedId = contractId.trim();
  if (!tenantKey || !trimmedId) return { block: "", hasLiveNumbers: false };

  const contract = await getContract360(tenantKey, trimmedId).catch(() => null);
  if (!contract) return { block: "", hasLiveNumbers: false };

  const [opportunitySet, evidencePack] = await Promise.all([
    getContractOptimizationOpportunitySet(tenantKey, trimmedId, contract).catch(
      () => null,
    ),
    getContractOptimizationEvidencePack(tenantKey, trimmedId).catch(() => null),
  ]);

  const readiness = buildContractOptimizationEvidenceReadiness({
    evidencePack: evidencePack ?? null,
  });
  const traceability = summarizeOpportunityTraceability(
    opportunitySet?.opportunities ?? [],
  );
  const position = deriveOptimizeWorkflowPosition({
    hasSelectedContract: true,
    opportunitySet,
    readiness,
    traceability,
  });

  const missingFamilies = readiness.rows
    .filter(
      (row) => row.obligation === "required" && row.evidenceClass === "missing",
    )
    .map((row) => row.label);

  const strategyRequest = latestRequest(
    opportunitySet?.approvalRequests ?? [],
    "vendor_outreach_strategy",
  );
  const financeRequest = latestRequest(
    opportunitySet?.approvalRequests ?? [],
    "finance_value_confirmation",
  );
  const agreedOutcome =
    (opportunitySet?.negotiatedOutcomes ?? []).find(
      (outcome) => outcome.outcomeState === "agreed",
    ) ?? null;
  const financeConfirmedUsd = opportunitySet?.financeConfirmedUsd ?? 0;
  const valueProofClosed =
    financeConfirmedUsd > 0 && financeRequest?.approvalState === "approved";

  const ledgerTotals = buildLedgerTotals({
    tracedByValueType: traceability.tracedByValueType,
    financeConfirmedUsd,
    valueProofClosed,
  });
  const largestLedger = ledgerTotals
    .filter((row) => row.valueType !== "realized_value")
    .reduce<(typeof ledgerTotals)[number] | null>(
      (best, row) => (best == null || row.amountUsd > best.amountUsd ? row : best),
      null,
    );

  const opportunityLines = (opportunitySet?.opportunities ?? [])
    .slice(0, 8)
    .map((opportunity) => {
      const trace = traceability.rows.find(
        (row) => row.opportunityId === opportunity.opportunityId,
      );
      return `- ${opportunity.shortLabel} · ${opportunity.valueType.replace(/_/g, " ")} · ${fmtUsd(
        opportunity.amountUsd,
      )} · stage ${opportunity.stage} · ${trace?.label ?? "traceability not evaluated"}`;
    });

  const lines: string[] = [
    `AUTHORITATIVE SOURCE CONTRACT GROUNDING (LIVE — the same governed reads the Optimize Contract page renders, tenant "${tenantKey}", contract ${trimmedId}):`,
    `Exact contract display name: "${contract.contract_name ?? trimmedId}". Exact vendor display name: "${contract.vendor_name ?? "not established"}". Use these exact names; do not substitute a similar name from generic context or prior examples.`,
    // `resolved_annual_value` wins whenever extraction disagreed with the
    // stated value; quoting the raw column there would repeat a known conflict.
    `Contract: ${contract.contract_name ?? trimmedId}. Vendor: ${contract.vendor_name ?? "not established"}. Annual value: ${fmtUsd(
      contract.annual_value_conflict_flag
        ? contract.resolved_annual_value
        : contract.annual_value,
    )}.${
      contract.annual_value_conflict_flag
        ? " (Stated annual value and extracted value disagreed; the resolved value is quoted.)"
        : ""
    }`,
    `Commercial baseline status: ${opportunitySet?.baseline.status ?? "no governed baseline"}.`,
    `Workflow position: step ${position.currentIndex} of ${position.steps.length} (${position.currentLabel}). Next action: ${position.primaryAction}.${
      position.blocker ? ` Blocked by: ${position.blocker}` : ""
    }`,
    `Evidence readiness: ${readiness.requiredEvidenced} of ${readiness.requiredTotal} required evidence families have governed evidence.${
      missingFamilies.length > 0
        ? ` Missing: ${missingFamilies.join(", ")}.`
        : ""
    }`,
    `Opportunity value that a calculation run can reproduce: ${fmtUsd(traceability.tracedAmountUsd)}. Stated value with no reproducible calculation run: ${fmtUsd(
      traceability.untracedAmountUsd,
    )}.`,
    `Chart-safe ledger totals from reproducible calculation runs: ${ledgerTotals
      .map((row) => `${row.label} ${fmtUsd(row.amountUsd)}`)
      .join("; ")}.`,
    largestLedger
      ? `Largest reproducible non-realized ledger for chart narration: ${largestLedger.label} at ${fmtUsd(largestLedger.amountUsd)}. Quote this line instead of recomputing totals from the opportunity rows.`
      : "",
    `Workflow lifecycle state: strategy approval ${strategyRequest?.approvalState ?? "not requested"}; vendor outcome ${agreedOutcome?.outcomeState ?? "not recorded"}; Finance/Tower confirmation request ${financeRequest?.approvalState ?? "not requested"}; value-proof gate ${valueProofClosed ? "closed" : "open"}.`,
    buildValueProofLine({ financeConfirmedUsd, valueProofClosed }),
    opportunityLines.length > 0
      ? `Opportunity rows:\n${opportunityLines.join("\n")}`
      : "Opportunity rows: none loaded for this contract.",
    `Contract-grain grounding IS available for ${trimmedId}. Answer questions about ${trimmedId} from the numbers above — do NOT deflect them to Contract 360, and do NOT fall back to portfolio-level figures or generic tenant-context retrieval for this contract.`,
    "Rules for these numbers: a missing evidence family is missing, never zero. Only the reproducible total and the chart-safe ledger totals may be presented as value that can be defended outside this workspace; the non-reproducible figure must be described as not yet traceable to a calculation run. Approved realized value exists only when the finance evidence is present AND the Finance/Tower confirmation request is approved. If the value-proof gate is open, do not say Finance has confirmed, do not say realized value to date, do not call the pending evidence booked, claimable, confirmed, or approved. If the user asks for a chart, graph, or table, use the chart-safe ledger totals above and do not add or recompute row-level amounts yourself. If the user asks something about this contract that is not covered above, say so plainly instead of estimating.",
  ].filter(Boolean);

  return { block: lines.join("\n"), hasLiveNumbers: true };
}

function buildLedgerTotals(input: {
  tracedByValueType: Readonly<
    Partial<Record<OptimizationOpportunityValueType, number>>
  >;
  financeConfirmedUsd: number;
  valueProofClosed: boolean;
}): readonly {
  readonly valueType:
    | OptimizationOpportunityValueType
    | "realized_value";
  readonly label: string;
  readonly amountUsd: number;
}[] {
  return [
    {
      valueType: "recoverable_leakage",
      label: VALUE_TYPE_LABEL.recoverable_leakage,
      amountUsd: input.tracedByValueType.recoverable_leakage ?? 0,
    },
    {
      valueType: "avoided_cost",
      label: VALUE_TYPE_LABEL.avoided_cost,
      amountUsd: input.tracedByValueType.avoided_cost ?? 0,
    },
    {
      valueType: "negotiable_improvement",
      label: VALUE_TYPE_LABEL.negotiable_improvement,
      amountUsd: input.tracedByValueType.negotiable_improvement ?? 0,
    },
    {
      valueType: "realized_value",
      label: "Approved realized value",
      amountUsd: input.valueProofClosed ? input.financeConfirmedUsd : 0,
    },
  ];
}

function buildValueProofLine(input: {
  financeConfirmedUsd: number;
  valueProofClosed: boolean;
}): string {
  if (input.financeConfirmedUsd <= 0) {
    return "Approved realized value: $0. No Finance/Tower realization evidence is loaded for this contract yet.";
  }

  if (input.valueProofClosed) {
    return `Finance/Tower-approved realized value: ${fmtUsd(input.financeConfirmedUsd)}.`;
  }

  return `Finance/Tower evidence pending approval: ${fmtUsd(input.financeConfirmedUsd)}. Approved realized value: $0 until the Finance/Tower confirmation request is approved.`;
}

function latestRequest(
  requests: readonly {
    readonly approvalType: string;
    readonly approvalState: string;
  }[],
  approvalType: string,
): { readonly approvalState: string } | null {
  return (
    requests.find((request) => request.approvalType === approvalType) ?? null
  );
}
