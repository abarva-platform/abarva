"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SourceWorkspaceVM } from "./buildViewModel";
import { fmtDate, money, pct, type WorkspaceViewModel } from "./viewModel";
import { focusableContractRows } from "./contractDiscovery";
import type {
  SourceWorkspacePortfolioData,
  SourceWorkspaceProviderMode,
} from "./live/portfolioAdapter";
import type { Contract360Response } from "./live/contractDetail";
import { portfolioDiscountComparatorSummary } from "./contractDiscountComparator";
import type { ContractFacetKey } from "@/lib/source/contract-intelligence/education";
import { numberFromDb } from "@/lib/source/data-model/vendor-contract-portfolio";
import type {
  DocExtractionRow,
  DocFileRow,
  SourceContractApplicationScopeRow,
  SourceContract360Row,
  SourceContractActionCandidateRow,
  SourceContractEvidenceCoverageRow,
  SourceContractPerformancePeriodRow,
  SourceContractTabIntelligenceRow,
  SourceVendorPositionRow,
  SourceVendorContractPortfolioRow,
} from "@/lib/source/data-model/types";

const PAGE_LABELS = [
  "Command",
  "Contracts",
  "Levers",
  "Evidence",
  "Coverage",
] as const;
const CONTRACT_TABS = [
  "Story",
  "Scope",
  "Economics",
  "Performance",
  "Relationship",
  "Evidence",
  "Optimize",
  "Education",
] as const;
const VENDOR_SUBTABS = [
  "Concentration",
  "Evidence depth",
  "Archetype mix",
] as const;
const CONTRACT_LIST_SUBTABS = [
  "Table",
  "By evidence depth",
  "By finance status",
] as const;
const OPTIMIZE_SUBTABS = ["Queue", "By type", "By contract"] as const;
const CONTRACT_OPTIMIZE_SUBTABS = ["Levers", "Sequence", "Comparator"] as const;
const GRAPH_SUBTABS = ["Flow", "Volume", "Mapping spine"] as const;

export const SOURCE_CHART_PALETTE = {
  ink: "#102033",
  teal: "#1d9e75",
  amber: "#ba7517",
  blue: "#2d6cdf",
  red: "#ad2d2d",
  slate: "#6f7480",
} as const;
const SOURCE_CHART_SERIES = [
  SOURCE_CHART_PALETTE.ink,
  SOURCE_CHART_PALETTE.teal,
  SOURCE_CHART_PALETTE.amber,
  SOURCE_CHART_PALETTE.blue,
  SOURCE_CHART_PALETTE.red,
  SOURCE_CHART_PALETTE.slate,
] as const;

function chartSeriesColor(index: number): string {
  return SOURCE_CHART_SERIES[index % SOURCE_CHART_SERIES.length];
}

type PageLabel = (typeof PAGE_LABELS)[number];
type ExecutiveVendorRow = SourceVendorContractPortfolioRow & {
  readonly vendor_refs: readonly string[];
};
type FocusedContractRow = {
  readonly contract: SourceContract360Row;
  readonly coverage: SourceContractEvidenceCoverageRow | null;
  readonly actionRows: number;
  readonly claimRows: number;
  readonly depthScore: number;
  readonly reason: string;
};
type FocusedContractSet = {
  readonly rows: readonly FocusedContractRow[];
  readonly remainderCount: number;
  readonly remainderAnnualValue: number;
  readonly depthReadyCount: number;
};
type VendorCoverageSummary = {
  spendRows: number;
  performanceRows: number;
  actionRows: number;
  unclaimedCredit: number;
};
type ImpactLoadState = "loading" | "ready" | "error";

type RecoverableCreditInput = Pick<
  SourceWorkspacePortfolioData,
  "impact" | "v4Snapshot" | "workspaceDiagnostics"
>;

function impactLoadRunScore(row: SourceContractEvidenceCoverageRow): number {
  return (
    1 +
    (numberFromDb(row.document_page_text_rows) ?? 0) * 8 +
    (numberFromDb(row.change_order_rows) ?? 0) * 5 +
    (numberFromDb(row.opportunity_rows) ?? 0) * 3 +
    (numberFromDb(row.scope_rows) ?? 0) +
    Math.min(numberFromDb(row.spend_rows) ?? 0, 12) +
    Math.min(numberFromDb(row.performance_rows) ?? 0, 12)
  );
}

function preferredImpactLoadRunId(
  rows: readonly SourceContractEvidenceCoverageRow[],
): string {
  const scored = new Map<string, { score: number; rows: number }>();
  for (const row of rows) {
    const loadRunId = row.load_run_id?.trim() ?? "";
    if (!loadRunId) continue;
    const current = scored.get(loadRunId) ?? { score: 0, rows: 0 };
    current.score += impactLoadRunScore(row);
    current.rows += 1;
    scored.set(loadRunId, current);
  }

  return (
    [...scored.entries()].sort(
      ([leftId, left], [rightId, right]) =>
        right.score - left.score ||
        right.rows - left.rows ||
        leftId.localeCompare(rightId),
    )[0]?.[0] ?? ""
  );
}

function impactCreditMoney(value: number | null | undefined): string {
  if (value == null) return "Not established";
  const abs = Math.abs(value);
  if (abs >= 1_000 && abs < 1_000_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return money(value);
}

function isRecoverableCreditCandidate(
  candidate: SourceWorkspacePortfolioData["impact"]["actionCandidates"][number],
): boolean {
  return /credit|recover/i.test(
    [
      candidate.opportunity_type,
      candidate.action_type,
      candidate.title,
      candidate.finding_summary,
      candidate.deterministic_basis,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

export function source360RecoverableCreditCoverageRows(
  portfolio: RecoverableCreditInput,
): readonly SourceContractEvidenceCoverageRow[] {
  const rowsWithCredits = portfolio.impact.evidenceCoverage.filter(
    (row) => (numberFromDb(row.unclaimed_credit_usd) ?? 0) > 0,
  );
  const activeLoadRunId =
    portfolio.workspaceDiagnostics.activeLoadRunId?.trim() ?? "";

  if (activeLoadRunId) {
    const activeRows = rowsWithCredits.filter(
      (row) => row.load_run_id === activeLoadRunId,
    );
    if (activeRows.length > 0) {
      return activeRows;
    }
  }

  const preferredLoadRunId = preferredImpactLoadRunId(rowsWithCredits);
  if (preferredLoadRunId) {
    const preferredRows = rowsWithCredits.filter(
      (row) => row.load_run_id === preferredLoadRunId,
    );
    if (preferredRows.length > 0) {
      return preferredRows;
    }
  }

  const creditActionContractIds = new Set(
    portfolio.impact.actionCandidates
      .filter((row) =>
        /credit|recover/i.test(
          [
            row.action_type,
            row.opportunity_type,
            row.title,
            row.finding_summary,
            row.deterministic_basis,
          ]
            .filter(Boolean)
            .join(" "),
        ),
      )
      .map((row) => row.contract_id),
  );
  const actionableCreditRows = rowsWithCredits.filter((row) =>
    creditActionContractIds.has(row.contract_id),
  );

  if (actionableCreditRows.length > 0) {
    return actionableCreditRows;
  }

  return rowsWithCredits;
}

export function source360RecoverableCreditFinding(
  portfolio: RecoverableCreditInput,
): number {
  const deterministicCredit = source360RecoverableCreditCoverageRows(
    portfolio,
  ).reduce(
    (sum, row) => sum + (numberFromDb(row.unclaimed_credit_usd) ?? 0),
    0,
  );

  if (deterministicCredit > 0) {
    return deterministicCredit;
  }

  return portfolio.v4Snapshot.performanceCredits.unclaimedCredit;
}
type FocusedVendorRow = {
  readonly vendor: ExecutiveVendorRow;
  readonly coverage: VendorCoverageSummary | null;
  readonly reason: string;
};
type FocusedVendorSet = {
  readonly rows: readonly FocusedVendorRow[];
  readonly remainderCount: number;
  readonly remainderAnnualValue: number;
  readonly depthReadyCount: number;
  readonly unresolvedCount: number;
};
type FocusedActionSet = {
  readonly rows: readonly SourceContractActionCandidateRow[];
  readonly remainderCount: number;
  readonly remainderAmount: number;
  readonly totalRows: number;
  readonly totalAmount: number;
};
type CommandCreditFunnel = {
  readonly calculated: number;
  readonly claimed: number;
  readonly recovered: number;
  readonly unclaimed: number;
};

function contractById(
  portfolio: SourceWorkspacePortfolioData,
  contractId: string,
) {
  return (
    focusableContractRows(portfolio).find(
      (contract) => contract.contract_id === contractId,
    ) ?? null
  );
}

function actionText(candidate: SourceContractActionCandidateRow) {
  return [
    candidate.title,
    candidate.action_type,
    candidate.opportunity_type,
    candidate.finding_summary,
    candidate.next_action,
    candidate.deterministic_basis,
  ]
    .filter(Boolean)
    .join(" ");
}

function primaryCommitmentAction(portfolio: SourceWorkspacePortfolioData) {
  const rows = [...portfolio.impact.actionCandidates].sort((left, right) => {
    const leftCommit = /commit|notice|renew|ramp|consumption|usage/i.test(
      actionText(left),
    );
    const rightCommit = /commit|notice|renew|ramp|consumption|usage/i.test(
      actionText(right),
    );
    if (leftCommit !== rightCommit) return leftCommit ? -1 : 1;
    const leftDue = sortableDate(left.decision_due_date);
    const rightDue = sortableDate(right.decision_due_date);
    return (
      leftDue - rightDue ||
      (numberFromDb(right.candidate_amount_usd) ?? 0) -
        (numberFromDb(left.candidate_amount_usd) ?? 0) ||
      left.action_candidate_id.localeCompare(right.action_candidate_id)
    );
  });
  return rows[0] ?? null;
}

function actionSequenceRank(candidate: SourceContractActionCandidateRow) {
  const text = actionText(candidate);
  if (/notice|non-renew|auto-renew/i.test(text)) return 0;
  if (/credit|claim|breach/i.test(text)) return 1;
  if (/right-size|re-time|retime|ramp|commitment/i.test(text)) return 2;
  if (/marketplace|private offer|route/i.test(text)) return 3;
  if (/serverless|classic|migration/i.test(text)) return 4;
  if (/discount|re-price|benchmark/i.test(text)) return 5;
  if (/scope|cmdb|workload/i.test(text)) return 6;
  return 7;
}

function actionPayload(candidate: SourceContractActionCandidateRow) {
  const payload = candidate.citation_basis_json?.payload;
  return payload && typeof payload === "object" && !Array.isArray(payload)
    ? (payload as Record<string, unknown>)
    : {};
}

function actionPayloadText(
  candidate: SourceContractActionCandidateRow,
  keys: readonly string[],
) {
  const payload = actionPayload(candidate);
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function humanizeEvidenceLabel(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value
    .replace(/[_:;]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return null;
  return normalized
    .split(" ")
    .map((part) =>
      /^[A-Z0-9]+$/.test(part)
        ? part
        : `${part.charAt(0).toUpperCase()}${part.slice(1)}`,
    )
    .join(" ");
}

function isMachineEvidenceTokenText(value: string | null | undefined) {
  if (!value) return false;
  const text = value.trim();
  if (!text) return false;
  if (/[;:]/.test(text) && /[_-]/.test(text)) return true;
  if (
    /\b(?:cloud_account|marketplace_routing|contract_ref|opportunity_ref|finance_confirmation_state|evidence_rows)\b/i.test(
      text,
    )
  )
    return true;
  const snakeTokens = text.match(/\b[a-z]+(?:_[a-z0-9]+){1,}\b/g) ?? [];
  return snakeTokens.length >= 2;
}

function actionCardBody(candidate: SourceContractActionCandidateRow) {
  const title = candidate.title?.trim() ?? "";
  const candidates = [
    actionPayloadText(candidate, ["buyer_ask", "negotiation_language"]),
    candidate.finding_summary,
    candidate.next_action,
    candidate.blocker_if_missing,
  ];
  const body = candidates
    .map((value) => value?.trim() ?? "")
    .find((value) => value && value !== title);
  return body ?? "Open the governed contract record before outreach.";
}

function actionCardBasis(candidate: SourceContractActionCandidateRow) {
  const payloadBasis = actionPayloadText(candidate, ["evidence_family"]);
  if (payloadBasis) return humanizeEvidenceLabel(payloadBasis) ?? payloadBasis;
  if (
    candidate.deterministic_basis &&
    !isMachineEvidenceTokenText(candidate.deterministic_basis)
  )
    return candidate.deterministic_basis;
  return (
    humanizeEvidenceLabel(candidate.evidence_state) ?? "Loaded evidence row"
  );
}

function orderedActionRows(
  rows: readonly SourceContractActionCandidateRow[],
): SourceContractActionCandidateRow[] {
  return [...rows].sort(
    (left, right) =>
      actionSequenceRank(left) - actionSequenceRank(right) ||
      priorityRank(left.priority) - priorityRank(right.priority) ||
      sortableDate(left.decision_due_date) -
        sortableDate(right.decision_due_date) ||
      (numberFromDb(right.candidate_amount_usd) ?? 0) -
        (numberFromDb(left.candidate_amount_usd) ?? 0) ||
      left.action_candidate_id.localeCompare(right.action_candidate_id),
  );
}

function anchorContractScore(
  contract: SourceContract360Row | null,
  rows: readonly SourceContractActionCandidateRow[],
) {
  const contractText = [
    contract?.contract_id,
    contract?.vendor_name,
    contract?.vendor_category,
    contract?.contract_name,
    contract?.contract_archetype,
  ]
    .filter(Boolean)
    .join(" ");
  const actionSetText = rows.map(actionText).join(" ");
  if (/databricks|dbx/i.test(contractText)) return 4;
  if (/cloud|consumption|edp|marketplace|serverless|dbu/i.test(contractText)) {
    return 3;
  }
  if (
    /cloud|consumption|edp|marketplace|serverless|dbu/i.test(actionSetText)
  ) {
    return 2;
  }
  if (/managed service|ams|bpo/i.test(contractText)) return 0;
  return 1;
}

function anchorContractActionSet(
  portfolio: SourceWorkspacePortfolioData,
): FocusedActionSet & { contract: SourceContract360Row | null } {
  const byContract = new Map<string, SourceContractActionCandidateRow[]>();
  for (const row of portfolio.impact.actionCandidates) {
    const current = byContract.get(row.contract_id) ?? [];
    current.push(row);
    byContract.set(row.contract_id, current);
  }

  const ranked = [...byContract.entries()]
    .map(([contractId, rows]) => {
      const orderedRows = orderedActionRows(rows);
      const contract = contractById(portfolio, contractId);
      const text = orderedRows.map(actionText).join(" ");
      return {
        contract,
        contractId,
        rows: orderedRows,
        totalAmount: orderedRows.reduce(
          (sum, row) => sum + (numberFromDb(row.candidate_amount_usd) ?? 0),
          0,
        ),
        commitmentScore: /commit|notice|renew|ramp|consumption|usage/i.test(
          text,
        )
          ? 1
          : 0,
        anchorScore: anchorContractScore(contract, orderedRows),
      };
    })
    .sort(
      (left, right) =>
        right.anchorScore - left.anchorScore ||
        right.commitmentScore - left.commitmentScore ||
        right.rows.length - left.rows.length ||
        right.totalAmount - left.totalAmount ||
        left.contractId.localeCompare(right.contractId),
    );

  const anchor = ranked[0];
  if (!anchor) {
    return {
      contract: null,
      rows: [],
      remainderCount: 0,
      remainderAmount: 0,
      totalRows: 0,
      totalAmount: 0,
    };
  }

  const totalRows = portfolio.impact.actionCandidates.length;
  const totalAmount = portfolio.impact.actionCandidates.reduce(
    (sum, row) => sum + (numberFromDb(row.candidate_amount_usd) ?? 0),
    0,
  );
  return {
    contract: anchor.contract,
    rows: anchor.rows,
    remainderCount: totalRows - anchor.rows.length,
    remainderAmount: totalAmount - anchor.totalAmount,
    totalRows,
    totalAmount,
  };
}

function actionOrderTitle(count: number) {
  const noun = count === 1 ? "lever" : "levers";
  const subject = count === 1 ? "it has" : "they have";
  return `${count} ${noun}, in the order ${subject} to happen`;
}

function sourceCreditFunnel(
  portfolio: SourceWorkspacePortfolioData,
  creditFinding: number,
): CommandCreditFunnel {
  const calculated = portfolio.impact.evidenceCoverage.reduce(
    (sum, row) => sum + (numberFromDb(row.credit_calculated_usd) ?? 0),
    0,
  );
  const claimed = portfolio.impact.evidenceCoverage.reduce(
    (sum, row) => sum + (numberFromDb(row.credit_claimed_usd) ?? 0),
    0,
  );
  const recovered = portfolio.impact.evidenceCoverage.reduce(
    (sum, row) => sum + (numberFromDb(row.credit_recovered_usd) ?? 0),
    0,
  );
  const fallbackCalculated =
    calculated ||
    portfolio.v4Snapshot.performanceCredits.unclaimedCredit +
      portfolio.v4Snapshot.performanceCredits.creditRecovered;
  const fallbackRecovered =
    recovered || portfolio.v4Snapshot.performanceCredits.creditRecovered;
  return {
    calculated: fallbackCalculated,
    claimed,
    recovered: fallbackRecovered,
    unclaimed: creditFinding,
  };
}

function creditFunnelSteps(funnel: CommandCreditFunnel) {
  const maxValue = Math.max(
    1,
    funnel.calculated,
    funnel.claimed,
    funnel.recovered,
    funnel.unclaimed,
  );
  return [
    { label: "Calculated", value: funnel.calculated },
    { label: "Claimed", value: funnel.claimed },
    { label: "Recovered", value: funnel.recovered },
    { label: "Unclaimed", value: funnel.unclaimed },
  ].map((step) => ({
    ...step,
    scalePct: Math.max(2, Math.round((step.value / maxValue) * 100)),
  }));
}

function commandExecutiveRead(
  portfolio: SourceWorkspacePortfolioData,
  creditFunnel: CommandCreditFunnel,
  actionSet: FocusedActionSet,
  impactLoadState: ImpactLoadState,
) {
  const storyline = storylineBySurface(portfolio, "overview");
  if (impactLoadState === "loading") {
    return {
      title: "Evidence depth is still loading.",
      body: "Source is holding action claims until the governed impact layer finishes hydrating.",
    };
  }
  if (creditFunnel.unclaimed > 0) {
    return {
      title: `${impactCreditMoney(creditFunnel.unclaimed)} is calculated but not recovered.`,
      body: "The gap is operational: calculated credit evidence exists, but the finance handoff and claim state are separate from the contract register.",
    };
  }
  if (actionSet.totalRows > 0) {
    return {
      title: `${actionSet.totalRows} governed actions are loaded.`,
      body: `${money(actionSet.totalAmount)} is candidate value in the action layer. Source keeps it out of realized savings until finance confirmation and approval are recorded.`,
    };
  }
  return {
    title: storyline?.headline ?? portfolio.cockpit.verdict.headline,
    body:
      storyline?.allowed_executive_statement ??
      portfolio.cockpit.verdict.decidingAxis,
  };
}

function topVendorShareLabel(
  portfolio: SourceWorkspacePortfolioData,
  totalAnnualValue: number | null,
) {
  if (!totalAnnualValue || totalAnnualValue <= 0) return "not established";
  const topThree = topVendors(portfolio)
    .slice(0, 3)
    .reduce((sum, vendor) => sum + (numberFromDb(vendor.annual_value) ?? 0), 0);
  return `${Math.min(100, Math.round((topThree / totalAnnualValue) * 100))}%`;
}

function parseDateStampFromText(value: string | null | undefined) {
  if (!value) return null;
  const text = value.trim();
  const dashed = text.match(/\b(20\d{2})[-_](0[1-9]|1[0-2])[-_]([0-3]\d)\b/);
  const compact = text.match(/\b(20\d{2})(0[1-9]|1[0-2])([0-3]\d)\b/);
  const match = dashed ?? compact;
  if (!match) return null;
  const iso = `${match[1]}-${match[2]}-${match[3]}`;
  const time = new Date(`${iso}T00:00:00Z`).getTime();
  return Number.isNaN(time) ? null : iso;
}

function sourceDateControl(portfolio: SourceWorkspacePortfolioData) {
  const loadRunDates = [
    ...portfolio.impact.actionCandidates.map((row) => row.load_run_id),
    ...portfolio.impact.evidenceCoverage.map((row) => row.load_run_id),
    ...portfolio.impact.vendorPositions.map((row) => row.load_run_id),
  ]
    .map(parseDateStampFromText)
    .filter((value): value is string => Boolean(value));
  const sortedLoadRunDates = loadRunDates.sort();
  const refreshedIso =
    sortedLoadRunDates.length > 0
      ? sortedLoadRunDates[sortedLoadRunDates.length - 1]
      : null;
  if (refreshedIso) {
    return {
      ariaLabel: "Source freshness",
      label: "Refreshed",
      value: fmtDate(refreshedIso),
    };
  }
  if (portfolio.asOfDateIso?.startsWith("2027-06-30")) {
    return {
      ariaLabel: "Source scenario date",
      label: "Scenario date",
      value: fmtDate(portfolio.asOfDateIso),
    };
  }
  return {
    ariaLabel: "Data as of",
    label: "As of",
    value: fmtDate(portfolio.asOfDateIso),
  };
}

function sortableDate(value: string | null | undefined) {
  if (!value) return Number.POSITIVE_INFINITY;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
}

function daysBetweenIso(
  fromIso: string | null | undefined,
  toIso: string | null | undefined,
) {
  if (!fromIso || !toIso) return null;
  const from = new Date(fromIso);
  const to = new Date(toIso);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;
  return Math.ceil((to.getTime() - from.getTime()) / 86_400_000);
}

function decisionDueLabel(
  candidate: SourceContractActionCandidateRow,
  asOfDateIso: string,
) {
  const days = daysBetweenIso(asOfDateIso, candidate.decision_due_date);
  if (days == null)
    return candidate.decision_due_date
      ? fmtDate(candidate.decision_due_date)
      : (actionPayloadText(candidate, [
          "timing_dependency",
          "timingDependency",
          "deadline",
          "next_step",
          "nextStep",
        ]) ?? "Timing gate not loaded");
  if (days < 0) return `${Math.abs(days)} days late`;
  if (days === 0) return "due today";
  return `${days} days`;
}

function actionCitationSummary(
  candidate: SourceContractActionCandidateRow,
  coverage: SourceContractEvidenceCoverageRow | null,
) {
  const citationLabelByKey: Record<string, string> = {
    contract_ref: "contract record",
    finance_confirmation_state: "finance gate",
    opportunity_ref: "opportunity record",
    payload: "loaded opportunity payload",
  };
  const citationLabels = candidate.citation_basis_json
    ? Object.keys(candidate.citation_basis_json)
        .map((key) => citationLabelByKey[key])
        .filter((value): value is string => Boolean(value))
    : [];
  const rowBits = coverage
    ? [
        `${coverage.spend_rows} spend rows`,
        `${coverage.performance_rows} performance rows`,
        `${coverage.document_page_text_rows} document text rows`,
        `${coverage.scope_rows} scope rows`,
      ]
    : [];
  return (
    [...rowBits, ...new Set(citationLabels)]
      .filter((value) => !/^0 /.test(value))
      .join(" · ") || "No detailed citation row is loaded for this action."
  );
}

export function vendorReadinessDecisionRows(
  portfolio: SourceWorkspacePortfolioData,
) {
  const rows =
    portfolio.impact.vendorPositions.length > 0
      ? portfolio.impact.vendorPositions
      : topVendors(portfolio).map(
          (vendor): SourceVendorPositionRow => ({
            tenant_key: portfolio.tenantKey,
            vendor_ref: vendor.vendor_ref,
            vendor_name: safeVendorDisplayName(
              vendor.vendor_name,
              vendor.vendor_ref,
            ),
            vendor_category: vendor.vendor_category,
            contract_count: vendor.contract_count,
            annual_value: numberFromDb(vendor.annual_value),
            total_committed_value: numberFromDb(vendor.total_committed_value),
            auto_renew_contracts: vendor.auto_renew_contracts,
            next_end_date: vendor.next_end_date,
            contract_refs: vendor.contract_refs,
            action_candidate_count: 0,
            candidate_amount_usd: 0,
            not_confirmed_count: 0,
            decision_ready_contracts: 0,
            unclaimed_credit_usd: 0,
            spend_rows: 0,
            performance_rows: 0,
            vendor_position_state: "not_loaded",
            load_run_id: null,
          }),
        );
  return rows
    .slice()
    .sort(
      (left, right) =>
        (numberFromDb(right.candidate_amount_usd) ?? 0) -
          (numberFromDb(left.candidate_amount_usd) ?? 0) ||
        (numberFromDb(right.annual_value) ?? 0) -
          (numberFromDb(left.annual_value) ?? 0),
    )
    .slice(0, 8)
    .map((row) => {
      const annualValue = numberFromDb(row.annual_value) ?? 0;
      const readiness =
        row.contract_count > 0
          ? Math.min(
              100,
              (row.decision_ready_contracts / row.contract_count) * 100,
            )
          : 0;
      const candidateValue = numberFromDb(row.candidate_amount_usd) ?? 0;
      const evidenceBits = [
        row.spend_rows > 0 ? `${row.spend_rows} spend` : null,
        row.performance_rows > 0 ? `${row.performance_rows} performance` : null,
        row.unclaimed_credit_usd > 0 ? "credit gap" : null,
      ].filter((value): value is string => Boolean(value));
      return {
        vendorRef: row.vendor_ref,
        vendorName: compactVendorName(
          safeVendorDisplayName(row.vendor_name, row.vendor_ref),
        ),
        annualValueLabel: money(annualValue),
        candidateValueLabel:
          candidateValue > 0 ? money(candidateValue) : "No candidate value",
        actionLabel:
          row.action_candidate_count > 0
            ? `${row.action_candidate_count} action${row.action_candidate_count === 1 ? "" : "s"}`
            : "No action row",
        evidenceLabel:
          evidenceBits.length > 0
            ? evidenceBits.join(" · ")
            : "No depth evidence",
        postureLabel:
          humanizeEvidenceLabel(row.vendor_position_state) ?? "Not loaded",
        readinessLabel:
          row.contract_count > 0
            ? `${row.decision_ready_contracts}/${row.contract_count} ready · ${Math.round(readiness)}%`
            : "No governed contracts",
        valueLabel: money(annualValue),
        tone: /ready|action|credit/i.test(row.vendor_position_state)
          ? "ready"
          : row.action_candidate_count > 0
            ? "partial"
            : "thin",
      };
    });
}

export function WorkspaceExecutiveShell({
  vm,
  logic,
  portfolio,
  tenantName,
  sourceClientKey,
  sourceProviderKey,
  impactLoadState = "ready",
}: {
  vm: SourceWorkspaceVM;
  logic: WorkspaceViewModel;
  portfolio: SourceWorkspacePortfolioData;
  tenantName: string;
  sourceClientKey?: string | null;
  sourceProviderKey?: SourceWorkspaceProviderMode | null;
  impactLoadState?: ImpactLoadState;
}) {
  const [showLineage, setShowLineage] = useState(false);
  const [openActionCandidateId, setOpenActionCandidateId] = useState<
    string | null
  >(null);
  const mainRef = useRef<HTMLElement | null>(null);
  const executiveVendors = useMemo(() => topVendors(portfolio), [portfolio]);
  const totalAnnualValue = useMemo(
    () => portfolioAnnualValue(portfolio),
    [portfolio],
  );
  const recoverableCreditRows = useMemo(
    () => source360RecoverableCreditCoverageRows(portfolio),
    [portfolio],
  );
  // Selecting a contract not present in the preloaded portfolio slice (e.g. a
  // row opened from Optimize's Queue/By contract views, which only summarize
  // the top N contracts inline -- most of the 230-contract book is not in
  // `portfolio.contracts`) used to silently fall through to the default
  // contract below, even though `fetchContractDetail` had already loaded the
  // right record into `logic.state.contractDetail`. `vm.c` cannot be used to
  // find that fetched record: `buildViewModel` derives `vm.c` from the same
  // preloaded slice, so it is also null for these contracts. Read the raw
  // selected id off `logic.state.sel` instead, and consult the fetched detail
  // before giving up and defaulting.
  const selectedContractId =
    logic.state.sel.kind === "contract" ? logic.state.sel.id : null;
  const fetchedContractDetail = selectedContractId
    ? logic.state.contractDetail[selectedContractId]
    : undefined;
  const fetchedContract: SourceContract360Row | null =
    fetchedContractDetail && typeof fetchedContractDetail === "object"
      ? (fetchedContractDetail as Contract360Response).contract
      : null;
  const selectedContract =
    (selectedContractId
      ? (portfolio.contracts.find(
          (contract) => contract.contract_id === selectedContractId,
        ) ?? fetchedContract)
      : null) ??
    (selectedContractId
      ? null
      : (preferredContract(portfolio) ?? portfolio.contracts[0] ?? null));
  const currentPage = activePage(logic, vm);
  const selectedVendorRef =
    logic.state.sel.kind === "vendor"
      ? logic.state.sel.id
      : vm.isContract
        ? (selectedContract?.vendor_ref ?? null)
        : null;
  const selectedVendor = resolveSelectedVendor(
    portfolio,
    executiveVendors,
    selectedVendorRef,
  );
  const headerContract = vm.isContract ? selectedContract : null;
  const openActionCandidate = openActionCandidateId
    ? (portfolio.impact.actionCandidates.find(
        (row) => row.action_candidate_id === openActionCandidateId,
      ) ?? null)
    : null;
  const creditFinding = useMemo(
    () => source360RecoverableCreditFinding(portfolio),
    [portfolio],
  );
  const spendRows =
    sourceImpactCoverageRowTotal(
      portfolio.impact.evidenceCoverage,
      "spend_rows",
    ) || portfolio.v4Snapshot.spendConsumption.rowCount;
  const performanceRows =
    sourceImpactCoverageRowTotal(
      portfolio.impact.evidenceCoverage,
      "performance_rows",
    ) || portfolio.v4Snapshot.performanceCredits.rowCount;
  const performanceCreditContract = [...recoverableCreditRows].sort(
    (left, right) =>
      (numberFromDb(right.unclaimed_credit_usd) ?? 0) -
        (numberFromDb(left.unclaimed_credit_usd) ?? 0) ||
      (numberFromDb(right.performance_rows) ?? 0) -
        (numberFromDb(left.performance_rows) ?? 0) ||
      left.contract_id.localeCompare(right.contract_id),
  )[0];
  const performanceCreditContract360 = performanceCreditContract
    ? portfolio.contracts.find(
        (contract) =>
          contract.contract_id === performanceCreditContract.contract_id,
      )
    : null;
  const performanceCreditCounterparty =
    safeVendorDisplayName(
      performanceCreditContract360?.vendor_name ??
        performanceCreditContract?.vendor_name,
      performanceCreditContract?.vendor_ref,
    ) ||
    performanceCreditContract?.contract_id ||
    "Selected contract";
  const findingContract =
    creditFinding > 0
      ? performanceCreditContract
        ? {
            contractId: performanceCreditContract.contract_id,
            counterparty: performanceCreditCounterparty,
            deadlineLabel: "Not established",
          }
        : (portfolio.cockpit.actionQueue.find((row) =>
            /credit/i.test(`${row.actionVerb} ${row.why}`),
          ) ??
          portfolio.cockpit.actionQueue[0] ??
          null)
      : null;
  const sourceContextLabel =
    headerContract && currentPage === "Contracts"
      ? headerContract.contract_id
      : currentPage;
  const isCommandCenter = !selectedContractId;
  const dateControl = sourceDateControl(portfolio);

  const resetMainScroll = useCallback(() => {
    const schedule =
      typeof requestAnimationFrame === "function"
        ? requestAnimationFrame
        : (callback: FrameRequestCallback) => {
            window.setTimeout(() => callback(Date.now()), 0);
            return 0;
          };
    schedule(() => {
      mainRef.current?.scrollTo?.({ top: 0, left: 0, behavior: "auto" });
    });
  }, []);

  const workspaceHrefFor = (page: PageLabel) => {
    const params = new URLSearchParams();
    params.set("workspaceTab", page.toLowerCase());
    if (sourceClientKey?.trim()) params.set("client", sourceClientKey.trim());
    if (sourceProviderKey?.trim()) {
      params.set("sourceProvider", sourceProviderKey.trim());
    }
    return `/source?${params.toString()}`;
  };

  const selectPage = (page: PageLabel) => {
    if (page === "Command") {
      logic.select("portfolio", null, "Portfolio");
      resetMainScroll();
      return;
    }
    if (page === "Coverage") {
      logic.select("vendorList", null);
      resetMainScroll();
      return;
    }
    if (page === "Contracts") {
      logic.select("contractList", null);
      resetMainScroll();
      return;
    }
    if (page === "Evidence") {
      logic.select("evidence", null, "Coverage");
      resetMainScroll();
      return;
    }
    if (page === "Levers") {
      logic.select("optimize", null, logic.state.tabs.optimize ?? "Queue");
      resetMainScroll();
      return;
    }
  };

  const openContract = (contractId: string, tab: string = "Story") => {
    logic.select("contract", contractId, tab);
    resetMainScroll();
  };

  const openVendor = (vendorRef: string) => {
    logic.select("vendor", vendorRef);
    resetMainScroll();
  };
  const returnToSource360 = () => {
    logic.select("portfolio", null, "Portfolio");
    resetMainScroll();
  };

  return (
    <main className="sw-v2-shell" aria-label="Source workspace">
      <section ref={mainRef} className="sw-v2-main">
        <header className="sw-v2-topbar">
          <div>
            <div className="sw-v2-breadcrumb">
              <button type="button" onClick={returnToSource360}>
                Source 360
              </button>
              <span>/ {sourceContextLabel}</span>
            </div>
            <div className="sw-v2-context">
              {isCommandCenter
                ? `IT Sourcing · FY26 · ${tenantName || "Current workspace"}`
                : `${tenantName || "Current workspace"} · governed contract book`}
            </div>
            <h1>
              {headlineFor(
                currentPage,
                tenantName,
                portfolio,
                selectedVendor,
                headerContract,
              )}
            </h1>
            <p>
              {subheadFor(
                currentPage,
                portfolio,
                selectedVendor,
                headerContract,
              )}
            </p>
          </div>
          <div className="sw-v2-controls" aria-label="Workspace controls">
            <div className="sw-v2-control" aria-label="Scope filter">
              <span>Scope</span>
              <b>All loaded contracts</b>
            </div>
            <div className="sw-v2-control" aria-label={dateControl.ariaLabel}>
              <span>{dateControl.label}</span>
              <b>{dateControl.value}</b>
            </div>
            <div className="sw-v2-control" aria-label="Evidence depth status">
              <span>Evidence depth</span>
              <ImpactLoadBadge state={impactLoadState} />
            </div>
          </div>
        </header>

        {selectedContractId && selectedContract ? (
          <ContractCommandBar
            activeTab={logic.state.tabs.contract ?? "Story"}
            contract={selectedContract}
            onBackToContracts={() => logic.select("contractList", null)}
            onOpenPortfolioPage={selectPage}
            onOpenTab={(tab) => logic.setTab("contract", tab)}
          />
        ) : (
          <nav
            className="sw-v2-horizontal-tabs"
            aria-label="Source workspace navigation"
          >
            {PAGE_LABELS.map((label) => (
              <a
                key={label}
                role="button"
                href={workspaceHrefFor(label)}
                className={label === currentPage ? "is-active" : ""}
                onClick={() => selectPage(label)}
              >
                <span>{label}</span>
              </a>
            ))}
          </nav>
        )}

        {selectedContractId || currentPage !== "Command" ? null : (
          <SourceCommandKpiStrip
            portfolio={portfolio}
            totalAnnualValue={totalAnnualValue}
            creditFinding={creditFinding}
          />
        )}

        <section
          className={`sw-v2-content-canvas${
            selectedContractId ? " is-contract-detail" : ""
          }`}
          aria-label="Source 360 canvas"
        >
          {currentPage === "Command" ? (
            <PortfolioPage
              portfolio={portfolio}
              creditFinding={creditFinding}
              findingContract={findingContract}
              performanceRows={performanceRows}
              spendRows={spendRows}
              impactLoadState={impactLoadState}
              showLineage={showLineage}
              onToggleLineage={() => setShowLineage((current) => !current)}
              onOpenContract={openContract}
              onOpenCoverage={() => selectPage("Coverage")}
              onOpenAction={(candidateId) =>
                setOpenActionCandidateId(candidateId)
              }
            />
          ) : null}

          {currentPage === "Coverage" && logic.state.sel.kind === "vendor" ? (
            <VendorsPage
              portfolio={portfolio}
              selectedVendor={selectedVendor}
              totalAnnualValue={totalAnnualValue}
              subtab={logic.state.tabs.vendorList ?? "Concentration"}
              onOpenSubtab={(tab) => logic.setTab("vendorList", tab)}
              onOpenVendor={openVendor}
              onOpenContract={openContract}
            />
          ) : null}

          {currentPage === "Coverage" && logic.state.sel.kind !== "vendor" ? (
            <CoveragePage
              portfolio={portfolio}
              onOpenVendor={openVendor}
            />
          ) : null}

          {currentPage === "Contracts" ? (
            vm.isContract ? (
              selectedContract ? (
                <ContractPage
                  vm={vm}
                  logic={logic}
                  portfolio={portfolio}
                  contract={selectedContract}
                />
              ) : (
                <ContractDetailLoadState
                  contractId={selectedContractId}
                  state={fetchedContractDetail}
                />
              )
            ) : (
              <ContractsPage
                portfolio={portfolio}
                subtab={logic.state.tabs.contractList ?? "Table"}
                onOpenSubtab={(tab) => logic.setTab("contractList", tab)}
                onOpenContract={openContract}
              />
            )
          ) : null}

          {currentPage === "Levers" && !selectedContractId ? (
            <OptimizePage
              portfolio={portfolio}
              subtab={logic.state.tabs.optimize ?? "Queue"}
              onOpenSubtab={(tab) => logic.setTab("optimize", tab)}
              onOpenAction={(candidateId) =>
                setOpenActionCandidateId(candidateId)
              }
              onOpenContract={openContract}
            />
          ) : null}

          {currentPage === "Evidence" ? (
            <EvidencePage
              portfolio={portfolio}
              showLineage={showLineage}
              onToggleLineage={() => setShowLineage((current) => !current)}
            />
          ) : null}
        </section>
        <SourceActionDrawer
          candidate={openActionCandidate}
          coverage={
            openActionCandidate
              ? coverageForContract(portfolio, openActionCandidate.contract_id)
              : null
          }
          asOfDateIso={portfolio.asOfDateIso}
          onClose={() => setOpenActionCandidateId(null)}
          onOpenContract={openContract}
        />
      </section>
    </main>
  );
}

function ImpactLoadBadge({ state }: { state: ImpactLoadState }) {
  const label =
    state === "loading"
      ? "Evidence depth updating"
      : state === "error"
        ? "Evidence depth retry needed"
        : "Evidence depth ready";
  return (
    <div
      className={`sw-v2-impact-load-badge is-${state}`}
      role="status"
      aria-live="polite"
    >
      {label}
    </div>
  );
}

function SourceCommandKpiStrip({
  portfolio,
  totalAnnualValue,
  creditFinding,
}: {
  portfolio: SourceWorkspacePortfolioData;
  totalAnnualValue: number | null;
  creditFinding: number;
}) {
  const topVendorShare = topVendorShareLabel(portfolio, totalAnnualValue);
  const commitmentRow = primaryCommitmentAction(portfolio);
  const commitmentCoverage = commitmentRow
    ? coverageForContract(portfolio, commitmentRow.contract_id)
    : null;
  const commitmentContract = commitmentRow
    ? contractById(portfolio, commitmentRow.contract_id)
    : null;
  const committedAmount =
    numberFromDb(commitmentCoverage?.committed_spend_usd) ??
    numberFromDb(commitmentContract?.total_committed_value) ??
    numberFromDb(commitmentContract?.committed_annual_spend);
  const actualAmount =
    numberFromDb(commitmentCoverage?.actual_spend_usd) ??
    numberFromDb(commitmentContract?.actual_annual_spend);
  const utilization =
    committedAmount && committedAmount > 0 && actualAmount != null
      ? `${Math.round((actualAmount / committedAmount) * 1000) / 10}%`
      : "Usage not established";
  const decisionRows = focusedActionSet(portfolio);
  const readyRows = portfolio.impact.actionCandidates.filter((row) =>
    /ready|approved|complete/i.test(
      `${row.readiness_state ?? ""} ${row.authority_state ?? ""}`,
    ),
  ).length;
  const financeBlockedRows = portfolio.impact.actionCandidates.filter((row) =>
    /not_confirmed|finance/i.test(row.finance_confirmation_state ?? ""),
  ).length;

  return (
    <section className="sw-v2-command-kpis" aria-label="Source command KPIs">
      <Metric
        label="Contracted value"
        value={money(totalAnnualValue)}
        note={`${portfolio.contracts.length} contracts · ${portfolio.vendors.length} vendors · top 3 vendors ${topVendorShare}`}
      />
      <Metric
        label="Commitment at risk"
        value={impactCreditMoney(commitmentRow?.candidate_amount_usd)}
        note={
          commitmentRow
            ? `${safeVendorDisplayName(commitmentRow.vendor_name, commitmentRow.vendor_ref)} · ${utilization} consumed`
            : "No commitment-timing action is loaded."
        }
        tone={commitmentRow ? "warn" : undefined}
      />
      <Metric
        label="Unclaimed credit"
        value={impactCreditMoney(creditFinding)}
        note={
          creditFinding > 0
            ? "Calculated above recovered; finance confirmation stays separate."
            : "No unclaimed-credit row is loaded."
        }
        tone={creditFinding > 0 ? "warn" : undefined}
      />
      <Metric
        label="Decision posture"
        value={`${readyRows} ready`}
        note={`${decisionRows.totalRows} open actions · ${financeBlockedRows} finance checks`}
      />
    </section>
  );
}

function SourceActionDrawer({
  candidate,
  coverage,
  asOfDateIso,
  onClose,
  onOpenContract,
}: {
  candidate: SourceContractActionCandidateRow | null;
  coverage: SourceContractEvidenceCoverageRow | null;
  asOfDateIso: string;
  onClose: () => void;
  onOpenContract: (contractId: string, tab?: string) => void;
}) {
  if (!candidate) return null;
  const basis = actionCitationSummary(candidate, coverage);
  const defensible =
    actionPayloadText(candidate, [
      "vendor_concession",
      "native_vs_nexus_note",
      "negotiation_language",
    ]) ??
    (isMachineEvidenceTokenText(candidate.deterministic_basis)
      ? null
      : candidate.deterministic_basis) ??
    basis;
  const riskIfIgnored =
    actionPayloadText(candidate, ["risk_if_ignored"]) ??
    candidate.blocker_if_missing;
  return (
    <div className="sw-v2-action-drawer-shell" role="presentation">
      <button
        type="button"
        className="sw-v2-action-drawer-scrim"
        aria-label="Close action details"
        onClick={onClose}
      />
      <aside className="sw-v2-action-drawer" aria-label="Action details">
        <div className="sw-v2-action-drawer-head">
          <span>Governed action</span>
          <button type="button" onClick={onClose} aria-label="Close">
            Close
          </button>
        </div>
        <h2>{candidate.title ?? "Review candidate action"}</h2>
        <dl>
          <div>
            <dt>Worth</dt>
            <dd>{impactCreditMoney(candidate.candidate_amount_usd)}</dd>
          </div>
          <div>
            <dt>Deadline</dt>
            <dd>{decisionDueLabel(candidate, asOfDateIso)}</dd>
          </div>
          <div>
            <dt>Accountable</dt>
            <dd>{candidate.accountable_role ?? "Not established"}</dd>
          </div>
          <div>
            <dt>Readiness</dt>
            <dd>{candidate.readiness_state ?? candidate.evidence_state}</dd>
          </div>
        </dl>
        <section>
          <span>The ask</span>
          <p>{candidate.next_action ?? candidate.finding_summary}</p>
        </section>
        <section>
          <span>Why it is defensible</span>
          <p>{defensible}</p>
        </section>
        <section>
          <span>What backs it</span>
          <p>{basis}</p>
        </section>
        {riskIfIgnored ? (
          <section>
            <span>If ignored</span>
            <p>{riskIfIgnored}</p>
          </section>
        ) : null}
        <div className="sw-v2-action-drawer-foot">
          <button
            type="button"
            className="sw-v2-primary"
            onClick={() => {
              onOpenContract(candidate.contract_id, "Optimize");
              onClose();
            }}
          >
            Open Contract 360
          </button>
        </div>
      </aside>
    </div>
  );
}

function PortfolioPage({
  portfolio,
  creditFinding,
  findingContract,
  performanceRows,
  spendRows,
  impactLoadState,
  showLineage,
  onToggleLineage,
  onOpenContract,
  onOpenCoverage,
  onOpenAction,
}: {
  portfolio: SourceWorkspacePortfolioData;
  creditFinding: number;
  findingContract: {
    contractId: string;
    counterparty: string;
    deadlineLabel: string;
  } | null;
  performanceRows: number;
  spendRows: number;
  impactLoadState: ImpactLoadState;
  showLineage: boolean;
  onToggleLineage: () => void;
  onOpenContract: (contractId: string, tab?: string) => void;
  onOpenCoverage: () => void;
  onOpenAction: (candidateId: string) => void;
}) {
  const actionSet = focusedActionSet(portfolio);
  const creditFunnel = sourceCreditFunnel(portfolio, creditFinding);
  const commandRead = commandExecutiveRead(
    portfolio,
    creditFunnel,
    actionSet,
    impactLoadState,
  );
  const portfolioContractIds = new Set(
    portfolio.contracts.map((contract) => contract.contract_id),
  );
  const depthContractIds = new Set([
    ...portfolio.impact.evidenceCoverage.map((row) => row.contract_id),
    ...portfolio.impact.actionCandidates.map((row) => row.contract_id),
  ]);

  return (
    <div className="sw-v2-command-grid">
      <section className="sw-v2-panel sw-v2-command-read">
        <PanelHead eyebrow="This week's read" title={commandRead.title} />
        <p className="sw-v2-lede">{commandRead.body}</p>
        <LineageToggle
          showLineage={showLineage}
          onToggleLineage={onToggleLineage}
        />
        <div className="sw-v2-credit-funnel" aria-label="Credit funnel">
          {creditFunnelSteps(creditFunnel).map((step) => (
            <div key={step.label} className="sw-v2-credit-step">
              <span>{step.label}</span>
              <b>{impactCreditMoney(step.value)}</b>
              <div>
                <i
                  style={
                    {
                      "--sw-v2-fill": `${step.scalePct}%`,
                    } as CSSProperties
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="sw-v2-panel sw-v2-command-queue">
        <PanelHead
          eyebrow="Decision queue"
          title={`${actionSet.totalRows || portfolio.cockpit.actionQueue.length} governed actions`}
        />
        {impactLoadState === "loading" ? (
          <p className="sw-v2-muted">
            Evidence depth is still updating. Candidate actions and credit
            findings will appear after the governed impact layer finishes
            hydrating.
          </p>
        ) : impactLoadState === "error" ? (
          <p className="sw-v2-muted">
            Evidence depth did not finish loading. Source is withholding
            quantified action claims until the impact layer can be refreshed.
          </p>
        ) : actionSet.rows.length > 0 ? (
          <div className="sw-v2-command-decisions">
            {actionSet.rows.map((row) => (
              <button
                key={row.action_candidate_id}
                type="button"
                className="sw-v2-command-decision"
                onClick={() => onOpenAction(row.action_candidate_id)}
              >
                <span>
                  <b>{row.title ?? "Review candidate action"}</b>
                  <small>
                    {safeVendorDisplayName(row.vendor_name, row.vendor_ref)} ·{" "}
                    {row.contract_id}
                  </small>
                </span>
                <strong>{impactCreditMoney(row.candidate_amount_usd)}</strong>
                <em>{decisionDueLabel(row, portfolio.asOfDateIso)}</em>
              </button>
            ))}
            {actionSet.remainderCount > 0 ? (
              <p className="sw-v2-muted">
                {actionSet.remainderCount} further actions carry{" "}
                {money(actionSet.remainderAmount)} in candidate value.
              </p>
            ) : null}
          </div>
        ) : creditFinding > 0 && findingContract ? (
          <button
            type="button"
            className="sw-v2-command-decision"
            onClick={() =>
              onOpenContract(findingContract.contractId, "Optimize")
            }
          >
            <span>
              <b>Open the strongest credit finding</b>
              <small>{findingContract.contractId}</small>
            </span>
            <strong>{impactCreditMoney(creditFinding)}</strong>
            <em>{findingContract.deadlineLabel}</em>
          </button>
        ) : (
          <p className="sw-v2-muted">
            No quantified opportunity is loaded in the current deterministic
            slice.
          </p>
        )}
      </section>

      <section className="sw-v2-panel sw-v2-command-vendors">
        <PanelHead
          eyebrow="Where the money sits"
          title="Concentration still matters, but it is not the action order"
        />
        <VendorConcentrationChart
          vendors={topVendors(portfolio).slice(0, 5)}
          totalAnnualValue={portfolioAnnualValue(portfolio)}
        />
        <div className="sw-v2-vendor-strip">
          {topVendors(portfolio)
            .slice(0, 5)
            .map((vendor) => (
              <button
                key={vendor.vendor_ref}
                type="button"
                onClick={onOpenCoverage}
                style={
                  {
                    "--sw-v2-share": `${vendorShare(vendor, portfolioAnnualValue(portfolio))}%`,
                  } as CSSProperties
                }
              >
                <b>
                  {safeVendorDisplayName(vendor.vendor_name, vendor.vendor_ref)}
                </b>
                <span>
                  {money(numberFromDb(vendor.annual_value))} /{" "}
                  {vendor.contract_count} contracts
                </span>
              </button>
            ))}
        </div>
      </section>

      <section className="sw-v2-panel sw-v2-command-evidence">
        <PanelHead
          eyebrow="Evidence lanes"
          title="A row is useful only when its substrate is loaded"
        />
        <div className="sw-v2-command-lanes">
          <Fact label="Spend rows" value={String(spendRows)} />
          <Fact label="Performance rows" value={String(performanceRows)} />
          <Fact
            label="Contracts with depth"
            value={String(depthContractIds.size)}
          />
          <Fact
            label="Action candidates"
            value={String(portfolio.impact.actionCandidates.length)}
          />
          <Fact
            label="aVa grounding bundles"
            value={String(portfolio.impact.avaGroundingBundles.length)}
          />
          <Fact
            label="Register untouched"
            value={`${portfolioContractIds.size} contract headers`}
          />
        </div>
      </section>

      <section className="sw-v2-panel sw-v2-command-quality">
        <PanelHead
          eyebrow="What stays out"
          title="Thin records do not get rich narrative"
        />
        <div className="sw-v2-command-control-list">
          {portfolio.cockpit.claimQualityControls.map((control) => (
            <div key={control.label}>
              <Fact label={control.label} value={control.value} />
              <p className="sw-v2-muted">{control.note}</p>
            </div>
          ))}
          <p className="sw-v2-muted">
            Contract pages should show scope, economics, performance,
            relationship, and evidence narratives only when the corresponding
            load rows exist. Otherwise they should render a specific backfill
            request, not a reusable placeholder.
          </p>
        </div>
      </section>
    </div>
  );
}

function CoveragePage({
  portfolio,
  onOpenVendor,
}: {
  portfolio: SourceWorkspacePortfolioData;
  onOpenVendor: (vendorRef: string) => void;
}) {
  const readinessRows = vendorReadinessDecisionRows(portfolio);
  const archetypeCoverage = vendorArchetypeCoverage(portfolio);
  const archetypes = vendorArchetypeRows(portfolio).slice(0, 6);
  const mappedPct =
    archetypeCoverage.totalContracts > 0
      ? Math.round(
          (archetypeCoverage.declaredContracts /
            archetypeCoverage.totalContracts) *
            100,
        )
      : 0;

  return (
    <div className="sw-v2-coverage-grid">
      <section className="sw-v2-panel sw-v2-coverage-hero">
        <PanelHead
          eyebrow="Readiness by value"
          title="Big is not the same as ready"
        />
        <div
          className="sw-v2-readiness-table"
          aria-label="Vendor readiness by value"
        >
          <div className="sw-v2-readiness-head">
            <span>Vendor</span>
            <span>Recorded value</span>
            <span>Readiness</span>
            <span>Evidence</span>
            <span>Action value</span>
          </div>
          {readinessRows.map((row) => (
            <button
              key={row.vendorRef}
              type="button"
              className={`sw-v2-readiness-row is-${row.tone}`}
              onClick={() => onOpenVendor(row.vendorRef)}
              aria-label={`${row.vendorName}: ${row.readinessLabel}, ${row.valueLabel}`}
            >
              <span>
                <b>{row.vendorName}</b>
                <small>{row.postureLabel}</small>
              </span>
              <strong>{row.annualValueLabel}</strong>
              <span>
                <b>{row.readinessLabel}</b>
                <small>{row.actionLabel}</small>
              </span>
              <span>{row.evidenceLabel}</span>
              <strong>{row.candidateValueLabel}</strong>
            </button>
          ))}
        </div>
        <p className="sw-v2-muted">
          Ranked by loaded candidate action value first, then recorded annual
          value. A large vendor without an action row is an evidence backlog,
          not a work queue.
        </p>
      </section>

      <section className="sw-v2-panel">
        <PanelHead
          eyebrow="Archetype coverage"
          title={`${mappedPct}% mapped to a declared contract archetype`}
        />
        <div className="sw-v2-coverage-meter">
          <i
            style={
              {
                "--sw-v2-fill": `${mappedPct}%`,
              } as CSSProperties
            }
          />
        </div>
        <div className="sw-v2-fact-stack sw-v2-compact-facts">
          <Fact
            label="Declared"
            value={String(archetypeCoverage.declaredContracts)}
          />
          <Fact
            label="Unmapped register"
            value={String(archetypeCoverage.unmappedCount)}
          />
          <Fact
            label="Supplemental declared"
            value={String(archetypeCoverage.supplementalDeclaredCount)}
          />
        </div>
        {archetypeCoverage.unmappedCount > 0 ? (
          <p className="sw-v2-muted">
            Backfill unlock: every register header needs a declared archetype
            before Source can draw an archetype concentration chart without
            making an &quot;unclassified&quot; chart look meaningful.
          </p>
        ) : null}
      </section>

      <section className="sw-v2-panel sw-v2-coverage-archetypes">
        <PanelHead
          eyebrow="Declared plays"
          title="Archetype determines which levers are allowed"
        />
        <div className="sw-v2-archetype-list">
          {archetypes.map((row) => (
            <div key={row.category}>
              <span>{row.category.replace(/_/g, " ")}</span>
              <b>{money(row.annualValue)}</b>
              <small>
                {row.contractCount} contracts · {row.vendorCount} vendors
              </small>
            </div>
          ))}
          {archetypes.length === 0 ? (
            <p className="sw-v2-muted">
              No declared archetype rows are loaded yet.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function VendorsPage({
  portfolio,
  selectedVendor,
  totalAnnualValue,
  subtab,
  onOpenSubtab,
  onOpenVendor,
  onOpenContract,
}: {
  portfolio: SourceWorkspacePortfolioData;
  selectedVendor: ExecutiveVendorRow | null;
  totalAnnualValue: number | null;
  subtab: string;
  onOpenSubtab: (tab: string) => void;
  onOpenVendor: (vendorRef: string) => void;
  onOpenContract: (contractId: string, tab?: string) => void;
}) {
  const vendors = topVendors(portfolio);
  const selectedContracts = selectedVendor
    ? vendorLinkedContracts(focusableContractRows(portfolio), selectedVendor)
    : [];
  const selectedVendorPosition = selectedVendor
    ? portfolio.impact.vendorPositions.find(
        (vendor) => vendor.vendor_ref === selectedVendor.vendor_ref,
      )
    : null;
  const selectedVendorCoverage = selectedVendor
    ? coverageForVendor(selectedVendor, vendorCoverageRows(portfolio))
    : null;
  const registerContractIds = new Set(
    portfolio.contracts.map((contract) => contract.contract_id),
  );

  return (
    <div className="sw-v2-grid">
      <section className="sw-v2-panel sw-v2-span-2">
        <SubtabBar
          tabs={VENDOR_SUBTABS}
          active={subtab}
          onSelect={onOpenSubtab}
        />
        <PanelHead eyebrow="Vendor 360" title={vendorSubtabTitle(subtab)} />
        {subtab === "Evidence depth" ? (
          <div className="sw-v2-vendor-evidence-view">
            <VendorEvidenceDepthChart portfolio={portfolio} vendors={vendors} />
            <VendorEvidenceDepthTable
              portfolio={portfolio}
              vendors={vendors}
              selectedVendor={selectedVendor}
              onOpenVendor={onOpenVendor}
            />
          </div>
        ) : subtab === "Archetype mix" ? (
          <div className="sw-v2-vendor-archetype-view">
            <VendorArchetypeMixChart portfolio={portfolio} />
            <VendorArchetypeTable
              portfolio={portfolio}
              onOpenVendor={onOpenVendor}
            />
          </div>
        ) : (
          <div className="sw-v2-vendor-concentration-view">
            <VendorConcentrationChart
              vendors={vendors.slice(0, 5)}
              totalAnnualValue={totalAnnualValue}
            />
            <VendorConcentrationTable
              portfolio={portfolio}
              vendors={vendors}
              selectedVendor={selectedVendor}
              totalAnnualValue={totalAnnualValue}
              onOpenVendor={onOpenVendor}
            />
          </div>
        )}
      </section>

      <section className="sw-v2-panel">
        <PanelHead
          eyebrow="Selected vendor"
          title={
            selectedVendor
              ? safeVendorDisplayName(
                  selectedVendor.vendor_name,
                  selectedVendor.vendor_ref,
                )
              : "Select a vendor"
          }
        />
        {selectedVendor ? (
          <div className="sw-v2-vendor-summary">
            <div className="sw-v2-vendor-summary-hero">
              <span>
                {selectedVendor.vendor_category ?? "Category not established"}
              </span>
              <b>{money(numberFromDb(selectedVendor.annual_value))}</b>
              <small>
                {selectedVendor.contract_count} contracts /{" "}
                {formatShare(selectedVendor, totalAnnualValue)} of recorded
                annual value
              </small>
            </div>
            <div className="sw-v2-vendor-metric-grid">
              <Fact
                label="Auto-renewing"
                value={String(selectedVendor.auto_renew_contracts)}
              />
              <Fact
                label="Action rows"
                value={formatCount(selectedVendorCoverage?.actionRows)}
              />
              <Fact
                label="Unconfirmed action value"
                value={money(
                  numberFromDb(selectedVendorPosition?.candidate_amount_usd),
                )}
              />
              <Fact
                label="Unclaimed credits"
                value={money(selectedVendorCoverage?.unclaimedCredit ?? null)}
              />
              <Fact
                label="Spend rows"
                value={formatCount(selectedVendorCoverage?.spendRows)}
              />
              <Fact
                label="Performance rows"
                value={formatCount(selectedVendorCoverage?.performanceRows)}
              />
            </div>
            <div className="sw-v2-vendor-contracts">
              <span>Grouped contracts</span>
              {selectedContracts.length > 0 ? (
                selectedContracts.slice(0, 6).map((contract) => {
                  const isSupplemental = !registerContractIds.has(
                    contract.contract_id,
                  );
                  return (
                    <button
                      key={contract.contract_id}
                      type="button"
                      onClick={() => onOpenContract(contract.contract_id)}
                    >
                      <b>{contract.contract_id}</b>
                      <small>
                        {contract.contract_name ||
                          safeContractVendorDisplayName(contract)}
                      </small>
                      <strong>
                        {money(numberFromDb(contract.annual_value))}
                      </strong>
                      {isSupplemental ? (
                        <em className="sw-v2-vendor-depth-badge">
                          Depth layer
                        </em>
                      ) : null}
                    </button>
                  );
                })
              ) : (
                <p className="sw-v2-muted">
                  Contract-level rows are not materialized for this vendor
                  selection.
                </p>
              )}
              {selectedContracts.length > 6 ? (
                <p className="sw-v2-muted">
                  {selectedContracts.length - 6} more contract headers stay in
                  the grouped vendor rollup.
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="sw-v2-muted">
            Choose a row to see grouped contract headers.
          </p>
        )}
      </section>
    </div>
  );
}

function VendorEvidenceDepthChart({
  portfolio,
  vendors,
}: {
  portfolio: SourceWorkspacePortfolioData;
  vendors: readonly ExecutiveVendorRow[];
}) {
  const coverageByVendor = vendorCoverageRows(portfolio);
  const data = focusedVendorSet(portfolio, vendors, "evidence")
    .rows.map(({ vendor }) => {
      const coverage = coverageForVendor(vendor, coverageByVendor);
      return {
        name: safeVendorDisplayName(vendor.vendor_name, vendor.vendor_ref),
        shortName: compactVendorName(
          safeVendorDisplayName(vendor.vendor_name, vendor.vendor_ref),
        ),
        spendRows: coverage?.spendRows ?? 0,
        performanceRows: coverage?.performanceRows ?? 0,
        actionRows: coverage?.actionRows ?? 0,
      };
    })
    .filter((row) => row.spendRows + row.performanceRows + row.actionRows > 0);

  if (data.length === 0) {
    return (
      <ChartEmptyState
        label="Vendor evidence depth chart"
        title="No vendor evidence depth chart available."
        body="Source has no supplier-level spend, performance, or action rows for this view yet, so it keeps the chart empty rather than implying coverage."
      />
    );
  }

  return (
    <div
      className="sw-v2-recharts-card"
      aria-label="Vendor evidence depth chart"
    >
      <MeasuredChartFrame className="sw-v2-chart-frame-bar" height={238}>
        {(chartWidth, chartHeight) => (
          <BarChart
            data={data}
            width={chartWidth}
            height={chartHeight}
            layout="vertical"
            margin={{ top: 8, right: 24, bottom: 8, left: 4 }}
            barCategoryGap={12}
          >
            <CartesianGrid
              horizontal={false}
              stroke="rgba(10,10,11,0.12)"
              strokeDasharray="3 4"
            />
            <XAxis type="number" hide allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="shortName"
              width={142}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#5f5e5a", fontSize: 11, fontWeight: 700 }}
            />
            <Tooltip
              cursor={{ fill: "rgba(29,158,117,0.08)" }}
              contentStyle={{
                border: "1px solid #d3d1c7",
                borderRadius: 6,
                boxShadow: "0 10px 24px rgba(10,10,11,0.12)",
                color: "#2c2c2a",
              }}
            />
            <Bar
              dataKey="spendRows"
              stackId="depth"
              fill={SOURCE_CHART_PALETTE.ink}
              maxBarSize={38}
            />
            <Bar
              dataKey="performanceRows"
              stackId="depth"
              fill={SOURCE_CHART_PALETTE.teal}
              maxBarSize={38}
            />
            <Bar
              dataKey="actionRows"
              stackId="depth"
              fill={SOURCE_CHART_PALETTE.amber}
              radius={[0, 5, 5, 0]}
              maxBarSize={38}
            />
          </BarChart>
        )}
      </MeasuredChartFrame>
      <div className="sw-v2-recharts-legend">
        <span>
          <b>navy</b> spend rows
        </span>
        <span>
          <b>teal</b> performance rows
        </span>
        <span>
          <b>amber</b> action rows
        </span>
      </div>
    </div>
  );
}

function VendorArchetypeMixChart({
  portfolio,
}: {
  portfolio: SourceWorkspacePortfolioData;
}) {
  const data = vendorArchetypeRows(portfolio)
    .filter((row) => row.annualValue > 0)
    .slice(0, 6)
    .map((row) => ({
      name: row.category,
      shortName: compactVendorName(row.category),
      annualValue: row.annualValue,
      contracts: row.contractCount,
    }));

  const coverage = vendorArchetypeCoverage(portfolio);

  if (data.length === 0) {
    return (
      <ChartEmptyState
        label="Vendor archetype annual value chart"
        title="Archetype data not charted."
        body={`${coverage.totalContracts} contract headers stay in the register, but Source will not draw a concentration chart from an unmapped placeholder bucket.`}
      />
    );
  }

  return (
    <div
      className="sw-v2-recharts-card"
      aria-label="Vendor archetype annual value chart"
    >
      <MeasuredChartFrame className="sw-v2-chart-frame-bar" height={238}>
        {(chartWidth, chartHeight) => (
          <BarChart
            data={data}
            width={chartWidth}
            height={chartHeight}
            margin={{ top: 12, right: 24, bottom: 8, left: 4 }}
            barCategoryGap={16}
          >
            <CartesianGrid
              vertical={false}
              stroke="rgba(10,10,11,0.12)"
              strokeDasharray="3 4"
            />
            <XAxis
              dataKey="shortName"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#5f5e5a", fontSize: 10, fontWeight: 700 }}
            />
            <YAxis hide domain={[0, "dataMax"]} />
            <Tooltip
              cursor={{ fill: "rgba(186,117,23,0.08)" }}
              contentStyle={{
                border: "1px solid #d3d1c7",
                borderRadius: 6,
                boxShadow: "0 10px 24px rgba(10,10,11,0.12)",
                color: "#2c2c2a",
              }}
              formatter={(value, name) => {
                if (name === "contracts") {
                  return [String(value), "Contracts"];
                }
                return [
                  money(typeof value === "number" ? value : Number(value)),
                  "Annual value",
                ];
              }}
            />
            <Bar
              dataKey="annualValue"
              fill={SOURCE_CHART_PALETTE.ink}
              radius={[5, 5, 0, 0]}
              maxBarSize={46}
            >
              {data.map((row, index) => (
                <Cell
                  key={row.name}
                  fill={chartSeriesColor(index)}
                  opacity={Math.max(0.5, 1 - index * 0.08)}
                />
              ))}
            </Bar>
          </BarChart>
        )}
      </MeasuredChartFrame>
      <div className="sw-v2-recharts-legend">
        {data.slice(0, 4).map((row) => (
          <span key={row.name}>
            <b>{row.shortName}</b>
            {row.contracts} contracts
          </span>
        ))}
        {coverage.unmappedCount > 0 ? (
          <span>
            <b>{coverage.unmappedCount}</b>
            register headers unclassified
          </span>
        ) : null}
        {coverage.supplementalDeclaredCount > 0 ? (
          <span>
            <b>{coverage.supplementalDeclaredCount}</b>
            contract-depth rows classified
          </span>
        ) : null}
      </div>
    </div>
  );
}

function VendorConcentrationChart({
  vendors,
  totalAnnualValue,
}: {
  vendors: readonly ExecutiveVendorRow[];
  totalAnnualValue: number | null;
}) {
  const data = vendors.map((vendor) => {
    const annualValue = numberFromDb(vendor.annual_value) ?? 0;
    return {
      name: safeVendorDisplayName(vendor.vendor_name, vendor.vendor_ref),
      shortName: compactVendorName(
        safeVendorDisplayName(vendor.vendor_name, vendor.vendor_ref),
      ),
      annualValue,
      share: vendorShare(vendor, totalAnnualValue),
    };
  });

  if (data.length === 0) {
    return (
      <ChartEmptyState
        label="Vendor concentration chart"
        title="No vendor concentration chart available."
        body="No supplier rows with recorded annual value are loaded for this view, so Source withholds the chart and table ranking."
      />
    );
  }

  return (
    <div
      className="sw-v2-recharts-card"
      aria-label="Vendor concentration chart"
    >
      <MeasuredChartFrame className="sw-v2-chart-frame-bar" height={238}>
        {(chartWidth, chartHeight) => (
          <BarChart
            data={data}
            width={chartWidth}
            height={chartHeight}
            layout="vertical"
            margin={{ top: 8, right: 24, bottom: 8, left: 4 }}
            barCategoryGap={14}
          >
            <CartesianGrid
              horizontal={false}
              stroke="rgba(10,10,11,0.12)"
              strokeDasharray="3 4"
            />
            <XAxis type="number" hide domain={[0, "dataMax"]} />
            <YAxis
              type="category"
              dataKey="shortName"
              width={142}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#5f5e5a", fontSize: 11, fontWeight: 700 }}
            />
            <Tooltip
              cursor={{ fill: "rgba(186,117,23,0.08)" }}
              contentStyle={{
                border: "1px solid #d3d1c7",
                borderRadius: 6,
                boxShadow: "0 10px 24px rgba(10,10,11,0.12)",
                color: "#2c2c2a",
              }}
              formatter={(value) => [
                money(typeof value === "number" ? value : Number(value)),
                "Annual value",
              ]}
              labelFormatter={(_, rows) => rows[0]?.payload?.name ?? ""}
            />
            <Bar dataKey="annualValue" radius={[0, 5, 5, 0]} maxBarSize={34}>
              {data.map((row, index) => (
                <Cell
                  key={row.name}
                  fill={chartSeriesColor(index)}
                  opacity={Math.max(0.45, 1 - index * 0.12)}
                />
              ))}
            </Bar>
          </BarChart>
        )}
      </MeasuredChartFrame>
      <div className="sw-v2-recharts-legend">
        {data.map((row) => (
          <span key={row.name}>
            <b>{row.shortName}</b>
            {row.share > 0 ? ` ${row.share.toFixed(1)}%` : " share unavailable"}
          </span>
        ))}
      </div>
    </div>
  );
}

function ContractPerformanceTrendChart({
  periods,
}: {
  periods: readonly SourceContractPerformancePeriodRow[];
}) {
  const data = periods.slice(0, 12).map((row) => ({
    period: shortMonth(row.period_start),
    actual: numberFromDb(row.value_num),
    credit: numberFromDb(row.credit_calculated) ?? 0,
  }));

  if (data.length === 0) {
    return (
      <ChartEmptyState
        label="Contract performance trend chart"
        title="No performance trend chart available."
        body="This contract has no loaded period-by-period SLA rows, so Source will not draw a performance trend."
        compact
      />
    );
  }

  return (
    <div
      className="sw-v2-recharts-card sw-v2-recharts-card-compact"
      aria-label="Contract performance trend chart"
    >
      <MeasuredChartFrame className="sw-v2-chart-frame-line" height={224}>
        {(chartWidth, chartHeight) => (
          <LineChart
            data={data}
            width={chartWidth}
            height={chartHeight}
            margin={{ top: 12, right: 24, bottom: 8, left: 4 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="rgba(10,10,11,0.12)"
              strokeDasharray="3 4"
            />
            <XAxis
              dataKey="period"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#5f5e5a", fontSize: 10, fontWeight: 700 }}
            />
            <YAxis
              yAxisId="actual"
              domain={[80, 100]}
              width={38}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#5f5e5a", fontSize: 10, fontWeight: 700 }}
            />
            <YAxis yAxisId="credit" orientation="right" hide />
            <Tooltip
              cursor={{ stroke: "rgba(186,117,23,0.28)", strokeWidth: 1 }}
              contentStyle={{
                border: "1px solid #d3d1c7",
                borderRadius: 6,
                boxShadow: "0 10px 24px rgba(10,10,11,0.12)",
                color: "#2c2c2a",
              }}
              formatter={(value, name) => {
                if (name === "credit") {
                  return [
                    money(typeof value === "number" ? value : Number(value)),
                    "Credit calculated",
                  ];
                }
                return [`${Number(value).toFixed(1)}%`, "Actual"];
              }}
            />
            <Line
              yAxisId="actual"
              type="monotone"
              dataKey="actual"
              stroke={SOURCE_CHART_PALETTE.ink}
              strokeWidth={2.5}
              dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
              activeDot={{
                r: 5,
                stroke: SOURCE_CHART_PALETTE.amber,
                strokeWidth: 2,
              }}
              connectNulls
            />
            <Line
              yAxisId="credit"
              type="monotone"
              dataKey="credit"
              stroke={SOURCE_CHART_PALETTE.amber}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
            />
          </LineChart>
        )}
      </MeasuredChartFrame>
      <div className="sw-v2-recharts-legend">
        <span>
          <b>navy</b> actual SLA %
        </span>
        <span>
          <b>amber</b> calculated credits
        </span>
      </div>
    </div>
  );
}

function OptimizeTypeMixChart({
  rows,
}: {
  rows: readonly ReturnType<typeof optimizeTypeRows>[number][];
}) {
  const data = rows
    .filter((row) => row.amount > 0)
    .slice(0, 5)
    .map((row) => ({
      name: row.type,
      value: row.amount,
    }));

  if (data.length === 0) {
    return (
      <ChartEmptyState
        label="Optimize action type mix chart"
        title="No optimize type chart available."
        body="No quantified action rows are loaded for this view. Finance-confirmed value remains separate from this review queue."
        compact
      />
    );
  }

  return (
    <div
      className="sw-v2-recharts-card sw-v2-recharts-card-compact"
      aria-label="Optimize action type mix chart"
    >
      <MeasuredChartFrame className="sw-v2-chart-frame-donut" height={224}>
        {(chartWidth, chartHeight) => (
          <PieChart width={chartWidth} height={chartHeight}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={82}
              paddingAngle={3}
            >
              {data.map((row, index) => (
                <Cell
                  key={row.name}
                  fill={chartSeriesColor(index)}
                  opacity={Math.max(0.52, 1 - index * 0.13)}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                border: "1px solid #d3d1c7",
                borderRadius: 6,
                boxShadow: "0 10px 24px rgba(10,10,11,0.12)",
                color: "#2c2c2a",
              }}
              formatter={(value) => [
                money(typeof value === "number" ? value : Number(value)),
                "Candidate amount",
              ]}
            />
          </PieChart>
        )}
      </MeasuredChartFrame>
      <div className="sw-v2-recharts-legend">
        {data.map((row) => (
          <span key={row.name}>
            <b>{row.name}</b>
            {money(row.value)}
          </span>
        ))}
      </div>
    </div>
  );
}

function ChartEmptyState({
  label,
  title,
  body,
  compact,
}: {
  label: string;
  title: string;
  body: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`sw-v2-recharts-card ${compact ? "sw-v2-recharts-card-compact" : ""}`}
      aria-label={label}
      data-chart-empty="true"
    >
      <div className="sw-v2-chart-empty">
        <b>{title}</b>
        <p>{body}</p>
      </div>
    </div>
  );
}

function MeasuredChartFrame({
  className,
  height,
  children,
}: {
  className: string;
  height: number;
  children: (width: number, height: number) => ReactNode;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(620);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const syncWidth = () => {
      const nextWidth = Math.floor(frame.getBoundingClientRect().width);
      if (nextWidth > 0) {
        setWidth(nextWidth);
      }
    };

    syncWidth();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", syncWidth);
      return () => window.removeEventListener("resize", syncWidth);
    }

    const observer = new ResizeObserver(syncWidth);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const chartWidth = Math.max(280, width);

  return (
    <div
      ref={frameRef}
      className={`sw-v2-chart-frame ${className}`}
      data-chart-width={chartWidth}
    >
      <div className="sw-v2-chart-stage" style={{ height }}>
        {children(chartWidth, height)}
      </div>
    </div>
  );
}

function VendorConcentrationTable({
  portfolio,
  vendors,
  selectedVendor,
  totalAnnualValue,
  onOpenVendor,
}: {
  portfolio: SourceWorkspacePortfolioData;
  vendors: readonly ExecutiveVendorRow[];
  selectedVendor: ExecutiveVendorRow | null;
  totalAnnualValue: number | null;
  onOpenVendor: (vendorRef: string) => void;
}) {
  const focus = focusedVendorSet(portfolio, vendors, "concentration");
  return (
    <div className="sw-v2-table">
      <div className="sw-v2-table-head sw-v2-vendor-row">
        <span>Vendor</span>
        <span>Contracts</span>
        <span>Annual value</span>
        <span>Share</span>
        <span>Why listed</span>
      </div>
      {focus.rows.map(({ vendor, reason }) => (
        <button
          key={vendor.vendor_ref}
          type="button"
          className={`sw-v2-table-row sw-v2-vendor-row ${selectedVendor?.vendor_ref === vendor.vendor_ref ? "is-selected" : ""}`}
          onClick={() => onOpenVendor(vendor.vendor_ref)}
        >
          <span>
            <b>
              {safeVendorDisplayName(vendor.vendor_name, vendor.vendor_ref)}
            </b>
            <small>
              {vendor.vendor_category ?? "Category not established"}
            </small>
          </span>
          <span>{vendor.contract_count}</span>
          <span>{money(numberFromDb(vendor.annual_value))}</span>
          <span>{formatShare(vendor, totalAnnualValue)}</span>
          <span>{reason}</span>
        </button>
      ))}
      {focus.remainderCount > 0 ? (
        <div className="sw-v2-table-foot">
          <b>{focus.remainderCount} further vendor relationships</b>
          <span>
            {money(focus.remainderAnnualValue)} remains summarized in the
            portfolio rollup.
          </span>
        </div>
      ) : null}
    </div>
  );
}

function VendorEvidenceDepthTable({
  portfolio,
  vendors,
  selectedVendor,
  onOpenVendor,
}: {
  portfolio: SourceWorkspacePortfolioData;
  vendors: readonly ExecutiveVendorRow[];
  selectedVendor: ExecutiveVendorRow | null;
  onOpenVendor: (vendorRef: string) => void;
}) {
  const coverageByVendor = vendorCoverageRows(portfolio);
  const focus = focusedVendorSet(portfolio, vendors, "evidence");
  return (
    <div className="sw-v2-table">
      <div className="sw-v2-table-head sw-v2-vendor-depth-row">
        <span>Vendor</span>
        <span>Spend rows</span>
        <span>Performance rows</span>
        <span>Action rows</span>
        <span>Unclaimed credits</span>
      </div>
      {focus.rows.map(({ vendor }) => {
        const coverage = coverageForVendor(vendor, coverageByVendor);
        return (
          <button
            key={vendor.vendor_ref}
            type="button"
            className={`sw-v2-table-row sw-v2-vendor-depth-row ${selectedVendor?.vendor_ref === vendor.vendor_ref ? "is-selected" : ""}`}
            onClick={() => onOpenVendor(vendor.vendor_ref)}
          >
            <span>
              <b>
                {safeVendorDisplayName(vendor.vendor_name, vendor.vendor_ref)}
              </b>
              <small>{vendor.contract_count} contracts</small>
            </span>
            <span>{formatCount(coverage?.spendRows)}</span>
            <span>{formatCount(coverage?.performanceRows)}</span>
            <span>{formatCount(coverage?.actionRows)}</span>
            <span>{money(coverage?.unclaimedCredit ?? null)}</span>
          </button>
        );
      })}
      {focus.remainderCount > 0 || focus.unresolvedCount > 0 ? (
        <div className="sw-v2-table-foot">
          <b>{focus.depthReadyCount} vendor relationships have loaded depth.</b>
          <span>
            The remaining {focus.remainderCount} stay summarized until contract
            evidence rows are loaded beneath them.
            {focus.unresolvedCount > 0
              ? ` ${focus.unresolvedCount} unresolved supplier rows are withheld from the executive chart until their names resolve.`
              : ""}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function VendorArchetypeTable({
  portfolio,
  onOpenVendor,
}: {
  portfolio: SourceWorkspacePortfolioData;
  onOpenVendor: (vendorRef: string) => void;
}) {
  const rows = vendorArchetypeRows(portfolio);
  const coverage = vendorArchetypeCoverage(portfolio);
  return (
    <div className="sw-v2-table">
      <div className="sw-v2-table-head sw-v2-archetype-row">
        <span>Archetype</span>
        <span>Vendors</span>
        <span>Contracts</span>
        <span>Annual value</span>
        <span>Representative vendor</span>
      </div>
      {rows.map((row) => (
        <button
          key={row.category}
          type="button"
          className="sw-v2-table-row sw-v2-archetype-row"
          onClick={() => {
            if (row.vendorRef) onOpenVendor(row.vendorRef);
          }}
        >
          <span>
            <b>{row.category}</b>
            <small>Declared category; no inferred taxonomy override.</small>
          </span>
          <span>{row.vendorCount}</span>
          <span>{row.contractCount}</span>
          <span>{money(row.annualValue)}</span>
          <span>{row.vendorName ?? "Not established"}</span>
        </button>
      ))}
      {rows.length === 0 ? (
        <div className="sw-v2-empty-state">
          <span>Archetype coverage</span>
          <b>Declared archetype rows are not loaded yet.</b>
          <p>
            {coverage.unmappedCount} contracts remain in the governed register,
            but the archetype mix view is withheld until their category
            substrate is populated.
          </p>
        </div>
      ) : coverage.unmappedCount > 0 ? (
        <div className="sw-v2-table-foot">
          <b>
            {coverage.declaredContracts} contracts carry declared archetypes.
          </b>
          <span>
            {coverage.unmappedCount} register headers remain unclassified and
            are not collapsed into a placeholder bucket.
            {coverage.supplementalDeclaredCount > 0
              ? ` ${coverage.supplementalDeclaredCount} classified contract-depth rows are shown from the evidence layer.`
              : ""}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function ContractsPage({
  portfolio,
  subtab,
  onOpenSubtab,
  onOpenContract,
}: {
  portfolio: SourceWorkspacePortfolioData;
  subtab: string;
  onOpenSubtab: (tab: string) => void;
  onOpenContract: (contractId: string, tab?: string) => void;
}) {
  const [contractQuery, setContractQuery] = useState("");
  const normalizedQuery = contractQuery.trim().toLowerCase();
  const searchableContracts = useMemo(
    () => contractFinderRows(portfolio),
    [portfolio],
  );
  const matchingContracts = useMemo(() => {
    if (normalizedQuery.length < 2) return [];
    return searchableContracts
      .filter((contract) =>
        contract.searchText.some((value) => value.includes(normalizedQuery)),
      )
      .sort(
        (a, b) =>
          contractSearchRank(a, normalizedQuery) -
            contractSearchRank(b, normalizedQuery) ||
          b.evidenceScore - a.evidenceScore ||
          (b.sortValue ?? 0) - (a.sortValue ?? 0) ||
          a.contractId.localeCompare(b.contractId),
      );
  }, [normalizedQuery, searchableContracts]);

  return (
    <div className="sw-v2-grid">
      <section className="sw-v2-panel sw-v2-span-2">
        <SubtabBar
          tabs={CONTRACT_LIST_SUBTABS}
          active={subtab}
          onSelect={onOpenSubtab}
        />
        <PanelHead
          eyebrow="Contracts"
          title={contractListSubtabTitle(subtab)}
        />
        <div className="sw-v2-contract-finder">
          <label htmlFor="source-contract-search">Find a contract</label>
          <input
            id="source-contract-search"
            type="search"
            value={contractQuery}
            onChange={(event) => setContractQuery(event.currentTarget.value)}
            placeholder="Search contract ID, vendor, or agreement"
            autoComplete="off"
          />
          <span>
            {normalizedQuery.length >= 2
              ? matchingContracts.length > 20
                ? `First 20 of ${matchingContracts.length} matching contracts`
                : `${matchingContracts.length} matching contracts`
              : [
                  `${portfolio.contracts.length} register contracts`,
                  `${searchableContracts.length - portfolio.contracts.length} supplemental depth contracts`,
                ].join("; ")}
          </span>
        </div>
        {normalizedQuery.length >= 2 ? (
          <ContractSearchResults
            contracts={matchingContracts.slice(0, 20)}
            query={contractQuery.trim()}
            onOpenContract={onOpenContract}
          />
        ) : subtab === "By evidence depth" ? (
          <ContractEvidenceDepthTable
            portfolio={portfolio}
            onOpenContract={onOpenContract}
          />
        ) : subtab === "By finance status" ? (
          <ContractFinancialPostureTable
            portfolio={portfolio}
            onOpenContract={onOpenContract}
          />
        ) : (
          <ContractListTable
            portfolio={portfolio}
            onOpenContract={onOpenContract}
          />
        )}
      </section>

      <section className="sw-v2-panel">
        <PanelHead
          eyebrow="Contract list guardrail"
          title="Rows before story"
        />
        <div className="sw-v2-fact-stack">
          <Fact label="Contracts" value={String(portfolio.contracts.length)} />
          <Fact
            label="Evidence coverage rows"
            value={String(portfolio.impact.evidenceCoverage.length)}
          />
          <Fact
            label="Action rows"
            value={String(portfolio.impact.actionCandidates.length)}
          />
          <Fact label="Finance confirmed" value="Not established" />
          <p className="sw-v2-muted">
            Open a contract row for Story, Scope, Economics, Performance,
            Relationship, Evidence, and Optimize detail.
          </p>
        </div>
      </section>
    </div>
  );
}

function ContractSearchResults({
  contracts,
  query,
  onOpenContract,
}: {
  contracts: readonly ContractFinderRow[];
  query: string;
  onOpenContract: (contractId: string, tab?: string) => void;
}) {
  if (contracts.length === 0) {
    return (
      <div className="sw-v2-empty-state">
        <b>No loaded contract matches “{query}”.</b>
        <p>Try a contract ID, vendor name, or agreement name.</p>
      </div>
    );
  }

  return (
    <div className="sw-v2-table" aria-label="Contract search results">
      <div className="sw-v2-table-head sw-v2-contract-search-row">
        <span>Contract</span>
        <span>Vendor</span>
        <span>Source</span>
        <span>Open</span>
      </div>
      {contracts.map((contract) => (
        <button
          key={contract.contractId}
          type="button"
          className="sw-v2-table-row sw-v2-contract-search-row"
          onClick={() => onOpenContract(contract.contractId)}
        >
          <span>
            <b>{contract.contractName}</b>
            <small>{contract.contractId}</small>
          </span>
          <span>{contract.vendorName}</span>
          <span>
            <b>{contract.sourceLabel}</b>
            <small>{contract.sourceDetail}</small>
          </span>
          <span>Contract 360</span>
        </button>
      ))}
    </div>
  );
}

export interface ContractFinderRow {
  readonly contractId: string;
  readonly contractName: string;
  readonly vendorName: string;
  readonly sourceLabel: string;
  readonly sourceDetail: string;
  readonly isSupplemental: boolean;
  readonly sortValue: number | null;
  readonly evidenceScore: number;
  readonly searchText: readonly string[];
}

export function contractSearchRank(contract: ContractFinderRow, query: string) {
  const normalizedId = contract.contractId.toLowerCase();
  const normalizedName = contract.contractName.toLowerCase();
  const normalizedVendor = contract.vendorName.toLowerCase();
  if (normalizedId === query) return 0;
  if (normalizedId.startsWith(query)) return 1;
  if (contract.isSupplemental && normalizedVendor.includes(query)) return 2;
  if (contract.isSupplemental && normalizedName.includes(query)) return 3;
  if (normalizedId.includes(query)) return 4;
  if (normalizedVendor.includes(query)) return 5;
  if (normalizedName.includes(query)) return 6;
  return 7;
}

function contractFinderRows(
  portfolio: SourceWorkspacePortfolioData,
): readonly ContractFinderRow[] {
  const rows = new Map<string, ContractFinderRow>();

  for (const contract of portfolio.contracts) {
    const vendorName = safeContractVendorDisplayName(contract);
    const annualValue = numberFromDb(contract.annual_value);
    rows.set(contract.contract_id, {
      contractId: contract.contract_id,
      contractName: contract.contract_name,
      vendorName,
      sourceLabel: "Governed register",
      sourceDetail: money(annualValue),
      isSupplemental: false,
      sortValue: annualValue,
      evidenceScore: 0,
      searchText: [
        contract.contract_id,
        contract.contract_name,
        vendorName,
      ].map((value) => value.toLowerCase()),
    });
  }

  for (const coverage of portfolio.impact.evidenceCoverage) {
    const existing = rows.get(coverage.contract_id);
    if (existing) continue;
    const vendorName = safeVendorDisplayName(
      coverage.vendor_name,
      coverage.vendor_ref,
    );
    const coverageState = coverage.coverage_state.replaceAll("_", " ");
    rows.set(coverage.contract_id, {
      contractId: coverage.contract_id,
      contractName: coverage.contract_name || "Contract depth record",
      vendorName,
      sourceLabel: "Supplemental depth",
      sourceDetail: `${coverageState}; outside the ${portfolio.contracts.length}-contract register`,
      isSupplemental: true,
      sortValue:
        numberFromDb(coverage.actual_spend_usd) ??
        numberFromDb(coverage.committed_spend_usd),
      evidenceScore:
        (numberFromDb(coverage.opportunity_rows) ?? 0) * 100 +
        (numberFromDb(coverage.spend_rows) ?? 0) * 10 +
        (numberFromDb(coverage.performance_rows) ?? 0) * 8 +
        (numberFromDb(coverage.document_page_text_rows) ?? 0) * 4,
      searchText: [
        coverage.contract_id,
        coverage.contract_name,
        vendorName,
        coverage.coverage_state,
      ].map((value) => value.toLowerCase()),
    });
  }

  for (const action of portfolio.impact.actionCandidates) {
    const existing = rows.get(action.contract_id);
    if (existing) {
      rows.set(action.contract_id, {
        ...existing,
        evidenceScore: existing.evidenceScore + 100,
        searchText: [
          ...existing.searchText,
          action.title ?? "",
          action.finding_summary ?? "",
        ].map((value) => value.toLowerCase()),
      });
      continue;
    }
    const vendorName = safeVendorDisplayName(
      action.vendor_name,
      action.vendor_ref,
    );
    rows.set(action.contract_id, {
      contractId: action.contract_id,
      contractName: action.title || "Action-layer contract",
      vendorName,
      sourceLabel: "Supplemental action",
      sourceDetail: `outside the ${portfolio.contracts.length}-contract register`,
      isSupplemental: true,
      sortValue: numberFromDb(action.candidate_amount_usd),
      evidenceScore: 100,
      searchText: [
        action.contract_id,
        action.title ?? "",
        action.finding_summary ?? "",
        vendorName,
      ].map((value) => value.toLowerCase()),
    });
  }

  return [...rows.values()];
}

function ContractListTable({
  portfolio,
  onOpenContract,
}: {
  portfolio: SourceWorkspacePortfolioData;
  onOpenContract: (contractId: string, tab?: string) => void;
}) {
  const focus = focusedContractSet(portfolio);
  return (
    <div className="sw-v2-table">
      <div className="sw-v2-table-head sw-v2-contract-row">
        <span>Contract</span>
        <span>Vendor</span>
        <span>Why listed</span>
        <span>Annual value</span>
        <span>Next action</span>
      </div>
      {focus.rows.map(({ contract, reason, actionRows }) => (
        <button
          key={contract.contract_id}
          type="button"
          className="sw-v2-table-row sw-v2-contract-row"
          onClick={() => onOpenContract(contract.contract_id)}
        >
          <span>
            <b>{contract.contract_name}</b>
            <small>{contract.contract_id}</small>
          </span>
          <span>{safeContractVendorDisplayName(contract)}</span>
          <span>{reason}</span>
          <span>{money(numberFromDb(contract.annual_value))}</span>
          <span>
            {actionRows > 0 ? "Open Optimize" : "Review Contract 360"}
          </span>
        </button>
      ))}
      {focus.remainderCount > 0 ? (
        <div className="sw-v2-table-foot">
          <b>{focus.remainderCount} further registry contracts</b>
          <span>
            {money(focus.remainderAnnualValue)} stays summarized until spend,
            performance, document, or action evidence is loaded.
          </span>
        </div>
      ) : null}
    </div>
  );
}

function ContractEvidenceDepthTable({
  portfolio,
  onOpenContract,
}: {
  portfolio: SourceWorkspacePortfolioData;
  onOpenContract: (contractId: string, tab?: string) => void;
}) {
  const focus = focusedContractSet(portfolio);
  return (
    <div className="sw-v2-table">
      <div className="sw-v2-table-head sw-v2-contract-depth-row">
        <span>Contract</span>
        <span>Spend</span>
        <span>Performance</span>
        <span>Docs</span>
        <span>Actions</span>
        <span>Coverage</span>
      </div>
      {focus.rows.map(({ contract, coverage, actionRows }) => (
        <button
          key={contract.contract_id}
          type="button"
          className="sw-v2-table-row sw-v2-contract-depth-row"
          onClick={() => onOpenContract(contract.contract_id, "Evidence")}
        >
          <span>
            <b>{contract.contract_name}</b>
            <small>{contract.contract_id}</small>
          </span>
          <span>{formatCount(coverage?.spend_rows)}</span>
          <span>{formatCount(coverage?.performance_rows)}</span>
          <span>{formatCount(coverage?.document_page_text_rows)}</span>
          <span>{formatCount(actionRows)}</span>
          <span>{coverage?.coverage_state ?? "Header only"}</span>
        </button>
      ))}
      {focus.remainderCount > 0 ? (
        <div className="sw-v2-table-foot">
          <b>{focus.depthReadyCount} contracts have loaded detail rows.</b>
          <span>
            The remaining {focus.remainderCount} are held as portfolio registry
            rows until their evidence lanes are populated.
          </span>
        </div>
      ) : null}
    </div>
  );
}

function ContractFinancialPostureTable({
  portfolio,
  onOpenContract,
}: {
  portfolio: SourceWorkspacePortfolioData;
  onOpenContract: (contractId: string, tab?: string) => void;
}) {
  const focus = focusedContractSet(portfolio);
  return (
    <div className="sw-v2-table">
      <div className="sw-v2-table-head sw-v2-financial-row">
        <span>Contract</span>
        <span>Annual value</span>
        <span>Actual spend</span>
        <span>Committed value</span>
        <span>Posture</span>
      </div>
      {focus.rows.map(({ contract }) => (
        <button
          key={contract.contract_id}
          type="button"
          className="sw-v2-table-row sw-v2-financial-row"
          onClick={() => onOpenContract(contract.contract_id, "Economics")}
        >
          <span>
            <b>{contract.contract_name}</b>
            <small>{safeContractVendorDisplayName(contract)}</small>
          </span>
          <span>{money(numberFromDb(contract.annual_value))}</span>
          <span>{money(numberFromDb(contract.actual_annual_spend))}</span>
          <span>{money(numberFromDb(contract.total_committed_value))}</span>
          <span>{financialPosture(contract)}</span>
        </button>
      ))}
      {focus.remainderCount > 0 ? (
        <div className="sw-v2-table-foot">
          <b>{focus.remainderCount} registry-only financial rows summarized.</b>
          <span>
            Actual spend is only shown when monthly spend or consumption rows
            exist for the contract.
          </span>
        </div>
      ) : null}
    </div>
  );
}

function ContractDetailLoadState({
  contractId,
  state,
}: {
  contractId: string | null;
  state: Contract360Response | "loading" | "error" | undefined;
}) {
  const failed = state === "error";
  return (
    <section
      className="sw-v2-panel sw-v2-span-3"
      role={failed ? "alert" : "status"}
      aria-live="polite"
    >
      <PanelHead
        eyebrow="Contract 360"
        title={
          failed ? "Contract detail unavailable" : "Loading contract detail"
        }
      />
      <p className="sw-v2-lede">
        {failed
          ? `Source could not load ${contractId ?? "the selected contract"}. No substitute contract is being shown.`
          : `Loading ${contractId ?? "the selected contract"} from the governed contract-detail service.`}
      </p>
    </section>
  );
}

function ContractPage({
  vm,
  logic,
  portfolio,
  contract,
}: {
  vm: SourceWorkspaceVM;
  logic: WorkspaceViewModel;
  portfolio: SourceWorkspacePortfolioData;
  contract: SourceContract360Row;
}) {
  const tab = logic.state.tabs.contract ?? "Story";
  const detailReady = vm.detailState === "ready";
  const coverage = coverageForContract(portfolio, contract.contract_id);
  const portfolioScopeRows = portfolio.applicationScope.filter(
    (row) => row.contract_id === contract.contract_id,
  );
  const detailScopeRows =
    detailReady && vm.detail
      ? [
          ...(vm.detail.scopeTiers.explicit ?? []),
          ...(vm.detail.scopeTiers.reviewed ?? []),
          ...(vm.detail.scopeTiers.vendorInferred ?? []),
          ...(vm.detail.scopeTiers.unresolved ?? []),
        ]
      : [];
  const scopeRows =
    portfolioScopeRows.length > 0 ? portfolioScopeRows : detailScopeRows;
  const contractClaimCards = portfolio.impact.claimCards.filter(
    (row) => row.contract_id === contract.contract_id,
  );
  const tabNarrative = contractTabNarrative(
    tab,
    vm,
    contract,
    coverage,
    scopeRows,
    contractClaimCards[0],
  );

  return (
    <div className="sw-v2-grid sw-v2-contract-detail-grid">
      <section className="sw-v2-panel sw-v2-span-2 sw-v2-contract-story-panel">
        <PanelHead
          eyebrow={`Contract 360 / ${tab}`}
          title={contract.contract_name}
        />
        <ContractTabStory
          coverage={coverage}
          contract={contract}
          scopeRows={scopeRows}
          tab={tab}
          tabNarrative={tabNarrative}
          vm={vm}
        />
        {tab === "Optimize" ? <ContractOptimizeContent vm={vm} /> : null}
        {tab === "Economics" &&
        detailReady &&
        vm.detail?.spendMonths?.length ? (
          <ContractConsumptionRamp spendMonths={vm.detail.spendMonths} />
        ) : null}
        {tab === "Scope" ? (
          <ContractScopeTable scopeRows={scopeRows} />
        ) : tab === "Performance" &&
          !contractFacetIsRequired(vm, "Performance") ? (
          <ContractFacetNotRequired
            tab="Performance"
            reason={contractFacetReason(vm, "Performance")}
          />
        ) : tab === "Performance" &&
          detailReady &&
          vm.detail?.performancePeriods?.length ? (
          <>
            <ContractPerformanceTrendChart
              periods={vm.detail.performancePeriods}
            />
            <div className="sw-v2-table">
              <div className="sw-v2-table-head sw-v2-performance-row">
                <span>Period</span>
                <span>Metric</span>
                <span>Actual</span>
                <span>Credit</span>
              </div>
              {vm.detail.performancePeriods.slice(0, 12).map((row) => (
                <div
                  key={row.observation_id}
                  className="sw-v2-table-row sw-v2-performance-row"
                >
                  <span>{fmtDate(row.period_start)}</span>
                  <span>{row.metric_name}</span>
                  <span>
                    {performanceActual(row.actual_value, row.value_num)}
                  </span>
                  <span>{money(numberFromDb(row.credit_calculated))}</span>
                </div>
              ))}
            </div>
          </>
        ) : tab === "Evidence" && detailReady && vm.detail ? (
          <ContractEvidenceDocuments
            coverage={coverage}
            files={vm.detail.documentFiles ?? []}
            extractions={vm.detail.docExtractions}
          />
        ) : tab === "Education" && vm.contractEducation ? (
          <ContractEducationContent education={vm.contractEducation} />
        ) : tab === "Optimize" ? null : (
          <ContractTabBody
            contract={contract}
            scopeRows={scopeRows}
            tab={tab}
            vm={vm}
          />
        )}
      </section>

      <section className="sw-v2-panel sw-v2-contract-context-panel">
        <ContractDetailSidePanel
          cardCount={contractClaimCards.length}
          contract={contract}
          coverage={coverage}
          scopeRows={scopeRows}
          tab={tab}
          vm={vm}
        />
      </section>

      {tab === "Story" ? <ProductShellCommercialPostureStrip vm={vm} /> : null}
    </div>
  );
}

function ContractCommandBar({
  activeTab,
  contract,
  onBackToContracts,
  onOpenPortfolioPage,
  onOpenTab,
}: {
  activeTab: string;
  contract: SourceContract360Row;
  onBackToContracts: () => void;
  onOpenPortfolioPage: (page: PageLabel) => void;
  onOpenTab: (tab: string) => void;
}) {
  return (
    <nav
      className="sw-v2-contract-commandbar"
      aria-label="Contract command toolbar"
    >
      <button
        type="button"
        className="sw-v2-contract-command"
        onClick={onBackToContracts}
      >
        Back to contracts
      </button>
      <div className="sw-v2-contract-commandbar-tabs" role="tablist">
        {CONTRACT_TABS.map((label) => (
          <button
            key={label}
            type="button"
            className={activeTab === label ? "is-active" : ""}
            onClick={() => onOpenTab(label)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="sw-v2-contract-commandbar-actions">
        <button type="button" onClick={() => onOpenPortfolioPage("Evidence")}>
          Evidence map
        </button>
      </div>
      <span className="sw-v2-contract-commandbar-id">
        {contract.contract_id}
      </span>
    </nav>
  );
}

function ContractTabStory({
  coverage,
  contract,
  scopeRows,
  tab,
  tabNarrative,
  vm,
}: {
  coverage: SourceContractEvidenceCoverageRow | null | undefined;
  contract: SourceContract360Row;
  scopeRows: readonly SourceContractApplicationScopeRow[];
  tab: string;
  tabNarrative: ReturnType<typeof contractTabNarrative>;
  vm: SourceWorkspaceVM;
}) {
  const actualSpend =
    numberFromDb(contract.actual_annual_spend) ??
    numberFromDb(coverage?.actual_spend_usd);
  const annualValue =
    numberFromDb(contract.resolved_annual_value) ??
    numberFromDb(contract.annual_value) ??
    numberFromDb(coverage?.committed_spend_usd);
  const utilization =
    annualValue && annualValue > 0 && actualSpend != null
      ? Math.round((actualSpend / annualValue) * 100)
      : null;
  const sizedTotal = vm.opportunityView
    ? sizedOpportunityTotalUsd(vm.opportunityView.opportunities)
    : 0;
  const stats =
    tab === "Optimize"
      ? [
          [
            "Sized opportunity",
            sizedTotal > 0 ? money(sizedTotal) : "Not sized",
          ],
          [
            "Levers",
            vm.opportunityView
              ? `${vm.opportunityView.opportunities.length} total`
              : "Not loaded",
          ],
          [
            "Finance confirmed",
            vm.opportunityView?.financeConfirmed ?? "Not established",
          ],
        ]
      : tab === "Education"
        ? [
            ["Archetype", vm.contractEducation?.archetypeLabel ?? "Not mapped"],
            ["Education state", vm.contractEducation?.stateLabel ?? "Loading"],
            ["Operating loop", "Track · Load · Observe"],
          ]
      : tab === "Performance" && !contractFacetIsRequired(vm, "Performance")
        ? [
            ["Applicability", "Not part of this archetype"],
            ["Evidence lane", "Not required"],
            ["Next focus", "Consumption and commercial evidence"],
          ]
      : tab === "Economics"
        ? [
            ["Annual value", money(annualValue)],
            ["Actual annual spend", money(actualSpend)],
            [
              "Utilization",
              utilization == null ? "Not established" : `${utilization}%`,
            ],
          ]
        : [
            ["Vendor", safeContractVendorDisplayName(contract)],
            ["End date", fmtDate(contract.end_date)],
            [
              "Notice",
              contract.notice_period_days == null
                ? "Not established"
                : `${contract.notice_period_days} days`,
            ],
          ];
  const purpose =
    tab === "Story"
      ? contractPurposeSummary(contract, coverage, scopeRows)
      : null;

  return (
    <div className={`sw-v2-contract-story is-${tab.toLowerCase()}`}>
      <div>
        {purpose ? (
          <div className="sw-v2-contract-purpose">
            <h3>{purpose.heading}</h3>
            <p>{purpose.body}</p>
            <span>{purpose.evidence}</span>
          </div>
        ) : null}
        <span>{tabNarrative.provenance}</span>
        <h2>{tabNarrative.headline}</h2>
        <p>{tabNarrative.body}</p>
        <small>{tabNarrative.blocker}</small>
      </div>
      <dl>
        {stats.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function contractFacetIsRequired(
  vm: SourceWorkspaceVM,
  tab: ContractFacetKey,
): boolean {
  return vm.contractEducation?.facetRequirements[tab]?.state !== "not_required";
}

function contractFacetReason(vm: SourceWorkspaceVM, tab: ContractFacetKey) {
  return (
    vm.contractEducation?.facetRequirements[tab]?.reason ??
    "This evidence lane is not required by the declared contract archetype."
  );
}

function ContractFacetNotRequired({
  tab,
  reason,
}: {
  tab: string;
  reason: string;
}) {
  return (
    <section className="sw-v2-evidence-empty" aria-label={`${tab} applicability`}>
      <b>{tab} is not a required evidence lane for this contract.</b>
      <p>{reason}</p>
      <p>
        Source is not treating the absence of service-level rows as a defect or
        asking someone to load irrelevant evidence. If the executed agreement
        contains a service-level obligation, map it to the contract and this
        lane will become applicable.
      </p>
    </section>
  );
}

export function contractPurposeSummary(
  contract: SourceContract360Row,
  coverage?: SourceContractEvidenceCoverageRow | null,
  scopeRows: readonly SourceContractApplicationScopeRow[] = [],
) {
  const vendor = safeContractVendorDisplayName(contract);
  const contractName =
    usableText(contract.contract_name) ?? contract.contract_id;
  const rawArchetype =
    coverage?.contract_archetype ??
    contractArchetype(contract) ??
    contract.vendor_category ??
    null;
  const archetype = isDeclaredArchetype(rawArchetype)
    ? titleFromSourceKey(String(rawArchetype))
    : null;
  const scopePhrase =
    usableScopeSummary(contract.purpose_summary) ??
    scopeFromContractName(contractName) ??
    usableScopeSummary(contract.scope_summary) ??
    "the loaded commercial scope";
  const classificationText = [
    rawArchetype,
    contract.vendor_category,
    contractName,
    vendor,
    scopePhrase,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const kind = contractPurposeKind(classificationText);
  const annualValue =
    numberFromDb(contract.resolved_annual_value) ??
    numberFromDb(contract.annual_value) ??
    numberFromDb(coverage?.committed_spend_usd);
  const actualSpend =
    numberFromDb(contract.actual_annual_spend) ??
    numberFromDb(coverage?.actual_spend_usd);
  const evidenceParts = [
    archetype ? `${archetype} archetype` : null,
    annualValue != null ? `${money(annualValue)} annual value` : null,
    actualSpend != null ? `${money(actualSpend)} observed spend` : null,
    positiveCount(numberFromDb(coverage?.scope_rows) ?? scopeRows.length)
      ? `${numberFromDb(coverage?.scope_rows) ?? scopeRows.length} scope rows`
      : null,
    coverage ? evidenceCount(coverage.spend_rows, "spend rows") : null,
    coverage
      ? evidenceCount(coverage.document_page_text_rows, "document text rows")
      : null,
    coverage
      ? evidenceCount(coverage.opportunity_rows, "opportunity rows")
      : null,
  ].filter(Boolean);

  return {
    heading: "What this contract is",
    body: usableScopeSummary(contract.purpose_summary)
      ? `${scopePhrase} Read it as ${kind.readAs}: Source is tying the contract document, archetype, economics, renewal timing, usage or scope evidence, and optimization rows together before naming an action.`
      : `This is ${kind.article} ${kind.label} with ${vendor} covering ${scopePhrase}. Read it as ${kind.readAs}: Source is tying the contract document, archetype, economics, renewal timing, usage or scope evidence, and optimization rows together before naming an action.`,
    evidence: `Loaded basis: ${evidenceParts.join("; ")}.`,
  };
}

function usableText(value: string | null | undefined) {
  const text = value?.trim();
  if (
    !text ||
    /^(not established|unknown|unresolved|none|null|n\/a)$/i.test(text)
  ) {
    return null;
  }
  return text;
}

function usableScopeSummary(value: string | null | undefined) {
  const text = usableText(value);
  if (!text) return null;
  if (
    /\b(absent|unknown|unresolved|none|null|n\/a|for_cause_only)\b/i.test(text)
  ) {
    return null;
  }
  return text;
}

function scopeFromContractName(contractName: string) {
  const [, scope] = contractName.split(/\s[-–—]\s(.+)/);
  return usableText(scope);
}

function positiveCount(value: number | null | undefined) {
  return value != null && value > 0;
}

function evidenceCount(value: number | null | undefined, label: string) {
  const count = numberFromDb(value);
  return positiveCount(count) ? `${count} ${label}` : null;
}

function contractPurposeKind(text: string) {
  if (
    /(cloud|consumption|committed purchase|enterprise discount program|edp|dbu|databricks|aws|marketplace|compute|lakehouse)/i.test(
      text,
    )
  ) {
    return {
      article: "a",
      label: "cloud consumption commitment",
      readAs: "a usage-backed commercial commitment",
    };
  }
  if (
    /(managed service|managed-services|ams|bpo|outsourcing|service desk|sow)/i.test(
      text,
    )
  ) {
    return {
      article: "a",
      label: "managed-services contract",
      readAs: "a service-scope and performance-control agreement",
    };
  }
  if (
    /(saas|subscription|seat|license|licence|enterprise agreement)/i.test(text)
  ) {
    return {
      article: "a",
      label: "software subscription contract",
      readAs: "an entitlement, usage, and renewal-control agreement",
    };
  }
  return {
    article: "a",
    label: "commercial contract",
    readAs: "a governed commercial record",
  };
}

function ContractTabBody({
  contract,
  scopeRows,
  tab,
  vm,
}: {
  contract: SourceContract360Row;
  scopeRows: readonly SourceContractApplicationScopeRow[];
  tab: string;
  vm: SourceWorkspaceVM;
}) {
  if (tab === "Story") {
    return (
      <div className="sw-v2-contract-story-grid">
        <Fact
          label="Commercial position"
          value={vm.commercialPosture?.headline ?? "Contract header loaded"}
        />
        <Fact
          label="Action posture"
          value={vm.opportunityView?.recommendation ?? "No action loaded"}
        />
        <Fact
          label="Benchmarking"
          value={displayBenchmarkingClause(contract.benchmarking_clause)}
        />
        <Fact
          label="Source confidence"
          value={
            contract.source_confidence == null
              ? "Not established"
              : pct(numberFromDb(contract.source_confidence) ?? 0)
          }
        />
      </div>
    );
  }
  if (tab === "Relationship") {
    return (
      <ContractRelationshipMap contract={contract} scopeRows={scopeRows} />
    );
  }
  return (
    <div className="sw-v2-contract-story-grid">
      <Fact label="Auto-renew" value={contract.auto_renew ? "Yes" : "No"} />
      <Fact
        label="Notice period"
        value={
          contract.notice_period_days == null
            ? "Not established"
            : `${contract.notice_period_days} days`
        }
      />
      <Fact label="End date" value={fmtDate(contract.end_date)} />
    </div>
  );
}

function ContractDetailSidePanel({
  cardCount,
  contract,
  coverage,
  scopeRows,
  tab,
  vm,
}: {
  cardCount: number;
  contract: SourceContract360Row;
  coverage: ReturnType<typeof coverageForContract>;
  scopeRows: readonly SourceContractApplicationScopeRow[];
  tab: string;
  vm: SourceWorkspaceVM;
}) {
  if (tab === "Story") {
    return (
      <>
        <PanelHead eyebrow="Executive read" title="Why this contract matters" />
        <ContractStoryContextStack
          contract={contract}
          coverage={coverage}
          scopeRows={scopeRows}
          vm={vm}
        />
      </>
    );
  }
  if (tab === "Scope") {
    return (
      <>
        <PanelHead eyebrow="Scope readout" title="What is actually covered" />
        <ContractScopeContextStack scopeRows={scopeRows} />
      </>
    );
  }
  if (tab === "Relationship") {
    return (
      <>
        <PanelHead
          eyebrow="Relationship readout"
          title="Loaded dependency path"
        />
        <ContractRelationshipContextStack
          contract={contract}
          coverage={coverage}
          scopeRows={scopeRows}
        />
      </>
    );
  }
  if (tab === "Evidence") {
    return (
      <>
        <PanelHead eyebrow="Evidence readout" title="What evidence exists" />
        <ContractEvidenceContextStack coverage={coverage} />
      </>
    );
  }
  if (tab === "Education" && vm.contractEducation) {
    return (
      <>
        <PanelHead
          eyebrow="Contract education"
          title="How to improve this contract over time"
        />
        <ContractEducationSidePanel education={vm.contractEducation} />
      </>
    );
  }
  if (tab === "Optimize" && vm.opportunityView) {
    return (
      <>
        <PanelHead eyebrow="Optimization gates" title="What can be claimed" />
        <ContractValueTypeStack
          view={vm.opportunityView}
          cardCount={cardCount}
        />
      </>
    );
  }
  if (tab === "Performance" || tab === "Economics") {
    const tabNarrative = contractTabNarrative(
      tab,
      vm,
      contract,
      coverage,
      scopeRows,
      undefined,
    );
    return (
      <>
        <PanelHead
          eyebrow={`${tab} readout`}
          title={
            tab === "Performance"
              ? "What performance evidence supports"
              : "What the spend evidence supports"
          }
        />
        <ContractNarrativeContextStack narrative={tabNarrative} />
      </>
    );
  }
  return (
    <>
      <PanelHead
        eyebrow="Contract readout"
        title={detailStateLabel(vm.detailState)}
      />
      <ContractNarrativeContextStack
        narrative={contractTabNarrative(
          tab,
          vm,
          contract,
          coverage,
          scopeRows,
          undefined,
        )}
      />
    </>
  );
}

function ContractNarrativeContextStack({
  narrative,
}: {
  narrative: ReturnType<typeof contractTabNarrative>;
}) {
  return (
    <div className="sw-v2-fact-stack">
      <Fact label="Decision consequence" value={narrative.blocker} />
      <p className="sw-v2-muted">{narrative.body}</p>
      <p className="sw-v2-muted">Basis: {narrative.provenance}.</p>
    </div>
  );
}

function ContractEducationSidePanel({
  education,
}: {
  education: NonNullable<SourceWorkspaceVM["contractEducation"]>;
}) {
  const next = education.steps.find((step) => step.state === "next");
  return (
    <div className="sw-v2-fact-stack">
      <Fact label="The coaching focus" value={education.focus} />
      <Fact
        label="Next evidence move"
        value={
          next
            ? `${next.title}: ${next.question}`
            : "Keep the loop current at each review."
        }
      />
      <p className="sw-v2-muted">
        This guide is selected from the declared contract archetype. It does
        not replace contract evidence or create a value claim.
      </p>
    </div>
  );
}

function ContractEducationContent({
  education,
}: {
  education: NonNullable<SourceWorkspaceVM["contractEducation"]>;
}) {
  return (
    <section
      aria-label="Contract education guide"
      style={{
        borderTop: "1px solid rgba(10,10,11,.1)",
        paddingTop: 18,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 18,
          alignItems: "start",
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        <div style={{ maxWidth: 820 }}>
          <div className="sw-v2-eyebrow">Archetype coaching guide</div>
          <h3 style={{ margin: "7px 0 8px", fontSize: 22, lineHeight: 1.16 }}>
            {education.headline}
          </h3>
          <p style={{ margin: 0, color: "#5f5e5a", lineHeight: 1.55 }}>
            {education.body}
          </p>
        </div>
        <span
          style={{
            border: "1px solid rgba(15,110,86,.28)",
            background: education.state === "ready" ? "#e5f5ef" : "#fbf2df",
            color: education.state === "ready" ? "#0f6e56" : "#995c00",
            borderRadius: 999,
            padding: "7px 10px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9.5,
            letterSpacing: ".08em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          {education.stateLabel}
        </span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 10,
        }}
      >
        {education.steps.map((step) => (
          <article
            key={step.key}
            style={{
              border: "1px solid rgba(10,10,11,.12)",
              borderTop: `3px solid ${step.state === "loaded" ? "#2f9e78" : "#c27a13"}`,
              borderRadius: 7,
              padding: "15px 16px 16px",
              minHeight: 198,
              background: "#fff",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <strong style={{ fontSize: 15 }}>{step.title}</strong>
              <span
                style={{
                  color: step.state === "loaded" ? "#0f6e56" : "#995c00",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                }}
              >
                {step.state === "loaded" ? "Loaded" : "Next"}
              </span>
            </div>
            <p style={{ fontWeight: 700, margin: "14px 0 8px", lineHeight: 1.35 }}>
              {step.question}
            </p>
            <p style={{ color: "#5f5e5a", lineHeight: 1.5, margin: 0, fontSize: 12.5 }}>
              {step.guidance}
            </p>
            <small style={{ display: "block", color: "#888780", marginTop: 14, lineHeight: 1.4 }}>
              Basis: {step.evidence}.
            </small>
          </article>
        ))}
      </div>
      <div
        style={{
          marginTop: 12,
          padding: "12px 14px",
          background: "#fbfaf7",
          border: "1px solid rgba(10,10,11,.1)",
          borderRadius: 7,
          color: "#5f5e5a",
          fontSize: 12,
          lineHeight: 1.5,
        }}
      >
        <strong style={{ color: "#0a0a0b" }}>Data basis.</strong>{" "}
        {education.basis.join(" · ")}.
      </div>
    </section>
  );
}

function ContractEvidenceContextStack({
  coverage,
}: {
  coverage: ReturnType<typeof coverageForContract>;
}) {
  const documentRows = numberFromDb(coverage?.document_page_text_rows) ?? 0;
  const structuredRows =
    (numberFromDb(coverage?.spend_rows) ?? 0) +
    (numberFromDb(coverage?.scope_rows) ?? 0) +
    (numberFromDb(coverage?.performance_rows) ?? 0) +
    (numberFromDb(coverage?.opportunity_rows) ?? 0);

  return (
    <div className="sw-v2-fact-stack">
      <Fact label="Structured evidence rows" value={String(structuredRows)} />
      <Fact label="Document page rows" value={String(documentRows)} />
      <Fact
        label="What this means"
        value={
          documentRows > 0
            ? "Clause text can be cited"
            : structuredRows > 0
              ? "Optimization can render; clause text stays withheld"
              : "Header only"
        }
      />
      <p className="sw-v2-muted">
        Evidence is not a generic status panel. It tells the presenter which
        claims are supported by structured rows and which claims still need raw
        document page text.
      </p>
    </div>
  );
}

function ContractStoryContextStack({
  contract,
  coverage,
  scopeRows,
  vm,
}: {
  contract: SourceContract360Row;
  coverage: ReturnType<typeof coverageForContract>;
  scopeRows: readonly SourceContractApplicationScopeRow[];
  vm: SourceWorkspaceVM;
}) {
  const annualValue =
    numberFromDb(contract.resolved_annual_value) ??
    numberFromDb(contract.annual_value) ??
    numberFromDb(coverage?.committed_spend_usd);
  const actualSpend =
    numberFromDb(contract.actual_annual_spend) ??
    numberFromDb(coverage?.actual_spend_usd);
  const sizedTotal = vm.opportunityView
    ? sizedOpportunityTotalUsd(vm.opportunityView.opportunities)
    : 0;
  const signalCount =
    vm.opportunityView?.opportunities.filter(
      (opportunity) => opportunity.stageRaw === "signal",
    ).length ?? 0;

  return (
    <div className="sw-v2-fact-stack">
      <Fact label="Contract value" value={money(annualValue)} />
      <Fact label="Observed spend" value={money(actualSpend)} />
      <Fact
        label="Optimization levers"
        value={
          vm.opportunityView
            ? `${vm.opportunityView.opportunities.length} loaded`
            : "Not loaded"
        }
      />
      <Fact
        label="Sized ask"
        value={sizedTotal > 0 ? money(sizedTotal) : "Not sized"}
      />
      {signalCount > 0 ? (
        <p className="sw-v2-muted">
          {signalCount} signal-stage lever{signalCount === 1 ? "" : "s"} stay
          visible, but do not carry a dollar claim until the evidence gate
          closes.
        </p>
      ) : null}
      <p className="sw-v2-muted">
        Scope is bounded to {scopeRows.length} loaded row
        {scopeRows.length === 1 ? "" : "s"}; Source will not expand this into
        tower, CMDB, or ownership claims without matching rows.
      </p>
    </div>
  );
}

function ContractScopeContextStack({
  scopeRows,
}: {
  scopeRows: readonly SourceContractApplicationScopeRow[];
}) {
  const functions = uniqueTruthy(scopeRows.map((row) => row.business_function));
  const hosting = uniqueTruthy(scopeRows.map((row) => row.hosting_model));
  const critical = uniqueTruthy(scopeRows.map((row) => row.criticality));
  const missingRunCost = scopeRows.filter(
    (row) => numberFromDb(row.annual_run_cost) == null,
  ).length;
  return (
    <div className="sw-v2-fact-stack">
      <Fact label="Workloads covered" value={String(scopeRows.length)} />
      <Fact
        label="Business functions"
        value={functions.length ? functions.join(", ") : "Not established"}
      />
      <Fact
        label="Hosting"
        value={hosting.length ? hosting.join(", ") : "Not established"}
      />
      <Fact
        label="Criticality"
        value={critical.length ? critical.join(", ") : "Not established"}
      />
      <p className="sw-v2-muted">
        Plain English: this contract covers the named workloads in the table,
        not every system that happens to depend on the vendor.
      </p>
      {missingRunCost > 0 ? (
        <p className="sw-v2-muted">
          {missingRunCost} row{missingRunCost === 1 ? "" : "s"} still need run
          cost before scope can become a full economics view.
        </p>
      ) : null}
    </div>
  );
}

function ContractRelationshipContextStack({
  contract,
  coverage,
  scopeRows,
}: {
  contract: SourceContract360Row;
  coverage: ReturnType<typeof coverageForContract>;
  scopeRows: readonly SourceContractApplicationScopeRow[];
}) {
  const functions = uniqueTruthy(scopeRows.map((row) => row.business_function));
  const hosting = uniqueTruthy(scopeRows.map((row) => row.hosting_model));
  return (
    <div className="sw-v2-fact-stack">
      <Fact label="Vendor" value={safeContractVendorDisplayName(contract)} />
      <Fact label="Contract" value={contract.contract_id} />
      <Fact label="Scoped workloads" value={String(scopeRows.length)} />
      <Fact
        label="Functions touched"
        value={functions.length ? functions.join(", ") : "Not established"}
      />
      <Fact
        label="Platform / hosting"
        value={hosting.length ? hosting.join(", ") : "Not established"}
      />
      <Fact
        label="Evidence documents"
        value={formatCount(coverage?.document_page_text_rows)}
      />
      <p className="sw-v2-muted">
        Relationship means loaded linkage, not proximity. The dependency path
        stops where rows stop.
      </p>
    </div>
  );
}

function ContractRelationshipMap({
  contract,
  scopeRows,
}: {
  contract: SourceContract360Row;
  scopeRows: readonly SourceContractApplicationScopeRow[];
}) {
  const functions = uniqueTruthy(scopeRows.map((row) => row.business_function));
  const hosting = uniqueTruthy(scopeRows.map((row) => row.hosting_model));
  const topWorkloads = scopeRows
    .map((row) => row.application_name)
    .filter((name): name is string => Boolean(usableText(name)))
    .slice(0, 4);
  const nodes = [
    {
      label: "Vendor",
      value: safeContractVendorDisplayName(contract),
      detail: "commercial counterparty",
    },
    {
      label: "Contract",
      value: contract.contract_id,
      detail: contract.contract_name,
    },
    {
      label: "Covered work",
      value:
        topWorkloads.length > 0
          ? topWorkloads.join(" · ")
          : "No workload rows loaded",
      detail:
        scopeRows.length > topWorkloads.length
          ? `${scopeRows.length - topWorkloads.length} more scoped row${scopeRows.length - topWorkloads.length === 1 ? "" : "s"}`
          : `${scopeRows.length} scoped row${scopeRows.length === 1 ? "" : "s"}`,
    },
    {
      label: "Business functions",
      value: functions.length ? functions.join(" · ") : "Not established",
      detail: "loaded from scope rows",
    },
    {
      label: "Platform / hosting",
      value: hosting.length ? hosting.join(" · ") : "Not established",
      detail: "no inferred dependencies",
    },
  ];

  return (
    <div
      className="sw-v2-relationship-map"
      aria-label="Loaded relationship path"
    >
      {nodes.map((node, index) => (
        <div className="sw-v2-relationship-step" key={node.label}>
          <div>
            <span>{node.label}</span>
            <b>{node.value}</b>
            <small>{node.detail}</small>
          </div>
          {index < nodes.length - 1 ? <i aria-hidden="true">then</i> : null}
        </div>
      ))}
    </div>
  );
}

function ProductShellCommercialPostureStrip({ vm }: { vm: SourceWorkspaceVM }) {
  const posture = vm.commercialPosture;
  if (!posture) return null;
  return (
    <section
      className="sw-v2-panel sw-v2-span-2"
      aria-label="Commercial posture"
    >
      <PanelHead eyebrow="Commercial posture" title={posture.headline} />
      <p className="sw-v2-lede">{posture.summary}</p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(185px, 1fr))",
          gap: 10,
          marginTop: 14,
        }}
      >
        {posture.items.map((item) => (
          <div
            key={item.label}
            style={{
              minHeight: 96,
              border: "1px solid rgba(10,10,11,.1)",
              borderRadius: 8,
              background:
                item.label === "Commitment posture"
                  ? "rgba(15,110,86,.05)"
                  : "#faf7f1",
              padding: "12px 13px",
            }}
          >
            <span
              style={{
                display: "block",
                color: "#888780",
                fontSize: 9.5,
                fontWeight: 850,
                letterSpacing: ".08em",
                marginBottom: 6,
                textTransform: "uppercase",
              }}
            >
              {item.label}
            </span>
            <b
              style={{
                display: "block",
                color: item.tone,
                fontSize: 13,
                lineHeight: 1.25,
                marginBottom: 5,
              }}
            >
              {item.value}
            </b>
            <small
              style={{
                color: "#5f5e5a",
                display: "block",
                fontSize: 11.2,
                lineHeight: 1.35,
              }}
            >
              {item.detail}
            </small>
          </div>
        ))}
      </div>
    </section>
  );
}

function ContractOptimizeContent({ vm }: { vm: SourceWorkspaceVM }) {
  const [subtab, setSubtab] =
    useState<(typeof CONTRACT_OPTIMIZE_SUBTABS)[number]>("Levers");
  const view = vm.opportunityView;
  if (!view || view.opportunities.length === 0) {
    return (
      <div className="sw-v2-empty-state">
        <b>No contract-specific optimization levers loaded.</b>
        <p>
          Source can show the contract record, but it will not invent an
          optimization play until governed opportunity rows exist for this
          contract.
        </p>
      </div>
    );
  }

  return (
    <>
      <ProductShellOptimizationExecutiveStrip vm={vm} />
      <SubtabBar
        tabs={CONTRACT_OPTIMIZE_SUBTABS}
        active={subtab}
        onSelect={(tab) =>
          setSubtab(
            CONTRACT_OPTIMIZE_SUBTABS.includes(
              tab as (typeof CONTRACT_OPTIMIZE_SUBTABS)[number],
            )
              ? (tab as (typeof CONTRACT_OPTIMIZE_SUBTABS)[number])
              : "Levers",
          )
        }
      />
      {subtab === "Levers" ? <ContractLeverTableContent vm={vm} /> : null}
      {subtab === "Sequence" ? (
        <ContractNegotiationSequenceContent vm={vm} />
      ) : null}
      {subtab === "Comparator" ? <ContractComparatorContent vm={vm} /> : null}
    </>
  );
}

function ContractLeverTableContent({ vm }: { vm: SourceWorkspaceVM }) {
  const rows = leverTableRows(vm.opportunityView?.opportunities ?? []);
  if (rows.length === 0) {
    return (
      <div className="sw-v2-empty-state">
        <b>No negotiation text is loaded for this contract.</b>
        <p>
          Opportunity rows exist, but Source needs buyer ask, concession, or
          negotiation language fields before it can render a client-ready lever
          table.
        </p>
      </div>
    );
  }
  return <ProductShellLeverTable vm={vm} />;
}

function ContractNegotiationSequenceContent({ vm }: { vm: SourceWorkspaceVM }) {
  const rows = negotiationSequenceRows(vm.opportunityView?.opportunities ?? []);
  if (rows.length === 0) {
    return (
      <div className="sw-v2-empty-state">
        <b>No governed negotiation sequence is loaded.</b>
        <p>
          Source needs priority, timing, or authored playbook fields before it
          can say what must happen first.
        </p>
      </div>
    );
  }
  return <ProductShellNegotiationSequence vm={vm} />;
}

function ContractComparatorContent({ vm }: { vm: SourceWorkspaceVM }) {
  const summary = portfolioDiscountComparatorSummary(
    vm.c?.id,
    vm.detail?.cloudCommitmentPeerCoverage ?? [],
    vm.opportunityView?.opportunities ?? [],
  );
  if (!summary) {
    return (
      <div className="sw-v2-empty-state">
        <b>No discount comparator is loaded.</b>
        <p>
          Load same-tenant peer coverage or an accepted benchmark comparable
          before Source treats a discount-band ask as supported.
        </p>
      </div>
    );
  }
  return <ProductShellDiscountComparator vm={vm} />;
}

function OptimizePage({
  portfolio,
  subtab,
  onOpenSubtab,
  onOpenAction,
  onOpenContract,
}: {
  portfolio: SourceWorkspacePortfolioData;
  subtab: string;
  onOpenSubtab: (tab: string) => void;
  onOpenAction: (candidateId: string) => void;
  onOpenContract: (contractId: string, tab?: string) => void;
}) {
  const actionSet = focusedActionSet(portfolio);
  const anchorActionSet = anchorContractActionSet(portfolio);

  return (
    <div className="sw-v2-grid">
      <section className="sw-v2-panel sw-v2-span-3">
        <SubtabBar
          tabs={OPTIMIZE_SUBTABS}
          active={subtab}
          onSelect={onOpenSubtab}
        />
        <PanelHead eyebrow="Optimize" title={optimizeSubtabTitle(subtab)} />
        {subtab === "By type" ? (
          <OptimizeByTypeTable portfolio={portfolio} />
        ) : subtab === "By contract" ? (
          <OptimizeByContractTable
            portfolio={portfolio}
            onOpenContract={onOpenContract}
          />
        ) : anchorActionSet.rows.length > 0 ? (
          <SourceLeverSequence
            actionSet={anchorActionSet}
            asOfDateIso={portfolio.asOfDateIso}
            onOpenAction={onOpenAction}
          />
        ) : (
          <OptimizeActionQueue
            actionSet={actionSet}
            onOpenContract={onOpenContract}
          />
        )}
      </section>
    </div>
  );
}

function SourceLeverSequence({
  actionSet,
  asOfDateIso,
  onOpenAction,
}: {
  actionSet: FocusedActionSet & { contract: SourceContract360Row | null };
  asOfDateIso: string;
  onOpenAction: (candidateId: string) => void;
}) {
  const contract = actionSet.contract;
  const contractLabel = contract
    ? `${safeContractVendorDisplayName(contract)} · ${contract.contract_id}`
    : "Selected governed contract";

  return (
    <div className="sw-v2-lever-sequence">
      <div className="sw-v2-lever-sequence-head">
        <div>
          <span>Action order</span>
          <h3>{actionOrderTitle(actionSet.rows.length)}</h3>
          <p>{contractLabel}</p>
        </div>
        <small>
          Derived from governed action rows. Finance confirmation remains
          separate.
        </small>
      </div>

      <div className="sw-v2-lever-sequence-list">
        {actionSet.rows.map((row, index) => {
          const amount = numberFromDb(row.candidate_amount_usd);
          const amountLabel =
            amount && amount > 0
              ? impactCreditMoney(amount)
              : row.readiness_state ?? "Not sized";
          const dueLabel = decisionDueLabel(row, asOfDateIso);
          const basis = actionCardBasis(row);
          const body = actionCardBody(row);

          return (
            <button
              key={row.action_candidate_id}
              type="button"
              className="sw-v2-lever-sequence-card"
              onClick={() => onOpenAction(row.action_candidate_id)}
            >
              <span className="sw-v2-lever-sequence-index">{index + 1}</span>
              <span className="sw-v2-lever-sequence-main">
                <b>{row.title ?? row.finding_summary ?? "Review loaded action"}</b>
                <small>{body}</small>
                <em>
                  Backed by <strong>{basis}</strong>
                </em>
              </span>
              <span className="sw-v2-lever-sequence-value">
                <b>{amountLabel}</b>
                <small>{formatFinanceState(row.finance_confirmation_state)}</small>
              </span>
              <span className="sw-v2-lever-sequence-owner">
                <b>{row.accountable_role ?? "Owner not assigned"}</b>
                <small>{dueLabel}</small>
              </span>
              <span className="sw-v2-lever-sequence-next">
                <b>Open the record</b>
                <small>
                  {row.next_action ?? row.readiness_state ?? "Review evidence"}
                </small>
              </span>
            </button>
          );
        })}
      </div>

      {actionSet.remainderCount > 0 ? (
        <p className="sw-v2-lever-sequence-footnote">
          {actionSet.remainderCount} further portfolio action rows stay in By
          contract until an operator selects the next move.
        </p>
      ) : null}
    </div>
  );
}

function ProductShellOptimizationExecutiveStrip({
  vm,
}: {
  vm: SourceWorkspaceVM;
}) {
  const view = vm.opportunityView;
  if (!view || view.opportunities.length === 0) return null;

  const quantifiedCount = view.opportunities.filter(
    (opportunity) => opportunity.stageRaw === "quantified",
  ).length;
  const signalCount = view.opportunities.filter(
    (opportunity) => opportunity.stageRaw === "signal",
  ).length;
  const financeConfirmedCount = view.opportunities.filter(
    (opportunity) => opportunity.stageRaw === "finance_confirmed",
  ).length;
  // Sized and signal-stage dollars are reported apart. A signal has no
  // defensible number behind it yet, so folding it into one total would
  // overstate exactly the figure a CFO will challenge first.
  const sizedTotalUsd = sizedOpportunityTotalUsd(view.opportunities);
  const items = [
    {
      label: "Levers",
      value: String(view.opportunities.length),
      detail: `${quantifiedCount} sized · ${signalCount} signal-stage`,
      tone: "#0a0a0b",
    },
    {
      label: "Sized opportunity",
      value: sizedTotalUsd > 0 ? money(sizedTotalUsd) : "Not sized",
      detail: "excludes signal-stage rows; candidate, not booked",
      tone: SOURCE_CHART_PALETTE.teal,
    },
    {
      label: "Quantified",
      value: String(quantifiedCount),
      detail: "calculation-backed or document-evidenced",
      tone: SOURCE_CHART_PALETTE.teal,
    },
    {
      label: "Signal-stage",
      value: String(signalCount),
      detail: "requires more evidence before upgrade",
      tone: SOURCE_CHART_PALETTE.amber,
    },
    {
      label: "Finance confirmed",
      value: String(financeConfirmedCount),
      detail:
        view.financeConfirmed === "Not established"
          ? "no outcome claimed"
          : `${view.financeConfirmed} outcome`,
      tone:
        financeConfirmedCount > 0
          ? SOURCE_CHART_PALETTE.teal
          : SOURCE_CHART_PALETTE.slate,
    },
  ];

  return (
    <section
      aria-label="Executive lever summary"
      style={{
        border: "1px solid rgba(10,10,11,.1)",
        borderRadius: 8,
        background: "#fffdfa",
        margin: "0 0 14px",
        padding: "12px 14px",
      }}
    >
      <div
        style={{
          display: "grid",
          gap: 8,
          gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
        }}
      >
        {items.map((item) => (
          <div
            key={item.label}
            aria-label={`${item.label}: ${item.value}`}
            style={{
              borderLeft: `3px solid ${item.tone}`,
              minHeight: 62,
              padding: "2px 10px 2px 11px",
            }}
          >
            <span
              style={{
                color: "#74716a",
                display: "block",
                fontSize: 9.5,
                fontWeight: 850,
                letterSpacing: ".08em",
                marginBottom: 3,
                textTransform: "uppercase",
              }}
            >
              {item.label}
            </span>
            <b
              style={{
                color: item.tone,
                display: "block",
                fontSize: 18,
                lineHeight: 1.05,
                marginBottom: 4,
              }}
            >
              {item.value}
            </b>
            <small
              style={{
                color: "#5f5e5a",
                display: "block",
                fontSize: 11,
                lineHeight: 1.3,
              }}
            >
              {item.detail}
            </small>
          </div>
        ))}
      </div>
    </section>
  );
}

const VALUE_TYPE_NOT_SET = "Not established";

/**
 * Split a contract's value types into the ones that carry a figure and the
 * ones that do not. A contract where nothing was mischarged legitimately has
 * no recoverable or avoidable dollars, and that absence is a finding in its
 * own right rather than a blank row.
 */
export function contractValueTypeSummary(view: {
  readonly potential: {
    readonly recoverable: string;
    readonly avoidable: string;
    readonly negotiable: string;
  };
  readonly financeConfirmed: string;
}) {
  const labelled = [
    ["Recoverable", view.potential.recoverable, "already owed back to you"],
    ["Avoidable", view.potential.avoidable, "stops when you act, unilaterally"],
    ["Negotiable", view.potential.negotiable, "needs the vendor to agree"],
  ] as const;
  return {
    established: labelled.filter(
      ([, value]) => Boolean(value) && value !== VALUE_TYPE_NOT_SET,
    ),
    absent: labelled
      .filter(([label]) => label !== "Negotiable")
      .filter(([, value]) => !value || value === VALUE_TYPE_NOT_SET)
      .map(([label]) => label.toLowerCase()),
    confirmed:
      view.financeConfirmed && view.financeConfirmed !== VALUE_TYPE_NOT_SET
        ? view.financeConfirmed
        : null,
  };
}

/**
 * Sum only the levers that carry a defensible figure. Signal-stage rows are
 * excluded on purpose: they have no evidence behind a number yet, so folding
 * them into a headline would overstate the first figure a CFO challenges.
 */
export function sizedOpportunityTotalUsd(
  opportunities: readonly {
    readonly stageRaw: string;
    readonly amountUsd: number | null;
  }[],
): number {
  return opportunities
    .filter((opportunity) => opportunity.stageRaw !== "signal")
    .reduce((total, opportunity) => total + (opportunity.amountUsd ?? 0), 0);
}

type ConsumptionRampInput = {
  readonly period_start?: string | null;
  readonly period_end?: string | null;
  readonly month?: string | null;
  readonly committed_amount?: number | string | null;
  readonly actual_spend?: number | string | null;
  readonly invoice_amount?: number | string | null;
  readonly paid_amount?: number | string | null;
  readonly service_id?: string | null;
  readonly business_unit?: string | null;
  readonly cost_center?: string | null;
  readonly evidence_reference?: string | null;
};

export function consumptionRampRows(
  spendMonths: readonly ConsumptionRampInput[],
  today = new Date(),
) {
  const ordered = spendMonths
    .slice()
    .sort((left, right) =>
      String(left.period_start ?? left.month ?? "").localeCompare(
        String(right.period_start ?? right.month ?? ""),
      ),
    );
  if (ordered.length === 0) return [];

  const maxCommitted = Math.max(
    0,
    ...ordered.map((row) => numberFromDb(row.committed_amount) ?? 0),
  );

  return ordered.map((row) => {
    const committedUsd = numberFromDb(row.committed_amount);
    const actualUsd = numberFromDb(row.actual_spend);
    const invoiceUsd = numberFromDb(row.invoice_amount);
    const paidUsd = numberFromDb(row.paid_amount);
    const committedScalePct =
      maxCommitted > 0 && committedUsd != null
        ? Math.max(8, Math.min(100, (committedUsd / maxCommitted) * 100))
        : null;
    const actualScalePct =
      maxCommitted > 0 && actualUsd != null
        ? Math.max(0, Math.min(100, (actualUsd / maxCommitted) * 100))
        : null;
    const utilizationPct =
      committedUsd != null && committedUsd > 0 && actualUsd != null
        ? Math.round((actualUsd / committedUsd) * 100)
        : null;
    const periodEnd = row.period_end ? Date.parse(row.period_end) : NaN;

    return {
      key: `${row.period_start ?? row.month ?? "period"}:${row.service_id ?? "all"}`,
      periodLabel: formatRampPeriodLabel(row.period_start ?? row.month),
      committedUsd,
      actualUsd,
      invoiceUsd,
      paidUsd,
      committedScalePct,
      actualScalePct,
      utilizationPct,
      isPartial: Number.isFinite(periodEnd)
        ? periodEnd > today.getTime()
        : false,
      serviceId: row.service_id ?? "All services",
      businessUnit:
        row.business_unit ?? row.cost_center ?? "Owner not recorded",
      evidenceReference: row.evidence_reference ?? "Evidence ref not recorded",
    };
  });
}

function formatRampPeriodLabel(value: string | null | undefined): string {
  if (!value) return "Period";
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
}

type NegotiationSequenceInput = {
  readonly id: string;
  readonly label: string;
  readonly shortLabel?: string | null;
  readonly buyerAsk?: string | null;
  readonly vendorConcession?: string | null;
  readonly negotiationLanguage?: string | null;
  readonly timingDependency?: string | null;
  readonly owner?: string | null;
  readonly ownerRole?: string | null;
  readonly priority?: string | null;
  readonly deadline?: string | null;
  readonly stageRaw?: string | null;
};

type NegotiationPlayRule = {
  readonly pattern: RegExp;
  readonly order: number;
  readonly lane: string;
  readonly rationale: string;
  readonly holdBack?: boolean;
  readonly evidenceGap?: string;
};

const NEGOTIATION_PLAYBOOK: readonly NegotiationPlayRule[] = [
  {
    pattern: /carry[-_\s]?forward|unused/i,
    order: 10,
    lane: "Open first",
    rationale:
      "Preserve buyer value before the next payment cycle; this is easier for the vendor to concede because it can be framed as adoption enablement, not a refund.",
  },
  {
    pattern: /commit[-_\s]?ramp|ramp schedule|re-time/i,
    order: 20,
    lane: "Anchor amendment",
    rationale:
      "Reset the commitment curve around production gates while the utilization evidence is fresh.",
  },
  {
    pattern: /support[-_\s]?rebase|support fee/i,
    order: 30,
    lane: "Attach economics",
    rationale:
      "Tie support economics to the same low-consumption fact pattern so it travels with the amendment instead of becoming a separate dispute.",
  },
  {
    pattern: /marketplace|private offer|edp/i,
    order: 40,
    lane: "Route conditionally",
    rationale:
      "Confirm cloud-portfolio credit treatment before papering the next commercial route.",
    evidenceGap: "Cloud commitment credit treatment must be confirmed first.",
  },
  {
    pattern: /serverless|classic|compute mode/i,
    order: 50,
    lane: "Validate before migration",
    rationale:
      "Protect the buyer from moving workloads into a compute mode whose discount treatment has not been proven.",
    evidenceGap: "Needs per-SKU serverless versus classic cost comparison.",
  },
  {
    pattern: /discount|re[-_\s]?price|pricing band/i,
    order: 90,
    lane: "Hold back",
    rationale:
      "Use after a benchmark comparable is loaded; opening with rate can invite the vendor to reopen term length before the easier concessions are banked.",
    holdBack: true,
    evidenceGap:
      "Needs an accepted benchmark comparable before it becomes a primary ask.",
  },
];

function negotiationPlayRuleFor(
  opportunity: NegotiationSequenceInput,
): NegotiationPlayRule | null {
  const haystack = [
    opportunity.id,
    opportunity.label,
    opportunity.shortLabel,
    opportunity.buyerAsk,
    opportunity.negotiationLanguage,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    NEGOTIATION_PLAYBOOK.find((rule) => rule.pattern.test(haystack)) ?? null
  );
}

function priorityRank(priority: string | null | undefined): number {
  const match = priority?.match(/\d+/);
  return match ? Number(match[0]) : Number.POSITIVE_INFINITY;
}

function deadlineRank(deadline: string | null | undefined): number {
  if (!deadline) return Number.POSITIVE_INFINITY;
  const parsed = Date.parse(deadline);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

function stageRank(stage: string | null | undefined): number {
  if (stage === "finance_confirmed" || stage === "validated") return 0;
  if (stage === "quantified") return 1;
  if (stage === "approval_required" || stage === "target_position") return 2;
  if (stage === "signal") return 8;
  return 5;
}

function hasNegotiationDetail(opportunity: NegotiationSequenceInput): boolean {
  return Boolean(
    opportunity.buyerAsk ||
    opportunity.negotiationLanguage ||
    opportunity.vendorConcession ||
    opportunity.timingDependency ||
    opportunity.priority,
  );
}

export function negotiationSequenceRows(
  opportunities: readonly NegotiationSequenceInput[],
) {
  return opportunities
    .filter(hasNegotiationDetail)
    .map((opportunity) => {
      const play = negotiationPlayRuleFor(opportunity);
      return {
        opportunity,
        lane: play?.lane ?? "Sequence by evidence",
        rationale:
          play?.rationale ??
          "Sequence by priority, deadline, and evidence stage; no authored lever-specific sequencing rule is loaded for this row.",
        evidenceGap: play?.evidenceGap ?? null,
        holdBack: Boolean(play?.holdBack),
        sortOrder: play?.order ?? 60,
      };
    })
    .sort((left, right) => {
      if (left.holdBack !== right.holdBack) return left.holdBack ? 1 : -1;
      return (
        left.sortOrder - right.sortOrder ||
        priorityRank(left.opportunity.priority) -
          priorityRank(right.opportunity.priority) ||
        deadlineRank(left.opportunity.deadline) -
          deadlineRank(right.opportunity.deadline) ||
        stageRank(left.opportunity.stageRaw) -
          stageRank(right.opportunity.stageRaw) ||
        left.opportunity.label.localeCompare(right.opportunity.label)
      );
    });
}

/** Levers with enough negotiation content to be worth a row. */
export function leverTableRows<
  T extends {
    readonly buyerAsk?: string | null;
    readonly vendorConcession?: string | null;
    readonly negotiationLanguage?: string | null;
  },
>(opportunities: readonly T[]): readonly T[] {
  return opportunities.filter(
    (opportunity) =>
      Boolean(opportunity.buyerAsk) ||
      Boolean(opportunity.vendorConcession) ||
      Boolean(opportunity.negotiationLanguage),
  );
}

/**
 * The value-type stack on a contract's evidence panel.
 *
 * Renders the value types that are actually established, then states in one
 * line which ones are not and what that absence means. A contract where
 * nothing was mischarged legitimately has no recoverable or avoidable
 * dollars; listing those as two empty rows made a correct reading look like
 * a data failure.
 */
function ContractValueTypeStack({
  view,
  cardCount,
}: {
  view: NonNullable<SourceWorkspaceVM["opportunityView"]>;
  cardCount: number;
}) {
  const { established, absent, confirmed } = contractValueTypeSummary(view);

  return (
    <div className="sw-v2-fact-stack">
      {established.map(([label, value, meaning]) => (
        <Fact key={label} label={`${label} - ${meaning}`} value={value} />
      ))}
      {absent.length > 0 ? (
        <p className="sw-v2-muted">
          No {absent.join(" or ")} dollars on this contract - nothing has been
          mischarged, so the whole opportunity has to be negotiated rather than
          simply claimed.
        </p>
      ) : null}
      <Fact
        label="Finance confirmed"
        value={confirmed ?? "Nothing booked yet"}
      />
      <Fact label="Deterministic cards" value={String(cardCount)} />
    </div>
  );
}

function ContractConsumptionRamp({
  spendMonths,
}: {
  spendMonths: readonly ConsumptionRampInput[];
}) {
  const rows = consumptionRampRows(spendMonths);
  if (rows.length === 0) return null;

  const totalCommitted = rows.reduce(
    (sum, row) => sum + (row.committedUsd ?? 0),
    0,
  );
  const totalActual = rows.reduce((sum, row) => sum + (row.actualUsd ?? 0), 0);
  const utilization =
    totalCommitted > 0
      ? Math.round((totalActual / totalCommitted) * 100)
      : null;
  const latest = rows[rows.length - 1];

  return (
    <section
      aria-label="Contract consumption ramp"
      style={{
        border: "1px solid rgba(10,10,11,.1)",
        borderRadius: 8,
        background: "#fffdfa",
        margin: "14px 0",
        padding: "13px 14px",
      }}
    >
      <div
        style={{
          alignItems: "start",
          display: "grid",
          gap: 14,
          gridTemplateColumns: "minmax(0, 1.6fr) minmax(185px, .7fr)",
        }}
      >
        <div>
          <span
            style={{
              color: SOURCE_CHART_PALETTE.teal,
              display: "block",
              fontSize: 9.5,
              fontWeight: 850,
              letterSpacing: ".08em",
              marginBottom: 5,
              textTransform: "uppercase",
            }}
          >
            Consumption ramp
          </span>
          <b style={{ display: "block", fontSize: 15, marginBottom: 3 }}>
            Monthly actual spend against committed run-rate
          </b>
          <p className="sw-v2-muted" style={{ margin: "0 0 12px" }}>
            The empty space is the commercial argument: Source shows what was
            committed and what was actually consumed, month by month, without
            extrapolating missing periods.
          </p>
          <div
            style={{
              alignItems: "end",
              display: "grid",
              gap: 7,
              gridTemplateColumns: `repeat(${rows.length}, minmax(34px, 1fr))`,
              minHeight: 144,
              overflowX: "auto",
              paddingBottom: 2,
            }}
          >
            {rows.map((row) => (
              <div
                key={row.key}
                aria-label={`${row.periodLabel}: ${
                  row.utilizationPct == null
                    ? "utilization not established"
                    : `${row.utilizationPct}% utilized`
                }`}
                style={{
                  alignItems: "center",
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                  minWidth: 0,
                }}
              >
                <small
                  style={{
                    color: row.isPartial
                      ? SOURCE_CHART_PALETTE.amber
                      : "#5f5e5a",
                    fontSize: 10,
                    fontWeight: 800,
                    minHeight: 12,
                  }}
                >
                  {row.utilizationPct == null ? "-" : `${row.utilizationPct}%`}
                </small>
                <div
                  style={{
                    alignItems: "end",
                    display: "flex",
                    height: 96,
                    justifyContent: "center",
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      background: row.isPartial
                        ? "rgba(186,117,23,.05)"
                        : "rgba(29,158,117,.04)",
                      border: `1px ${row.isPartial ? "dashed" : "solid"} ${
                        row.isPartial
                          ? "rgba(186,117,23,.6)"
                          : "rgba(15,110,86,.35)"
                      }`,
                      borderRadius: 5,
                      height:
                        row.committedScalePct == null
                          ? 38
                          : `${row.committedScalePct}%`,
                      minHeight: 28,
                      overflow: "hidden",
                      position: "relative",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        background: row.isPartial
                          ? "rgba(186,117,23,.45)"
                          : "rgba(29,158,117,.65)",
                        bottom: 0,
                        height:
                          row.actualScalePct == null
                            ? 0
                            : `${row.actualScalePct}%`,
                        left: 0,
                        position: "absolute",
                        right: 0,
                      }}
                    />
                  </div>
                </div>
                <span
                  style={{
                    color: "#74716a",
                    fontSize: 10,
                    fontWeight: 750,
                  }}
                >
                  {row.periodLabel}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="sw-v2-fact-stack">
          <Fact
            label="Observed utilization"
            value={utilization == null ? "Not established" : `${utilization}%`}
          />
          <Fact label="Observed actual" value={money(totalActual)} />
          <Fact label="Observed commitment" value={money(totalCommitted)} />
          <Fact
            label="Latest tracking grain"
            value={`${latest.serviceId} · ${latest.businessUnit}`}
          />
          <p className="sw-v2-muted">
            Track the same fields every month: commitment run-rate, actual
            consumed spend, invoice/paid amount, workload or service, owner/cost
            center, and evidence reference.
          </p>
          {rows.some((row) => row.isPartial) ? (
            <p className="sw-v2-muted">
              Dashed month is still open; Source does not project it to a full
              period.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/**
 * The lever table.
 *
 * Every column here reads a field the read adapter already returned and the
 * view model previously discarded: what the term is today, what to ask for,
 * why the vendor can agree, what it is worth, and who owns it by when. The
 * screen used to show a count of levers with no way to find out what they
 * were, which made the tab unactionable.
 */
function ProductShellLeverTable({ vm }: { vm: SourceWorkspaceVM }) {
  const view = vm.opportunityView;
  if (!view || view.opportunities.length === 0) return null;
  const rows = leverTableRows(view.opportunities);
  if (rows.length === 0) return null;

  const cellStyle: React.CSSProperties = {
    borderTop: "1px solid rgba(10,10,11,.08)",
    fontSize: 12,
    lineHeight: 1.35,
    padding: "9px 10px",
    verticalAlign: "top",
  };
  const headStyle: React.CSSProperties = {
    color: "#74716a",
    fontSize: 9.5,
    fontWeight: 850,
    letterSpacing: ".08em",
    padding: "0 10px 6px",
    textAlign: "left",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  };

  return (
    <div style={{ marginTop: 14, overflowX: "auto" }}>
      <table
        aria-label="Negotiation levers"
        style={{ borderCollapse: "collapse", minWidth: 940, width: "100%" }}
      >
        <thead>
          <tr>
            <th style={headStyle}>Lever</th>
            <th style={headStyle}>The ask</th>
            <th style={headStyle}>Why they can agree</th>
            <th style={headStyle}>Worth</th>
            <th style={headStyle}>Owner &amp; timing</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((opportunity) => {
            const isSignal = opportunity.stageRaw === "signal";
            return (
              <tr key={opportunity.id}>
                <td style={cellStyle}>
                  <b style={{ display: "block", fontSize: 13 }}>
                    {opportunity.shortLabel || opportunity.label}
                  </b>
                  <small
                    style={{
                      color: isSignal ? SOURCE_CHART_PALETTE.amber : "#5f5e5a",
                      display: "block",
                      fontSize: 10,
                      marginTop: 3,
                    }}
                  >
                    {opportunity.valueType} · {opportunity.stage}
                  </small>
                </td>
                <td style={cellStyle}>
                  {opportunity.buyerAsk ?? "Ask not recorded"}
                  {opportunity.negotiationLanguage ? (
                    <em
                      style={{
                        color: "#5f5e5a",
                        display: "block",
                        fontStyle: "italic",
                        marginTop: 5,
                      }}
                    >
                      &ldquo;{opportunity.negotiationLanguage}&rdquo;
                    </em>
                  ) : null}
                </td>
                <td style={cellStyle}>
                  {opportunity.vendorConcession ?? "Not recorded"}
                </td>
                <td style={cellStyle}>
                  <b
                    style={{
                      color: isSignal ? "#74716a" : SOURCE_CHART_PALETTE.teal,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {isSignal ? "Not sized" : opportunity.amount}
                  </b>
                  {isSignal ? (
                    <small
                      style={{
                        color: SOURCE_CHART_PALETTE.amber,
                        display: "block",
                        fontSize: 10,
                        marginTop: 3,
                      }}
                    >
                      needs evidence before it carries a number
                    </small>
                  ) : null}
                </td>
                <td style={cellStyle}>
                  {opportunity.ownerRole ?? opportunity.owner}
                  <small
                    style={{
                      color: "#5f5e5a",
                      display: "block",
                      fontSize: 10,
                      marginTop: 3,
                    }}
                  >
                    {opportunity.timingDependency ?? opportunity.deadline}
                  </small>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p
        style={{
          color: "#5f5e5a",
          fontSize: 11,
          lineHeight: 1.4,
          margin: "9px 2px 0",
        }}
      >
        Every row is a candidate until finance confirms it. Signal-stage rows
        carry no dollar figure on purpose - the evidence behind them does not
        yet support one.
      </p>
    </div>
  );
}

function ProductShellDiscountComparator({ vm }: { vm: SourceWorkspaceVM }) {
  const summary = portfolioDiscountComparatorSummary(
    vm.c?.id,
    vm.detail?.cloudCommitmentPeerCoverage ?? [],
    vm.opportunityView?.opportunities ?? [],
  );
  if (!summary) return null;

  return (
    <div
      aria-label="Portfolio-relative discount comparator"
      style={{
        background: "rgba(250,247,241,.72)",
        border: "1px solid rgba(10,10,11,.1)",
        borderRadius: 8,
        display: "grid",
        gap: 12,
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        marginTop: 14,
        padding: "12px 13px",
      }}
    >
      <div>
        <span
          style={{
            color: SOURCE_CHART_PALETTE.teal,
            display: "block",
            fontSize: 9.5,
            fontWeight: 850,
            letterSpacing: ".08em",
            marginBottom: 4,
            textTransform: "uppercase",
          }}
        >
          {summary.heading}
        </span>
        <b style={{ display: "block", fontSize: 15, marginBottom: 4 }}>
          {summary.headline}
        </b>
        <p className="sw-v2-muted" style={{ margin: 0 }}>
          {summary.basis}
        </p>
      </div>
      <div>
        <small
          style={{
            color: SOURCE_CHART_PALETTE.amber,
            display: "block",
            fontSize: 10.5,
            fontWeight: 800,
            lineHeight: 1.35,
            marginBottom: 7,
          }}
        >
          Evidence gate: {summary.evidenceGate}
        </small>
        <small
          style={{
            color: "#5f5e5a",
            display: "block",
            fontSize: 10.5,
            lineHeight: 1.35,
          }}
        >
          {summary.caveat}
        </small>
      </div>
    </div>
  );
}

function ProductShellNegotiationSequence({ vm }: { vm: SourceWorkspaceVM }) {
  const view = vm.opportunityView;
  if (!view || view.opportunities.length === 0) return null;
  const rows = negotiationSequenceRows(view.opportunities);
  if (rows.length === 0) return null;

  return (
    <div
      aria-label="Negotiation sequence"
      style={{
        borderTop: "1px solid rgba(10,10,11,.1)",
        marginTop: 16,
        paddingTop: 14,
      }}
    >
      <div
        style={{
          alignItems: "end",
          display: "flex",
          gap: 12,
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div>
          <span
            style={{
              color: SOURCE_CHART_PALETTE.teal,
              display: "block",
              fontSize: 9.5,
              fontWeight: 850,
              letterSpacing: ".08em",
              marginBottom: 3,
              textTransform: "uppercase",
            }}
          >
            Negotiation sequence
          </span>
          <b style={{ display: "block", fontSize: 15 }}>
            {rows.length} lever{rows.length === 1 ? "" : "s"}, in the order they
            have to happen
          </b>
        </div>
        <small
          style={{
            color: "#5f5e5a",
            fontSize: 11,
            lineHeight: 1.35,
            maxWidth: 360,
            textAlign: "right",
          }}
        >
          Authored playbook keyed to lever type; not model-generated strategy.
          Rows still remain candidates until finance confirms.
        </small>
      </div>
      <div
        style={{
          display: "grid",
          gap: 8,
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        }}
      >
        {rows.map((row, index) => (
          <div
            key={row.opportunity.id}
            style={{
              border: `1px ${row.holdBack ? "dashed" : "solid"} ${
                row.holdBack ? "rgba(186,117,23,.55)" : "rgba(10,10,11,.1)"
              }`,
              borderRadius: 8,
              background: row.holdBack
                ? "rgba(186,117,23,.05)"
                : "rgba(250,247,241,.72)",
              padding: "10px 11px",
            }}
          >
            <div
              style={{
                alignItems: "center",
                display: "flex",
                gap: 8,
                marginBottom: 7,
              }}
            >
              <span
                style={{
                  alignItems: "center",
                  background: row.holdBack
                    ? SOURCE_CHART_PALETTE.amber
                    : SOURCE_CHART_PALETTE.ink,
                  borderRadius: 999,
                  color: "white",
                  display: "inline-flex",
                  fontSize: 11,
                  fontWeight: 850,
                  height: 22,
                  justifyContent: "center",
                  width: 22,
                }}
              >
                {index + 1}
              </span>
              <span
                style={{
                  color: row.holdBack
                    ? SOURCE_CHART_PALETTE.amber
                    : SOURCE_CHART_PALETTE.teal,
                  fontSize: 9.5,
                  fontWeight: 850,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                }}
              >
                {row.lane}
              </span>
            </div>
            <b style={{ display: "block", fontSize: 13, marginBottom: 5 }}>
              {row.opportunity.shortLabel || row.opportunity.label}
            </b>
            <p style={{ fontSize: 12, lineHeight: 1.35, margin: "0 0 7px" }}>
              {row.rationale}
            </p>
            {row.opportunity.negotiationLanguage ? (
              <em
                style={{
                  color: "#5f5e5a",
                  display: "block",
                  fontSize: 11,
                  lineHeight: 1.35,
                  marginBottom: 6,
                }}
              >
                &ldquo;{row.opportunity.negotiationLanguage}&rdquo;
              </em>
            ) : null}
            <small
              style={{
                color: "#5f5e5a",
                display: "block",
                fontSize: 10.5,
                lineHeight: 1.35,
              }}
            >
              {row.opportunity.ownerRole ??
                row.opportunity.owner ??
                "Owner not recorded"}
              {row.opportunity.timingDependency
                ? ` · ${row.opportunity.timingDependency}`
                : ""}
            </small>
            {row.evidenceGap ? (
              <small
                style={{
                  color: SOURCE_CHART_PALETTE.amber,
                  display: "block",
                  fontSize: 10.5,
                  lineHeight: 1.35,
                  marginTop: 5,
                }}
              >
                Evidence gate: {row.evidenceGap}
              </small>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function OptimizeByTypeTable({
  portfolio,
}: {
  portfolio: SourceWorkspacePortfolioData;
}) {
  const rows = optimizeTypeRows(portfolio);
  if (rows.length === 0) {
    return (
      <div className="sw-v2-empty-state">
        <b>No typed action rows loaded.</b>
        <p>
          Source will not summarize recoverable, avoidable, or negotiable value
          by type until action rows exist.
        </p>
      </div>
    );
  }
  return (
    <>
      <OptimizeTypeMixChart rows={rows} />
      <div className="sw-v2-table">
        <div className="sw-v2-table-head sw-v2-opt-type-row">
          <span>Action type</span>
          <span>Rows</span>
          <span>Action amount</span>
          <span>Finance state</span>
        </div>
        {rows.map((row) => (
          <div key={row.type} className="sw-v2-table-row sw-v2-opt-type-row">
            <span>
              <b>{row.type}</b>
              <small>Derived from loaded action rows.</small>
            </span>
            <span>{row.count}</span>
            <span>{money(row.amount)}</span>
            <span>{row.financeState}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function OptimizeByContractTable({
  portfolio,
  onOpenContract,
}: {
  portfolio: SourceWorkspacePortfolioData;
  onOpenContract: (contractId: string, tab?: string) => void;
}) {
  const actionSet = focusedActionSet(portfolio);
  if (actionSet.rows.length === 0) {
    return (
      <div className="sw-v2-empty-state">
        <b>No contract-level action rows loaded.</b>
        <p>
          Contract headers can still be inspected, but Source will not invent an
          optimization action without evidence-backed action rows.
        </p>
      </div>
    );
  }
  return (
    <div className="sw-v2-table">
      <div className="sw-v2-table-head sw-v2-opt-contract-row">
        <span>Contract</span>
        <span>Finding</span>
        <span>Amount</span>
        <span>Next action</span>
      </div>
      {actionSet.rows.map((row) => (
        <button
          key={row.action_candidate_id}
          type="button"
          className="sw-v2-table-row sw-v2-opt-contract-row"
          onClick={() => onOpenContract(row.contract_id, "Optimize")}
        >
          <span>
            <b>{safeVendorDisplayName(row.vendor_name, row.vendor_ref)}</b>
            <small>{row.contract_id}</small>
          </span>
          <span>{row.finding_summary ?? row.title ?? "Review candidate"}</span>
          <span>{money(numberFromDb(row.candidate_amount_usd))}</span>
          <span>
            {row.next_action ?? row.readiness_state ?? "Not established"}
          </span>
        </button>
      ))}
      {actionSet.remainderCount > 0 ? (
        <div className="sw-v2-table-row sw-v2-opt-contract-row sw-v2-rollup-row">
          <span>
            <b>{actionSet.remainderCount} further action rows</b>
            <small>
              Summarized so the operator sees the ranked queue first.
            </small>
          </span>
          <span>Open By type or Evidence for full lineage before action.</span>
          <span>{money(actionSet.remainderAmount)}</span>
          <span>Keep behind rollup until selected.</span>
        </div>
      ) : null}
    </div>
  );
}

function OptimizeActionQueue({
  actionSet,
  onOpenContract,
}: {
  actionSet: FocusedActionSet;
  onOpenContract: (contractId: string, tab?: string) => void;
}) {
  if (actionSet.rows.length === 0) {
    return (
      <div className="sw-v2-empty-state">
        <b>No optimize-ready action rows loaded.</b>
        <p>
          Source can describe the contract book, but it will not recommend a
          move until an evidence-backed action row exists.
        </p>
      </div>
    );
  }
  return (
    <div className="sw-v2-table sw-v2-action-queue">
      <div className="sw-v2-table-head sw-v2-action-row">
        <span>Action</span>
        <span>Contract</span>
        <span>Amount</span>
        <span>Finance state</span>
        <span>Next</span>
      </div>
      {actionSet.rows.map((row) => (
        <button
          key={row.action_candidate_id}
          type="button"
          className="sw-v2-table-row sw-v2-action-row"
          onClick={() => onOpenContract(row.contract_id, "Optimize")}
        >
          <span>
            <b>{row.title ?? row.finding_summary ?? "Review loaded action"}</b>
            <small>{row.deterministic_basis ?? "Evidence basis loaded."}</small>
          </span>
          <span>
            <b>{safeVendorDisplayName(row.vendor_name, row.vendor_ref)}</b>
            <small>{row.contract_id}</small>
          </span>
          <span>{money(numberFromDb(row.candidate_amount_usd))}</span>
          <span>{formatFinanceState(row.finance_confirmation_state)}</span>
          <span>
            {row.next_action ?? row.readiness_state ?? "Review evidence"}
          </span>
        </button>
      ))}
      {actionSet.remainderCount > 0 ? (
        <div className="sw-v2-table-row sw-v2-action-row sw-v2-rollup-row">
          <span>
            <b>{actionSet.remainderCount} further action rows</b>
            <small>
              Kept in the rollup until an operator selects the next move.
            </small>
          </span>
          <span>Portfolio rollup</span>
          <span>{money(actionSet.remainderAmount)}</span>
          <span>Mixed states</span>
          <span>Review by type</span>
        </div>
      ) : null}
    </div>
  );
}

function EvidencePage({
  portfolio,
  showLineage,
  onToggleLineage,
}: {
  portfolio: SourceWorkspacePortfolioData;
  showLineage: boolean;
  onToggleLineage: () => void;
}) {
  const coverage = portfolio.impact.evidenceCoverage;
  const archetypeRows = evidenceArchetypeRows(portfolio);
  const sourceRows = [
    {
      name: "Contract headers",
      support: "Contract count, dates, values, renewal posture",
      lineage: "source.contract_360",
      count: portfolio.contracts.length,
      state: portfolio.reads.contracts,
    },
    {
      name: "Vendor rollups",
      support: "Vendor count, concentration, grouped contracts",
      lineage: "source.vendor_contract_portfolio",
      count: portfolio.vendors.length,
      state: portfolio.reads.vendors,
    },
    {
      name: "Application scope",
      support: "Contract-to-application rows and named scope",
      lineage: "source.contract_application_scope",
      count: portfolio.applicationScope.length,
      state: portfolio.reads.applicationScope,
    },
    {
      name: "Action rows",
      support: "Optimize-ready actions",
      lineage: "source.contract_action_candidate_v1",
      count: portfolio.impact.actionCandidates.length,
      state: portfolio.impact.actionCandidates.length ? "available" : "missing",
    },
    {
      name: "Claim cards",
      support: "Allowed executive statements and blockers",
      lineage: "source.contract_claim_card_v1",
      count: portfolio.impact.claimCards.length,
      state: portfolio.impact.claimCards.length ? "available" : "missing",
    },
    {
      name: "aVa grounding",
      support: "Citations, refusals, and safe-answer bundles",
      lineage: "source.ava_grounding_bundle_v1",
      count: portfolio.impact.avaGroundingBundles.length,
      state: portfolio.impact.avaGroundingBundles.length
        ? "available"
        : "missing",
    },
    {
      name: "Document page text",
      support: "Document citations, page spans, and proof text",
      lineage: "source.source_page_text_fact_assertion",
      count: coverage.reduce(
        (sum, row) => sum + (numberFromDb(row.document_page_text_rows) ?? 0),
        0,
      ),
      state: coverage.some(
        (row) => (numberFromDb(row.document_page_text_rows) ?? 0) > 0,
      )
        ? "available"
        : "missing",
    },
    {
      name: "Change orders",
      support: "Scope drift, commercial drift, and amendment posture",
      lineage: "source.source_change_order_fact_assertion",
      count: coverage.reduce(
        (sum, row) => sum + (numberFromDb(row.change_order_rows) ?? 0),
        0,
      ),
      state: coverage.some(
        (row) => (numberFromDb(row.change_order_rows) ?? 0) > 0,
      )
        ? "available"
        : "missing",
    },
  ];

  return (
    <div className="sw-v2-grid">
      <section className="sw-v2-panel sw-v2-span-2">
        <PanelHead eyebrow="Evidence" title="Archetype coverage matrix" />
        <LineageToggle
          showLineage={showLineage}
          onToggleLineage={onToggleLineage}
        />
        <EvidenceLaneBarChart rows={sourceRows} />
        <div className="sw-v2-table">
          <div className="sw-v2-table-head sw-v2-archetype-coverage-row">
            <span>Archetype</span>
            <span>Contracts</span>
            <span>Spend</span>
            <span>SLA</span>
            <span>Documents</span>
            <span>Change orders</span>
            <span>Actions</span>
            <span>Live registry</span>
          </div>
          {archetypeRows.map((row) => (
            <div
              key={row.archetype}
              className="sw-v2-table-row sw-v2-archetype-coverage-row"
            >
              <span>
                <b>{row.archetype}</b>
                <small>{row.description}</small>
              </span>
              <span>{row.contractCount}</span>
              <span>{row.spendRows}</span>
              <span>{row.performanceRows}</span>
              <span>{row.documentPageTextRows}</span>
              <span>{row.changeOrderRows}</span>
              <span>{row.actionRows}</span>
              <span>{row.registryLabel}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="sw-v2-panel sw-v2-span-2">
        <PanelHead
          eyebrow="Evidence lanes"
          title="Loaded rows, missing lanes, and claim eligibility"
        />
        <div className="sw-v2-table">
          <div className="sw-v2-table-head sw-v2-evidence-row">
            <span>Evidence lane</span>
            <span>Supports</span>
            <span>Rows</span>
            <span>Status</span>
          </div>
          {sourceRows.map((row) => (
            <div
              key={row.lineage}
              className="sw-v2-table-row sw-v2-evidence-row"
            >
              <span>
                <b>{row.name}</b>
                {showLineage ? <small>{row.lineage}</small> : null}
              </span>
              <span>{row.support}</span>
              <span>{row.count}</span>
              <span>{row.state}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="sw-v2-panel">
        <PanelHead eyebrow="Coverage" title="Contract-depth posture" />
        <div className="sw-v2-fact-stack">
          <Fact
            label="Evidence coverage rows"
            value={String(coverage.length)}
          />
          <Fact
            label="Spend rows"
            value={String(
              coverage.reduce(
                (sum, row) => sum + (numberFromDb(row.spend_rows) ?? 0),
                0,
              ),
            )}
          />
          <Fact
            label="Performance rows"
            value={String(
              coverage.reduce(
                (sum, row) => sum + (numberFromDb(row.performance_rows) ?? 0),
                0,
              ),
            )}
          />
          <Fact
            label="Document page text"
            value={String(
              coverage.reduce(
                (sum, row) =>
                  sum + (numberFromDb(row.document_page_text_rows) ?? 0),
                0,
              ),
            )}
          />
          <Fact label="Finance confirmed" value="Not established" />
        </div>
      </section>
    </div>
  );
}

function evidenceArchetypeRows(portfolio: SourceWorkspacePortfolioData) {
  const coverageByContractId = new Map(
    portfolio.impact.evidenceCoverage.map((row) => [row.contract_id, row]),
  );
  const actionRowsByContractId = new Map<string, number>();
  for (const row of portfolio.impact.actionCandidates) {
    actionRowsByContractId.set(
      row.contract_id,
      (actionRowsByContractId.get(row.contract_id) ?? 0) + 1,
    );
  }
  const groups = new Map<
    string,
    {
      description: string;
      contractCount: number;
      spendRows: number;
      performanceRows: number;
      documentPageTextRows: number;
      changeOrderRows: number;
      actionRows: number;
    }
  >();

  for (const contract of portfolio.contracts) {
    const rawArchetype = contract.vendor_category?.trim() || "";
    const archetype = rawArchetype
      ? titleFromSourceKey(rawArchetype)
      : "Not established";
    const current = groups.get(archetype) ?? {
      description: rawArchetype
        ? "Declared category from the governed contract row."
        : "No declared category; no inferred taxonomy override.",
      contractCount: 0,
      spendRows: 0,
      performanceRows: 0,
      documentPageTextRows: 0,
      changeOrderRows: 0,
      actionRows: 0,
    };
    const coverage = coverageByContractId.get(contract.contract_id);
    current.contractCount += 1;
    current.spendRows += numberFromDb(coverage?.spend_rows) ?? 0;
    current.performanceRows += numberFromDb(coverage?.performance_rows) ?? 0;
    current.documentPageTextRows +=
      numberFromDb(coverage?.document_page_text_rows) ?? 0;
    current.changeOrderRows += numberFromDb(coverage?.change_order_rows) ?? 0;
    current.actionRows += actionRowsByContractId.get(contract.contract_id) ?? 0;
    groups.set(archetype, current);
  }

  return [...groups.entries()]
    .map(([archetype, row]) => ({
      archetype,
      ...row,
      registryLabel:
        row.contractCount === portfolio.contracts.length
          ? "All loaded contracts"
          : `${row.contractCount} of ${portfolio.contracts.length}`,
    }))
    .sort((left, right) => {
      if (left.archetype === "Not established") return 1;
      if (right.archetype === "Not established") return -1;
      return (
        right.contractCount - left.contractCount ||
        left.archetype.localeCompare(right.archetype)
      );
    });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Legacy graph renderer is no longer reachable from the Source command IA; remove in a focused cleanup.
function ContractGraphPage({
  portfolio,
  subtab,
  onOpenSubtab,
  showLineage,
  onToggleLineage,
}: {
  portfolio: SourceWorkspacePortfolioData;
  subtab: string;
  onOpenSubtab: (tab: string) => void;
  showLineage: boolean;
  onToggleLineage: () => void;
}) {
  const lanes = [
    {
      title: "Source systems and files",
      nodes: [
        {
          label: "Contract repository",
          lineage: "CLM agreements, SOWs, pricing schedules, amendments",
        },
        {
          label: "Finance and invoices",
          lineage: "AP / ERP paid amount, invoice amount, cost center",
        },
        {
          label: "Service catalog",
          lineage: "CMDB applications, service towers, hosting model",
        },
        {
          label: "Service performance",
          lineage: "ITSM tickets, incidents, SLA periods, service credits",
        },
        {
          label: "Usage consoles",
          lineage: "SaaS seats, cloud usage, reserved commitments",
        },
      ],
    },
    {
      title: "Adapters",
      nodes: [
        {
          label: "Register adapter",
          lineage: "contract_register_adapter",
        },
        {
          label: "Clause adapter",
          lineage: "contract_clause_adapter",
        },
        {
          label: "Spend adapter",
          lineage: "contract_consumption_adapter",
        },
        {
          label: "Performance adapter",
          lineage: "contract_performance_adapter",
        },
        {
          label: "Scope adapter",
          lineage: "contract_scope_adapter",
        },
        {
          label: "Opportunity adapter",
          lineage: "optimization_opportunity_adapter",
        },
      ],
    },
    {
      title: "Canonical facts",
      nodes: [
        {
          label: "Contract",
          lineage: "source.contract",
        },
        {
          label: "Commercial terms",
          lineage: "source.contract_term",
        },
        {
          label: "Scope and applications",
          lineage: "source.contract_scope",
        },
        {
          label: "Monthly spend observations",
          lineage: "source.contract_consumption_observation",
        },
        {
          label: "Performance observations",
          lineage: "source.contract_performance_observation",
        },
        {
          label: "Optimization opportunities",
          lineage: "source.optimization_opportunity",
        },
      ],
    },
    {
      title: "Source page substrate",
      nodes: [
        {
          label: "Source 360",
          lineage: "source.contract_360",
        },
        {
          label: "Claim cards",
          lineage: "source.contract_claim_card_v1",
        },
        {
          label: "Action queue",
          lineage: "source.contract_action_candidate_v1",
        },
        {
          label: "Vendor position",
          lineage: "source.vendor_position_v1",
        },
        {
          label: "Page storyline",
          lineage: "source.source_page_storyline_v1",
        },
        {
          label: "aVa grounding bundle",
          lineage: "source.ava_grounding_bundle_v1",
        },
      ],
    },
  ];

  return (
    <div className="sw-v2-grid sw-v2-graph-layout">
      <section className="sw-v2-panel sw-v2-span-2 sw-v2-graph-hero-panel sw-v2-graph-panel">
        <SubtabBar
          tabs={GRAPH_SUBTABS}
          active={subtab}
          onSelect={onOpenSubtab}
        />
        <PanelHead eyebrow="Contract graph" title={graphSubtabTitle(subtab)} />
        {subtab === "Volume" ? (
          <GraphVolumeTable portfolio={portfolio} showLineage={showLineage} />
        ) : subtab === "Mapping spine" ? (
          <GraphSpineTable portfolio={portfolio} showLineage={showLineage} />
        ) : (
          <div className="sw-v2-graph" aria-label="Source contract graph flow">
            <svg
              className="sw-v2-graph-links"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M24 50 C32 50 34 50 40 50" />
              <path d="M49 50 C57 50 59 50 65 50" />
              <path d="M74 50 C82 50 84 50 90 50" />
            </svg>
            {lanes.map((lane) => (
              <div key={lane.title} className="sw-v2-graph-lane">
                <h3>{lane.title}</h3>
                {lane.nodes.map((node) => (
                  <div key={node.lineage} className="sw-v2-graph-node">
                    <b>{node.label}</b>
                    {showLineage ? <small>{node.lineage}</small> : null}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
        <LineageToggle
          showLineage={showLineage}
          onToggleLineage={onToggleLineage}
        />
      </section>

      <section className="sw-v2-panel">
        <PanelHead eyebrow="Live substrate" title="What Source can use now" />
        <div className="sw-v2-fact-stack">
          <Fact label="Contracts" value={String(portfolio.contracts.length)} />
          <Fact label="Vendors" value={String(portfolio.vendors.length)} />
          <Fact
            label="Claim cards"
            value={String(portfolio.impact.claimCards.length)}
          />
          <Fact
            label="Action rows"
            value={String(portfolio.impact.actionCandidates.length)}
          />
          <Fact
            label="aVa bundles"
            value={String(portfolio.impact.avaGroundingBundles.length)}
          />
        </div>
      </section>
    </div>
  );
}

function GraphVolumeTable({
  portfolio,
  showLineage,
}: {
  portfolio: SourceWorkspacePortfolioData;
  showLineage: boolean;
}) {
  const coverage = portfolio.impact.evidenceCoverage;
  const rows = [
    {
      layer: "Contract headers",
      object: "source.contract_360",
      count: portfolio.contracts.length,
      claim: "Contract count, vendor, dates, values, renewal posture",
    },
    {
      layer: "Vendor rollups",
      object: "source.vendor_contract_portfolio",
      count: portfolio.vendors.length,
      claim: "Vendor count, concentration, grouped contract list",
    },
    {
      layer: "Application scope",
      object: "source.contract_application_scope",
      count: portfolio.applicationScope.length,
      claim: "Contract-to-application rows only where loaded",
    },
    {
      layer: "Spend rows",
      object: "consumption.sourcing_spend_monthly_v1",
      count: coverage.reduce(
        (sum, row) => sum + (numberFromDb(row.spend_rows) ?? 0),
        0,
      ),
      claim: "Actual spend trend only where monthly rows exist",
    },
    {
      layer: "Performance rows",
      object: "consumption.sourcing_performance_v1",
      count: coverage.reduce(
        (sum, row) => sum + (numberFromDb(row.performance_rows) ?? 0),
        0,
      ),
      claim: "SLA and credit posture only where periods exist",
    },
    {
      layer: "Action rows",
      object: "source.contract_action_candidate_v1",
      count: portfolio.impact.actionCandidates.length,
      claim: "Optimize queue rows; not finance-confirmed value",
    },
    {
      layer: "Document page text",
      object: "source.source_page_text_fact_assertion",
      count: coverage.reduce(
        (sum, row) => sum + (numberFromDb(row.document_page_text_rows) ?? 0),
        0,
      ),
      claim: "Document statements only where page-text rows exist",
    },
    {
      layer: "Change orders",
      object: "source.source_change_order_fact_assertion",
      count: coverage.reduce(
        (sum, row) => sum + (numberFromDb(row.change_order_rows) ?? 0),
        0,
      ),
      claim: "Scope, price, or term drift only where change-order facts exist",
    },
  ];
  return (
    <>
      <GraphVolumeBars rows={rows} />
      <div className="sw-v2-table">
        <div className="sw-v2-table-head sw-v2-graph-volume-row">
          <span>Layer</span>
          <span>{showLineage ? "Read object" : "Substrate"}</span>
          <span>Rows</span>
          <span>Allowed claim</span>
        </div>
        {rows.map((row) => (
          <div
            key={row.object}
            className="sw-v2-table-row sw-v2-graph-volume-row"
          >
            <span>
              <b>{row.layer}</b>
            </span>
            <span>
              {showLineage ? row.object : plainSubstrateLabel(row.object)}
            </span>
            <span>{row.count}</span>
            <span>{row.claim}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function GraphSpineTable({
  portfolio,
  showLineage,
}: {
  portfolio: SourceWorkspacePortfolioData;
  showLineage: boolean;
}) {
  const rows: Array<{
    family: string;
    sourceSystem: string;
    adapter: string;
    canonical: string;
    substrate: string;
    rows: number;
  }> = [
    {
      family: "Contract register",
      sourceSystem: "CLM / contract repository",
      adapter: "contract_register_adapter",
      canonical: "source.contract, source.vendor",
      substrate: "source.contract_360",
      rows: portfolio.contracts.length,
    },
    {
      family: "Vendor rollup",
      sourceSystem: "Vendor master and contract refs",
      adapter: "vendor_portfolio_adapter",
      canonical: "source.vendor",
      substrate: "source.vendor_contract_portfolio",
      rows: portfolio.vendors.length,
    },
    {
      family: "Scope to applications",
      sourceSystem: "CMDB / service catalog",
      adapter: "contract_scope_adapter",
      canonical: "source.contract_scope",
      substrate: "source.contract_application_scope",
      rows: portfolio.applicationScope.length,
    },
    {
      family: "Spend consumption",
      sourceSystem: "AP / ERP invoices",
      adapter: "contract_consumption_adapter",
      canonical: "source.contract_consumption_observation",
      substrate: "consumption.sourcing_spend_monthly_v1",
      rows:
        sourceImpactCoverageRowTotal(
          portfolio.impact.evidenceCoverage,
          "spend_rows",
        ) || portfolio.v4Snapshot.spendConsumption.rowCount,
    },
    {
      family: "SLA performance",
      sourceSystem: "ITSM / SLA history",
      adapter: "contract_performance_adapter",
      canonical: "source.contract_performance_observation",
      substrate: "consumption.sourcing_performance_v1",
      rows:
        sourceImpactCoverageRowTotal(
          portfolio.impact.evidenceCoverage,
          "performance_rows",
        ) || portfolio.v4Snapshot.performanceCredits.rowCount,
    },
    {
      family: "Optimization action",
      sourceSystem: "Deterministic impact layer",
      adapter: "optimization_opportunity_adapter",
      canonical: "source.optimization_opportunity",
      substrate: "source.contract_action_candidate_v1",
      rows: portfolio.impact.actionCandidates.length,
    },
    {
      family: "Document manifest",
      sourceSystem: "Evidence manifest / document inventory",
      adapter: "evidence_document_adapter",
      canonical: "source.source_record_snapshot",
      substrate: "source.source_page_text_fact_assertion",
      rows: portfolio.impact.evidenceCoverage.reduce(
        (sum, row) => sum + (numberFromDb(row.document_page_text_rows) ?? 0),
        0,
      ),
    },
    {
      family: "Change orders",
      sourceSystem: "Amendment and change-order register",
      adapter: "change_order_adapter",
      canonical: "source.contract_change_order",
      substrate: "source.source_change_order_fact_assertion",
      rows: portfolio.impact.evidenceCoverage.reduce(
        (sum, row) => sum + (numberFromDb(row.change_order_rows) ?? 0),
        0,
      ),
    },
  ];
  return (
    <>
      <GraphMappingFlow rows={rows} showLineage={showLineage} />
      <div className="sw-v2-table">
        <div className="sw-v2-table-head sw-v2-graph-spine-row">
          <span>Evidence family</span>
          <span>Source system</span>
          <span>{showLineage ? "Adapter" : "Intake path"}</span>
          <span>{showLineage ? "Canonical" : "Facts created"}</span>
          <span>{showLineage ? "Product substrate" : "Source view"}</span>
          <span>Rows</span>
        </div>
        {rows.map((row) => (
          <div
            key={row.family}
            className="sw-v2-table-row sw-v2-graph-spine-row"
          >
            <span>{row.family}</span>
            <span>{row.sourceSystem}</span>
            <span>
              {showLineage ? row.adapter : plainAdapterLabel(row.adapter)}
            </span>
            <span>
              {showLineage ? row.canonical : plainCanonicalLabel(row.canonical)}
            </span>
            <span>
              {showLineage ? row.substrate : plainSubstrateLabel(row.substrate)}
            </span>
            <span>{row.rows}</span>
          </div>
        ))}
      </div>
    </>
  );
}

type EvidenceLaneVisualRow = {
  readonly name: string;
  readonly support: string;
  readonly lineage: string;
  readonly count: number;
  readonly state: string;
};

function EvidenceLaneBarChart({
  rows,
}: {
  rows: readonly EvidenceLaneVisualRow[];
}) {
  const maxCount = Math.max(...rows.map((row) => row.count), 1);
  return (
    <div className="sw-v2-visual-bars" aria-label="Evidence lane row counts">
      {rows.map((row, index) => {
        const width = Math.max(4, Math.round((row.count / maxCount) * 100));
        return (
          <div key={row.lineage} className="sw-v2-visual-bar-row">
            <span>{row.name}</span>
            <div className="sw-v2-visual-bar-track">
              <i
                style={
                  {
                    "--sw-v2-bar-width": `${width}%`,
                    "--sw-v2-bar-color": chartSeriesColor(index),
                  } as CSSProperties
                }
              />
            </div>
            <b>{formatCount(row.count)}</b>
          </div>
        );
      })}
    </div>
  );
}

function GraphVolumeBars({
  rows,
}: {
  rows: readonly {
    readonly layer: string;
    readonly object: string;
    readonly count: number;
    readonly claim: string;
  }[];
}) {
  const maxCount = Math.max(...rows.map((row) => row.count), 1);
  return (
    <div
      className="sw-v2-graph-volume-visual"
      aria-label="Source graph row volume"
    >
      {rows.map((row, index) => {
        const width = Math.max(5, Math.round((row.count / maxCount) * 100));
        return (
          <div key={row.object} className="sw-v2-volume-card">
            <span>{row.layer}</span>
            <b>{formatCount(row.count)}</b>
            <i
              style={
                {
                  "--sw-v2-volume-width": `${width}%`,
                  "--sw-v2-volume-color": chartSeriesColor(index),
                } as CSSProperties
              }
            />
          </div>
        );
      })}
    </div>
  );
}

function GraphMappingFlow({
  rows,
  showLineage,
}: {
  rows: readonly {
    readonly family: string;
    readonly sourceSystem: string;
    readonly adapter: string;
    readonly canonical: string;
    readonly substrate: string;
    readonly rows: number;
  }[];
  showLineage: boolean;
}) {
  const featuredRows = rows.slice(0, 6);
  return (
    <div className="sw-v2-mapping-flow" aria-label="Source mapping flow">
      {featuredRows.map((row) => (
        <div key={row.family} className="sw-v2-mapping-flow-row">
          <span>
            <b>{row.sourceSystem}</b>
            <small>{row.family}</small>
          </span>
          <i aria-hidden="true" />
          <span>
            <b>{showLineage ? row.adapter : plainAdapterLabel(row.adapter)}</b>
            <small>adapter</small>
          </span>
          <i aria-hidden="true" />
          <span>
            <b>
              {showLineage ? row.canonical : plainCanonicalLabel(row.canonical)}
            </b>
            <small>{formatCount(row.rows)} rows</small>
          </span>
          <i aria-hidden="true" />
          <span>
            <b>
              {showLineage ? row.substrate : plainSubstrateLabel(row.substrate)}
            </b>
            <small>Source view</small>
          </span>
        </div>
      ))}
    </div>
  );
}

function Metric({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone?: "warn";
}) {
  return (
    <div className={`sw-v2-metric ${tone === "warn" ? "is-warn" : ""}`}>
      <span>{label}</span>
      <b>{value}</b>
      <small>{note}</small>
    </div>
  );
}

function SubtabBar<T extends readonly string[]>({
  tabs,
  active,
  onSelect,
}: {
  tabs: T;
  active: string;
  onSelect: (tab: T[number]) => void;
}) {
  return (
    <div className="sw-v2-subtabbar" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={active === tab}
          className={active === tab ? "is-active" : ""}
          onClick={() => onSelect(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

function LineageToggle({
  showLineage,
  onToggleLineage,
}: {
  showLineage: boolean;
  onToggleLineage: () => void;
}) {
  return (
    <div className="sw-v2-lineage-toggle">
      <p>
        {showLineage
          ? "Canonical object names, adapters, and read-model paths are visible for audit."
          : "Executive view hides raw substrate names; open lineage when auditing the evidence path."}
      </p>
      <button type="button" onClick={onToggleLineage}>
        {showLineage ? "Hide lineage" : "Show lineage"}
      </button>
    </div>
  );
}

function PanelHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="sw-v2-panel-head">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
    </div>
  );
}

function plainAdapterLabel(adapter: string) {
  if (adapter.includes("contract_register")) return "Contract register";
  if (adapter.includes("vendor_portfolio")) return "Vendor rollup";
  if (adapter.includes("scope")) return "Scope mapping";
  if (adapter.includes("consumption")) return "Spend consumption";
  if (adapter.includes("performance")) return "SLA performance";
  if (adapter.includes("optimization")) return "Action calculation";
  if (adapter.includes("evidence_document")) return "Document evidence";
  if (adapter.includes("change_order")) return "Change-order evidence";
  return "Mapped intake";
}

function plainCanonicalLabel(canonical: string) {
  if (canonical.includes("contract, source.vendor")) {
    return "Contracts and vendors";
  }
  if (canonical.includes("source.vendor")) return "Vendor facts";
  if (canonical.includes("contract_scope")) return "Scope facts";
  if (canonical.includes("contract_consumption")) return "Monthly spend facts";
  if (canonical.includes("contract_performance")) {
    return "Performance and credit facts";
  }
  if (canonical.includes("optimization")) return "Opportunity facts";
  if (canonical.includes("source_record_snapshot")) return "Document snapshots";
  if (canonical.includes("change_order")) return "Change-order facts";
  if (canonical.includes("page_text")) return "Document page text";
  if (canonical.includes("contract_term")) return "Commercial term facts";
  return "Canonical facts";
}

function plainSubstrateLabel(substrate: string) {
  if (substrate.includes("contract_360")) return "Contract detail";
  if (substrate.includes("vendor_contract_portfolio"))
    return "Vendor portfolio";
  if (substrate.includes("application_scope")) return "Application scope";
  if (substrate.includes("spend_monthly")) return "Spend trend";
  if (substrate.includes("performance")) return "Performance view";
  if (substrate.includes("action_candidate")) return "Optimize action queue";
  if (substrate.includes("page_text")) return "Document page text";
  if (substrate.includes("change_order")) return "Change-order facts";
  if (substrate.includes("claim_card")) return "Executive claim cards";
  if (substrate.includes("vendor_position")) return "Vendor position";
  if (substrate.includes("source_page_storyline")) return "Page storyline";
  if (substrate.includes("ava_grounding")) return "aVa grounding";
  return "Source view";
}

function titleFromSourceKey(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="sw-v2-fact">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function ContractScopeTable({
  scopeRows,
}: {
  scopeRows: readonly SourceContractApplicationScopeRow[];
}) {
  if (scopeRows.length === 0) {
    return (
      <div className="sw-v2-empty-state">
        <b>No scoped applications loaded for this contract.</b>
        <p>
          Source can show the contract header, but it will not infer which
          applications, services, or business functions are covered.
        </p>
      </div>
    );
  }

  return (
    <div className="sw-v2-table">
      <div className="sw-v2-table-head sw-v2-scope-row">
        <span>Application / service</span>
        <span>Business function</span>
        <span>Criticality</span>
        <span>Hosting</span>
        <span>Run cost</span>
      </div>
      {scopeRows.slice(0, 12).map((row) => (
        <div
          key={`${row.contract_id}:${row.application_ref}`}
          className="sw-v2-table-row sw-v2-scope-row"
        >
          <span>
            <b>{row.application_name}</b>
            <small>{row.application_ref}</small>
          </span>
          <span>{row.business_function ?? "Not established"}</span>
          <span>{row.criticality ?? "Not established"}</span>
          <span>{row.hosting_model ?? "Not established"}</span>
          <span>{money(numberFromDb(row.annual_run_cost))}</span>
        </div>
      ))}
      {scopeRows.length > 12 ? (
        <div className="sw-v2-table-foot">
          Showing 12 of {scopeRows.length} scoped rows.
        </div>
      ) : null}
    </div>
  );
}

export function ContractEvidenceDocuments({
  coverage,
  files,
  extractions,
}: {
  coverage?: SourceContractEvidenceCoverageRow | null;
  files: readonly DocFileRow[];
  extractions: readonly DocExtractionRow[];
}) {
  const extractionCountByFile = new Map<string, number>();
  for (const row of extractions) {
    if (!row.source_file_id) continue;
    extractionCountByFile.set(
      row.source_file_id,
      (extractionCountByFile.get(row.source_file_id) ?? 0) + 1,
    );
  }
  const rankedFiles = [...files].sort((a, b) => {
    const extractionDelta =
      (extractionCountByFile.get(b.file_id) ?? 0) -
      (extractionCountByFile.get(a.file_id) ?? 0);
    if (extractionDelta !== 0) return extractionDelta;
    return (b.page_count ?? 0) - (a.page_count ?? 0);
  });
  const visibleFiles = rankedFiles.slice(0, 8);
  const extractedDocumentCount = extractionCountByFile.size;
  const pageCount = files.reduce(
    (sum, file) => sum + (numberFromDb(file.page_count) ?? 0),
    0,
  );

  return (
    <div className="sw-v2-contract-documents">
      {files.length || extractions.length ? (
        <div
          className="sw-v2-document-metrics"
          aria-label="Contract document evidence summary"
        >
          <Fact label="Governed files" value={String(files.length)} />
          <Fact label="Document pages" value={String(pageCount)} />
          <Fact label="Extracted facts" value={String(extractions.length)} />
          <Fact
            label="Clause-bearing documents"
            value={String(extractedDocumentCount)}
          />
        </div>
      ) : null}
      {visibleFiles.length ? (
        <div className="sw-v2-table">
          <div className="sw-v2-table-head sw-v2-document-row">
            <span>Source document</span>
            <span>Type</span>
            <span>Pages</span>
            <span>Facts</span>
            <span>Evidence state</span>
          </div>
          {visibleFiles.map((file) => (
            <div
              key={file.file_id}
              className="sw-v2-table-row sw-v2-document-row"
            >
              <span>
                <b>{documentEvidenceLabel(file)}</b>
                <small>{file.file_id}</small>
              </span>
              <span>{humanizeEvidenceToken(file.document_type)}</span>
              <span>{formatCount(file.page_count)}</span>
              <span>{extractionCountByFile.get(file.file_id) ?? 0}</span>
              <span>
                {file.content_authenticity === "synthetic"
                  ? "Reviewed synthetic"
                  : "Governed source"}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="sw-v2-evidence-empty">
          <b>Document package not attached in this demo-safe layer.</b>
          <p>
            Source can still optimize this contract because structured spend,
            scope, performance, and opportunity rows are loaded separately from
            raw PDF page text. That is why document counts stay at zero while
            the Economics, Scope, and Optimize tabs can still render governed
            rows.
          </p>
          <div className="sw-v2-fact-grid">
            <Fact
              label="Spend rows"
              value={formatCount(coverage?.spend_rows)}
            />
            <Fact
              label="Scope rows"
              value={formatCount(coverage?.scope_rows)}
            />
            <Fact
              label="Opportunity rows"
              value={formatCount(coverage?.opportunity_rows)}
            />
            <Fact
              label="Performance rows"
              value={formatCount(coverage?.performance_rows)}
            />
          </div>
        </div>
      )}
      {rankedFiles.length > visibleFiles.length ? (
        <p className="sw-v2-muted">
          {rankedFiles.length - visibleFiles.length} additional governed
          evidence files remain available in the evidence inventory.
        </p>
      ) : null}
    </div>
  );
}

function documentEvidenceLabel(file: DocFileRow): string {
  const knownLabels: Record<string, string> = {
    master_services_agreement: "Master services agreement",
    statement_of_work: "Statement of work",
    pricing_schedule: "Pricing schedule",
    sla_report: "SLA schedule and performance evidence",
    usage_entitlement_report: "Usage and entitlement evidence",
    change_order_ledger: "Change-order ledger",
    invoice_export: "Invoice and spend evidence",
  };
  return (
    knownLabels[file.document_type ?? ""] ?? file.file_name ?? file.file_id
  );
}

function humanizeEvidenceToken(value: string | null): string {
  if (!value) return "Supplemental evidence";
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function activePage(
  logic: WorkspaceViewModel,
  vm: SourceWorkspaceVM,
): PageLabel {
  if (logic.state.sel.kind === "evidence") return "Evidence";
  if (logic.state.sel.kind === "graph") return "Coverage";
  if (logic.state.sel.kind === "vendor" || vm.isVendorList) return "Coverage";
  if (vm.isContractList) return "Contracts";
  if (logic.state.sel.kind === "optimize") return "Levers";
  if (vm.isContract) return "Contracts";
  return "Command";
}

function preferredContract(portfolio: SourceWorkspacePortfolioData) {
  const creditContract = portfolio.cockpit.actionQueue.find((row) =>
    /credit/i.test(`${row.actionVerb} ${row.why}`),
  );
  if (creditContract) {
    return (
      portfolio.contracts.find(
        (contract) => contract.contract_id === creditContract.contractId,
      ) ?? null
    );
  }
  const topContract = portfolio.cockpit.topContracts[0];
  return topContract
    ? (portfolio.contracts.find(
        (contract) => contract.contract_id === topContract.contractId,
      ) ?? null)
    : null;
}

function coverageForContract(
  portfolio: SourceWorkspacePortfolioData,
  contractId: string,
) {
  return (
    portfolio.impact.evidenceCoverage.find(
      (row) => row.contract_id === contractId,
    ) ?? null
  );
}

function storylineBySurface(
  portfolio: SourceWorkspacePortfolioData,
  surfaceKey: string,
) {
  return (
    portfolio.impact.storyline.find((row) => row.page_key === surfaceKey) ??
    portfolio.impact.storyline.find((row) => row.section_key === surfaceKey) ??
    null
  );
}

function formatCount(value: number | null | undefined) {
  return value == null ? "Not established" : String(value);
}

export function sourceImpactCoverageRowTotal(
  rows: readonly SourceContractEvidenceCoverageRow[],
  key:
    | "spend_rows"
    | "performance_rows"
    | "document_page_text_rows"
    | "change_order_rows",
) {
  return rows.reduce((sum, row) => sum + (numberFromDb(row[key]) ?? 0), 0);
}

function contractsByAnnualValue(contracts: readonly SourceContract360Row[]) {
  return contracts
    .slice()
    .sort(
      (a, b) =>
        (numberFromDb(b.annual_value) ?? 0) -
        (numberFromDb(a.annual_value) ?? 0),
    );
}

export function focusedContractSet(
  portfolio: SourceWorkspacePortfolioData,
  limit = 7,
): FocusedContractSet {
  const coverageByContract = new Map(
    portfolio.impact.evidenceCoverage.map((row) => [row.contract_id, row]),
  );
  const actionRowsByContract = countByContract(
    portfolio.impact.actionCandidates.map((row) => row.contract_id),
  );
  const claimRowsByContract = countByContract(
    portfolio.impact.claimCards.map((row) => row.contract_id),
  );
  const ranked = contractsByAnnualValue(focusableContractRows(portfolio))
    .map((contract): FocusedContractRow => {
      const coverage = coverageByContract.get(contract.contract_id) ?? null;
      const actionRows = actionRowsByContract.get(contract.contract_id) ?? 0;
      const claimRows = claimRowsByContract.get(contract.contract_id) ?? 0;
      const depthScore = contractDepthScore(
        contract,
        coverage,
        actionRows,
        claimRows,
      );
      return {
        contract,
        coverage,
        actionRows,
        claimRows,
        depthScore,
        reason: contractFocusReason(contract, coverage, actionRows, claimRows),
      };
    })
    .sort(
      (a, b) =>
        b.depthScore - a.depthScore ||
        (numberFromDb(b.contract.annual_value) ?? 0) -
          (numberFromDb(a.contract.annual_value) ?? 0),
    );
  const rows = ranked.filter((row) => row.depthScore > 0).slice(0, limit);
  if (rows.length < Math.min(limit, 3)) {
    const selected = new Set(rows.map((row) => row.contract.contract_id));
    for (const row of ranked) {
      if (rows.length >= Math.min(limit, 3)) break;
      if (selected.has(row.contract.contract_id)) continue;
      rows.push(row);
      selected.add(row.contract.contract_id);
    }
  }
  const selectedIds = new Set(rows.map((row) => row.contract.contract_id));
  const remainder = portfolio.contracts.filter(
    (contract) => !selectedIds.has(contract.contract_id),
  );
  return {
    rows,
    remainderCount: remainder.length,
    remainderAnnualValue: remainder.reduce(
      (sum, contract) => sum + (numberFromDb(contract.annual_value) ?? 0),
      0,
    ),
    depthReadyCount: ranked.filter((row) => row.depthScore > 0).length,
  };
}

function countByContract(contractIds: readonly string[]) {
  const counts = new Map<string, number>();
  for (const contractId of contractIds) {
    counts.set(contractId, (counts.get(contractId) ?? 0) + 1);
  }
  return counts;
}

function contractDepthScore(
  contract: SourceContract360Row,
  coverage: SourceContractEvidenceCoverageRow | null,
  actionRows: number,
  claimRows: number,
) {
  return (
    actionRows * 100 +
    claimRows * 90 +
    (coverage?.opportunity_rows ?? 0) * 80 +
    (coverage?.performance_rows ?? 0) * 8 +
    (coverage?.spend_rows ?? 0) * 6 +
    (coverage?.document_page_text_rows ?? 0) * 3 +
    (coverage?.scope_rows ?? 0) * 2 +
    (numberFromDb(coverage?.unclaimed_credit_usd) ?? 0) / 10000 +
    (numberFromDb(contract.actual_annual_spend) == null ? 0 : 5)
  );
}

function contractFocusReason(
  contract: SourceContract360Row,
  coverage: SourceContractEvidenceCoverageRow | null,
  actionRows: number,
  claimRows: number,
) {
  if (claimRows > 0)
    return `${claimRows} executive claim card${claimRows === 1 ? "" : "s"}`;
  if (actionRows > 0)
    return `${actionRows} action row${actionRows === 1 ? "" : "s"}`;
  if ((coverage?.unclaimed_credit_usd ?? 0) > 0)
    return "Unclaimed credit evidence";
  if ((coverage?.performance_rows ?? 0) > 0)
    return "Performance evidence loaded";
  if ((coverage?.spend_rows ?? 0) > 0) return "Monthly spend loaded";
  if ((coverage?.document_page_text_rows ?? 0) > 0)
    return "Document text loaded";
  if ((coverage?.scope_rows ?? 0) > 0) return "Application scope mapped";
  if (numberFromDb(contract.actual_annual_spend) != null)
    return "Actual spend loaded";
  return "Header-only portfolio signal";
}

export function focusedVendorSet(
  portfolio: SourceWorkspacePortfolioData,
  vendors: readonly ExecutiveVendorRow[],
  mode: "concentration" | "evidence",
  limit = 7,
): FocusedVendorSet {
  const coverageByVendor = vendorCoverageRows(portfolio);
  const candidateVendors =
    mode === "evidence"
      ? vendorsWithImpactEvidence(portfolio, vendors)
      : vendors;
  const unresolvedCount =
    mode === "evidence" ? unresolvedVendorIdentityCount(candidateVendors) : 0;
  const visibleVendors =
    mode === "evidence"
      ? candidateVendors.filter((vendor) => !isUnresolvedVendorDisplay(vendor))
      : candidateVendors;
  const ranked = visibleVendors
    .map((vendor): FocusedVendorRow => {
      const coverage = coverageForVendor(vendor, coverageByVendor);
      return {
        vendor,
        coverage,
        reason:
          mode === "evidence"
            ? vendorEvidenceReason(coverage)
            : vendorConcentrationReason(vendor),
      };
    })
    .sort((a, b) => {
      if (mode === "evidence") {
        return (
          vendorDepthScore(b.coverage) - vendorDepthScore(a.coverage) ||
          (numberFromDb(b.vendor.annual_value) ?? 0) -
            (numberFromDb(a.vendor.annual_value) ?? 0)
        );
      }
      return (
        (numberFromDb(b.vendor.annual_value) ?? 0) -
        (numberFromDb(a.vendor.annual_value) ?? 0)
      );
    });
  const rows =
    mode === "evidence"
      ? ranked
          .filter((row) => vendorDepthScore(row.coverage) > 0)
          .slice(0, limit)
      : ranked.slice(0, limit);
  if (mode === "evidence" && rows.length < Math.min(limit, 3)) {
    const selected = new Set(rows.map((row) => row.vendor.vendor_ref));
    for (const row of ranked) {
      if (rows.length >= Math.min(limit, 3)) break;
      if (selected.has(row.vendor.vendor_ref)) continue;
      rows.push(row);
      selected.add(row.vendor.vendor_ref);
    }
  }
  const selectedRefs = new Set(rows.map((row) => row.vendor.vendor_ref));
  const remainder = visibleVendors.filter(
    (vendor) => !selectedRefs.has(vendor.vendor_ref),
  );
  return {
    rows,
    remainderCount: remainder.length,
    remainderAnnualValue: remainder.reduce(
      (sum, vendor) => sum + (numberFromDb(vendor.annual_value) ?? 0),
      0,
    ),
    depthReadyCount: ranked.filter((row) => vendorDepthScore(row.coverage) > 0)
      .length,
    unresolvedCount,
  };
}

export function resolveSelectedVendor(
  portfolio: SourceWorkspacePortfolioData,
  vendors: readonly ExecutiveVendorRow[],
  selectedVendorRef: string | null,
): ExecutiveVendorRow | null {
  if (!selectedVendorRef) return null;

  const linkedByRef = (vendor: ExecutiveVendorRow) =>
    uniqueRefs([vendor.vendor_ref, ...vendor.vendor_refs]).includes(
      selectedVendorRef,
    );
  const registerVendor = vendors.find(linkedByRef);
  const evidenceVendor = vendorsWithImpactEvidence(portfolio, vendors).find(
    linkedByRef,
  );

  if (registerVendor && evidenceVendor) {
    return {
      ...evidenceVendor,
      vendor_ref: registerVendor.vendor_ref,
      vendor_name: preferVendorDisplayName(
        registerVendor.vendor_name,
        evidenceVendor.vendor_name,
      ),
      vendor_category:
        registerVendor.vendor_category ?? evidenceVendor.vendor_category,
      annual_value: registerVendor.annual_value ?? evidenceVendor.annual_value,
      total_committed_value:
        registerVendor.total_committed_value ??
        evidenceVendor.total_committed_value,
      auto_renew_contracts: registerVendor.auto_renew_contracts,
      next_end_date: registerVendor.next_end_date,
      vendor_refs: uniqueRefs([
        registerVendor.vendor_ref,
        ...registerVendor.vendor_refs,
        evidenceVendor.vendor_ref,
        ...evidenceVendor.vendor_refs,
      ]),
      contract_refs: uniqueRefs([
        ...registerVendor.contract_refs,
        ...evidenceVendor.contract_refs,
      ]),
    };
  }

  return registerVendor ?? evidenceVendor ?? null;
}

function vendorsWithImpactEvidence(
  portfolio: SourceWorkspacePortfolioData,
  vendors: readonly ExecutiveVendorRow[],
): ExecutiveVendorRow[] {
  const byName = new Map<string, ExecutiveVendorRow>();
  for (const vendor of vendors) {
    const displayName = safeVendorDisplayName(
      vendor.vendor_name,
      vendor.vendor_ref,
    );
    byName.set(normalizedVendorName(displayName), {
      ...vendor,
      vendor_name: displayName,
      vendor_refs: uniqueRefs([vendor.vendor_ref, ...vendor.vendor_refs]),
    });
  }

  const contractsById = new Map(
    focusableContractRows(portfolio).map((contract) => [
      contract.contract_id,
      contract,
    ]),
  );
  const upsert = ({
    contractId,
    vendorName,
    vendorRef,
    vendorCategory,
    annualValue,
  }: {
    contractId: string;
    vendorName: string;
    vendorRef: string;
    vendorCategory: string | null;
    annualValue: number | null;
  }) => {
    const displayName = safeVendorDisplayName(vendorName, vendorRef);
    const key =
      displayName === "Vendor name not resolved"
        ? vendorRef || contractId
        : normalizedVendorName(displayName);
    if (!key || !vendorRef) return;
    const existing = byName.get(key);
    const contractRefs = uniqueRefs([
      ...(existing?.contract_refs ?? []),
      contractId,
    ]);
    if (existing) {
      byName.set(key, {
        ...existing,
        vendor_name: preferVendorDisplayName(existing.vendor_name, displayName),
        vendor_category: existing.vendor_category ?? vendorCategory,
        contract_count: Math.max(existing.contract_count, contractRefs.length),
        annual_value: numberFromDb(existing.annual_value) ?? annualValue,
        total_committed_value:
          numberFromDb(existing.total_committed_value) ?? annualValue,
        contract_refs: contractRefs,
        vendor_refs: uniqueRefs([
          existing.vendor_ref,
          ...existing.vendor_refs,
          vendorRef,
        ]),
      });
      return;
    }
    byName.set(key, {
      tenant_key: portfolio.tenantKey,
      vendor_ref: vendorRef,
      vendor_name: displayName,
      vendor_category: vendorCategory,
      contract_count: contractRefs.length,
      annual_value: annualValue,
      total_committed_value: annualValue,
      auto_renew_contracts: 0,
      next_end_date: null,
      contract_refs: contractRefs,
      vendor_refs: [vendorRef],
    });
  };

  for (const coverage of portfolio.impact?.evidenceCoverage ?? []) {
    const contract = contractsById.get(coverage.contract_id);
    const annualValue =
      numberFromDb(contract?.resolved_annual_value) ??
      numberFromDb(contract?.annual_value) ??
      numberFromDb(coverage.candidate_amount_usd) ??
      numberFromDb(coverage.actual_spend_usd);
    upsert({
      contractId: coverage.contract_id,
      vendorName: coverage.vendor_name || contract?.vendor_name || "",
      vendorRef:
        coverage.vendor_ref || contract?.vendor_ref || coverage.contract_id,
      vendorCategory:
        contractArchetype(contract) ??
        contract?.vendor_category ??
        coverage.contract_archetype ??
        coverage.vendor_category ??
        null,
      annualValue,
    });
  }

  for (const action of portfolio.impact?.actionCandidates ?? []) {
    const contract = contractsById.get(action.contract_id);
    const annualValue =
      numberFromDb(contract?.resolved_annual_value) ??
      numberFromDb(contract?.annual_value) ??
      numberFromDb(action.candidate_amount_usd);
    upsert({
      contractId: action.contract_id,
      vendorName: action.vendor_name || contract?.vendor_name || "",
      vendorRef:
        action.vendor_ref || contract?.vendor_ref || action.contract_id,
      vendorCategory:
        contractArchetype(contract) ?? contract?.vendor_category ?? null,
      annualValue,
    });
  }

  for (const claim of portfolio.impact?.claimCards ?? []) {
    const contract = contractsById.get(claim.contract_id);
    const annualValue =
      numberFromDb(contract?.resolved_annual_value) ??
      numberFromDb(contract?.annual_value) ??
      numberFromDb(claim.candidate_amount_usd);
    upsert({
      contractId: claim.contract_id,
      vendorName: claim.vendor_name || contract?.vendor_name || "",
      vendorRef: claim.vendor_ref || contract?.vendor_ref || claim.contract_id,
      vendorCategory:
        contractArchetype(contract) ?? contract?.vendor_category ?? null,
      annualValue,
    });
  }

  return Array.from(byName.values());
}

function unresolvedVendorIdentityCount(vendors: readonly ExecutiveVendorRow[]) {
  const unresolvedRefs = new Set<string>();
  for (const vendor of vendors) {
    if (!isUnresolvedVendorDisplay(vendor)) continue;
    const refs = uniqueRefs([vendor.vendor_ref, ...vendor.vendor_refs]);
    if (refs.length === 0) {
      unresolvedRefs.add(vendor.vendor_name);
      continue;
    }
    for (const ref of refs) {
      unresolvedRefs.add(ref);
    }
  }
  return unresolvedRefs.size;
}

export function coverageForVendor(
  vendor: ExecutiveVendorRow,
  coverageByVendor: Map<string, VendorCoverageSummary>,
) {
  let found = false;
  const coverage: VendorCoverageSummary = {
    spendRows: 0,
    performanceRows: 0,
    actionRows: 0,
    unclaimedCredit: 0,
  };

  for (const vendorRef of uniqueRefs([
    vendor.vendor_ref,
    ...vendor.vendor_refs,
  ])) {
    const row = coverageByVendor.get(vendorRef);
    if (!row) continue;
    found = true;
    coverage.spendRows += row.spendRows;
    coverage.performanceRows += row.performanceRows;
    coverage.actionRows += row.actionRows;
    coverage.unclaimedCredit += row.unclaimedCredit;
  }

  return found ? coverage : null;
}

function vendorDepthScore(coverage: VendorCoverageSummary | null) {
  if (!coverage) return 0;
  return (
    coverage.actionRows * 100 +
    coverage.performanceRows * 8 +
    coverage.spendRows * 6 +
    coverage.unclaimedCredit / 10000
  );
}

function vendorEvidenceReason(coverage: VendorCoverageSummary | null) {
  if (!coverage) return "Rollup only";
  if (coverage.unclaimedCredit > 0) return "Unclaimed credit evidence";
  if (coverage.actionRows > 0) return "Action rows loaded";
  if (coverage.performanceRows > 0) return "Performance rows loaded";
  if (coverage.spendRows > 0) return "Spend rows loaded";
  return "Rollup only";
}

function vendorConcentrationReason(vendor: ExecutiveVendorRow) {
  if (vendor.contract_count > 1) return "Multi-contract relationship";
  if (vendor.auto_renew_contracts > 0) return "Auto-renew exposure";
  return "Largest recorded relationships";
}

export function vendorCoverageRows(portfolio: SourceWorkspacePortfolioData) {
  const rows = new Map<string, VendorCoverageSummary>();
  const vendorRefsByContract = new Map(
    portfolio.contracts.map((contract) => [
      contract.contract_id,
      contract.vendor_ref,
    ]),
  );
  for (const coverage of portfolio.impact?.evidenceCoverage ?? []) {
    const vendorRef =
      coverage.vendor_ref || vendorRefsByContract.get(coverage.contract_id);
    if (!vendorRef) continue;
    const current = rows.get(vendorRef) ?? {
      spendRows: 0,
      performanceRows: 0,
      actionRows: 0,
      unclaimedCredit: 0,
    };
    current.spendRows += numberFromDb(coverage.spend_rows) ?? 0;
    current.performanceRows += numberFromDb(coverage.performance_rows) ?? 0;
    current.actionRows += numberFromDb(coverage.opportunity_rows) ?? 0;
    current.unclaimedCredit += numberFromDb(coverage.unclaimed_credit_usd) ?? 0;
    rows.set(vendorRef, current);
  }
  return rows;
}

export function vendorArchetypeRows(portfolio: SourceWorkspacePortfolioData) {
  const contractsById = new Map(
    portfolio.contracts.map((contract) => [contract.contract_id, contract]),
  );
  const groups = new Map<
    string,
    {
      category: string;
      vendorRefs: Set<string>;
      contractCount: number;
      annualValue: number;
      vendorRef: string | null;
      vendorName: string | null;
    }
  >();

  const addArchetypeContract = ({
    category,
    contractId,
    vendorRef,
    vendorName,
    annualValue,
  }: {
    category: string | null | undefined;
    contractId: string;
    vendorRef: string | null | undefined;
    vendorName: string | null | undefined;
    annualValue: number | null | undefined;
  }) => {
    const categoryKey = typeof category === "string" ? category.trim() : "";
    if (!isDeclaredArchetype(categoryKey)) return;
    const current = groups.get(categoryKey) ?? {
      category: categoryKey,
      vendorRefs: new Set<string>(),
      contractCount: 0,
      annualValue: 0,
      vendorRef: null,
      vendorName: null,
    };
    if (vendorRef) current.vendorRefs.add(vendorRef);
    current.contractCount += 1;
    current.annualValue += annualValue ?? 0;
    if (!current.vendorRef) {
      current.vendorRef = vendorRef ?? contractId;
      current.vendorName = safeVendorDisplayName(
        vendorName,
        vendorRef ?? contractId,
      );
    }
    groups.set(categoryKey, current);
  };

  for (const contract of portfolio.contracts) {
    addArchetypeContract({
      category: contractArchetype(contract) ?? contract.vendor_category,
      contractId: contract.contract_id,
      vendorRef: contract.vendor_ref,
      vendorName: contract.vendor_name,
      annualValue:
        numberFromDb(contract.resolved_annual_value) ??
        numberFromDb(contract.annual_value),
    });
  }

  for (const coverage of portfolio.impact?.evidenceCoverage ?? []) {
    if (contractsById.has(coverage.contract_id)) continue;
    addArchetypeContract({
      category: coverage.contract_archetype ?? coverage.vendor_category,
      contractId: coverage.contract_id,
      vendorRef: coverage.vendor_ref,
      vendorName: coverage.vendor_name,
      annualValue:
        numberFromDb(coverage.committed_spend_usd) ??
        numberFromDb(coverage.actual_spend_usd) ??
        numberFromDb(coverage.candidate_amount_usd),
    });
  }

  return [...groups.values()]
    .map((row) => ({
      category: row.category,
      vendorCount: row.vendorRefs.size,
      contractCount: row.contractCount,
      annualValue: row.annualValue,
      vendorRef: row.vendorRef,
      vendorName: row.vendorName,
    }))
    .sort((a, b) => b.annualValue - a.annualValue);
}

export function vendorArchetypeCoverage(
  portfolio: SourceWorkspacePortfolioData,
) {
  const registerIds = new Set(
    portfolio.contracts.map((contract) => contract.contract_id),
  );
  const declaredRegisterIds = new Set<string>();
  const declaredSupplementalIds = new Set<string>();
  for (const contract of portfolio.contracts) {
    if (
      isDeclaredArchetype(
        contractArchetype(contract) ?? contract.vendor_category,
      )
    ) {
      declaredRegisterIds.add(contract.contract_id);
    }
  }
  for (const coverage of portfolio.impact?.evidenceCoverage ?? []) {
    if (
      !isDeclaredArchetype(
        coverage.contract_archetype ?? coverage.vendor_category,
      )
    ) {
      continue;
    }
    if (registerIds.has(coverage.contract_id)) {
      declaredRegisterIds.add(coverage.contract_id);
    } else {
      declaredSupplementalIds.add(coverage.contract_id);
    }
  }
  const totalContracts =
    portfolio.contracts.length + declaredSupplementalIds.size;
  const declaredContracts =
    declaredRegisterIds.size + declaredSupplementalIds.size;
  return {
    totalContracts,
    declaredContracts,
    unmappedCount: Math.max(
      0,
      portfolio.contracts.length - declaredRegisterIds.size,
    ),
    supplementalDeclaredCount: declaredSupplementalIds.size,
  };
}

export function optimizeTypeRows(portfolio: SourceWorkspacePortfolioData) {
  const recoverableCreditRows =
    source360RecoverableCreditCoverageRows(portfolio);
  const recoverableCreditByContract = new Map(
    recoverableCreditRows.map((row) => [
      row.contract_id,
      numberFromDb(row.unclaimed_credit_usd) ?? 0,
    ]),
  );
  const recoverableCreditAmount = recoverableCreditRows.reduce(
    (sum, row) => sum + (numberFromDb(row.unclaimed_credit_usd) ?? 0),
    0,
  );
  const recoverableCreditFinanceStates = new Set(
    portfolio.impact.actionCandidates
      .filter(
        (candidate) =>
          isRecoverableCreditCandidate(candidate) &&
          recoverableCreditByContract.has(candidate.contract_id),
      )
      .map((candidate) => candidate.finance_confirmation_state)
      .filter(Boolean),
  );
  const groups = new Map<
    string,
    {
      type: string;
      count: number;
      amount: number;
      financeStates: Set<string>;
    }
  >();
  if (recoverableCreditRows.length > 0 && recoverableCreditAmount > 0) {
    groups.set("recoverable_leakage", {
      type: "recoverable_leakage",
      count: recoverableCreditRows.length,
      amount: recoverableCreditAmount,
      financeStates:
        recoverableCreditFinanceStates.size > 0
          ? recoverableCreditFinanceStates
          : new Set(["not_confirmed"]),
    });
  }
  for (const candidate of portfolio.impact.actionCandidates) {
    const type =
      candidate.opportunity_type ?? candidate.action_type ?? "Not established";
    const isRecoverableCredit = isRecoverableCreditCandidate(candidate);
    if (isRecoverableCredit && recoverableCreditByContract.size > 0) {
      continue;
    }
    const current = groups.get(type) ?? {
      type,
      count: 0,
      amount: 0,
      financeStates: new Set<string>(),
    };
    current.count += 1;
    current.amount += numberFromDb(candidate.candidate_amount_usd) ?? 0;
    current.financeStates.add(candidate.finance_confirmation_state);
    groups.set(type, current);
  }
  return [...groups.values()]
    .map((row) => ({
      type: row.type.replace(/_/g, " "),
      count: row.count,
      amount: row.amount,
      financeState: [...row.financeStates].join(", "),
    }))
    .sort((a, b) => b.amount - a.amount);
}

function focusedActionSet(
  portfolio: SourceWorkspacePortfolioData,
): FocusedActionSet {
  const rows = [...portfolio.impact.actionCandidates].sort((left, right) => {
    const rightAmount = numberFromDb(right.candidate_amount_usd) ?? 0;
    const leftAmount = numberFromDb(left.candidate_amount_usd) ?? 0;
    return (
      rightAmount - leftAmount ||
      left.contract_id.localeCompare(right.contract_id)
    );
  });
  const visibleRows = rows.slice(0, 5);
  const remainderRows = rows.slice(5);
  return {
    rows: visibleRows,
    remainderCount: remainderRows.length,
    remainderAmount: remainderRows.reduce(
      (sum, row) => sum + (numberFromDb(row.candidate_amount_usd) ?? 0),
      0,
    ),
    totalRows: rows.length,
    totalAmount: rows.reduce(
      (sum, row) => sum + (numberFromDb(row.candidate_amount_usd) ?? 0),
      0,
    ),
  };
}

function formatFinanceState(state: string | null | undefined) {
  if (!state) return "Not established";
  return state.replace(/_/g, " ");
}

function financialPosture(contract: SourceContract360Row) {
  const actual = numberFromDb(contract.actual_annual_spend);
  const annual = numberFromDb(contract.annual_value);
  if (actual == null) return "Actual spend not established";
  if (annual == null) return "Annual value not established";
  const variance = actual - annual;
  if (Math.abs(variance) < 1) return "Actual matches annual value";
  return variance > 0
    ? `${money(variance)} above annual value`
    : `${money(Math.abs(variance))} below annual value`;
}

function vendorSubtabTitle(subtab: string) {
  if (subtab === "Evidence depth") return "Which vendors have usable depth";
  if (subtab === "Archetype mix") return "Declared contract archetypes";
  return "One row per supplier relationship";
}

function contractListSubtabTitle(subtab: string) {
  if (subtab === "By evidence depth")
    return "Which contracts can support detail";
  if (subtab === "By finance status")
    return "Annual, actual, and committed values";
  return "Focused contract set";
}

function optimizeSubtabTitle(subtab: string) {
  if (subtab === "By type") return "Action rows grouped by type";
  if (subtab === "By contract") return "Contract-level action rows";
  return "What to ask first";
}

function graphSubtabTitle(subtab: string) {
  if (subtab === "Volume") return "Loaded row volume by substrate";
  if (subtab === "Mapping spine") return "Source system to product mapping";
  return "Contract at the center; systems, facts, and actions around it";
}

export function topVendors(
  portfolio: SourceWorkspacePortfolioData,
): ExecutiveVendorRow[] {
  const byVendorName = new Map<string, ExecutiveVendorRow>();
  for (const vendor of portfolio.vendors) {
    const vendorName = safeVendorDisplayName(
      vendor.vendor_name,
      vendor.vendor_ref,
    );
    const key = normalizedVendorName(vendorName);
    const existing = byVendorName.get(key);
    if (!existing) {
      byVendorName.set(key, {
        ...vendor,
        vendor_name: vendorName,
        vendor_refs: [vendor.vendor_ref],
      });
      continue;
    }
    byVendorName.set(key, {
      ...existing,
      vendor_category: existing.vendor_category ?? vendor.vendor_category,
      contract_count: existing.contract_count + vendor.contract_count,
      annual_value:
        (numberFromDb(existing.annual_value) ?? 0) +
        (numberFromDb(vendor.annual_value) ?? 0),
      total_committed_value:
        (numberFromDb(existing.total_committed_value) ?? 0) +
        (numberFromDb(vendor.total_committed_value) ?? 0),
      auto_renew_contracts:
        existing.auto_renew_contracts + vendor.auto_renew_contracts,
      next_end_date: earlierDate(existing.next_end_date, vendor.next_end_date),
      contract_refs: uniqueRefs([
        ...existing.contract_refs,
        ...vendor.contract_refs,
      ]),
      vendor_refs: uniqueRefs([...existing.vendor_refs, vendor.vendor_ref]),
    });
  }
  return [...byVendorName.values()]
    .map((vendor) =>
      withContractBackedVendorMetrics(vendor, portfolio.contracts),
    )
    .slice()
    .sort(
      (a, b) =>
        (numberFromDb(b.annual_value) ?? 0) -
        (numberFromDb(a.annual_value) ?? 0),
    );
}

export function displayBenchmarkingClause(value: string | null | undefined) {
  const clause = value?.trim();
  if (!clause || isActionNarrative(clause)) return "Not established";
  return clause;
}

function isActionNarrative(value: string) {
  return (
    /^\(\d+\)/.test(value.trim()) ||
    /\b(unused entitlements|right-size|potential savings|approximately \$|current unit pricing|convert the|consolidate overlapping|recommend|candidate opportunity)\b/i.test(
      value,
    )
  );
}

function withContractBackedVendorMetrics(
  vendor: ExecutiveVendorRow,
  contracts: readonly SourceContract360Row[],
): ExecutiveVendorRow {
  const contractRefs = uniqueRefs(vendor.contract_refs);
  const linkedContracts = vendorLinkedContracts(contracts, {
    ...vendor,
    contract_refs: contractRefs,
  });
  if (linkedContracts.length === 0) {
    return {
      ...vendor,
      vendor_name: safeVendorDisplayName(vendor.vendor_name, vendor.vendor_ref),
      contract_refs: contractRefs,
      contract_count: contractRefs.length || vendor.contract_count,
    };
  }
  const annualValue = linkedContracts.reduce(
    (sum, contract) =>
      sum +
      (numberFromDb(contract.resolved_annual_value) ??
        numberFromDb(contract.annual_value) ??
        0),
    0,
  );
  const totalCommittedValue = linkedContracts.reduce(
    (sum, contract) =>
      sum +
      (numberFromDb(contract.resolved_total_committed_value) ??
        numberFromDb(contract.total_committed_value) ??
        0),
    0,
  );
  const nextEndDate = linkedContracts.reduce<string | null>(
    (next, contract) => earlierDate(next, contract.end_date),
    null,
  );

  return {
    ...vendor,
    vendor_name: safeVendorDisplayName(vendor.vendor_name, vendor.vendor_ref),
    contract_count: linkedContracts.length,
    annual_value: annualValue > 0 ? annualValue : vendor.annual_value,
    total_committed_value:
      totalCommittedValue > 0
        ? totalCommittedValue
        : vendor.total_committed_value,
    auto_renew_contracts: linkedContracts.filter(
      (contract) => contract.auto_renew,
    ).length,
    next_end_date: nextEndDate ?? vendor.next_end_date,
    contract_refs: uniqueRefs(
      linkedContracts.map((contract) => contract.contract_id),
    ),
  };
}

export function vendorLinkedContracts(
  contracts: readonly SourceContract360Row[],
  vendor: ExecutiveVendorRow,
) {
  const explicitRefs = new Set(uniqueRefs(vendor.contract_refs));
  const vendorRefs = new Set(
    uniqueRefs([vendor.vendor_ref, ...vendor.vendor_refs]),
  );
  const normalizedName = normalizedVendorName(vendor.vendor_name);
  const rows = new Map<string, SourceContract360Row>();
  for (const contract of contracts) {
    const hasExplicitRef = explicitRefs.has(contract.contract_id);
    const hasVendorRef = vendorRefs.has(contract.vendor_ref);
    const hasVendorName =
      normalizedName.length > 0 &&
      normalizedVendorName(contract.vendor_name) === normalizedName;
    if (hasExplicitRef || hasVendorRef || hasVendorName) {
      rows.set(contract.contract_id, contract);
    }
  }
  return [...rows.values()].sort(
    (a, b) =>
      (numberFromDb(b.resolved_annual_value) ??
        numberFromDb(b.annual_value) ??
        0) -
      (numberFromDb(a.resolved_annual_value) ??
        numberFromDb(a.annual_value) ??
        0),
  );
}

function normalizedVendorName(name: string) {
  return name
    .toLowerCase()
    .replace(
      /\b(incorporated|inc|corporation|corp|llc|ltd|limited|company|co)\b/g,
      "",
    )
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function contractArchetype(contract: SourceContract360Row | undefined) {
  return (
    (
      contract as
        | (SourceContract360Row & { contract_archetype?: string | null })
        | undefined
    )?.contract_archetype ?? null
  );
}

function isDeclaredArchetype(value: string | null | undefined) {
  const normalized = value?.trim();
  return Boolean(
    normalized &&
    !/^(not established|unknown|unresolved|none|null|n\/a)$/i.test(normalized),
  );
}

function isOpaqueIdentifier(value: string | null | undefined) {
  const normalized = value?.trim();
  if (!normalized) return false;
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      normalized,
    ) || /^[0-9a-f]{24,}$/i.test(normalized)
  );
}

function isUnresolvedVendorDisplay(vendor: ExecutiveVendorRow) {
  return (
    safeVendorDisplayName(vendor.vendor_name, vendor.vendor_ref) ===
    "Vendor name not resolved"
  );
}

function safeVendorDisplayName(
  vendorName: string | null | undefined,
  vendorRef: string | null | undefined,
) {
  const name = vendorName?.trim();
  if (name && !isOpaqueIdentifier(name)) return name;
  const ref = vendorRef?.trim();
  if (ref && !isOpaqueIdentifier(ref)) return ref;
  return "Vendor name not resolved";
}

function safeContractVendorDisplayName(contract: SourceContract360Row) {
  return safeVendorDisplayName(contract.vendor_name, contract.vendor_ref);
}

function preferVendorDisplayName(left: string, right: string) {
  if (left === "Vendor name not resolved") return right;
  if (isOpaqueIdentifier(left)) return right;
  return left;
}

function compactVendorName(name: string) {
  const trimmed = name.trim();
  if (trimmed.length <= 18) return trimmed;
  return `${trimmed.slice(0, 16).trim()}...`;
}

function earlierDate(a: string | null, b: string | null) {
  if (!a) return b;
  if (!b) return a;
  return a < b ? a : b;
}

function uniqueRefs(refs: readonly string[]) {
  return [...new Set(refs.filter(Boolean))];
}

function portfolioAnnualValue(portfolio: SourceWorkspacePortfolioData) {
  const snapshotValue = numberFromDb(
    portfolio.v4Snapshot.executivePortfolio.annualValue,
  );
  if (snapshotValue && snapshotValue > 0) return snapshotValue;
  const vendorValue = portfolio.vendors.reduce(
    (sum, vendor) => sum + (numberFromDb(vendor.annual_value) ?? 0),
    0,
  );
  return vendorValue > 0 ? vendorValue : null;
}

function vendorShare(
  vendor: SourceVendorContractPortfolioRow,
  totalAnnualValue: number | null,
) {
  const value = numberFromDb(vendor.annual_value) ?? 0;
  if (!totalAnnualValue || totalAnnualValue <= 0) return 0;
  return Math.max(3, Math.min(100, (value / totalAnnualValue) * 100));
}

function formatShare(
  vendor: SourceVendorContractPortfolioRow,
  totalAnnualValue: number | null,
) {
  const value = numberFromDb(vendor.annual_value) ?? 0;
  if (!totalAnnualValue || totalAnnualValue <= 0) return "Not established";
  return `${((value / totalAnnualValue) * 100).toFixed(1)}%`;
}

function shortMonth(value: string | null | undefined) {
  if (!value) return "n/a";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 7);
  return date.toLocaleDateString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
}

function headlineFor(
  page: PageLabel,
  tenantName: string,
  portfolio: SourceWorkspacePortfolioData,
  vendor: SourceVendorContractPortfolioRow | null,
  contract: SourceContract360Row | null,
) {
  if (page === "Coverage") {
    return vendor
      ? safeVendorDisplayName(vendor.vendor_name, vendor.vendor_ref)
      : "Coverage decides what can be claimed.";
  }
  if (page === "Contracts") {
    return contract ? safeContractVendorDisplayName(contract) : "Contract 360";
  }
  if (page === "Levers") {
    const anchor = anchorContractActionSet(portfolio);
    return anchor.rows.length > 0
      ? actionOrderTitle(anchor.rows.length)
      : "Optimize evidenced opportunities";
  }
  if (page === "Evidence") return "Evidence and proof";
  return commandHeadline(portfolio, tenantName);
}

function subheadFor(
  page: PageLabel,
  portfolio: SourceWorkspacePortfolioData,
  vendor: SourceVendorContractPortfolioRow | null,
  contract: SourceContract360Row | null,
) {
  if (page === "Coverage") {
    return vendor
      ? `${vendor.contract_count} contracts / ${money(numberFromDb(vendor.annual_value))} recorded annual value.`
      : `${portfolio.contracts.length} register contracts · ${portfolio.impact.evidenceCoverage.length} contracts with depth rows · ${vendorArchetypeCoverage(portfolio).unmappedCount} register headers still need archetype mapping.`;
  }
  if (page === "Contracts" && contract) {
    return `${contract.contract_id} / ${money(numberFromDb(contract.annual_value))} annual value / expiry ${fmtDate(contract.end_date)}.`;
  }
  if (page === "Levers") {
    const anchor = anchorContractActionSet(portfolio);
    const anchorContract = anchor.contract;
    if (anchorContract && anchor.rows.length > 0) {
      return `${safeContractVendorDisplayName(anchorContract)} · ${anchorContract.contract_id}`;
    }
    return "Only quantified findings with loaded evidence are shown. Finance confirmation remains separate.";
  }
  if (page === "Evidence") {
    return "Evidence lanes, row counts, and blockers are visible without exposing raw diagnostics by default.";
  }
  return `${portfolio.contracts.length} contracts · ${portfolio.vendors.length} vendors · unsupported dashboard claims are hidden.`;
}

function commandHeadline(
  portfolio: SourceWorkspacePortfolioData,
  tenantName: string,
) {
  const commitment = primaryCommitmentAction(portfolio);
  if (commitment) {
    return "Committed ahead of consumption. Notice is the constraint.";
  }
  const credit = source360RecoverableCreditFinding(portfolio);
  if (credit > 0) {
    return "Credits are calculated. Claims are the constraint.";
  }
  return `${tenantName || "Source"} contract actions, governed by evidence.`;
}

export function contractTabNarrative(
  tab: string,
  vm: SourceWorkspaceVM,
  contract: SourceContract360Row,
  coverage: ReturnType<typeof coverageForContract>,
  scopeRows: readonly SourceContractApplicationScopeRow[],
  claimCard:
    | SourceWorkspacePortfolioData["impact"]["claimCards"][number]
    | undefined,
) {
  if (tab === "Performance" && !contractFacetIsRequired(vm, "Performance")) {
    return {
      headline: "Service performance is not part of this contract archetype.",
      body: contractFacetReason(vm, "Performance"),
      provenance: "Archetype applicability · governed education model",
      blocker:
        "No SLA, service-credit, or performance rows are expected unless the executed agreement declares a service-level obligation.",
    };
  }
  const governedTab = contractTabIntelligenceFor(
    tab,
    vm.detail?.contractTabIntelligence ?? [],
  );
  if (governedTab) {
    return {
      headline: governedTab.headline,
      body: [
        governedTab.allowed_executive_statement,
        governedTab.supporting_evidence_summary
          ? `Evidence basis: ${governedTab.supporting_evidence_summary}.`
          : null,
      ]
        .filter(Boolean)
        .join(" "),
      provenance: `${tab} intelligence · ${governedTab.review_status}`,
      blocker:
        governedTab.missing_evidence_summary ??
        governedTab.action_prompt ??
        "Stay within the governed tab evidence.",
    };
  }
  if (tab === "Scope") {
    if (scopeRows.length > 0) {
      const namedRows = scopeRows.filter(
        (row) =>
          row.application_name &&
          !/^scoped application \d+$/i.test(row.application_name),
      ).length;
      const functions = uniqueTruthy(
        scopeRows.map((row) => row.business_function),
      );
      const critical = uniqueTruthy(scopeRows.map((row) => row.criticality));
      return {
        headline: `${safeContractVendorDisplayName(contract)} covers ${namedRows} named workload${namedRows === 1 ? "" : "s"}, not the whole enterprise.`,
        body: `Plain English scope: this contract is tied to ${functions.join(", ") || "the loaded business functions"} across ${scopeRows.length} scoped row${scopeRows.length === 1 ? "" : "s"}. ${critical.length ? `Criticality on record: ${critical.join(", ")}.` : "Criticality is not yet recorded."}`,
        provenance: "Scope story",
        blocker:
          namedRows === scopeRows.length
            ? "Use only these named workloads when explaining coverage; do not expand to tower, module, or CMDB relationships without matching rows."
            : "Generic scope labels block a stronger executive claim until CMDB/SOW names are loaded.",
      };
    }
    return {
      headline: "No application or service scope rows loaded.",
      body: "The contract exists in the governed book, but Source does not yet know what applications, services, or functions it covers.",
      provenance: "Scope gap",
      blocker:
        "No scope rationalization, app risk, or tower handoff claim is allowed without scoped rows.",
    };
  }
  if (tab === "Performance") {
    if (vm.detailState === "ready" && vm.detail?.performancePeriods?.length) {
      return {
        headline: `${vm.detail.performancePeriods.length} performance periods loaded.`,
        body: "Monthly performance rows are loaded for this contract. Misses and service-credit amounts stay visible as evidence, not finance-confirmed value.",
        provenance: "Performance basis",
        blocker:
          "Credit rows do not become realized value until finance confirmation is loaded.",
      };
    }
    if ((coverage?.performance_rows ?? 0) > 0) {
      return {
        headline: `${coverage?.performance_rows} governed performance rows loaded.`,
        body: `${coverage?.performance_rows} governed performance rows are in the Source impact layer for this contract. Open detail proof before using row-level claims.`,
        provenance: "Performance basis",
        blocker:
          "Withhold period-by-period conclusions until the detail rows render in this tab.",
      };
    }
    return {
      headline: "No performance periods loaded.",
      body: "This contract can still be optimized on consumption, commitment timing, and commercial terms. It cannot support a service-quality, SLA-credit, or performance-trend story until contract-specific performance periods are loaded.",
      provenance: "Performance gap",
      blocker:
        "Load ITSM, SLA, service-credit, or monthly performance rows before making service-quality claims.",
    };
  }
  if (tab === "Relationship") {
    const namedRows = scopeRows.filter((row) =>
      usableText(row.application_name),
    ).length;
    const businessFunctions = uniqueTruthy(
      scopeRows.map((row) => row.business_function),
    );
    const hostingModels = uniqueTruthy(
      scopeRows.map((row) => row.hosting_model),
    );
    return {
      headline: `${safeContractVendorDisplayName(contract)} links to ${namedRows} scoped workloads.`,
      body:
        namedRows > 0
          ? `The loaded relationship path is vendor -> contract -> ${businessFunctions.length || "named"} business function${businessFunctions.length === 1 ? "" : "s"} -> ${hostingModels.join(" and ") || "recorded hosting"}. Use this to explain dependency, not to invent unrecorded system ownership.`
          : "The relationship path stops at vendor and contract header because no scoped workloads are loaded.",
      provenance: "Relationship map",
      blocker:
        namedRows > 0
          ? "Dependencies are bounded to the scoped rows below; no business-unit, tower, or CMDB expansion without matching evidence."
          : "Load scoped workload rows before claiming application, function, or tower dependency coverage.",
    };
  }
  if (tab === "Evidence") {
    if (vm.detailState === "error") {
      return {
        headline: "Per-contract detail is unavailable.",
        body: "Per-contract detail could not load. The workspace is withholding evidence claims for this contract.",
        provenance: "Evidence guard",
        blocker:
          "Do not use document, clause, or row-level claims from this contract until detail proof loads.",
      };
    }
    const structuredRows =
      (coverage?.spend_rows ?? 0) +
      (coverage?.scope_rows ?? 0) +
      (coverage?.performance_rows ?? 0) +
      (coverage?.opportunity_rows ?? 0);
    if ((coverage?.document_page_text_rows ?? 0) === 0 && structuredRows > 0) {
      return {
        headline:
          "Document pages are not attached; structured evidence is loaded.",
        body: `${structuredRows} structured rows support this contract across spend, scope, performance, and opportunity lanes. The raw contract document remains outside this demo-safe evidence layer, so page-span citation claims stay withheld.`,
        provenance: "Evidence boundary",
        blocker:
          "Use the structured rows for optimization and scope; do not claim exact PDF clause text until governed document pages are attached.",
      };
    }
    return {
      headline: "Evidence rows and missing inputs stay separate.",
      body: "Evidence rows, source documents, and missing inputs are separated from the contract header.",
      provenance: "Evidence basis",
      blocker:
        "No document page-span claim is allowed unless page text and source document IDs are loaded.",
      };
  }
  if (tab === "Education" && vm.contractEducation) {
    const next = vm.contractEducation.steps.find((step) => step.state === "next");
    return {
      headline: vm.contractEducation.headline,
      body: vm.contractEducation.body,
      provenance: `${vm.contractEducation.archetypeLabel} guide · ${vm.contractEducation.stateLabel}`,
      blocker: next
        ? `${next.title} next: ${next.question}`
        : vm.contractEducation.focus,
    };
  }
  if (tab === "Optimize") {
    if (claimCard) {
      return {
        headline: claimCard.claim_title ?? "Evidence-backed action row",
        body: claimCard.allowed_executive_statement,
        provenance: "Action basis",
        blocker:
          claimCard.blocker_if_missing ??
          "Finance confirmation remains separate from action opportunity.",
      };
    }
    return {
      headline: "No contract-specific opportunity loaded.",
      body: vm.opportunityView
        ? vm.opportunityView.recommendationDetail
        : "No contract-specific opportunity set is loaded for this selection.",
      provenance: "Optimize gap",
      blocker:
        "Do not manufacture savings or recommend action without a candidate and evidence rows.",
    };
  }
  if (tab === "Economics") {
    if ((coverage?.spend_rows ?? 0) > 0) {
      return {
        headline: `${coverage?.spend_rows} monthly spend rows loaded.`,
        body: `${coverage?.spend_rows} monthly spend rows support actual spend. Missing finance confirmation still blocks realized-value language.`,
        provenance: "Economics basis",
        blocker:
          "Actual spend is evidence, not realized savings or budget approval.",
      };
    }
    return {
      headline: "Actual spend is not established.",
      body: "Economics shows recorded annual value and actual spend only. Missing spend is not converted to zero.",
      provenance: "Economics gap",
      blocker:
        "No variance, consumption, or run-rate story without monthly spend rows.",
    };
  }
  return {
    headline: contractStoryHeadline(contract, coverage, vm),
    body: contractStoryBody(contract, coverage, scopeRows, vm),
    provenance: "Executive story",
    blocker:
      "Use this as the opening talk track; dollar claims still stay bounded to loaded opportunity and finance rows.",
  };
}

function contractTabIntelligenceFor(
  tab: string,
  rows: readonly SourceContractTabIntelligenceRow[],
) {
  const key = tab.toLowerCase();
  return rows.find((row) => row.tab_key.toLowerCase() === key) ?? null;
}

function uniqueTruthy(values: readonly (string | null | undefined)[]) {
  return Array.from(
    new Set(values.map((value) => usableText(value)).filter(Boolean)),
  ) as string[];
}

function contractStoryHeadline(
  contract: SourceContract360Row,
  coverage: ReturnType<typeof coverageForContract>,
  vm: SourceWorkspaceVM,
) {
  const vendor = safeContractVendorDisplayName(contract);
  const opportunityTotal = vm.opportunityView
    ? sizedOpportunityTotalUsd(vm.opportunityView.opportunities)
    : 0;
  const actualSpend =
    numberFromDb(contract.actual_annual_spend) ??
    numberFromDb(coverage?.actual_spend_usd);
  const annualValue =
    numberFromDb(contract.resolved_annual_value) ??
    numberFromDb(contract.annual_value) ??
    numberFromDb(coverage?.committed_spend_usd);
  if (opportunityTotal > 0) {
    return `${vendor}: ${money(opportunityTotal)} of governed optimization levers are ready to work.`;
  }
  if (annualValue != null && actualSpend != null && annualValue > actualSpend) {
    return `${vendor}: commitment is ahead of observed use.`;
  }
  if (annualValue != null && actualSpend != null && actualSpend > annualValue) {
    return `${vendor}: spend is running above the recorded commitment.`;
  }
  return `${vendor}: contract header is governed; action depends on loaded evidence.`;
}

function contractStoryBody(
  contract: SourceContract360Row,
  coverage: ReturnType<typeof coverageForContract>,
  scopeRows: readonly SourceContractApplicationScopeRow[],
  vm: SourceWorkspaceVM,
) {
  const annualValue =
    numberFromDb(contract.resolved_annual_value) ??
    numberFromDb(contract.annual_value) ??
    numberFromDb(coverage?.committed_spend_usd);
  const actualSpend =
    numberFromDb(contract.actual_annual_spend) ??
    numberFromDb(coverage?.actual_spend_usd);
  const opportunityCount = vm.opportunityView?.opportunities.length ?? 0;
  const sizedTotal = vm.opportunityView
    ? sizedOpportunityTotalUsd(vm.opportunityView.opportunities)
    : 0;
  const phrases = [
    `${contract.contract_name} carries ${money(annualValue)} in annual value`,
    actualSpend != null
      ? `${money(actualSpend)} of observed annual spend`
      : null,
    scopeRows.length > 0
      ? `${scopeRows.length} scoped workload${scopeRows.length === 1 ? "" : "s"}`
      : null,
    opportunityCount > 0
      ? `${opportunityCount} optimization lever${opportunityCount === 1 ? "" : "s"}${sizedTotal > 0 ? `, with ${money(sizedTotal)} sized` : ""}`
      : null,
  ].filter(Boolean);
  return `${phrases.join(", ")}. The executive story is not "data loaded"; it is whether the buyer should recover money, avoid future spend, or negotiate a better commercial shape before the next decision window.`;
}

function detailStateLabel(state: SourceWorkspaceVM["detailState"]) {
  if (state === "ready") return "Detail loaded";
  if (state === "loading") return "Loading detail";
  if (state === "error") return "Detail unavailable";
  return "Header only";
}

export function performanceActual(actualValue: unknown, valueNum: unknown) {
  const formatActual = (actual: number) =>
    actual <= 1 ? pct(actual) : `${actual.toFixed(1)}%`;
  if (typeof actualValue === "number" && Number.isFinite(actualValue)) {
    return formatActual(actualValue);
  }
  if (actualValue != null) {
    const actualText = String(actualValue).trim();
    if (actualText) return actualText;
  }
  const actual = numberFromDb(valueNum);
  if (actual == null) return "Not established";
  return formatActual(actual);
}
