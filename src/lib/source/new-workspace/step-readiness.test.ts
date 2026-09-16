import {
  assessStepReadiness,
  isAcceptedEvidence,
  type DefineStepInput,
  type RequestStepInput,
  type RfiStepInput,
  type SupplierSelection,
  type SuppliersStepInput,
} from "./step-readiness";

const request = (): RequestStepInput => ({
  step: "request",
  versionId: "request-v1",
  requesterId: "person-1",
  businessOwnerId: "person-2",
  need: "Document the business need",
  category: "Services",
  decisionDate: "2027-06-30",
});

const define = (): DefineStepInput => ({
  step: "define",
  outcome: "Understand the market",
  scopeIn: "Member support",
  scopeOut: "Claims adjudication",
  motion: "rfi",
  ownerId: "person-2",
  decisionDate: "2027-06-30",
  baseline: { kind: "accepted", versionId: "baseline-v1", acceptedBy: "person-2" },
  strategy: { versionId: "strategy-v1", state: "accepted", acceptedBy: "person-2" },
  approvals: [],
});

const supplier = (): SupplierSelection => ({
  selectionId: "selection-1",
  legalEntityId: "legal-1",
  contactId: "contact-1",
  disqualified: false,
  nda: {
    state: "approved",
    legalEntityId: "legal-1",
    scopeId: "scope-1",
    expiresOn: "2027-12-31",
    actorId: "legal-reviewer-1",
  },
});

const suppliers = (): SuppliersStepInput => ({
  step: "suppliers_nda",
  selectionVersionId: "selection-v1",
  requiredScopeId: "scope-1",
  asOfDate: "2027-06-01",
  selected: [supplier()],
});

const rfi = (): RfiStepInput => ({
  step: "rfi",
  package: { versionId: "package-v1", state: "accepted", acceptedBy: "person-2" },
  selected: [supplier()],
  selectionVersionId: "selection-v1",
  confirmedSelectionVersionId: "selection-v1",
  requiredScopeId: "scope-1",
  asOfDate: "2027-06-01",
  recipientSnapshotId: "recipients-v1",
  approvals: [],
});

describe("Source New step readiness", () => {
  test("Request exposes one disabled action until complete, then only the current version can be accepted", () => {
    const incomplete = assessStepReadiness({ ...request(), need: "" });
    expect(incomplete.status).toBe("needs_work");
    expect(incomplete.nextAction).toEqual({
      label: "Accept for planning",
      disabled: true,
      disabledReason: "Describe the need",
    });
    expect(assessStepReadiness(request()).status).toBe("ready_to_submit");
    expect(assessStepReadiness({ ...request(), accepted: { versionId: "request-v0", actorId: "person-3" } }).status)
      .toBe("ready_to_submit");
    const accepted = assessStepReadiness({ ...request(), accepted: { versionId: "request-v1", actorId: "person-3" } });
    expect(accepted.status).toBe("complete");
    expect(accepted.nextAction).toEqual({ label: "Continue to Define", disabled: false });
  });

  test("uploaded evidence is not accepted; an explicit unknown resolves disposition without evidence", () => {
    const uploaded = assessStepReadiness({
      ...define(),
      baseline: { kind: "uploaded", versionId: "baseline-v1" },
    });
    expect(uploaded.status).toBe("needs_work");
    expect(uploaded.baselineEvidencePresent).toBe(false);
    expect(uploaded.unmetRequirements).toContain("Accept baseline evidence or record why it is unknown");
    const unknown = assessStepReadiness({
      ...define(),
      baseline: { kind: "explicit_unknown", recordedBy: "person-2", reason: "No report supplied" },
    });
    expect(unknown.status).toBe("ready_to_submit");
    expect(unknown.baselineEvidencePresent).toBe(false);
    expect(unknown.completedRequirements).toContain("Baseline unknown recorded");
    expect(isAcceptedEvidence({ kind: "explicit_unknown", recordedBy: "person-2", reason: "No report supplied" })).toBe(false);
    expect(isAcceptedEvidence({ kind: "accepted", versionId: "", acceptedBy: "person-2" })).toBe(false);
  });

  test("Define requires submitted current version and two distinct named approvals", () => {
    const input = { ...define(), submittedVersionId: "strategy-v1" };
    expect(assessStepReadiness(input).status).toBe("awaiting_approval");
    const one = {
      ...input,
      approvals: [{ role: "business_owner", actorId: "person-2", versionId: "strategy-v1", decision: "approved" }],
    } as DefineStepInput;
    expect(assessStepReadiness(one).unmetRequirements).toEqual(["Procurement lead approval pending"]);
    const stale = {
      ...one,
      approvals: [...one.approvals, { role: "procurement_lead", actorId: "person-3", versionId: "strategy-v0", decision: "approved" }],
    } as DefineStepInput;
    expect(assessStepReadiness(stale).status).toBe("awaiting_approval");
    const sameActor = {
      ...one,
      approvals: [...one.approvals, { role: "procurement_lead", actorId: "person-2", versionId: "strategy-v1", decision: "approved" }],
    } as DefineStepInput;
    expect(assessStepReadiness(sameActor).status).toBe("blocked");
    const both = {
      ...one,
      approvals: [...one.approvals, { role: "procurement_lead", actorId: "person-3", versionId: "strategy-v1", decision: "approved" }],
    } as DefineStepInput;
    expect(assessStepReadiness(both).status).toBe("complete");
    expect(assessStepReadiness({ ...both, strategy: { versionId: "strategy-v2", state: "accepted" } }).status)
      .toBe("needs_work");
    expect(assessStepReadiness({ ...both, strategy: { versionId: "strategy-v2", state: "accepted", acceptedBy: "person-2" } }).status)
      .toBe("ready_to_submit");
    expect(assessStepReadiness({ ...both, approvals: [...both.approvals, { role: "business_owner", actorId: "person-2", versionId: "strategy-v1", decision: "changes_requested" }] }).status)
      .toBe("blocked");
  });

  test("supplier readiness requires selection, contact, legal identity and scoped NDA", () => {
    expect(assessStepReadiness(suppliers()).status).toBe("ready_to_submit");
    expect(assessStepReadiness({ ...suppliers(), confirmedVersionId: "selection-v1" }).status).toBe("complete");
    expect(assessStepReadiness({ ...suppliers(), confirmedVersionId: "selection-v0" }).status).toBe("ready_to_submit");
    expect(assessStepReadiness({ ...suppliers(), selected: [] }).status).toBe("needs_work");
    expect(assessStepReadiness({ ...suppliers(), selected: [{ ...supplier(), contactId: "" }] }).status).toBe("needs_work");
    expect(assessStepReadiness({ ...suppliers(), selected: [{ ...supplier(), disqualified: true }] }).status).toBe("blocked");
    expect(assessStepReadiness({ ...suppliers(), selected: [{ ...supplier(), nda: { ...supplier().nda!, legalEntityId: "legal-other" } }] }).status).toBe("blocked");
    expect(assessStepReadiness({ ...suppliers(), selected: [{ ...supplier(), nda: { ...supplier().nda!, expiresOn: "2027-05-31" } }] }).status).toBe("blocked");
    expect(assessStepReadiness({ ...suppliers(), selected: [{ ...supplier(), nda: { ...supplier().nda!, state: "pending" } }] }).status).toBe("awaiting_approval");
    expect(assessStepReadiness({ ...suppliers(), selected: [{ ...supplier(), nda: { ...supplier().nda!, state: "waived" } }] }).status).toBe("blocked");
    expect(assessStepReadiness({ ...suppliers(), selected: [{ ...supplier(), nda: { ...supplier().nda!, state: "waived", reason: "Time-bound legal exception" } }] }).status).toBe("ready_to_submit");
  });

  test("RFI release and decision are tied to the current package and recipient snapshot", () => {
    expect(assessStepReadiness({ ...rfi(), package: { versionId: "package-v1", state: "uploaded" } }).status).toBe("needs_work");
    expect(assessStepReadiness({ ...rfi(), package: { versionId: "package-v1", state: "accepted" } }).status).toBe("needs_work");
    expect(assessStepReadiness({ ...rfi(), confirmedSelectionVersionId: "selection-v0" }).status).toBe("needs_work");
    expect(assessStepReadiness(rfi()).nextAction.label).toBe("Submit RFI for release approval");
    const submitted = { ...rfi(), submittedVersionId: "package-v1" };
    expect(assessStepReadiness(submitted).status).toBe("awaiting_approval");
    expect(assessStepReadiness({
      ...submitted,
      release: { packageVersionId: "package-v1", recipientSnapshotId: "recipients-v1", actorId: "person-4" },
    }).status).toBe("blocked");
    const approved = {
      ...submitted,
      approvals: [{ role: "release_approver", actorId: "person-4", versionId: "package-v1", decision: "approved" }],
    } as RfiStepInput;
    expect(assessStepReadiness(approved).nextAction.label).toBe("Release RFI to cleared suppliers");
    const released = {
      ...approved,
      release: { packageVersionId: "package-v1", recipientSnapshotId: "recipients-v1", actorId: "person-4" },
    };
    expect(assessStepReadiness(released).nextAction.label).toBe("Record RFI decision");
    expect(assessStepReadiness({
      ...released,
      decision: { kind: "convert", packageVersionId: "package-v1", actorId: "person-5" },
    }).status).toBe("complete");
    expect(assessStepReadiness({ ...released, recipientSnapshotId: "recipients-v2" }).status).toBe("blocked");
    expect(assessStepReadiness({ ...released, package: { versionId: "package-v2", state: "accepted", acceptedBy: "person-2" } }).status).toBe("blocked");
    expect(assessStepReadiness({ ...rfi(), selected: [{ ...supplier(), nda: { ...supplier().nda!, scopeId: "other" } }] }).status).toBe("blocked");
  });
});
