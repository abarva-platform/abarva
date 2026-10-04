import { computeCaptureRevision } from "@/lib/programs/phase-capture-integrity";

export const P1_CHARTER_EVIDENCE_FAMILIES = [
  {
    id: "charter_sponsor",
    sectionKey: "sponsor_commitment",
    label: "Sponsor contact and progress updates",
  },
  {
    id: "charter_scope",
    sectionKey: "scope_boundary",
    label: "Scope boundary",
  },
  {
    id: "charter_success_metrics",
    sectionKey: "success_criteria",
    label: "Success criteria",
  },
  {
    id: "charter_stakeholders",
    sectionKey: "stakeholder_map",
    label: "Stakeholder map",
  },
  {
    id: "charter_decision_rights",
    sectionKey: "decision_rights",
    label: "Decision rights",
  },
  {
    id: "charter_evidence_plan",
    sectionKey: "evidence_plan",
    label: "Evidence plan",
  },
  {
    id: "charter_business_change",
    sectionKey: "business_change_assessment",
    label: "Business change & adoption owner",
  },
] as const;

export type P1CharterEvidenceFamilyId =
  (typeof P1_CHARTER_EVIDENCE_FAMILIES)[number]["id"];

export type P1CharterBasisInput =
  | { kind: "approved_evidence"; evidenceId: string }
  | { kind: "workspace_assertion" }
  | {
      kind: "assumption";
      owner: string;
      p2ValidationPlan: string;
    };

export type P1CharterBasisRecord = P1CharterBasisInput & {
  recordedByUserId: string;
  recordedByEmail: string | null;
  recordedAt: string;
  valueRevision: string;
};

interface P1CaptureSectionRequirement {
  key: string;
  label: string;
  evidenceFamily?: string;
}

interface P1CaptureModuleState {
  moduleKey: string;
  status: string;
  state?: Record<string, unknown> | null;
}

interface P1ApprovedEvidenceReference {
  evidenceId: string;
  familyKey: string;
}

export interface MissingP1CaptureSectionsOptions {
  /**
   * When true, advance requires a per-field BASIS (approved evidence, a
   * workspace assertion, or an owned assumption) rather than an approved
   * evidence upload for every field. Gated by the `moves_charter_basis_v1`
   * feature flag; defaults to false so the live P1 gate (approved-evidence
   * lock) is preserved exactly when the flag is off.
   */
  requireBasis?: boolean;
}

export function missingP1CaptureSections(
  sections: readonly P1CaptureSectionRequirement[],
  modules: readonly P1CaptureModuleState[],
  approvedEvidence: readonly P1ApprovedEvidenceReference[],
  options?: MissingP1CaptureSectionsOptions,
): string[] {
  const requireBasis = options?.requireBasis ?? false;
  return sections.flatMap((section) => {
    const captureState = modules.find(
      (entry) => entry.moduleKey === `phase_1_${section.key}`,
    );

    if (!requireBasis) {
      // Legacy gate (live on main; flag OFF): capture saved + an approved
      // evidence upload for the field's family. Preserved byte-for-byte so
      // the flag-off path never changes behavior.
      const captureSaved =
        !!captureState &&
        ["completed", "skipped"].includes(captureState.status);
      const sourceApproved =
        !section.evidenceFamily ||
        approvedEvidence.some(
          (reference) => reference.familyKey === section.evidenceFamily,
        );
      return captureSaved && sourceApproved ? [] : [section.label];
    }

    // Minimum-viable-evidence gate (flag ON): capture saved + a recorded
    // basis. A workspace assertion or an owned assumption is sufficient; only
    // an `approved_evidence` basis still requires a matching approved upload.
    const value = captureState?.state?.value;
    const captureSaved =
      captureState?.status === "completed" &&
      typeof value === "string" &&
      value.trim().length > 0;
    const basis = readP1CharterBasisRecord(
      captureState?.state,
      section.key,
      typeof value === "string" ? value : "",
    );
    const family = p1CharterEvidenceFamilyForSection(section.key);
    const approvedSource = approvedEvidence.some(
      (reference) =>
        reference.familyKey === family?.id &&
        basis?.kind === "approved_evidence" &&
        reference.evidenceId === basis.evidenceId,
    );
    return captureSaved && basis && (basis.kind !== "approved_evidence" || approvedSource)
      ? []
      : [section.label];
  });
}

export function parseP1CharterBasisInput(
  raw: unknown,
): P1CharterBasisInput | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const value = raw as Record<string, unknown>;
  if (value.kind === "approved_evidence") {
    const evidenceId = typeof value.evidenceId === "string" ? value.evidenceId.trim() : "";
    return evidenceId ? { kind: "approved_evidence", evidenceId } : null;
  }
  if (value.kind === "workspace_assertion") {
    return { kind: "workspace_assertion" };
  }
  if (value.kind === "assumption") {
    const owner = typeof value.owner === "string" ? value.owner.trim() : "";
    const p2ValidationPlan =
      typeof value.p2ValidationPlan === "string"
        ? value.p2ValidationPlan.trim()
        : "";
    return owner && p2ValidationPlan
      ? { kind: "assumption", owner, p2ValidationPlan }
      : null;
  }
  return null;
}

export function createP1CharterBasisRecord(args: {
  input: P1CharterBasisInput;
  sectionKey: string;
  value: string;
  userId: string;
  email?: string | null;
  recordedAt: string;
}): P1CharterBasisRecord {
  return {
    ...args.input,
    recordedByUserId: args.userId,
    recordedByEmail: args.email ?? null,
    recordedAt: args.recordedAt,
    valueRevision: computeCaptureRevision({ [args.sectionKey]: args.value }),
  };
}

export function readP1CharterBasisRecord(
  state: Record<string, unknown> | null | undefined,
  sectionKey: string,
  value: string,
): P1CharterBasisRecord | null {
  const raw = state?.p1_charter_basis;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const input = parseP1CharterBasisInput(record);
  if (
    !input ||
    record.valueRevision !== computeCaptureRevision({ [sectionKey]: value })
  ) {
    return null;
  }
  if (
    typeof record.recordedByUserId !== "string" ||
    !record.recordedByUserId.trim() ||
    typeof record.recordedAt !== "string" ||
    !record.recordedAt.trim()
  ) {
    return null;
  }
  return {
    ...input,
    recordedByUserId: record.recordedByUserId,
    recordedByEmail:
      typeof record.recordedByEmail === "string"
        ? record.recordedByEmail
        : null,
    recordedAt: record.recordedAt,
    valueRevision: record.valueRevision as string,
  };
}

export function p1CharterBasisInputFromRecord(
  record: P1CharterBasisRecord | null,
): P1CharterBasisInput | null {
  if (!record) return null;
  if (record.kind === "approved_evidence") {
    return { kind: record.kind, evidenceId: record.evidenceId };
  }
  if (record.kind === "workspace_assertion") {
    return { kind: record.kind };
  }
  return {
    kind: record.kind,
    owner: record.owner,
    p2ValidationPlan: record.p2ValidationPlan,
  };
}

export function isP1CharterBasisValidForSection(args: {
  sectionKey: string;
  basis: P1CharterBasisInput | null;
  approvedEvidence: readonly P1ApprovedEvidenceReference[];
}): boolean {
  if (!args.basis) return false;
  if (args.basis.kind !== "approved_evidence") return true;
  const { evidenceId } = args.basis;
  const family = p1CharterEvidenceFamilyForSection(args.sectionKey);
  return Boolean(
    family &&
      args.approvedEvidence.some(
        (reference) =>
          reference.evidenceId === evidenceId &&
          reference.familyKey === family.id,
      ),
  );
}

export function isP1CharterEvidenceFamily(
  familyKey: string | null | undefined,
): familyKey is P1CharterEvidenceFamilyId {
  return P1_CHARTER_EVIDENCE_FAMILIES.some(
    (family) => family.id === familyKey,
  );
}

export function p1CharterEvidenceFamilyForSection(
  sectionKey: string,
): (typeof P1_CHARTER_EVIDENCE_FAMILIES)[number] | null {
  return (
    P1_CHARTER_EVIDENCE_FAMILIES.find(
      (family) => family.sectionKey === sectionKey,
    ) ?? null
  );
}

export function resolveMoveUploadEvidenceFamily(
  raw: unknown,
  phase: number,
  discoveryFamilyIds: readonly string[],
): { ok: true; familyKey: string | null } | { ok: false; detail: string } {
  const declared = typeof raw === "string" ? raw.trim() : "";
  if (!declared) return { ok: true, familyKey: null };

  const allowed =
    (phase === 1 && isP1CharterEvidenceFamily(declared)) ||
    discoveryFamilyIds.includes(declared);
  return allowed
    ? { ok: true, familyKey: declared }
    : {
        ok: false,
        detail:
          phase === 1
            ? `'${declared}' is not a P1 charter or discovery evidence family.`
            : `'${declared}' is not an evidence family this Move requires.`,
      };
}
