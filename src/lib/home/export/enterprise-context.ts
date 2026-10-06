import type { TableSpec } from "@/components/home/v4/page-tables";
import type {
  EnterpriseContextFact,
  HomeEnterpriseContext,
} from "@/lib/home/preview/ecl-enterprise-context";
import type {
  ChapterId,
  HomeRecordRenderSource,
} from "@/lib/home/preview/types";
import { formatValueMoney } from "@/lib/home/preview/value-proof-format";

export interface EnterpriseContextExportSection {
  title: string;
  paragraphs: string[];
  tables: TableSpec[];
}

/**
 * The chapters this module emits a source-linked enterprise-context section for. Seven chapters
 * carry one; every other chapter never did, so an absent section there is not a gap and must not
 * be declared as one.
 *
 * This list is the declaration side of the branch ladder below. The two are held together by
 * `every chapter that carries a context section` in
 * `src/__tests__/behaviors/home-walkthrough-export-enterprise-context.test.tsx`, which counts the
 * declarations an all-chapters render produces against this list's length.
 */
export const ENTERPRISE_CONTEXT_CHAPTER_IDS = [
  "executive_brief",
  "our_business",
  "strategy_value_creation",
  "how_we_operate",
  "technology_data",
  "performance_value",
  "what_needs_attention",
] as const satisfies readonly ChapterId[];

export type EnterpriseContextAbsenceReason =
  | "reviewed_snapshot"
  | "context_not_attached"
  | "context_not_established"
  | "dependency_proof_not_established";

export interface EnterpriseContextAbsence {
  reason: EnterpriseContextAbsenceReason;
  why: string;
}

/**
 * Why a chapter that normally carries a source-linked enterprise-context section is not carrying
 * one in this export.
 *
 * The export used to render silence here, and silence is the one answer a reader cannot act on:
 * six of the seven elements the section carries disappear together, so a document missing them
 * looks the same whether the context was never attached to the served bundle, was attached as
 * `null` because the served rows could not establish it, or was established and rendered for a
 * different chapter. Those have different owners and different fixes, and the document is the only
 * artifact the reader holds.
 *
 * Returns `null` when nothing is owed: the chapter never carries a section, a section is about to
 * render, or the narrative is aligned with the served record (`coherence === "coherent"`), in which
 * case the export deliberately renders the aligned narrative alone rather than repeating the
 * source-linked tables beside it. That last case is a declared choice, not an oversight, and
 * `treats an aligned narrative as a deliberate suppression` in the behavior suite pins it.
 */
export function enterpriseContextExportAbsence({
  chapterId,
  recordSource,
  context,
}: {
  chapterId: ChapterId;
  recordSource: HomeRecordRenderSource;
  context: HomeEnterpriseContext | null | undefined;
}): EnterpriseContextAbsence | null {
  if (
    !(ENTERPRISE_CONTEXT_CHAPTER_IDS as readonly string[]).includes(chapterId)
  ) {
    return null;
  }

  if (recordSource.kind !== "ecl_serving_projection") {
    return {
      reason: "reviewed_snapshot",
      why:
        "This export was built from the reviewed Home snapshot, which carries no source-linked " +
        "enterprise context. Business scale, operating segments, declared priorities, function " +
        "ownership and the attribution gaps are absent because no serving projection was read, " +
        "not because the record does not declare them.",
    };
  }

  if (recordSource.contextVersion?.coherence === "coherent") return null;

  if (context === undefined) {
    return {
      reason: "context_not_attached",
      why:
        "A serving projection was read, but no enterprise context was attached to the bundle this " +
        "export rendered. The reader that builds the bundle and the reader that builds the context " +
        "disagree; this is a defect in the export's input, not an absence in the record.",
    };
  }

  if (context === null) {
    return {
      reason: "context_not_established",
      why:
        "A serving projection was read and its rows could not establish a source-linked " +
        "enterprise context. The builder requires exactly one cited enterprise-profile row, at " +
        "least one cited business segment, at least one cited business function, and a declared " +
        "business model on a synthetic-reference basis. Nothing here is a judgment about the " +
        "enterprise.",
    };
  }

  if (chapterId === "technology_data" && !context.dependencyProof) {
    return {
      reason: "dependency_proof_not_established",
      why:
        "An enterprise context was established, but no canonical ID-linked dependency path " +
        "reached this export, so the critical dependency paths table is not rendered. Missing " +
        "links are not inferred, and an empty table would read as an absence of exposure.",
    };
  }

  return null;
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
        `${context.sharedFunctionIds.length} functions serve the enterprise across segments; ${context.unlinkedPrograms.length} ${context.unlinkedPrograms.length === 1 ? "program has" : "programs have"} no declared priority. Changes over time are not established by this view.`,
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

  if (chapterId === "technology_data" && context.dependencyProof) {
    const proof = context.dependencyProof;
    const paths = [...proof.riskPaths.slice(0, 3), ...proof.programPaths.slice(0, 3)];
    return {
      title: "Critical dependency paths",
      paragraphs: [
        `${new Set(proof.riskPaths.map((path) => path.subject.id)).size} priority risks and ${new Set(proof.programPaths.map((path) => path.subject.id)).size} programs have recorded asset links in this bounded slice.`,
        `${proof.projectedLinks} source-linked relationship rows are available; this does not establish the full enterprise blast radius. Missing direct links are not inferred.`,
        "Synthetic reference; not client-attested. Source dates do not attest current data currency.",
        caveat,
      ],
      tables: [{
        caption: "Risk and program connections to applications, suppliers, data and hosting",
        columns: ["Risk or program", "Affected asset", "Supplier / contract", "Data / hosting", "Evidence"],
        rows: paths.map((path) => [
          `${path.subjectKind === "risk" ? "Risk" : "Program"}: ${path.subject.name}`,
          path.asset.name,
          [path.supplier?.name, path.contract?.name].filter(Boolean).join(" / ") || "No direct link in this slice",
          [path.dataProduct?.name, path.platform?.name].filter(Boolean).join(" / ") || "No direct link in this slice",
          `${path.asOf ? `As of ${path.asOf}` : "Source date not established"}; ${path.sourceRefs.length} source records`,
        ]),
        note: "Canonical ID-linked relationships only. Each displayed path includes source-linked endpoints and edges.",
      }],
    };
  }

  if (chapterId === "performance_value") {
    const value = context.valueProof;
    const totalSpendLines = value.completedPeriodSpendLines + value.excludedSpendLines;
    const valueNotes = [
      `Totals include ${context.unlinkedPrograms.length} ${context.unlinkedPrograms.length === 1 ? "program" : "programs"} without a declared priority.`,
      ...(value.missingFinancialCount > 0
        ? [`${value.missingFinancialCount} program financial records are incomplete.`]
        : []),
      ...(value.otherClaimCount > 0
        ? [`${value.otherClaimCount} claim statuses need separate review.`]
        : []),
      totalSpendLines > 0
        ? `${value.excludedSpendLines} of ${totalSpendLines} spend records lack a verifiable completed-period actual and are excluded from current-period spend.`
        : "No spend records are available for completed-period review.",
    ].join(" ");
    return {
      title: "Investment versus proof",
      paragraphs: [
        `${value.programCount} source-linked program records; ${value.asOf ? `as of ${value.asOf}` : "source date not established"}.`,
        `Across ${value.programCount} programs, approved budgets total ${formatValueMoney(value.approvedBudgetUsd)} and forecasts total ${formatValueMoney(value.forecastUsd)}. ${value.overBudgetProgramCount} programs forecast above budget. These are declared estimates, not realized benefits.`,
        `${value.modelledClaimCount} value claims are modelled but not finance-validated; ${value.unsupportedClaimCount} ${value.unsupportedClaimCount === 1 ? "is" : "are"} unsupported. Client-attested realized value is not established by this synthetic record.`,
        valueNotes,
        caveat,
      ],
      tables: [{
        caption: "Program investment by declared priority",
        columns: ["Priority", "Owner", "Programs", "Approved budget", "Forecast", "Above budget", "Evidence"],
        rows: value.priorities.map((priority) => [
          priority.title,
          priority.ownerRole ?? "Not recorded",
          priority.programCount,
          formatValueMoney(priority.approvedBudgetUsd),
          formatValueMoney(priority.forecastUsd),
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
