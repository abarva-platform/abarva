/**
 * The decision that links fill-from-notes to the per-field charter basis.
 *
 * It lives in this directory, beside the Moves component suites, because
 * `src/components/strategic-moves/__tests__` is named by exact path in a
 * REQUIRED status check, and `src/lib/programs/__tests__` is swept by no job —
 * a case written there would record coverage and block nothing.
 *
 * Every branch is pinned with the other conditions SATISFIED, so removing any
 * one guard turns a case red. A fixture that falsifies two conditions at once
 * would stay green with either half of the guard deleted.
 */
import {
  basisForNotesInsert,
  notesInsertBasisRecordingKeys,
} from "@/lib/programs/capture-notes-basis-link";
import type { P1CharterBasisInput } from "@/lib/programs/p1-charter-evidence";

const CHARTER_KEYS = new Set(["sponsor_commitment", "scope_boundary"]);

describe("basisForNotesInsert", () => {
  it("records the person's own assertion for a charter field with no basis yet", () => {
    const decision = basisForNotesInsert({
      sectionKey: "sponsor_commitment",
      basisSurfaceActive: true,
      charterBasisSectionKeys: CHARTER_KEYS,
      existingBasis: null,
    });

    expect(decision.reason).toBe("recorded_assertion");
    expect(decision.basis).toEqual({ kind: "workspace_assertion" });
  });

  it("records nothing when the basis surface is off, with everything else satisfied", () => {
    const decision = basisForNotesInsert({
      sectionKey: "sponsor_commitment",
      basisSurfaceActive: false,
      charterBasisSectionKeys: CHARTER_KEYS,
      existingBasis: null,
    });

    expect(decision.basis).toBeNull();
    expect(decision.reason).toBe("basis_surface_off");
  });

  it("records nothing for a field that carries no charter basis, with the surface on", () => {
    const decision = basisForNotesInsert({
      sectionKey: "known_evidence",
      basisSurfaceActive: true,
      charterBasisSectionKeys: CHARTER_KEYS,
      existingBasis: null,
    });

    expect(decision.basis).toBeNull();
    expect(decision.reason).toBe("not_a_charter_field");
  });

  it("never downgrades an approved-evidence basis to an assertion", () => {
    const existing: P1CharterBasisInput = {
      kind: "approved_evidence",
      evidenceId: "ev-1",
    };

    const decision = basisForNotesInsert({
      sectionKey: "sponsor_commitment",
      basisSurfaceActive: true,
      charterBasisSectionKeys: CHARTER_KEYS,
      existingBasis: existing,
    });

    expect(decision.basis).toBeNull();
    expect(decision.reason).toBe("basis_already_declared");
  });

  it("never strips an assumption's owner and Discover validation plan", () => {
    const existing: P1CharterBasisInput = {
      kind: "assumption",
      owner: "Operations lead",
      p2ValidationPlan: "Confirm the queue volumes in the Discover sample.",
    };

    const decision = basisForNotesInsert({
      sectionKey: "scope_boundary",
      basisSurfaceActive: true,
      charterBasisSectionKeys: CHARTER_KEYS,
      existingBasis: existing,
    });

    expect(decision.basis).toBeNull();
    expect(decision.reason).toBe("basis_already_declared");
  });

  it("treats an already-recorded assertion as declared, so an insert does not re-stamp it", () => {
    const decision = basisForNotesInsert({
      sectionKey: "scope_boundary",
      basisSurfaceActive: true,
      charterBasisSectionKeys: CHARTER_KEYS,
      existingBasis: { kind: "workspace_assertion" },
    });

    expect(decision.basis).toBeNull();
    expect(decision.reason).toBe("basis_already_declared");
  });
});

describe("notesInsertBasisRecordingKeys", () => {
  it("names only the charter fields an insert would actually stamp", () => {
    const keys = notesInsertBasisRecordingKeys({
      basisSurfaceActive: true,
      charterBasisSectionKeys: CHARTER_KEYS,
      basisBySection: {
        scope_boundary: { kind: "approved_evidence", evidenceId: "ev-1" },
      },
    });

    expect(keys).toEqual(["sponsor_commitment"]);
  });

  it("names nothing while the basis surface is off", () => {
    const keys = notesInsertBasisRecordingKeys({
      basisSurfaceActive: false,
      charterBasisSectionKeys: CHARTER_KEYS,
      basisBySection: {},
    });

    expect(keys).toEqual([]);
  });

  it("names every charter field when none has a basis yet", () => {
    const keys = notesInsertBasisRecordingKeys({
      basisSurfaceActive: true,
      charterBasisSectionKeys: CHARTER_KEYS,
      basisBySection: {},
    });

    expect([...keys].sort()).toEqual(["scope_boundary", "sponsor_commitment"]);
  });
});
