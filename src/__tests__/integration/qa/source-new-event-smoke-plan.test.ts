import { SOURCE_STAGE_ORDER } from "@/lib/source/constants";
import {
  buildSourceNewEventSmokePlan,
  type SourceNewEventSmokeWorkspace,
} from "@/lib/qa/source-new-event-smoke-plan";

const EVENT_ID = "apex-retail-ams-outsourcing-2026";

describe("SRC57 Source New Event smoke plan", () => {
  it("covers all 11 canonical New Event stages in order", () => {
    const plan = buildSourceNewEventSmokePlan({ eventId: EVENT_ID });

    expect(plan.planId).toBe("SRC57_SOURCE_NEW_EVENT_11_STAGE_SMOKE");
    expect(plan.totalStages).toBe(11);
    expect(plan.stages.map((stage) => stage.stageKey)).toEqual(
      SOURCE_STAGE_ORDER,
    );
    expect(plan.stages.map((stage) => stage.index)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    ]);
  });

  it("requires every stage proof to check the shared workspaces", () => {
    const plan = buildSourceNewEventSmokePlan({ eventId: EVENT_ID });
    const expectedWorkspaces: SourceNewEventSmokeWorkspace[] = [
      "steps",
      "files",
      "intelligence",
      "guidebook",
      "approvals",
    ];

    for (const stage of plan.stages) {
      expect(stage.route).toBe(
        `/source/events/${EVENT_ID}?stage=${stage.stageKey}`,
      );
      expect(stage.expectedWorkspaces).toEqual(expectedWorkspaces);
      expect(stage.mustVerify).toEqual(
        expect.arrayContaining([
          "main canvas presents one active task area",
          "required evidence is distinguishable from optional evidence",
          "files workspace shows upload/parse/readiness/accepted state",
          "intelligence explains evidence used, missing evidence, caveats, and next action",
          "approval action is disabled until readiness or clearly routes to gap review",
        ]),
      );
    }
  });

  it("binds stage smoke to canonical evidence and artifact contracts", () => {
    const plan = buildSourceNewEventSmokePlan({ eventId: EVENT_ID });
    const byStage = new Map(
      plan.stages.map((stage) => [stage.stageKey, stage]),
    );

    expect(byStage.get("scope")).toMatchObject({
      requiredEvidenceCount: expect.any(Number),
      requiredArtifactCodes: expect.arrayContaining([
        "d04_app_inv",
        "d05_scope_memo",
        "d06_excl_log",
        "d07_ticket_synth",
      ]),
      gateDefiningArtifactCodes: expect.arrayContaining([
        "d04_app_inv",
        "d05_scope_memo",
        "d06_excl_log",
        "d07_ticket_synth",
      ]),
    });
    expect(byStage.get("scope")?.requiredEvidenceCount).toBeGreaterThan(0);
    expect(byStage.get("responses")?.requiredEvidenceLabels).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/supplier/i),
        expect.stringMatching(/pricing/i),
      ]),
    );
    expect(byStage.get("pricing")?.primaryProofQuestion).toMatch(
      /pricing is or is not comparable/i,
    );
  });

  it("defines proof-pack fields and deploy boundaries for incremental execution", () => {
    const plan = buildSourceNewEventSmokePlan({ eventId: EVENT_ID });

    expect(plan.nonMutatingByDefault).toBe(true);
    expect(plan.proofPackFields).toEqual(
      expect.arrayContaining([
        "run_id",
        "commit_sha",
        "deploy_run_id",
        "screenshot_ref",
        "evidence_state",
        "approval_state",
      ]),
    );
    expect(plan.deployRule).toMatch(/ACA deploy proof is required only/i);
  });
});
