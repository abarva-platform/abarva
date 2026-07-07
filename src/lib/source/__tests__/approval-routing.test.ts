import {
  APPROVAL_LABEL_OWNER_ROLE_MAP,
  approvalRequirementsForTransitions,
  approvalViewForCriterion,
  formatCriterionApprovalNotes,
  resolveApprover,
  resolveOwnerRoleForApprovalLabel,
} from "../approval-routing";
import { SOURCE_STAGE_GATE_REQUIRED_APPROVALS_BY_TRANSITION } from "../source-stage-gates";

const event = {
  id: "evt-1",
  decisionOwner: "Tomas Singh",
  createdByUserId: "clerk-source-lead-1",
};

describe("Source approval routing", () => {
  it("maps every transition approval label to a known owner role", () => {
    const labels = Object.values(
      SOURCE_STAGE_GATE_REQUIRED_APPROVALS_BY_TRANSITION,
    ).flat();
    expect(labels.length).toBeGreaterThan(0);

    for (const label of labels) {
      expect(APPROVAL_LABEL_OWNER_ROLE_MAP[label]).toBeDefined();
      expect(resolveOwnerRoleForApprovalLabel(label)).toBe(
        APPROVAL_LABEL_OWNER_ROLE_MAP[label],
      );
    }
    expect(approvalRequirementsForTransitions()).toHaveLength(labels.length);
  });

  it("resolves sourcing lead from created_by_user_id", () => {
    expect(resolveApprover(event, "sourcing-lead")).toMatchObject({
      status: "resolved",
      name: "Sourcing lead",
      userId: "clerk-source-lead-1",
      basis: "event-created-by",
    });
  });

  it("resolves sponsor from decision_owner as a name-only approval", () => {
    expect(resolveApprover(event, "sponsor")).toMatchObject({
      status: "resolved",
      name: "Tomas Singh",
      userId: null,
      basis: "event-decision-owner-name",
    });
  });

  it("keeps finance, legal, and EA council unresolved without fabrication", () => {
    for (const ownerRole of ["finance", "legal", "ea-council"] as const) {
      const resolution = resolveApprover(event, ownerRole);
      expect(resolution.status).toBe("unresolved");
      if (resolution.status === "unresolved") {
        expect(resolution.reason).toMatch(/no resolved person field/i);
      }
    }
  });

  it("formats criterion approval notes with role, requirement, resolution, and reason", () => {
    const resolution = resolveApprover(event, "sponsor");
    expect(
      formatCriterionApprovalNotes({
        ownerRole: "sponsor",
        requirementId: "GATE-SCOPE-02",
        humanReason: "Reviewed sponsor letter and scope memo.",
        resolution,
      }),
    ).toBe(
      "ownerRole=sponsor | requirementId=GATE-SCOPE-02 | resolved=Tomas Singh | reason=Reviewed sponsor letter and scope memo.",
    );
  });

  it("builds compact approval view statuses for resolved and unresolved rows", () => {
    expect(
      approvalViewForCriterion({
        event,
        ownerRole: "sponsor",
        criterionState: "pending",
      }),
    ).toMatchObject({
      status: "pending",
      label: "Tomas Singh",
    });
    expect(
      approvalViewForCriterion({
        event,
        ownerRole: "sponsor",
        criterionState: "waived",
      }),
    ).toMatchObject({
      status: "approved",
      label: "Tomas Singh",
    });
    expect(
      approvalViewForCriterion({
        event,
        ownerRole: "legal",
        criterionState: "pending",
      }),
    ).toMatchObject({
      status: "unresolved",
      label: "Approval unresolved",
    });
  });
});
