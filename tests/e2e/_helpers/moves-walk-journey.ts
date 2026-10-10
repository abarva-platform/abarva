/** Derive a read-only journey from the product's evaluator and cabinet reads. */

export interface GateCriterionReadback {
  id: string;
  label: string;
  severity: "hard" | "soft";
  verified: boolean;
  completed: boolean;
  reason?: string;
}

export interface PhaseGateReadback {
  currentPhase: number | null;
  terminalComplete: boolean | null;
  criteria: GateCriterionReadback[] | null;
  reason: string | null;
}

export interface CurrentDocumentReadback {
  artifactId: string;
  phase: number | null;
  family: string;
  signedOffVersion?: number | null;
  currentVersion?: number | null;
}

export interface JourneyEntry {
  phase: number;
  transition: string;
  state: "done" | "current" | "upcoming" | "unknown";
  hard: { met: number | null; total: number | null };
  soft: { met: number | null; total: number | null };
  firstOpenHard: { id: string; reason: string } | null;
  gateReadback: "verified" | "unverified" | "unavailable";
  gateReadbackReason: string | null;
  documents: {
    readback: "available" | "unavailable";
    currentBuiltCount: number | null;
    signedOffCount: number | null;
    allObservedSignedOff: boolean | null;
    basis: string;
  };
}

export function buildJourney(
  readbacks: Array<PhaseGateReadback | null>,
  documents: CurrentDocumentReadback[] | null,
  documentSignOffAvailable: boolean,
): JourneyEntry[] {
  return Array.from({ length: 6 }, (_, phase) => {
    const readback = readbacks[phase] ?? null;
    const currentPhase = readback?.currentPhase;
    const state: JourneyEntry["state"] =
      currentPhase == null
        ? "unknown"
        : phase < currentPhase ||
            (phase === 5 && readback?.terminalComplete === true)
          ? "done"
          : phase === currentPhase
            ? "current"
            : "upcoming";
    const criteria = readback?.criteria ?? null;
    const verified =
      criteria !== null && criteria.every((item) => item.verified);
    const hard = criteria?.filter((item) => item.severity === "hard") ?? null;
    const soft = criteria?.filter((item) => item.severity === "soft") ?? null;
    const firstOpenHard = verified
      ? (hard?.find((item) => !item.completed) ?? null)
      : null;
    const observedDocuments =
      documents?.filter(
        (item) =>
          item.phase === phase && item.family === "generated_deliverable",
      ) ?? null;
    const signedOffCount =
      observedDocuments && documentSignOffAvailable
        ? observedDocuments.filter(
            (item) =>
              typeof item.currentVersion === "number" &&
              item.currentVersion > 0 &&
              item.signedOffVersion === item.currentVersion,
          ).length
        : null;

    return {
      phase,
      transition: phase === 5 ? "P5→Tower" : `P${phase}→P${phase + 1}`,
      state,
      hard: {
        met: verified ? hard!.filter((item) => item.completed).length : null,
        total: hard?.length ?? null,
      },
      soft: {
        met: verified ? soft!.filter((item) => item.completed).length : null,
        total: soft?.length ?? null,
      },
      firstOpenHard: firstOpenHard
        ? {
            id: firstOpenHard.id,
            reason: firstOpenHard.reason?.trim() || firstOpenHard.label,
          }
        : null,
      gateReadback:
        criteria === null
          ? "unavailable"
          : verified
            ? "verified"
            : "unverified",
      gateReadbackReason:
        readback?.reason ??
        (criteria === null
          ? "Gate criteria could not be read"
          : verified
            ? null
            : "The evaluator did not verify every criterion"),
      documents: {
        readback:
          observedDocuments && documentSignOffAvailable
            ? "available"
            : "unavailable",
        currentBuiltCount: observedDocuments?.length ?? null,
        signedOffCount,
        allObservedSignedOff:
          observedDocuments && documentSignOffAvailable
            ? observedDocuments.length > 0 &&
              signedOffCount === observedDocuments.length
            : null,
        basis:
          "Current generated artifacts observed in the Move cabinet; this does not assert that every required deliverable was built.",
      },
    };
  });
}
