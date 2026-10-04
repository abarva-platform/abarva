import {
  createP1CharterBasisRecord,
  missingP1CaptureSections,
  parseP1CharterBasisInput,
  P1_CHARTER_EVIDENCE_FAMILIES,
  readP1CharterBasisRecord,
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

  it("requires a saved field and an explicit basis, not an upload for every field", () => {
    const sections = [
      {
        key: "scope_boundary",
        label: "Scope boundary",
        evidenceFamily: "charter_scope",
      },
    ];
    const modules = [
      {
        moduleKey: "phase_1_scope_boundary",
        status: "completed",
        state: { value: "Scope for the discovery hypothesis." },
      },
    ];

    expect(
      missingP1CaptureSections(sections, modules, [], { requireBasis: true }),
    ).toEqual(["Scope boundary"]);
    expect(
      missingP1CaptureSections(
        sections,
        modules,
        [
          { evidenceId: "evidence-other", familyKey: "charter_sponsor" },
          { evidenceId: "evidence-scope", familyKey: "charter_scope" },
        ],
        { requireBasis: true },
      ),
    ).toEqual(["Scope boundary"]);
    expect(
      missingP1CaptureSections(
        sections,
        modules,
        [{ evidenceId: "evidence-scope", familyKey: "charter_scope" }],
        { requireBasis: true },
      ),
    ).toEqual(["Scope boundary"]);
  });

  it("falls back to the legacy approved-evidence lock when the basis flag is off", () => {
    const sections = [
      {
        key: "scope_boundary",
        label: "Scope boundary",
        evidenceFamily: "charter_scope",
      },
    ];
    const modules = [
      {
        moduleKey: "phase_1_scope_boundary",
        status: "completed",
        state: { value: "Scope for the discovery hypothesis." },
      },
    ];

    // No approved upload for the family -> legacy lock blocks advance, with no
    // basis consulted (the field has no p1_charter_basis record at all).
    expect(missingP1CaptureSections(sections, modules, [])).toEqual([
      "Scope boundary",
    ]);
    // An approved upload for the family satisfies the legacy lock on its own.
    expect(
      missingP1CaptureSections(sections, modules, [
        { evidenceId: "evidence-scope", familyKey: "charter_scope" },
      ]),
    ).toEqual([]);
    // A skipped field is accepted by the legacy gate (unlike the basis gate).
    expect(
      missingP1CaptureSections(
        sections,
        [
          {
            moduleKey: "phase_1_scope_boundary",
            status: "skipped",
            state: {},
          },
        ],
        [{ evidenceId: "evidence-scope", familyKey: "charter_scope" }],
      ),
    ).toEqual([]);
  });

  it("accepts an authorized-user assertion without misclassifying it as evidence", () => {
    const value = "Scope for the discovery hypothesis.";
    const sections = [
      { key: "scope_boundary", label: "Scope boundary", evidenceFamily: "charter_scope" },
    ];
    const basis = createP1CharterBasisRecord({
      input: { kind: "workspace_assertion" },
      sectionKey: "scope_boundary",
      value,
      userId: "user-1",
      email: "reviewer@example.test",
      recordedAt: "2026-10-04T12:00:00.000Z",
    });
    const modules = [
      {
        moduleKey: "phase_1_scope_boundary",
        status: "completed",
        state: { value, p1_charter_basis: basis },
      },
    ];

    expect(
      missingP1CaptureSections(sections, modules, [], { requireBasis: true }),
    ).toEqual([]);
    expect(readP1CharterBasisRecord(modules[0].state, "scope_boundary", value))
      .toMatchObject({ kind: "workspace_assertion", recordedByUserId: "user-1" });
  });

  it("requires an assumption owner and a P2 validation plan", () => {
    expect(
      parseP1CharterBasisInput({
        kind: "assumption",
        owner: "",
        p2ValidationPlan: "Review in P2",
      }),
    ).toBeNull();
    expect(
      parseP1CharterBasisInput({
        kind: "assumption",
        owner: "Operations lead",
        p2ValidationPlan: "",
      }),
    ).toBeNull();
    expect(
      parseP1CharterBasisInput({
        kind: "assumption",
        owner: "Operations lead",
        p2ValidationPlan: "Validate through the P2 workshop.",
      }),
    ).toEqual({
      kind: "assumption",
      owner: "Operations lead",
      p2ValidationPlan: "Validate through the P2 workshop.",
    });
  });

  it("binds a selected approved source to its exact family and saved value", () => {
    const value = "Scope for the discovery hypothesis.";
    const basis = createP1CharterBasisRecord({
      input: { kind: "approved_evidence", evidenceId: "evidence-scope" },
      sectionKey: "scope_boundary",
      value,
      userId: "user-1",
      recordedAt: "2026-10-04T12:00:00.000Z",
    });
    const sections = [
      { key: "scope_boundary", label: "Scope boundary", evidenceFamily: "charter_scope" },
    ];
    const modules = [
      {
        moduleKey: "phase_1_scope_boundary",
        status: "completed",
        state: { value, p1_charter_basis: basis },
      },
    ];

    expect(
      missingP1CaptureSections(
        sections,
        modules,
        [{ evidenceId: "evidence-scope", familyKey: "charter_scope" }],
        { requireBasis: true },
      ),
    ).toEqual([]);
    expect(
      missingP1CaptureSections(
        sections,
        modules,
        [{ evidenceId: "evidence-scope", familyKey: "charter_sponsor" }],
        { requireBasis: true },
      ),
    ).toEqual(["Scope boundary"]);
    expect(readP1CharterBasisRecord({ p1_charter_basis: basis }, "scope_boundary", "Changed scope"))
      .toBeNull();
  });

  it("does not let skipped or empty required capture pass", () => {
    const sections = [
      { key: "scope_boundary", label: "Scope boundary", evidenceFamily: "charter_scope" },
    ];
    const basis = createP1CharterBasisRecord({
      input: { kind: "workspace_assertion" },
      sectionKey: "scope_boundary",
      value: "Scope for the discovery hypothesis.",
      userId: "user-1",
      recordedAt: "2026-10-04T12:00:00.000Z",
    });
    expect(
      missingP1CaptureSections(
        sections,
        [
          {
            moduleKey: "phase_1_scope_boundary",
            status: "skipped",
            state: { value: "Scope for the discovery hypothesis.", p1_charter_basis: basis },
          },
        ],
        [],
        { requireBasis: true },
      ),
    ).toEqual(["Scope boundary"]);
  });
});
