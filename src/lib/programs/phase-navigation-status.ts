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
}): PhaseNavigationStatus {
  const currentPhase = clampPhase(input.currentPhase);
  const requestedPhase = clampPhase(input.requestedPhase);
  const blockedPhase =
    input.blockedPhase === null || input.blockedPhase === undefined
      ? null
      : clampPhase(input.blockedPhase);
  const canOpenRequestedPhase = requestedPhase <= currentPhase;
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
        : buildBlocker(currentPhase, blockedRequestPhase),
  };
}

function clampPhase(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(5, Math.max(0, Math.trunc(value)));
}

function buildBlocker(
  currentPhase: number,
  requestedPhase: number,
): PhaseNavigationBlocker {
  if (requestedPhase === 2 && currentPhase === 1) {
    return {
      requestedPhase,
      currentPhase,
      title: "Discovery cannot begin yet",
      reason:
        "Review and accept the completed Discovery Workbook before P2 can consume it as governed context.",
      remaining: [
        {
          label: "Completed Discovery Workbook reviewed",
          status: "Required before P2 opens",
          required: true,
        },
        {
          label: "Accepted structured responses recorded",
          status: "Required before P2 context",
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
