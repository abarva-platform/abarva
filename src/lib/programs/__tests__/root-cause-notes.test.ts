import { proposeRootCausesFromNotes } from "@/lib/programs/root-cause-notes";
import type {
  RootCauseEntry,
  RootCauseRegister,
} from "@/lib/programs/root-cause-register";

const reg = (causes: RootCauseEntry[]): RootCauseRegister => ({
  kind: "root_cause_register",
  version: 1,
  causes,
});

const REGISTER = reg([
  {
    id: "RC-1",
    cause: "No accountable ownership or decision rights",
    status: "accepted",
    evidence: ["Interviews"],
  },
  {
    id: "RC-4",
    cause: "Identity not resolved across EHR and claims",
    status: "no_evidence",
  },
]);

const NOTES =
  "Validation prep. The EHR team says a duplicate-match report is possible by Oct 5.\n" +
  "If we carry identity as a gap, Dana Ruiz (master-data program) would own it.\n" +
  "Another candidate: provider reference IDs drift between claims and EHR.";

describe("proposeRootCausesFromNotes", () => {
  it("proposes an owner for the open cause and a new candidate, each with its verbatim sentence", () => {
    const proposals = proposeRootCausesFromNotes(NOTES, REGISTER);
    expect(proposals).toEqual([
      {
        kind: "owner",
        causeId: "RC-4",
        value: "Dana Ruiz (master-data program)",
        excerpt:
          "If we carry identity as a gap, Dana Ruiz (master-data program) would own it.",
        sourceLine: 2,
      },
      {
        kind: "cause",
        value: "provider reference IDs drift between claims and EHR",
        excerpt:
          "Another candidate: provider reference IDs drift between claims and EHR.",
        sourceLine: 3,
      },
    ]);
    for (const p of proposals) expect(NOTES).toContain(p.excerpt);
  });

  it("does not re-propose a cause the register already covers", () => {
    const proposals = proposeRootCausesFromNotes(
      "Nobody holds decision rights; accountable ownership is missing.",
      REGISTER,
    );
    expect(proposals.filter((p) => p.kind === "cause")).toEqual([]);
  });

  it("proposes no owner when no open cause needs one", () => {
    const settled = reg([
      {
        id: "RC-1",
        cause: "Identity unresolved",
        status: "accepted",
        evidence: ["Report"],
      },
    ]);
    expect(
      proposeRootCausesFromNotes(
        "Dana Ruiz would own identity.",
        settled,
      ).filter((p) => p.kind === "owner"),
    ).toEqual([]);
  });

  it("matches an owner to the open cause the sentence names when several are open", () => {
    const two = reg([
      {
        id: "RC-4",
        cause: "Identity not resolved across EHR and claims",
        status: "no_evidence",
      },
      {
        id: "RC-6",
        cause: "Quality defects reach reports",
        status: "no_evidence",
      },
    ]);
    const [owner] = proposeRootCausesFromNotes(
      "Quality defects are owned by Lee Park (data quality lead).",
      two,
    );
    expect(owner).toMatchObject({
      kind: "owner",
      causeId: "RC-6",
      value: "Lee Park (data quality lead)",
    });
  });

  it("proposes nothing from notes with no cause wording", () => {
    expect(
      proposeRootCausesFromNotes(
        "Meeting moved to Thursday at the main office.",
        REGISTER,
      ),
    ).toEqual([]);
  });
});
