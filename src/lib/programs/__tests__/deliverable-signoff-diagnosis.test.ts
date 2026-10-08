import {
  DELIVERABLE_PRODUCERS,
  DELIVERABLE_SIGN_OFF_CAUSES,
  deliverableLabel,
  describeDeliverableSignOffFailure,
  resolveDeliverableProducer,
  type DeliverableSignOffCause,
} from "@/lib/programs/deliverable-signoff-diagnosis";
import {
  PHASE_CANONICAL_KEYS,
  getDeliverableSpec,
} from "@/lib/programs/deliverable-registry";

/**
 * Every key the three SOFT sign-off criteria accept. None is in any phase build
 * set, and none is in `DELIVERABLE_REGISTRY` at all — asserted below rather than
 * asserted once in prose, because the whole producer-aware branch rests on it.
 */
const AUTHORSHIP_ONLY_SIGN_OFF_KEYS = [
  // funding_approval_recorded
  "funding_approval",
  "capacity_approval",
  "approval_memo",
  // sponsor_alignment_confirmed
  "stakeholder_alignment",
  "sponsor_alignment",
  // tower_handoff_plan_accepted
  "tower_handoff_plan",
  "execution_monitoring_plan",
  "control_tower_handoff",
] as const;

/**
 * The five HARD criteria this module serves, with the canonical registry key
 * each gate call site passes. Kept here so a renamed key fails a test rather
 * than silently degrading a sentence to a humanized identifier.
 */
const GATE_SIGN_OFF_KEYS = [
  "charter",
  "discovery_report",
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

describe("resolveDeliverableProducer", () => {
  it.each(AUTHORSHIP_ONLY_SIGN_OFF_KEYS)(
    "answers authorship_only for %s, which no phase build set produces",
    (key) => {
      expect(resolveDeliverableProducer({ deliverableTypeKey: key })).toBe(
        "authorship_only",
      );
    },
  );

  it.each(AUTHORSHIP_ONLY_SIGN_OFF_KEYS)(
    "%s is absent from the deliverable registry too, so its other two causes cannot fire",
    (key) => {
      // Not decoration. `signOffVerdict` resolves the approval-currency scope
      // before the `linked_artifact_integrity` and `evidence_basis_stale`
      // vetoes, and an unregistered key resolves to no phase, so the verdict
      // returns a PASS before reaching either. That is why only `absent` and
      // `not_signed_off` have a producer-aware form: if one of these keys were
      // registered, a third and fourth arm would start needing one.
      expect(getDeliverableSpec(key)).toBeUndefined();
    },
  );

  it.each(GATE_SIGN_OFF_KEYS)(
    "answers phase_build for %s, so the five HARD sentences are unchanged",
    (key) => {
      expect(resolveDeliverableProducer({ deliverableTypeKey: key })).toBe(
        "phase_build",
      );
    },
  );

  it("derives from the build sets rather than declaring, so a document that moves into one flips", () => {
    expect(
      resolveDeliverableProducer({
        deliverableTypeKey: "funding_approval",
        phaseBuildSets: { 4: ["business_case", "funding_approval"] },
      }),
    ).toBe("phase_build");
  });

  it("matches a build set exactly, so an alias no set carries is authorship_only", () => {
    // `tower_metrics_plan` IS in phase 4's set; the `tower_metric_plan`
    // spelling is not. Approve & Build builds the keys in the set, so the
    // singular spelling gets the honest answer for the action prescribed.
    expect(PHASE_CANONICAL_KEYS[4]).toContain("tower_metrics_plan");
    expect(
      resolveDeliverableProducer({ deliverableTypeKey: "tower_metric_plan" }),
    ).toBe("authorship_only");
  });

  it("has an arm for every declared producer", () => {
    expect([...DELIVERABLE_PRODUCERS].sort()).toEqual([
      "authorship_only",
      "phase_build",
    ]);
  });
});

describe("a sign-off failure on a document no build produces", () => {
  it("absent asks for authorship instead of prescribing Approve & Build", () => {
    const sentence = describeDeliverableSignOffFailure({
      cause: "absent",
      deliverableTypeKey: "funding_approval",
    });
    expect(sentence).toContain("Funding Approval");
    expect(sentence).toContain("Approve & Build does not produce one");
    expect(sentence).toContain("Ask aVa to save");
    // The defect being fixed: the build-shaped prescription must be GONE, not
    // merely softened alongside the new one.
    expect(sentence).not.toContain(
      "Run Approve & Build for this phase to generate it",
    );
  });

  it("not_signed_off drops a rebuild warning about a build that cannot touch it", () => {
    const sentence = describeDeliverableSignOffFailure({
      cause: "not_signed_off",
      deliverableTypeKey: "tower_handoff_plan",
      status: "draft",
    });
    expect(sentence).toContain("Tower Handoff Plan");
    expect(sentence).toContain('its status is "draft", not signed off');
    expect(sentence).toContain("Record the sign-off on the existing document");
    expect(sentence).not.toContain("Do not re-run Approve & Build");
    expect(sentence).not.toContain("fresh unapproved draft");
  });

  it.each(AUTHORSHIP_ONLY_SIGN_OFF_KEYS)(
    "never names a build for %s under either reachable cause",
    (key) => {
      for (const cause of ["absent", "not_signed_off"] as const) {
        const sentence = describeDeliverableSignOffFailure({
          cause,
          deliverableTypeKey: key,
          status: "draft",
        });
        expect(sentence).not.toContain("Run Approve & Build");
        expect(sentence).not.toContain("Regenerate");
        expect(sentence).not.toContain("Do not re-run");
      }
    },
  );

  it("keeps prescribing the build once the document joins a build set", () => {
    // The guard against the new branch becoming a permanent exemption: the
    // producer is derived, so the same key gets the build sentence back.
    const sentence = describeDeliverableSignOffFailure({
      cause: "absent",
      deliverableTypeKey: "funding_approval",
      phaseBuildSets: { 4: ["funding_approval"] },
    });
    expect(sentence).toContain(
      "Run Approve & Build for this phase to generate it",
    );
    expect(sentence).not.toContain("Ask aVa to save");
  });

  it.each(GATE_SIGN_OFF_KEYS)(
    "leaves %s's absent sentence prescribing the build",
    (key) => {
      const sentence = describeDeliverableSignOffFailure({
        cause: "absent",
        deliverableTypeKey: key,
      });
      expect(sentence).toContain(
        "Run Approve & Build for this phase to generate it",
      );
      expect(sentence).not.toContain("Ask aVa to save");
    },
  );

  it.each(GATE_SIGN_OFF_KEYS)(
    "leaves %s's not_signed_off rebuild warning in place",
    (key) => {
      const sentence = describeDeliverableSignOffFailure({
        cause: "not_signed_off",
        deliverableTypeKey: key,
        status: "draft",
      });
      expect(sentence).toContain("Do not re-run Approve & Build");
    },
  );

  it.each(["linked_artifact_integrity", "evidence_basis_stale"] as const)(
    "%s keeps its single build-shaped form, because it is unreachable here",
    (cause) => {
      const sentence = describeDeliverableSignOffFailure({
        cause,
        deliverableTypeKey: "funding_approval",
      });
      expect(sentence).toContain("Regenerate");
    },
  );
});

describe("the causes and the producers stay in step", () => {
  it("every cause still yields a non-empty sentence for an authorship-only key", () => {
    for (const cause of DELIVERABLE_SIGN_OFF_CAUSES) {
      const sentence = describeDeliverableSignOffFailure({
        cause,
        deliverableTypeKey: "sponsor_alignment",
      });
      expect(sentence.trim().length).toBeGreaterThan(0);
      expect(sentence).toContain("Sponsor Alignment");
    }
  });
});
