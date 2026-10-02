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

  return null;
}
