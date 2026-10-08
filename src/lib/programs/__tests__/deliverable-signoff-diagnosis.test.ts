import {
  DELIVERABLE_SIGN_OFF_CAUSES,
  deliverableLabel,
  describeDeliverableSignOffFailure,
  type DeliverableSignOffCause,
} from "@/lib/programs/deliverable-signoff-diagnosis";
import { getDeliverableSpec } from "@/lib/programs/deliverable-registry";

/**
 * The six HARD criteria this module serves, with the canonical registry key
 * each gate call site passes. Kept here so a renamed key fails a test rather
 * than silently degrading a sentence to a humanized identifier.
 *
 * `business_case` is the one reached through `meetsApprovalBar` rather than a
 * direct `isSignedOff` call, which is why it was not in the original five.
 */
const GATE_SIGN_OFF_KEYS = [
  "charter",
  "discovery_report",
  "business_case",
  "readiness_and_change_plan",
  "handoff_package",
  "value_measurement_contract",
] as const;

describe("deliverableLabel", () => {
  it.each(GATE_SIGN_OFF_KEYS)(
    "reads %s's name from the registry rather than a local literal",
    (key) => {
      const spec = getDeliverableSpec(key);
      expect(spec).toBeDefined();
      expect(deliverableLabel(key)).toBe(spec!.documentTitle);
    },
  );

  it("humanizes an unregistered key instead of printing a bare identifier", () => {
    expect(getDeliverableSpec("change_management_plan")).toBeUndefined();
    expect(deliverableLabel("change_management_plan")).toBe(
      "Change Management Plan",
    );
  });

  it("falls back to the key itself when there is nothing to humanize", () => {
    expect(deliverableLabel("")).toBe("");
  });
});

describe("describeDeliverableSignOffFailure", () => {
  const failureCauses: DeliverableSignOffCause[] =
    DELIVERABLE_SIGN_OFF_CAUSES.filter((cause) => cause !== "signed_off");

  it("covers every declared cause with a non-empty sentence", () => {
    for (const cause of DELIVERABLE_SIGN_OFF_CAUSES) {
      const sentence = describeDeliverableSignOffFailure({
        cause,
        deliverableTypeKey: "discovery_report",
      });
      expect(sentence.trim().length).toBeGreaterThan(0);
    }
  });

  it("names the document in every cause's sentence", () => {
    for (const cause of DELIVERABLE_SIGN_OFF_CAUSES) {
      expect(
        describeDeliverableSignOffFailure({
          cause,
          deliverableTypeKey: "handoff_package",
        }),
      ).toContain("Mobilization & Tower Handoff Package");
    }
  });

  it("gives each failure cause a distinct sentence", () => {
    const sentences = failureCauses.map((cause) =>
      describeDeliverableSignOffFailure({
        cause,
        deliverableTypeKey: "charter",
        status: "draft",
      }),
    );
    expect(new Set(sentences).size).toBe(failureCauses.length);
  });

  describe("absent", () => {
    it("sends the reader to Approve & Build, because there is nothing to sign", () => {
      const sentence = describeDeliverableSignOffFailure({
        cause: "absent",
        deliverableTypeKey: "discovery_report",
      });
      expect(sentence).toContain("Discovery & Diagnosis Report");
      expect(sentence).toContain("No Discovery & Diagnosis Report exists");
      expect(sentence).toContain("Approve & Build");
    });
  });

  describe("not_signed_off", () => {
    it("states the recorded status so the reader knows what they are looking at", () => {
      const sentence = describeDeliverableSignOffFailure({
        cause: "not_signed_off",
        deliverableTypeKey: "charter",
        status: "in_review",
      });
      expect(sentence).toContain('"in_review"');
      expect(sentence).toContain("not signed off");
    });

    it("tells the reader NOT to rebuild, because a rebuild clears the sign-off", () => {
      // The live surface carries this hazard as a comment: re-running the build
      // replaces the document with a fresh unapproved draft. A sentence that
      // prescribed it would be prescribing the one action that cannot work.
      const sentence = describeDeliverableSignOffFailure({
        cause: "not_signed_off",
        deliverableTypeKey: "charter",
        status: "draft",
      });
      expect(sentence).toContain("Do not re-run Approve & Build");
      expect(sentence).toContain(
        "Record the sign-off on the existing document",
      );
    });

    it("says the status is not recorded rather than printing an empty quote", () => {
      for (const status of [undefined, null, "", "   "]) {
        const sentence = describeDeliverableSignOffFailure({
          cause: "not_signed_off",
          deliverableTypeKey: "charter",
          status,
        });
        expect(sentence).toContain('"not recorded"');
        expect(sentence).not.toContain('""');
      }
    });

    it("trims a padded status", () => {
      expect(
        describeDeliverableSignOffFailure({
          cause: "not_signed_off",
          deliverableTypeKey: "charter",
          status: "  approved  ",
        }),
      ).toContain('"approved"');
    });
  });

  describe("the two states where the signature stands", () => {
    it.each(["linked_artifact_integrity", "evidence_basis_stale"] as const)(
      "%s says the document IS signed off before prescribing a regenerate",
      (cause) => {
        const sentence = describeDeliverableSignOffFailure({
          cause,
          deliverableTypeKey: "value_measurement_contract",
        });
        expect(sentence).toContain("recorded as signed off");
        expect(sentence).toContain("Regenerate");
      },
    );

    it("evidence_basis_stale names the evidence basis, not the signature", () => {
      const sentence = describeDeliverableSignOffFailure({
        cause: "evidence_basis_stale",
        deliverableTypeKey: "discovery_report",
      });
      expect(sentence).toContain("older evidence basis");
      expect(sentence).toContain("current evidence basis");
    });

    it("linked_artifact_integrity names ownership, not currency", () => {
      const sentence = describeDeliverableSignOffFailure({
        cause: "linked_artifact_integrity",
        deliverableTypeKey: "handoff_package",
      });
      expect(sentence).toContain("does not belong to this Move");
      expect(sentence).not.toContain("older evidence basis");
    });
  });

  describe("the defensive final arm", () => {
    it("still states a cause rather than returning nothing", () => {
      // Unreachable from the gate evaluator today: it only asks for a sentence
      // when the verdict failed. The arm exists so a later caller cannot
      // reintroduce a failed HARD criterion with no sentence.
      const sentence = describeDeliverableSignOffFailure({
        cause: "signed_off",
        deliverableTypeKey: "charter",
      });
      expect(sentence).toContain("Program Charter");
      expect(sentence).toContain("no specific cause was recorded");
    });

    it("catches a cause added to the union but not to the ladder", () => {
      const sentence = describeDeliverableSignOffFailure({
        cause: "a_cause_no_arm_handles" as DeliverableSignOffCause,
        deliverableTypeKey: "charter",
      });
      expect(sentence.trim().length).toBeGreaterThan(0);
      expect(sentence).toContain("Program Charter");
    });
  });
});
