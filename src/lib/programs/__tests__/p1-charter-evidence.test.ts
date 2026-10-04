import {
  missingP1CaptureSections,
  P1_CHARTER_EVIDENCE_FAMILIES,
  resolveMoveUploadEvidenceFamily,
} from "../p1-charter-evidence";

describe("P1 charter evidence families", () => {
  it("allows a required P1 family only on P1 uploads", () => {
    expect(
      resolveMoveUploadEvidenceFamily("charter_sponsor", 1, []),
    ).toEqual({ ok: true, familyKey: "charter_sponsor" });
    expect(
      resolveMoveUploadEvidenceFamily("charter_sponsor", 2, [
        "contact_center_kpis",
      ]),
    ).toMatchObject({ ok: false });
  });

  it("allows P1 charter and discovery families only in their valid phases", () => {
    expect(
      resolveMoveUploadEvidenceFamily("contact_center_kpis", 1, []),
    ).toMatchObject({ ok: false });
    expect(
      resolveMoveUploadEvidenceFamily("contact_center_kpis", 1, [
        "contact_center_kpis",
      ]),
    ).toEqual({ ok: true, familyKey: "contact_center_kpis" });
    expect(
      resolveMoveUploadEvidenceFamily("contact_center_kpis", 2, [
        "contact_center_kpis",
      ]),
    ).toEqual({ ok: true, familyKey: "contact_center_kpis" });
    expect(
      resolveMoveUploadEvidenceFamily("charter_sponsor", 2, [
        "contact_center_kpis",
      ]),
    ).toMatchObject({ ok: false });
  });

  it("keeps each P1 family attached to one capture field", () => {
    expect(P1_CHARTER_EVIDENCE_FAMILIES).toHaveLength(7);
    expect(
      new Set(P1_CHARTER_EVIDENCE_FAMILIES.map((family) => family.sectionKey))
        .size,
    ).toBe(P1_CHARTER_EVIDENCE_FAMILIES.length);
  });

  it("requires a saved field and a same-family approved source", () => {
    const sections = [
      {
        key: "scope_boundary",
        label: "Scope boundary",
        evidenceFamily: "charter_scope",
      },
    ];
    const modules = [
      { moduleKey: "phase_1_scope_boundary", status: "completed" },
    ];

    expect(missingP1CaptureSections(sections, modules, [])).toEqual([
      "Scope boundary",
    ]);
    expect(
      missingP1CaptureSections(sections, modules, [
        { familyKey: "charter_sponsor" },
      ]),
    ).toEqual(["Scope boundary"]);
    expect(
      missingP1CaptureSections(sections, modules, [
        { familyKey: "charter_scope" },
      ]),
    ).toEqual([]);
  });
});
