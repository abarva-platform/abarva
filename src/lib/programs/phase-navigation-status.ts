export interface PhaseNavigationBlockerItem {
  label: string;
  status: string;
  required: boolean;
}

export interface PhaseNavigationBlocker {
  requestedPhase: number;
  currentPhase: number;
  title: string;
  reason: string;
  remaining: PhaseNavigationBlockerItem[];
  nextActionLabel: string;
}

export interface PhaseNavigationStatus {
  requestedPhase: number;
  currentPhase: number;
  canOpenRequestedPhase: boolean;
  blockedRequest: PhaseNavigationBlocker | null;
}

export interface StageReadinessReviewGateStatus {
  acceptedCount: number;
  pendingCount: number;
  needsValidationCount: number;
  rejectedCount: number;
  ready: number;
  insufficientEvidence: number;
  unknown: number;
}

export function parseRequestedPhase(value: unknown): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string" || raw.trim() === "") return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 5 ? parsed : null;
}

export function buildPhaseNavigationStatus(input: {
  currentPhase: number;
  requestedPhase: number;
  blockedPhase?: number | null;
  p1ToP2WorkbookReview?: StageReadinessReviewGateStatus | null;
}): PhaseNavigationStatus {
  const currentPhase = clampPhase(input.currentPhase);
  const requestedPhase = clampPhase(input.requestedPhase);
  const p1ToP2Open =
    currentPhase === 1 &&
    requestedPhase === 2 &&
    workbookReviewOpensP2(input.p1ToP2WorkbookReview);
  const blockedPhase =
    input.blockedPhase === null || input.blockedPhase === undefined
      ? null
      : clampPhase(input.blockedPhase);
  const canOpenRequestedPhase = requestedPhase <= currentPhase || p1ToP2Open;
  const blockedRequestPhase =
    !canOpenRequestedPhase && requestedPhase > currentPhase
      ? requestedPhase
      : blockedPhase !== null && blockedPhase > currentPhase
        ? blockedPhase
        : null;

  return {
    requestedPhase,
    currentPhase,
    canOpenRequestedPhase,
    blockedRequest:
      blockedRequestPhase === null
        ? null
        : buildBlocker(
            currentPhase,
            blockedRequestPhase,
            input.p1ToP2WorkbookReview ?? null,
          ),
  };
}

function workbookReviewOpensP2(
  review: StageReadinessReviewGateStatus | null | undefined,
): boolean {
  return Boolean(
    review &&
    review.acceptedCount > 0 &&
    review.pendingCount === 0 &&
    review.needsValidationCount === 0,
  );
}

function clampPhase(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(5, Math.max(0, Math.trunc(value)));
}

function buildBlocker(
  currentPhase: number,
  requestedPhase: number,
  p1ToP2WorkbookReview: StageReadinessReviewGateStatus | null,
): PhaseNavigationBlocker {
  if (requestedPhase === 2 && currentPhase === 1) {
    const reviewed =
      p1ToP2WorkbookReview &&
      p1ToP2WorkbookReview.pendingCount === 0 &&
      p1ToP2WorkbookReview.needsValidationCount === 0;
    const accepted = p1ToP2WorkbookReview?.acceptedCount ?? 0;
    const readinessParts = p1ToP2WorkbookReview
      ? [
          `${p1ToP2WorkbookReview.ready} ready`,
          `${p1ToP2WorkbookReview.insufficientEvidence} insufficient evidence`,
          `${p1ToP2WorkbookReview.unknown} unknown`,
        ].join(" · ")
      : "No accepted review artifact found";
    return {
      requestedPhase,
      currentPhase,
      title: "Discovery cannot begin yet",
      reason:
        "Review and accept the completed Discovery Workbook before P2 can consume it as governed context.",
      remaining: [
        {
          label: "Completed Discovery Workbook reviewed",
          status: reviewed ? "Reviewed" : "Required before P2 opens",
          required: true,
        },
        {
          label: "Accepted structured responses recorded",
          status:
            accepted > 0
              ? `${accepted} accepted · ${readinessParts}`
              : "Required before P2 context",
          required: true,
        },
        {
          label: "Optional supporting evidence attached",
          status: "Can follow after the required review",
          required: false,
        },
      ],
      nextActionLabel: "Review workbook responses",
    };
  }

  return {
    requestedPhase,
    currentPhase,
    title: `P${requestedPhase} cannot begin yet`,
    reason: `Finish the required P${currentPhase} gate before opening P${requestedPhase}.`,
    remaining: [
      {
        label: `P${currentPhase} gate approval`,
        status: "Required before the next phase opens",
        required: true,
      },
    ],
    nextActionLabel: `Finish P${currentPhase} gate`,
  };
}
