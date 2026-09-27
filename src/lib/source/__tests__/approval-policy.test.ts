import { criterionForSourceApprovalPolicy, resolveSourceApprovalPolicy } from "../approval-policy";
import { criterionById } from "../canonical-specs";

describe("Source event approval policy", () => {
  it("resolves an explicitly opted-in V1 event to self authority", () => {
    expect(resolveSourceApprovalPolicy("self_v1")).toEqual({
      code: "self_v1",
      selfApprovalAllowed: true,
      requiresExternalSigners: false,
    });
  });

  it("keeps historical and missing policies on signed-scope authority", () => {
    for (const code of [undefined, null, "legacy_signed_scope_v1"]) {
      expect(resolveSourceApprovalPolicy(code)).toEqual({
        code: "legacy_signed_scope_v1",
        selfApprovalAllowed: false,
        requiresExternalSigners: true,
      });
    }
  });

  it("fails closed on unknown policy values", () => {
    expect(() => resolveSourceApprovalPolicy("self_v2")).toThrow(
      "Unknown Source approval policy",
    );
  });

  it("attributes SELF Scope decisions to the Event Owner without changing legacy definitions", () => {
    const legacy = criterionById("GATE-SCOPE-04")!;
    const self = criterionForSourceApprovalPolicy(legacy, "self_v1");
    expect(self).toMatchObject({
      criterionId: "GATE-SCOPE-04",
      title: "Scope memo approved by Event Owner",
      ownerRole: "event-owner",
      linkedArtifactCodes: legacy.linkedArtifactCodes,
      severity: "hard",
    });
    expect(criterionForSourceApprovalPolicy(legacy, null)).toBe(legacy);
    expect(legacy.title).toBe("Scope memo signed by sponsor + EA");
  });

  it.each([
    ["GATE-STRATEGY-01", "Sourcing strategy memo approved by Event Owner"],
    ["GATE-RFP-04", "RFP terms reviewed by Event Owner"],
    ["GATE-EVAL-04", "Scorecard weight set approved by Event Owner"],
    ["GATE-DEC-04", "Award commitment recorded by Event Owner"],
    ["GATE-SEL-01", "Selection memo approved by Event Owner"],
  ])("avoids unsupported external sign-off wording for %s under SELF", (id, title) => {
    const definition = criterionById(id)!;
    expect(criterionForSourceApprovalPolicy(definition, "self_v1")).toMatchObject({
      title,
      ownerRole: "event-owner",
      linkedArtifactCodes: definition.linkedArtifactCodes,
      required: definition.required,
    });
    expect(criterionForSourceApprovalPolicy(definition, null)).toBe(definition);
  });
});
