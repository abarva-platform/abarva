import type { TableSpec } from "@/components/home/v4/page-tables";
import type {
  EnterpriseContextFact,
  HomeEnterpriseContext,
} from "@/lib/home/preview/ecl-enterprise-context";
import type { ChapterId } from "@/lib/home/preview/types";

export interface EnterpriseContextExportSection {
  title: string;
  paragraphs: string[];
  tables: TableSpec[];
}

function money(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function evidence(fact: EnterpriseContextFact): string {
  const date = fact.asOf ? `As of ${fact.asOf}` : "Source date not established";
  return `${date}; ${fact.sourceRefs.length} source ${fact.sourceRefs.length === 1 ? "record" : "records"}`;
}

export function enterpriseContextExportSection(
  chapterId: ChapterId,
  context: HomeEnterpriseContext | null | undefined,
): EnterpriseContextExportSection | null {
  if (!context) return null;
  const segments = context.segmentSpine.segments;
  const segmentName = (key: string | null) =>
    segments.find((segment) => segment.segmentKey === key)?.segmentName ??
    "Enterprise shared";
  const shared = context.segmentSpine.unattributed;
  const caveat = context.excludedUncitedRows > 0
    ? `${context.excludedUncitedRows} uncited source rows were excluded from these totals.`
    : "All included rows carry a verified source reference.";

  if (chapterId === "executive_brief") {
    const atRisk = context.priorities.reduce(
      (sum, priority) => sum + priority.atRiskProgramCount,
      0,
    );
    const programs = segments.reduce(
      (sum, segment) => sum + segment.domains.programs.count,
      shared.programs ?? 0,
    );
    return {
      title: "Source-linked enterprise context",
      paragraphs: [
        context.profile.businessModel,
        evidence(context.profile),
        `${context.sharedFunctionIds.length} functions serve the enterprise across segments; ${context.unlinkedPrograms.length} programs have no declared priority. Changes over time are not established by this view.`,
        caveat,
      ],
      tables: [{
        caption: "Declared enterprise scale",
        columns: ["Measure", "Current record"],
        rows: [
          ...(context.profile.annualRevenueUsd === null ? [] : [
            ["Declared annual revenue", money(context.profile.annualRevenueUsd)],
          ]),
          ["Business segments", segments.length],
          ["Declared priorities", context.priorities.length],
          ["Programs", programs],
          ["At-risk linked programs", atRisk],
          ["High/critical risks with partial or unknown controls", context.riskTriage.attentionRisks.length],
        ],
        note: "Synthetic reference; not client-attested. Values are source-linked, not performance judgments.",
      }],
    };
  }

  if (chapterId === "our_business") {
    return {
      title: "Declared business segments",
      paragraphs: [
        "Revenue shares are declared in the source. Resource shares count only segment-attributed rows; shared functions remain outside the denominator.",
        `Shared or unattributed: ${shared.applications ?? 0} applications, ${shared.programs ?? 0} programs, ${shared.risks ?? 0} risks. Customer and channel economics are not established by this record.`,
        caveat,
      ],
      tables: [{
        caption: "Segment scale and governed footprint",
        columns: ["Segment", "Revenue", "Share", "P&L owner", "Apps", "Programs", "Risks", "Evidence"],
        rows: segments.map((segment) => [
          segment.segmentName,
          money(segment.revenueUsd),
          `${segment.revenueSharePct.toFixed(1)}%`,
          segment.pnlOwnerRole || "Not recorded",
          segment.domains.applications.count,
          segment.domains.programs.count,
          segment.domains.risks.count,
          evidence(context.segmentFacts[segment.segmentKey]),
        ]),
        note: "Synthetic reference; not client-attested. Shared work is not assigned to a segment.",
      }],
    };
  }

  if (chapterId === "strategy_value_creation") {
    return {
      title: "Declared priorities and programs",
      paragraphs: [
        ...context.unlinkedPrograms.map((program) =>
          `Program without a declared priority: ${program.title}. ${evidence(program)}.`),
        "Targets and KPIs are not proof of realized value.",
        caveat,
      ],
      tables: [{
        caption: "Priority ownership and delivery",
        columns: ["Priority", "Owner", "Target", "Programs", "At risk", "KPIs", "Evidence"],
        rows: context.priorities.map((priority) => [
          priority.title,
          priority.ownerRole ?? "Not recorded",
          priority.targetOutcome ?? "Not recorded",
          priority.programCount,
          priority.atRiskProgramCount,
          priority.metricCount,
          evidence(priority),
        ]),
        note: "Synthetic reference; not client-attested. Counts use declared priority IDs.",
      }],
    };
  }

  if (chapterId === "how_we_operate") {
    return {
      title: "Declared operating functions",
      paragraphs: [
        `${context.sharedFunctionIds.length} shared functions are deliberately not allocated to one segment. Function-level accountability is recorded; decision rights are not inferred.`,
        caveat,
      ],
      tables: [{
        caption: "Function ownership and footprint",
        columns: ["Function", "Segment", "Executive owner", "Apps", "Programs", "Risks", "Evidence"],
        rows: context.functions.map((fn) => [
          fn.title,
          segmentName(fn.segmentKey),
          fn.executiveOwner ?? "Not recorded",
          fn.applicationCount,
          fn.programCount,
          fn.riskCount,
          evidence(fn),
        ]),
        note: "Synthetic reference; not client-attested. Shared functions remain unallocated.",
      }],
    };
  }

  if (chapterId === "performance_value") {
    const value = context.valueProof;
    return {
      title: "Investment versus proof",
      paragraphs: [
        `${value.programCount} source-linked program records; ${value.asOf ? `as of ${value.asOf}` : "source date not established"}.`,
        `Across ${value.programCount} programs, approved budgets total ${money(value.approvedBudgetUsd)} and forecasts total ${money(value.forecastUsd)}. ${value.overBudgetProgramCount} programs forecast above budget. These are declared estimates, not realized benefits.`,
        `${value.modelledClaimCount} value claims are modelled but not finance-validated; ${value.unsupportedClaimCount} are unsupported. Client-attested realized value is not established by this synthetic record.`,
        `Totals include ${context.unlinkedPrograms.length} programs without a declared priority. ${value.missingFinancialCount} program financial records are incomplete. ${value.otherClaimCount} claim statuses need separate review. ${value.excludedSpendLines} of ${value.completedPeriodSpendLines + value.excludedSpendLines} spend records lack a verifiable completed-period actual and are excluded from current-period spend.`,
        caveat,
      ],
      tables: [{
        caption: "Program investment by declared priority",
        columns: ["Priority", "Owner", "Programs", "Approved budget", "Forecast", "Above budget", "Evidence"],
        rows: value.priorities.map((priority) => [
          priority.title,
          priority.ownerRole ?? "Not recorded",
          priority.programCount,
          money(priority.approvedBudgetUsd),
          money(priority.forecastUsd),
          priority.overBudgetProgramCount,
          evidence(priority),
        ]),
        note: "Synthetic reference; not client-attested. The no-declared-priority row is included in enterprise totals.",
      }],
    };
  }

  if (chapterId === "what_needs_attention") {
    return {
      title: "Risk review queue",
      paragraphs: [
        `${context.riskTriage.totalRisks} risks are recorded; ${context.riskTriage.highOrCritical} are high or critical. ${context.riskTriage.partialControl} high/critical risks have partially effective controls and ${context.riskTriage.unknownControl} have unknown control state. Unknown is not uncontrolled.`,
        "The queue is ordered for review, not scored as a formal risk assessment. Control effectiveness is not independently attested here.",
        ...(context.riskTriage.ownerIsConstant ? ["The same role appears on every risk; item-level accountability is not established."] : []),
        caveat,
      ],
      tables: [{
        caption: "High and critical risks needing control review",
        columns: ["Risk", "Severity", "Control state", "Recorded role", "Affected record", "Evidence"],
        rows: context.riskTriage.attentionRisks.slice(0, 10).map((risk) => [
          risk.title,
          risk.severity,
          risk.controlState === "unknown" ? "Unknown" : "Partially effective",
          risk.ownerRole ?? "Not recorded",
          risk.affectedObject ?? "Not resolved",
          evidence(risk),
        ]),
        note: `Synthetic reference; not client-attested. Showing ${Math.min(10, context.riskTriage.attentionRisks.length)} of ${context.riskTriage.attentionRisks.length} review items.`,
      }],
    };
  }

  return null;
}
