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

interface P1CaptureSectionRequirement {
  key: string;
  label: string;
  evidenceFamily?: string;
}

interface P1CaptureModuleState {
  moduleKey: string;
  status: string;
}

interface P1ApprovedEvidenceReference {
  familyKey: string;
}

export function missingP1CaptureSections(
  sections: readonly P1CaptureSectionRequirement[],
  modules: readonly P1CaptureModuleState[],
  approvedEvidence: readonly P1ApprovedEvidenceReference[],
): string[] {
  return sections.flatMap((section) => {
    const captureState = modules.find(
      (entry) => entry.moduleKey === `phase_1_${section.key}`,
    );
    const captureSaved =
      captureState && ["completed", "skipped"].includes(captureState.status);
    const sourceApproved =
      !section.evidenceFamily ||
      approvedEvidence.some(
        (reference) => reference.familyKey === section.evidenceFamily,
      );
    return captureSaved && sourceApproved ? [] : [section.label];
  });
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
