import {
  createFileSourceOperationalProvider,
  readOperationalReleasePackage,
} from "@/lib/source/operational/source-operational-provider";
import { buildSourceOperationalDemoViewModel } from "@/lib/source/operational/source-view-model-assembler";
import {
  AIRLINE_SOURCE_OPERATIONAL_EVENT_ID,
  AIRLINE_SOURCE_OPERATIONAL_RELEASE_HASH_SHA256,
  AIRLINE_SOURCE_OPERATIONAL_RELEASE_ID,
} from "@/lib/source/operational/types";

describe("Source operational demo view-model assembler", () => {
  it("reads the approved package and preserves release identity", async () => {
    const sourcePackage = await readOperationalReleasePackage();

    expect(sourcePackage.manifest.releaseId).toBe(
      AIRLINE_SOURCE_OPERATIONAL_RELEASE_ID,
    );
    expect(sourcePackage.manifest.releaseHashSha256).toBe(
      AIRLINE_SOURCE_OPERATIONAL_RELEASE_HASH_SHA256,
    );
    expect(sourcePackage.release.event.eventId).toBe(
      AIRLINE_SOURCE_OPERATIONAL_EVENT_ID,
    );
    expect(sourcePackage.validation.ok).toBe(true);
  });

  it("assembles the complete Source workflow without promoting Knowledge", async () => {
    const provider = createFileSourceOperationalProvider();
    const viewModel = await buildSourceOperationalDemoViewModel(provider);

    expect(viewModel.releaseId).toBe(AIRLINE_SOURCE_OPERATIONAL_RELEASE_ID);
    expect(viewModel.releaseHashSha256).toBe(
      AIRLINE_SOURCE_OPERATIONAL_RELEASE_HASH_SHA256,
    );
    expect(viewModel.tenantKey).toBe("airline-demo-new");
    expect(viewModel.providerIdentity).toMatchObject({
      provider: "SourceOperationalProvider",
      mode: "file_release_package",
      eventId: AIRLINE_SOURCE_OPERATIONAL_EVENT_ID,
    });

    expect(viewModel.objectCounts).toMatchObject({
      event: 1,
      requirements: 24,
      vendors: 4,
      proposals: 4,
      proposalResponses: 96,
      criteria: 5,
      evaluations: 4,
      pricing: 4,
      bafo: 4,
      transitionCommitments: 4,
      decisionBrief: 1,
    });

    expect(Object.values(viewModel.validationChecks).every(Boolean)).toBe(true);
    expect(viewModel.workflow.map((step) => step.key)).toEqual([
      "event",
      "requirements",
      "vendor_participation",
      "proposals",
      "evaluation",
      "pricing",
      "bafo",
      "recommendation",
      "decision_brief",
      "transition",
      "evidence",
    ]);
    expect(viewModel.workflow.every((step) => step.status === "ready")).toBe(
      true,
    );
    expect(viewModel.knowledgeContext.provider).toBe(
      "KnowledgeConsumptionProvider",
    );
    expect(viewModel.limitations).toContain(
      "Synthetic Source operational records are lab-demo workflow state and are not canonical Knowledge.",
    );
  });

  it("produces a shell-compatible executive decision view", async () => {
    const viewModel = await buildSourceOperationalDemoViewModel(
      createFileSourceOperationalProvider(),
    );

    expect(viewModel.shellView.event.id).toBe(
      AIRLINE_SOURCE_OPERATIONAL_EVENT_ID,
    );
    expect(viewModel.shellView.stage.key).toBe("executive_decision");
    expect(viewModel.shellView.stage.ready).toBe(
      viewModel.shellView.stage.total,
    );
    expect(viewModel.shellView.stage.groups.length).toBeGreaterThan(0);
    expect(
      viewModel.shellView.files.items.map((item) => item.artifactCode),
    ).toEqual(["d24", "d33"]);
    expect(viewModel.shellView.intelligence.provenance).toBe("sample");
  });
});
