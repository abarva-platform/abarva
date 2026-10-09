// Audit · does every capture question a phase declares reach a step of the
// capture flow the user is given?
//
// The invariants and the sweep live in
// `src/lib/programs/capture-step-plan-integrity.ts`; this is the operator
// entry point and the CI gate over them. It prints what it audited before what
// it found, so a run that swept nothing cannot be read as a clean run.
//
// Exits 1 on any defect. A defect here means the capture contract and the
// step-group declarations have drifted: a question no step holds is a question
// nobody is asked, while the capture evaluator reads the same contract and goes
// on requiring its answer — which is how a phase stops being completable.
//
// Run: npx tsx src/scripts/audit/audit-capture-step-plan.ts

import {
  MOVES_CAPTURE_STEP_BAR_STEPS,
  auditEveryCaptureStepPlan,
  auditedCapturePhases,
  captureRouteConfigurations,
  describeCaptureStepPlanDefects,
} from "../../lib/programs/capture-step-plan-integrity";

function main(): void {
  const phases = auditedCapturePhases();
  const configurations = captureRouteConfigurations();
  console.log(
    `capture step-plan audit: ${phases.length} phase(s) [${phases.join(", ")}] x ` +
      `${configurations.length} route configuration(s), against a ${MOVES_CAPTURE_STEP_BAR_STEPS}-step flow.`,
  );

  if (phases.length === 0 || configurations.length === 0) {
    console.error(
      "capture step-plan audit: nothing to audit — the phase range or the route " +
        "constants resolved empty, so a clean result would mean nothing.",
    );
    process.exit(1);
  }

  const defects = auditEveryCaptureStepPlan();
  if (defects.length === 0) {
    console.log("capture step-plan audit: PASS — No capture step-plan defects.");
    return;
  }

  console.error(
    `capture step-plan audit: FAIL — ${defects.length} defect(s).\n` +
      describeCaptureStepPlanDefects(defects) +
      "\n\nThe capture contract (src/lib/programs/phase-capture-contract.ts) and the step " +
      "groups (src/lib/programs/moves-phase-step-groups.ts) have drifted. Regroup the " +
      "declared keys, or add the step the new question belongs on — do not leave a declared " +
      "question for the repair pass to place.",
  );
  process.exit(1);
}

main();
