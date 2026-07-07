export type ApprovalReviewSeverity = "info" | "warning" | "critical";

export interface ApprovalDecisionEvent {
  readonly approvalId: string;
  readonly tenantKey: string;
  readonly reviewerUserId: string;
  readonly reviewerLabel: string;
  readonly module: "moves" | "source" | "tower" | "setup" | "admin" | "other";
  readonly action: "approved" | "rejected" | "modified" | "more_evidence_requested";
  readonly requestedAt: string;
  readonly decidedAt: string;
  readonly rationale: string | null;
  readonly evidenceIds: readonly string[];
  readonly highRisk: boolean;
}

export interface ApprovalPatternReviewThresholds {
  readonly fastApprovalSeconds: number;
  readonly thinRationaleChars: number;
  readonly maxFastApprovalRate: number;
  readonly maxMissingEvidenceRate: number;
  readonly minEventsForReviewerFlag: number;
}

export interface ApprovalPatternEventFlag {
  readonly approvalId: string;
  readonly reviewerUserId: string;
  readonly severity: ApprovalReviewSeverity;
  readonly code:
    | "fast_approval"
    | "thin_rationale"
    | "missing_evidence"
    | "high_risk_fast_approval";
  readonly detail: string;
}

export interface ReviewerApprovalPatternSummary {
  readonly reviewerUserId: string;
  readonly reviewerLabel: string;
  readonly totalDecisions: number;
  readonly approvalCount: number;
  readonly fastApprovalCount: number;
  readonly highRiskDecisionCount: number;
  readonly missingEvidenceCount: number;
  readonly thinRationaleCount: number;
  readonly fastApprovalRate: number;
  readonly missingEvidenceRate: number;
  readonly medianDecisionSeconds: number | null;
  readonly severity: ApprovalReviewSeverity;
  readonly flags: readonly string[];
}

export interface ApprovalPatternReviewReport {
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly generatedAt: string;
  readonly thresholds: ApprovalPatternReviewThresholds;
  readonly totalEvents: number;
  readonly totalFlags: number;
  readonly criticalReviewerCount: number;
  readonly reviewerSummaries: readonly ReviewerApprovalPatternSummary[];
  readonly eventFlags: readonly ApprovalPatternEventFlag[];
  readonly escalationSummary: string;
}

export const DEFAULT_APPROVAL_PATTERN_REVIEW_THRESHOLDS: ApprovalPatternReviewThresholds = {
  fastApprovalSeconds: 30,
  thinRationaleChars: 24,
  maxFastApprovalRate: 0.5,
  maxMissingEvidenceRate: 0.2,
  minEventsForReviewerFlag: 3,
};

function secondsBetween(startIso: string, endIso: string): number | null {
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return null;
  }
  return Math.round((end - start) / 1000);
}

function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle];
  return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function rate(count: number, total: number): number {
  if (total === 0) return 0;
  return Number((count / total).toFixed(3));
}

function flagEvent(
  event: ApprovalDecisionEvent,
  thresholds: ApprovalPatternReviewThresholds,
): ApprovalPatternEventFlag[] {
  const flags: ApprovalPatternEventFlag[] = [];
  const decisionSeconds = secondsBetween(event.requestedAt, event.decidedAt);
  const rationaleLength = (event.rationale ?? "").trim().length;

  if (
    event.action === "approved" &&
    decisionSeconds !== null &&
    decisionSeconds < thresholds.fastApprovalSeconds
  ) {
    flags.push({
      approvalId: event.approvalId,
      reviewerUserId: event.reviewerUserId,
      severity: event.highRisk ? "critical" : "warning",
      code: event.highRisk ? "high_risk_fast_approval" : "fast_approval",
      detail: `Approved in ${decisionSeconds}s; threshold is ${thresholds.fastApprovalSeconds}s.`,
    });
  }

  if (event.action === "approved" && rationaleLength < thresholds.thinRationaleChars) {
    flags.push({
      approvalId: event.approvalId,
      reviewerUserId: event.reviewerUserId,
      severity: event.highRisk ? "critical" : "warning",
      code: "thin_rationale",
      detail: `Rationale has ${rationaleLength} chars; threshold is ${thresholds.thinRationaleChars}.`,
    });
  }

  if (event.action === "approved" && event.evidenceIds.length === 0) {
    flags.push({
      approvalId: event.approvalId,
      reviewerUserId: event.reviewerUserId,
      severity: event.highRisk ? "critical" : "warning",
      code: "missing_evidence",
      detail: "Approved without evidence ids.",
    });
  }

  return flags;
}

export function buildApprovalPatternReviewReport(input: {
  readonly events: readonly ApprovalDecisionEvent[];
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly generatedAt?: string;
  readonly thresholds?: Partial<ApprovalPatternReviewThresholds>;
}): ApprovalPatternReviewReport {
  const thresholds = {
    ...DEFAULT_APPROVAL_PATTERN_REVIEW_THRESHOLDS,
    ...input.thresholds,
  };
  const eventFlags = input.events.flatMap((event) => flagEvent(event, thresholds));
  const byReviewer = new Map<string, ApprovalDecisionEvent[]>();

  for (const event of input.events) {
    const bucket = byReviewer.get(event.reviewerUserId) ?? [];
    bucket.push(event);
    byReviewer.set(event.reviewerUserId, bucket);
  }

  const reviewerSummaries = Array.from(byReviewer.entries())
    .map(([reviewerUserId, events]) => {
      const approvalEvents = events.filter((event) => event.action === "approved");
      const decisionSeconds = events
        .map((event) => secondsBetween(event.requestedAt, event.decidedAt))
        .filter((value): value is number => value !== null);
      const reviewerFlags = eventFlags.filter(
        (flag) => flag.reviewerUserId === reviewerUserId,
      );
      const fastApprovalCount = approvalEvents.filter((event) => {
        const seconds = secondsBetween(event.requestedAt, event.decidedAt);
        return seconds !== null && seconds < thresholds.fastApprovalSeconds;
      }).length;
      const missingEvidenceCount = approvalEvents.filter(
        (event) => event.evidenceIds.length === 0,
      ).length;
      const thinRationaleCount = approvalEvents.filter(
        (event) => (event.rationale ?? "").trim().length < thresholds.thinRationaleChars,
      ).length;
      const fastApprovalRate = rate(fastApprovalCount, approvalEvents.length);
      const missingEvidenceRate = rate(missingEvidenceCount, approvalEvents.length);
      const reviewerLabel = events[0]?.reviewerLabel ?? reviewerUserId;
      const flags: string[] = [];

      if (
        events.length >= thresholds.minEventsForReviewerFlag &&
        fastApprovalRate > thresholds.maxFastApprovalRate
      ) {
        flags.push("fast_approval_rate_exceeds_threshold");
      }
      if (
        approvalEvents.length >= thresholds.minEventsForReviewerFlag &&
        missingEvidenceRate > thresholds.maxMissingEvidenceRate
      ) {
        flags.push("missing_evidence_rate_exceeds_threshold");
      }
      if (reviewerFlags.some((flag) => flag.severity === "critical")) {
        flags.push("critical_event_flag_present");
      }

      const severity: ApprovalReviewSeverity = flags.includes("critical_event_flag_present")
        ? "critical"
        : flags.length > 0
          ? "warning"
          : "info";

      return {
        reviewerUserId,
        reviewerLabel,
        totalDecisions: events.length,
        approvalCount: approvalEvents.length,
        fastApprovalCount,
        highRiskDecisionCount: events.filter((event) => event.highRisk).length,
        missingEvidenceCount,
        thinRationaleCount,
        fastApprovalRate,
        missingEvidenceRate,
        medianDecisionSeconds: median(decisionSeconds),
        severity,
        flags,
      };
    })
    .sort((a, b) => {
      const severityOrder: Record<ApprovalReviewSeverity, number> = {
        critical: 0,
        warning: 1,
        info: 2,
      };
      return (
        severityOrder[a.severity] - severityOrder[b.severity] ||
        b.totalDecisions - a.totalDecisions ||
        a.reviewerLabel.localeCompare(b.reviewerLabel)
      );
    });

  const criticalReviewerCount = reviewerSummaries.filter(
    (summary) => summary.severity === "critical",
  ).length;
  const escalationSummary = criticalReviewerCount > 0
    ? `${criticalReviewerCount} reviewer(s) require tenant-admin and AbarVa review before the next quarterly approval cycle closes.`
    : "No critical reviewer pattern detected; retain report for quarterly governance evidence.";

  return {
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    thresholds,
    totalEvents: input.events.length,
    totalFlags: eventFlags.length,
    criticalReviewerCount,
    reviewerSummaries,
    eventFlags,
    escalationSummary,
  };
}
