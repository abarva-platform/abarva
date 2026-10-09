import {
  classifyPhaseBuildSettlement,
  heldArtifactBlocker,
  heldArtifactStatus,
  planPhaseGateSubmitWithoutBuild,
} from "../phase-build-settlement";
import { gateCriteriaForPhase } from "../governance";
import {
  DELIVERABLE_REGISTRY,
  PHASE_CANONICAL_KEYS,
  phaseCanonicalKeysForRoute,
} from "../deliverable-registry";

function gateFlag(key: string): boolean {
  const spec = DELIVERABLE_REGISTRY.find(
    (entry) => entry.deliverableTypeKey === key,
  );
  if (!spec) throw new Error(`no registry spec for ${key}`);
  return spec.gateArtifact;
}

function settled(...keys: string[]) {
  return keys.map((key) => ({
    deliverableTypeKey: key,
    gateArtifact: gateFlag(key),
  }));
}

describe("the scenario this split exists for is live in the real build sets", () => {
  // Written out as literals rather than derived from the registry: an
  // expectation read off the declaration under test cannot see the declaration
  // change. If a phase's working documents are re-declared as gate artifacts,
  // this fails and the split has to be re-justified.
  const WORKING_DOCUMENTS_BY_PHASE: Record<number, string[]> = {
    1: ["discovery_plan"],
    2: ["root_cause_worksheet", "design_workshop_guide"],
    3: ["solution_design", "operating_model_design", "planning_workshop_guide"],
    4: ["financial_model", "mobilization_workshop_guide"],
    5: ["execution_kickoff_guide"],
  };

  it.each([1, 2, 3, 4, 5])(
    "P%s declares at least one document no gate check reads",
    (phase) => {
      const nonGate = PHASE_CANONICAL_KEYS[phase].filter(
        (key) => !gateFlag(key),
      );
      expect(nonGate).toEqual(WORKING_DOCUMENTS_BY_PHASE[phase]);
      expect(nonGate.length).toBeGreaterThan(0);
    },
  );

  it("still declares both P3 documents as gate artifacts on the narrowed technical route", () => {
    const narrowed = phaseCanonicalKeysForRoute(3, {
      route: "technical_product",
    } as Parameters<typeof phaseCanonicalKeysForRoute>[1]);
    expect(narrowed).toEqual([
      "target_state_architecture",
      "requirements_traceability",
    ]);
    expect(narrowed.filter((key) => !gateFlag(key))).toEqual([]);
  });
});

describe("classifyPhaseBuildSettlement", () => {
  it("submits the gate when only a working document failed, and names it", () => {
    // The case seen live: the P4 workshop guide over-ran its length ceiling
    // while every document the P4 gate reads built.
    const result = classifyPhaseBuildSettlement({
      phase: 4,
      succeeded: settled(
        "execution_roadmap",
        "business_case",
        "tower_metrics_plan",
        "readiness_and_change_plan",
      ),
      failed: settled("mobilization_workshop_guide", "financial_model"),
    });
    expect(result.refusal).toBeNull();
    expect(result.failedGateArtifacts).toEqual([]);
    expect(result.failedWorkingDocuments).toEqual([
      "mobilization_workshop_guide",
      "financial_model",
    ]);
    expect(result.workingDocumentCaveat).toContain(
      "mobilization_workshop_guide",
    );
    expect(result.workingDocumentCaveat).toContain("financial_model");
    expect(result.workingDocumentCaveat).toContain("2 working documents");
    expect(result.workingDocumentCaveat).toContain("No P4 gate check reads");
    expect(result.workingDocumentCaveat).toContain("still submitted");
  });

  it("refuses the gate when a document the gate reads failed", () => {
    const result = classifyPhaseBuildSettlement({
      phase: 4,
      succeeded: settled("execution_roadmap"),
      failed: settled("business_case"),
    });
    expect(result.refusal).toContain("business_case");
    expect(result.refusal).toContain("1 gate document");
    expect(result.refusal).toContain("The P4 gate reads this document");
    expect(result.refusal).toContain("re-run Approve & Build");
    expect(result.failedGateArtifacts).toEqual(["business_case"]);
    expect(result.workingDocumentCaveat).toBeNull();
  });

  it("names only the gate documents in the refusal and the working ones in the caveat", () => {
    const result = classifyPhaseBuildSettlement({
      phase: 2,
      succeeded: [],
      failed: settled(
        "discovery_report",
        "root_cause_worksheet",
        "design_workshop_guide",
      ),
    });
    expect(result.refusal).toContain("discovery_report");
    expect(result.refusal).not.toContain("root_cause_worksheet");
    expect(result.refusal).not.toContain("design_workshop_guide");
    expect(result.workingDocumentCaveat).toContain("root_cause_worksheet");
    expect(result.workingDocumentCaveat).toContain("design_workshop_guide");
    expect(result.workingDocumentCaveat).not.toContain("discovery_report");
  });

  it("refuses when nothing at all built, even with no failures recorded", () => {
    const result = classifyPhaseBuildSettlement({
      phase: 5,
      succeeded: [],
      failed: [],
    });
    expect(result.refusal).toBe(
      "No required deliverables completed generation for P5.",
    );
    expect(result.workingDocumentCaveat).toBeNull();
  });

  it("is silent when the whole batch built", () => {
    const result = classifyPhaseBuildSettlement({
      phase: 5,
      succeeded: settled(
        "handoff_package",
        "value_measurement_contract",
        "execution_kickoff_guide",
      ),
      failed: [],
    });
    expect(result.refusal).toBeNull();
    expect(result.workingDocumentCaveat).toBeNull();
    expect(result.failedGateArtifacts).toEqual([]);
    expect(result.failedWorkingDocuments).toEqual([]);
  });

  it("reads the singular and the phase number from the batch, not a fixed string", () => {
    const one = classifyPhaseBuildSettlement({
      phase: 1,
      succeeded: settled("charter"),
      failed: settled("discovery_plan"),
    });
    expect(one.workingDocumentCaveat).toContain("1 working document did not");
    expect(one.workingDocumentCaveat).toContain("No P1 gate check reads it");
    expect(one.workingDocumentCaveat).toContain("this document is missing");

    const two = classifyPhaseBuildSettlement({
      phase: 3,
      succeeded: settled("target_state_architecture"),
      failed: settled("solution_design", "planning_workshop_guide"),
    });
    expect(two.workingDocumentCaveat).toContain("2 working documents did not");
    expect(two.workingDocumentCaveat).toContain("No P3 gate check reads them");
    expect(two.workingDocumentCaveat).toContain("these documents are missing");
  });

  it("refuses on a gate document even when a working document also built", () => {
    const result = classifyPhaseBuildSettlement({
      phase: 3,
      succeeded: settled("solution_design", "planning_workshop_guide"),
      failed: settled("target_state_architecture", "requirements_traceability"),
    });
    expect(result.refusal).toContain("2 gate documents");
    expect(result.refusal).toContain("were held below gate");
    expect(result.refusal).toContain("target_state_architecture");
    expect(result.refusal).toContain("requirements_traceability");
    expect(result.refusal).toContain("The P3 gate reads these documents");
  });
});

// ─── planPhaseGateSubmitWithoutBuild ────────────────────────────────────────
//
// The premise first, then the decision. The control exists because two HARD gate
// checks read a human sign-off that can only be recorded AFTER the phase build
// wrote the document — and the rebuild that used to be the only way to submit
// the gate resets that document to `draft`, clearing the sign-off. If either
// criterion stops being hard, or stops naming a document its phase builds, this
// fails and the control has to be re-justified.

describe("the sign-off criteria this submission exists for", () => {
  const POST_BUILD_SIGN_OFF: Array<{
    fromPhase: number;
    criterion: string;
    deliverableTypeKey: string;
  }> = [
    { fromPhase: 1, criterion: "charter_signed_off", deliverableTypeKey: "charter" },
    {
      fromPhase: 2,
      criterion: "discovery_report_signed_off",
      deliverableTypeKey: "discovery_report",
    },
  ];

  it.each(POST_BUILD_SIGN_OFF)(
    "P$fromPhase holds $criterion as a hard check over a document P$fromPhase builds",
    ({ fromPhase, criterion, deliverableTypeKey }) => {
      const criteria = gateCriteriaForPhase(fromPhase);
      expect(criteria?.find((entry) => entry.key === criterion)).toEqual({
        key: criterion,
        describe: expect.any(String),
        severity: "hard",
      });
      expect(PHASE_CANONICAL_KEYS[fromPhase]).toContain(deliverableTypeKey);
      expect(gateFlag(deliverableTypeKey)).toBe(true);
    },
  );
});

describe("planPhaseGateSubmitWithoutBuild", () => {
  function documents(...keys: string[]) {
    return keys.map((key) => {
      const spec = DELIVERABLE_REGISTRY.find(
        (entry) => entry.deliverableTypeKey === key,
      );
      if (!spec) throw new Error(`no registry spec for ${key}`);
      return {
        deliverableTypeKey: key,
        documentTitle: spec.documentTitle,
        gateArtifact: spec.gateArtifact,
      };
    });
  }

  function builtState(key: string, artifactStatus?: string | null) {
    return {
      deliverableTypeKey: key,
      status: "succeeded",
      ...(artifactStatus === undefined ? {} : { artifactStatus }),
    };
  }

  it("submits P1 without a rebuild once both documents are on the record", () => {
    const plan = planPhaseGateSubmitWithoutBuild({
      phase: 1,
      phaseLabel: "P1 Charter",
      documents: documents("charter", "discovery_plan"),
      states: [builtState("charter"), builtState("discovery_plan")],
      buildInFlight: false,
    });
    expect(plan.submittable).toBe(true);
    if (!plan.submittable) throw new Error("expected a submittable plan");
    expect(plan.settled).toEqual([
      { deliverableTypeKey: "charter", gateArtifact: true },
      { deliverableTypeKey: "discovery_plan", gateArtifact: false },
    ]);
    expect(plan.total).toBe(2);
    expect(plan.actionLabel).toBe("Submit P1 Charter gate approval →");
  });

  it("says in the pre-commit summary that it does not rebuild, and why that matters", () => {
    const plan = planPhaseGateSubmitWithoutBuild({
      phase: 1,
      phaseLabel: "P1 Charter",
      documents: documents("charter", "discovery_plan"),
      states: [builtState("charter"), builtState("discovery_plan")],
      buildInFlight: false,
    });
    if (!plan.submittable) throw new Error("expected a submittable plan");
    expect(plan.summary).toContain("without rebuilding");
    expect(plan.summary).toContain("new unapproved draft");
    expect(plan.summary).toContain("clear the sign-off");
    // It must not claim the gate is granted here — the server decides.
    expect(plan.summary).toContain("The governed gate still decides");
  });

  it("hands classifyPhaseBuildSettlement a set it does not refuse", () => {
    const plan = planPhaseGateSubmitWithoutBuild({
      phase: 2,
      phaseLabel: "P2 Discover & Diagnose",
      documents: documents(
        "discovery_report",
        "root_cause_worksheet",
        "design_workshop_guide",
      ),
      states: [builtState("discovery_report"), builtState("root_cause_worksheet")],
      buildInFlight: false,
    });
    if (!plan.submittable) throw new Error("expected a submittable plan");
    // The unbuilt working document is reported neither as succeeded nor failed:
    // it never entered this batch, so it must not read as a build failure.
    expect(plan.settled.map((entry) => entry.deliverableTypeKey)).toEqual([
      "discovery_report",
      "root_cause_worksheet",
    ]);
    expect(
      classifyPhaseBuildSettlement({
        phase: 2,
        succeeded: plan.settled,
        failed: [],
      }),
    ).toEqual({
      failedGateArtifacts: [],
      failedWorkingDocuments: [],
      refusal: null,
      workingDocumentCaveat: null,
    });
  });

  it("refuses when the document the gate reads is not built, and names it", () => {
    const plan = planPhaseGateSubmitWithoutBuild({
      phase: 1,
      phaseLabel: "P1 Charter",
      documents: documents("charter", "discovery_plan"),
      states: [
        { deliverableTypeKey: "charter", status: "idle" },
        builtState("discovery_plan"),
      ],
      buildInFlight: false,
    });
    expect(plan.submittable).toBe(false);
    if (plan.submittable) throw new Error("expected a refusal");
    expect(plan.reason).toBe("gate_documents_not_built");
    expect(plan.unbuiltGateDocuments).toEqual(["Program Charter"]);
    expect(plan.explanation).toContain("Program Charter");
    expect(plan.explanation).toContain("Run Approve & Build first");
  });

  it.each(["quarantined", "blocked", "superseded", "QUARANTINED"])(
    "refuses a gate document whose stored artifact status is %s",
    (artifactStatus) => {
      const plan = planPhaseGateSubmitWithoutBuild({
        phase: 1,
        phaseLabel: "P1 Charter",
        documents: documents("charter", "discovery_plan"),
        states: [
          builtState("charter", artifactStatus),
          builtState("discovery_plan"),
        ],
        buildInFlight: false,
      });
      expect(plan.submittable).toBe(false);
      if (plan.submittable) throw new Error("expected a refusal");
      expect(plan.unbuiltGateDocuments).toEqual(["Program Charter"]);
    },
  );

  it.each(["approved", "draft", "review_required", "", null])(
    "accepts a gate document whose stored artifact status is %p",
    (artifactStatus) => {
      const plan = planPhaseGateSubmitWithoutBuild({
        phase: 1,
        phaseLabel: "P1 Charter",
        documents: documents("charter"),
        states: [builtState("charter", artifactStatus)],
        buildInFlight: false,
      });
      expect(plan.submittable).toBe(true);
    },
  );

  it("leaves a held working document out of the submitted set without refusing", () => {
    const plan = planPhaseGateSubmitWithoutBuild({
      phase: 1,
      phaseLabel: "P1 Charter",
      documents: documents("charter", "discovery_plan"),
      states: [
        builtState("charter"),
        builtState("discovery_plan", "quarantined"),
      ],
      buildInFlight: false,
    });
    expect(plan.submittable).toBe(true);
    if (!plan.submittable) throw new Error("expected a submittable plan");
    expect(plan.settled).toEqual([
      { deliverableTypeKey: "charter", gateArtifact: true },
    ]);
  });

  it("does not offer a submission while the batch is still building", () => {
    const plan = planPhaseGateSubmitWithoutBuild({
      phase: 1,
      phaseLabel: "P1 Charter",
      documents: documents("charter", "discovery_plan"),
      states: [builtState("charter"), builtState("discovery_plan")],
      buildInFlight: true,
    });
    expect(plan.submittable).toBe(false);
    if (plan.submittable) throw new Error("expected a refusal");
    expect(plan.reason).toBe("build_in_flight");
    expect(plan.unbuiltGateDocuments).toEqual([]);
    expect(plan.explanation).toContain("submitted on its own");
  });

  it("does not offer a submission for a build set no gate check reads", () => {
    const plan = planPhaseGateSubmitWithoutBuild({
      phase: 1,
      phaseLabel: "P1 Charter",
      documents: documents("discovery_plan"),
      states: [builtState("discovery_plan")],
      buildInFlight: false,
    });
    expect(plan.submittable).toBe(false);
    if (plan.submittable) throw new Error("expected a refusal");
    expect(plan.reason).toBe("phase_builds_no_gate_document");
  });

  it("refuses a phase whose documents have no state at all", () => {
    const plan = planPhaseGateSubmitWithoutBuild({
      phase: 2,
      phaseLabel: "P2 Discover & Diagnose",
      documents: documents("discovery_report", "root_cause_worksheet"),
      states: [],
      buildInFlight: false,
    });
    expect(plan.submittable).toBe(false);
    if (plan.submittable) throw new Error("expected a refusal");
    expect(plan.reason).toBe("gate_documents_not_built");
    expect(plan.unbuiltGateDocuments).toEqual(["Discovery & Diagnosis Report"]);
  });
});

// ─── The held-status rule, read in one place ───────────────────────────────
//
// The same stored artifact status is read twice in the phase workspace: by the
// submission plan above, and by the workspace's own per-document status list.
// The second reading seeded a row as built from the artifact's mere existence,
// so a held gate document rendered as "Built" on the same screen where the
// submission had silently withdrawn itself. These cases pin the shared rule.

describe("heldArtifactStatus", () => {
  it.each(["quarantined", "blocked", "superseded"])(
    "reports %s as held",
    (status) => {
      expect(heldArtifactStatus(status)).toBe(status);
    },
  );

  it.each([
    ["QUARANTINED", "quarantined"],
    ["  Superseded  ", "superseded"],
  ])("normalizes %p to %p", (status, normalized) => {
    expect(heldArtifactStatus(status)).toBe(normalized);
  });

  it.each(["approved", "draft", "board_ready", "review_required", "", null, undefined])(
    "reports %p as a usable build",
    (status) => {
      expect(heldArtifactStatus(status)).toBeNull();
    },
  );
});

describe("heldArtifactBlocker", () => {
  it("tells a reader holding a quarantined document what to do about it", () => {
    const sentence = heldArtifactBlocker({
      documentTitle: "Program Charter",
      heldStatus: "quarantined",
    });
    expect(sentence).toContain("Program Charter");
    expect(sentence).toContain("held below its quality bar");
    expect(sentence).toContain("Re-run Approve & Build");
  });

  it("does not call a blocked document a quality hold", () => {
    const sentence = heldArtifactBlocker({
      documentTitle: "Program Charter",
      heldStatus: "blocked",
    });
    expect(sentence).toContain("blocked before it could be published");
    expect(sentence).not.toContain("quality bar");
    expect(sentence).toContain("Re-run Approve & Build");
  });

  it("says a superseded document is not the current version, not that it failed", () => {
    const sentence = heldArtifactBlocker({
      documentTitle: "Discovery Report",
      heldStatus: "superseded",
    });
    expect(sentence).toContain("Discovery Report");
    expect(sentence).toContain("superseded");
    expect(sentence).not.toContain("quality bar");
    expect(sentence).not.toContain("blocked before");
  });

  it("names every held status the submission plan screens on", () => {
    // A status the plan refuses but this says nothing about would leave the
    // status list with a blocked row and no sentence under it.
    for (const status of ["quarantined", "blocked", "superseded"]) {
      const sentence = heldArtifactBlocker({
        documentTitle: "Program Charter",
        heldStatus: status,
      });
      expect(sentence.length).toBeGreaterThan(40);
      expect(sentence).toContain("Program Charter");
    }
  });
});
