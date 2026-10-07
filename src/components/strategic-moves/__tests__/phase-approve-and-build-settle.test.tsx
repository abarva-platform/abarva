/**
 * @jest-environment jsdom
 */

// Regression coverage for the decoupling fix: PhaseApproveAndBuild used to
// call its "gate approval" callback (formerly onBuildQueued) the instant
// generation jobs were QUEUED, before any of them had actually finished —
// so the parent (MovesPhaseStandaloneClient) would submit phase-gate
// approval while real generation was still in flight or had already failed.
// onBuildSettled must fire exactly once, only after every queued run in the
// batch reaches a terminal status, and must report failed/blocked keys
// separately from succeeded ones so the parent can refuse to approve when
// anything failed.

import "@testing-library/jest-dom";
import {
  render,
  screen,
  act,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import {
  PhaseApproveAndBuild,
  type BuildSettledResult,
} from "../PhaseApproveAndBuild";
import type { MoveEvidenceNeedPacket } from "@/lib/programs/evidence-readiness/move-evidence-need-packet";
import { classifyPhaseBuildSettlement } from "@/lib/programs/phase-build-settlement";
import {
  describeDeliverableRunHandOff,
  planDeliverableRunPoll,
} from "@/lib/programs/deliverable-run-poll-plan";

// Spy on the poll plan while keeping its real behaviour as the default, so the
// cases above (which rely on the real 4s interval) are untouched.
jest.mock("@/lib/programs/deliverable-run-poll-plan", () => {
  const actual = jest.requireActual<
    typeof import("@/lib/programs/deliverable-run-poll-plan")
  >("@/lib/programs/deliverable-run-poll-plan");
  return {
    ...actual,
    planDeliverableRunPoll: jest.fn(actual.planDeliverableRunPoll),
  };
});

async function clickApproveAndBuild(name: RegExp) {
  await act(async () => {
    screen.getByRole("button", { name }).click();
  });
  await act(async () => {
    within(screen.getByRole("dialog"))
      .getByRole("button", { name: /^Approve & Build$/i })
      .click();
  });
}

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});

function fakeResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function mockFetchSequence(opts: {
  runId: string;
  intermediateStatus: "queued" | "running";
  finalStatus: "succeeded" | "failed" | "blocked";
  blockers?: string[];
  packageReadiness?: {
    label: string;
    headline: string;
    evidenceCoveragePct: number;
    executiveReadinessPct: number;
    minimumEvidenceItems: number;
    retrievedEvidence: number;
    confidenceTier: "bronze" | "silver" | "gold" | "board";
    confidenceLabel: string;
    canShareExternally: boolean;
    missing: string[];
    recommendedNextStep: string;
  };
}) {
  let runCallCount = 0;
  global.fetch = (async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url === "/api/v1/deliverables/generate-phase") {
      return fakeResponse(
        {
          phase: 1,
          phaseLabel: "P1 Charter",
          queued: 1,
          total: 1,
          deliverables: [
            {
              deliverableTypeKey: "charter",
              documentTitle: "Program Charter",
              gateArtifact: true,
              runId: opts.runId,
              status: "queued",
            },
          ],
        },
        202,
      );
    }
    if (url === `/api/v1/deliverables/runs/${opts.runId}`) {
      runCallCount += 1;
      // First poll: still in flight. Second poll onward: terminal.
      const status =
        runCallCount === 1 ? opts.intermediateStatus : opts.finalStatus;
      return fakeResponse({
        status,
        artifactId: status === "succeeded" ? "art_1" : null,
        blobUrl: status === "succeeded" ? "/api/v1/artifacts/art_1" : null,
        progressPct: status === "succeeded" ? 100 : 40,
        progressLabel: null,
        blockers:
          status === "blocked"
            ? (opts.blockers ?? ["evidence_below_gate"])
            : [],
        packageReadiness:
          status === "blocked" ? (opts.packageReadiness ?? null) : null,
      });
    }
    throw new Error(`Unexpected fetch: ${url}`);
  }) as typeof fetch;
}

describe("PhaseApproveAndBuild onBuildSettled sequencing", () => {
  it("keeps the header progression action hidden while current-phase required evidence is open", async () => {
    render(
      <>
        <div id="phase-progress-test-action" />
        <PhaseApproveAndBuild
          moveId="move-1"
          phaseNum={1}
          phaseLabel="P1 Charter"
          archetype="ai_enabled_sdlc"
          moveName="Example Move"
          clientDisplayName="Client"
          blockOnEvidenceGaps
          actionPortalTargetId="phase-progress-test-action"
          evidenceNeedPackets={[
            {
              moveId: "move-1",
              phase: 1,
              artifactType: "charter",
              evidenceSlot: "Charter success measures",
              familyId: "charter_success_metrics",
              priority: "required",
              ownerSource: "Finance / FP&A",
              acceptedFormats: ["XLSX", "CSV"],
              exampleTemplate: "Baseline and value measurement worksheet",
              exampleContent: ["Current baseline with period and owner"],
              whyItMatters: "Funding-grade claims need a traceable baseline.",
              guidanceBasis: "generic",
              blockedArtifacts: [],
              canDraftBoundary: {
                canDraft: false,
                canDraftLabel: "",
                cannotDraftLabel: "",
              },
              preliminaryGenerationCaveat: null,
              waiverOption: null,
              nextAction:
                "Upload a finance-validated baseline or label the target as an assumption.",
              status: "missing",
              evidenceTitles: [],
            } as MoveEvidenceNeedPacket,
          ]}
        />
      </>,
    );

    const evidenceSummary = await screen.findByText(
      "1 required evidence item open",
    );
    await act(async () => {
      evidenceSummary.click();
    });
    expect(screen.getByText("Charter success measures")).toBeInTheDocument();
    expect(
      screen.getByText(/Upload a finance-validated baseline/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Likely source owner: Finance \/ FP&A/),
    ).toBeInTheDocument();
    expect(screen.getByText("Accepted formats: XLSX, CSV")).toBeInTheDocument();
    const examplesSummary = screen.getByText("Why this matters and examples");
    await act(async () => {
      examplesSummary.click();
    });
    expect(
      screen.getByText("Funding-grade claims need a traceable baseline."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Examples are guidance, not client evidence."),
    ).toBeInTheDocument();
    expect(
      within(
        document.getElementById("phase-progress-test-action")!,
      ).queryByRole("button", { name: /Approve & Build/i }),
    ).not.toBeInTheDocument();
  });

  it("puts a green progression action in the header when current-phase evidence is covered", async () => {
    render(
      <>
        <div id="phase-progress-test-action" />
        <PhaseApproveAndBuild
          moveId="move-1"
          phaseNum={1}
          phaseLabel="P1 Charter"
          archetype="ai_enabled_sdlc"
          moveName="Example Move"
          clientDisplayName="Client"
          blockOnEvidenceGaps
          actionPortalTargetId="phase-progress-test-action"
          evidenceNeedPackets={[
            {
              phase: 1,
              priority: "required",
              status: "covered",
            } as MoveEvidenceNeedPacket,
          ]}
        />
      </>,
    );

    const header = document.getElementById("phase-progress-test-action")!;
    const button = await within(header).findByRole("button", {
      name: /Approve & Build P1 Charter/i,
    });
    expect(button).toHaveStyle({ background: "rgb(20, 124, 91)" });
    expect(button).not.toBeDisabled();
  });

  it("labels non-blocking evidence gaps as preparation, not blockers", () => {
    render(
      <PhaseApproveAndBuild
        moveId="move-1"
        phaseNum={1}
        phaseLabel="P1 Charter"
        archetype="ai_enabled_sdlc"
        moveName="Example Move"
        clientDisplayName="Client"
        evidenceNeedPackets={[
          {
            phase: 1,
            artifactType: "charter",
            evidenceSlot: "Success measures",
            familyId: "success_measures",
            priority: "required",
            status: "missing",
            nextAction: "Upload a baseline source.",
          } as MoveEvidenceNeedPacket,
        ]}
      />,
    );

    fireEvent.click(screen.getByText("1 prep item carrying forward"));

    expect(
      screen.getByText(
        "These items inform the next phase and do not block this phase build.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Preparation · Not yet covered"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Required · Not yet covered"),
    ).not.toBeInTheDocument();
  });

  it("seeds built rows from persisted Move artifacts on a fresh page load", () => {
    global.fetch = jest.fn() as unknown as typeof fetch;

    render(
      <PhaseApproveAndBuild
        moveId="move-1"
        phaseNum={1}
        phaseLabel="P1 Charter"
        archetype="ai_enabled_sdlc"
        moveName="Contact Center AI"
        clientDisplayName="Client"
        initialArtifacts={[
          {
            artifactId: "artifact-charter-current",
            deliverableTypeKey: "charter",
            documentTitle: "Program Charter",
            phase: 1,
            status: "draft",
            version: 3,
            downloadUrl:
              "/api/v1/programs/move-1/artifacts/artifact-charter-current/download",
          },
          {
            artifactId: "artifact-discovery-guide-current",
            deliverableTypeKey: "discovery_plan",
            documentTitle: "Discovery Workshop Guide",
            phase: 1,
            status: "draft",
            version: 1,
            downloadUrl:
              "/api/v1/programs/move-1/artifacts/artifact-discovery-guide-current/download",
          },
        ]}
      />,
    );

    expect(
      screen.getByText(
        "P1 Charter documents are built. Review them before relying on them.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("2/2 built")).toBeInTheDocument();
    expect(screen.getAllByText("Built")).toHaveLength(2);
    const downloadLinks = screen.getAllByRole("link", {
      name: "Download final \u2192",
    });
    expect(downloadLinks[0]).toHaveAttribute(
      "href",
      "/api/v1/programs/move-1/artifacts/artifact-charter-current/download",
    );
    expect(downloadLinks[1]).toHaveAttribute(
      "href",
      "/api/v1/programs/move-1/artifacts/artifact-discovery-guide-current/download",
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("does not call onBuildSettled while the run is still queued/running", async () => {
    mockFetchSequence({
      runId: "run_pending",
      intermediateStatus: "running",
      finalStatus: "succeeded",
    });
    const onBuildSettled = jest.fn<Promise<void>, [BuildSettledResult]>(
      async () => {},
    );

    render(
      <PhaseApproveAndBuild
        moveId="move-1"
        phaseNum={1}
        phaseLabel="P1 Charter"
        archetype="ai_enabled_sdlc"
        moveName="Contact Center AI"
        clientDisplayName="Apex Retail"
        onBuildSettled={onBuildSettled}
      />,
    );

    await clickApproveAndBuild(/Approve & Build P1 Charter/i);

    // Immediately after queueing (before the first poll resolves as terminal),
    // onBuildSettled must NOT have fired — this is the exact bug: the old
    // onBuildQueued fired here, submitting gate approval before generation
    // had actually completed.
    expect(onBuildSettled).not.toHaveBeenCalled();

    await waitFor(() => expect(onBuildSettled).toHaveBeenCalledTimes(1), {
      timeout: 8000,
    });
    const result = onBuildSettled.mock.calls[0][0];
    expect(result.succeededKeys).toEqual(["charter"]);
    expect(result.failedKeys).toEqual([]);
    expect(screen.getByText("Download final \u2192")).toBeInTheDocument();
    expect(screen.queryByText("Open document \u2192")).not.toBeInTheDocument();
  });

  it("reports a failed deliverable in failedKeys instead of silently succeeding", async () => {
    mockFetchSequence({
      runId: "run_fails",
      intermediateStatus: "running",
      finalStatus: "failed",
    });
    const onBuildSettled = jest.fn<Promise<void>, [BuildSettledResult]>(
      async () => {},
    );

    render(
      <PhaseApproveAndBuild
        moveId="move-1"
        phaseNum={1}
        phaseLabel="P1 Charter"
        archetype="ai_enabled_sdlc"
        moveName="Contact Center AI"
        clientDisplayName="Apex Retail"
        onBuildSettled={onBuildSettled}
      />,
    );

    await clickApproveAndBuild(/Approve & Build P1 Charter/i);

    await waitFor(() => expect(onBuildSettled).toHaveBeenCalledTimes(1), {
      timeout: 8000,
    });
    const result = onBuildSettled.mock.calls[0][0];
    expect(result.succeededKeys).toEqual([]);
    expect(result.failedKeys).toEqual(["charter"]);
  });

  it("labels a blocked deliverable and surfaces its raw blocker without a readiness summary", async () => {
    mockFetchSequence({
      runId: "run_blocked",
      intermediateStatus: "running",
      finalStatus: "blocked",
    });
    const onBuildSettled = jest.fn<Promise<void>, [BuildSettledResult]>(
      async () => {},
    );

    render(
      <PhaseApproveAndBuild
        moveId="move-1"
        phaseNum={1}
        phaseLabel="P1 Charter"
        archetype="ai_enabled_sdlc"
        moveName="Contact Center AI"
        clientDisplayName="Client"
        onBuildSettled={onBuildSettled}
      />,
    );

    await clickApproveAndBuild(/Approve & Build P1 Charter/i);

    await waitFor(
      () => expect(screen.getByText("Build blocked")).toBeInTheDocument(),
      {
        timeout: 8000,
      },
    );
    expect(screen.getByText("evidence_below_gate")).toBeInTheDocument();
    expect(screen.queryByText("Not gate-ready")).not.toBeInTheDocument();
    expect(onBuildSettled).toHaveBeenCalledTimes(1);
    expect(onBuildSettled.mock.calls[0][0].failedKeys).toEqual(["charter"]);
  });

  it("does not describe an overlong draft with full evidence retrieval as an evidence gap", async () => {
    const blocker =
      "document too long for this artifact: 7595 words; target ceiling 3000 (advisory band up to 3600) - sections drifted off the decision this artifact exists to support";
    mockFetchSequence({
      runId: "run_overlong",
      intermediateStatus: "running",
      finalStatus: "blocked",
      blockers: [blocker],
      packageReadiness: {
        label: "Build blocked",
        headline:
          "The run is blocked. Evidence coverage and build-quality blockers are shown separately.",
        evidenceCoveragePct: 100,
        executiveReadinessPct: 75,
        minimumEvidenceItems: 5,
        retrievedEvidence: 18,
        confidenceTier: "gold",
        confidenceLabel: "Executive ready",
        canShareExternally: false,
        missing: [],
        recommendedNextStep:
          "Shorten the draft to the artifact's target word ceiling, then rebuild. This length blocker does not indicate that more evidence is needed.",
      },
    });

    render(
      <PhaseApproveAndBuild
        moveId="move-1"
        phaseNum={1}
        phaseLabel="P1 Charter"
        archetype="ai_enabled_sdlc"
        moveName="Contact Center AI"
        clientDisplayName="Client"
      />,
    );

    await clickApproveAndBuild(/Approve & Build P1 Charter/i);

    await waitFor(
      () => expect(screen.getByText("Build blocked")).toBeInTheDocument(),
      { timeout: 8000 },
    );
    await act(async () => {
      screen.getByText("Why this output is blocked").click();
    });
    expect(screen.getByText(blocker)).toBeInTheDocument();
    expect(screen.getByText(/Evidence retrieved: 18\/5/)).toBeInTheDocument();
    expect(screen.getByText(/Shorten the draft/)).toBeInTheDocument();
    expect(screen.queryByText(/Evidence gaps:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Upload and approve/)).not.toBeInTheDocument();
  });

  it("reports an enqueue-time error deliverable in failedKeys with no runId and no poll", async () => {
    global.fetch = (async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url === "/api/v1/deliverables/generate-phase") {
        return fakeResponse(
          {
            phase: 1,
            phaseLabel: "P1 Charter",
            queued: 0,
            total: 1,
            deliverables: [
              {
                deliverableTypeKey: "charter",
                documentTitle: "Program Charter",
                gateArtifact: true,
                runId: null,
                status: "error",
                error: "quality gate rejected input",
              },
            ],
          },
          202,
        );
      }
      throw new Error(`Unexpected fetch: ${url}`);
    }) as typeof fetch;
    const onBuildSettled = jest.fn<Promise<void>, [BuildSettledResult]>(
      async () => {},
    );

    render(
      <PhaseApproveAndBuild
        moveId="move-1"
        phaseNum={1}
        phaseLabel="P1 Charter"
        archetype="ai_enabled_sdlc"
        moveName="Contact Center AI"
        clientDisplayName="Apex Retail"
        onBuildSettled={onBuildSettled}
      />,
    );

    await clickApproveAndBuild(/Approve & Build P1 Charter/i);

    await waitFor(() => expect(onBuildSettled).toHaveBeenCalledTimes(1), {
      timeout: 8000,
    });
    const result = onBuildSettled.mock.calls[0][0];
    expect(result.succeededKeys).toEqual([]);
    expect(result.failedKeys).toEqual(["charter"]);
  });

  it("shows adaptive-depth omissions as package adjustments, not fake queued rows", async () => {
    global.fetch = (async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url === "/api/v1/deliverables/generate-phase") {
        return fakeResponse(
          {
            phase: 3,
            phaseLabel: "P3 Design Future State",
            queued: 3,
            total: 3,
            adaptiveDepth: {
              complexityTier: "straightforward",
              signalBasis: "prose_inferred",
              resolutionConfidence: "medium",
            },
            omittedDeliverables: [
              {
                deliverableTypeKey: "operating_model_design",
                documentTitle: "Operating Model Design",
                applicability: "merge_into_parent",
                mergeInto: "solution_design",
                reason:
                  "Operating responsibilities do not materially change; include a compact operating note in Solution Design.",
              },
              {
                deliverableTypeKey: "sourcing_strategy",
                documentTitle: "Sourcing Strategy Brief",
                applicability: "not_applicable",
                reason: "No deterministic vendor decision is present.",
              },
            ],
            deliverables: [
              {
                deliverableTypeKey: "target_state_architecture",
                documentTitle: "Target State Reference Architecture",
                gateArtifact: true,
                runId: "run-arch",
                status: "queued",
              },
              {
                deliverableTypeKey: "solution_design",
                documentTitle: "Solution Design Specification",
                gateArtifact: false,
                runId: "run-design",
                status: "queued",
              },
              {
                deliverableTypeKey: "requirements_traceability",
                documentTitle: "Requirements Traceability Matrix",
                gateArtifact: true,
                runId: "run-rtm",
                status: "queued",
              },
            ],
          },
          202,
        );
      }
      if (url.startsWith("/api/v1/deliverables/runs/")) {
        return fakeResponse({
          status: "succeeded",
          artifactId: "artifact-1",
          blobUrl: "/api/v1/artifacts/artifact-1",
          progressPct: 100,
          progressLabel: null,
          blockers: [],
        });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    }) as typeof fetch;

    render(
      <PhaseApproveAndBuild
        moveId="move-1"
        phaseNum={3}
        phaseLabel="P3 Design Future State"
        archetype="straightforward_dashboard"
        moveName="Executive KPI Dashboard"
        clientDisplayName="Client"
      />,
    );

    await clickApproveAndBuild(/Approve & Build P3 Design Future State/i);

    await waitFor(() =>
      expect(
        screen.getByText(/Package adjusted: 2 artifacts merged or omitted/i),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText(/Depth: straightforward/i)).toBeInTheDocument();
    expect(screen.getByText(/medium confidence/i)).toBeInTheDocument();
    expect(screen.getByText(/prose inferred/i)).toBeInTheDocument();
    expect(
      screen.getByText("Operating Model Design", { selector: "strong" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Sourcing Strategy Brief", { selector: "strong" }),
    ).toBeInTheDocument();

    const generatedRows = [
      "Target State Reference Architecture",
      "Solution Design Specification",
      "Requirements Traceability Matrix",
    ];
    for (const title of generatedRows) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
    expect(
      screen.queryByText("Operating Model Design", { selector: "span" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Sourcing Strategy Brief", { selector: "span" }),
    ).not.toBeInTheDocument();
  });
  // The settled result has to carry the registry's `gateArtifact` flag per key,
  // not just the key. Without it the parent can only ask "did anything fail?",
  // which refused the gate on a working document no gate check reads and
  // dead-ended the phase. Asserted here by feeding the real callback argument
  // through the classifier that owns the refusal decision.
  it("reports the gate-artifact flag per settled key, so a failed working document does not refuse the gate", async () => {
    global.fetch = (async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url === "/api/v1/deliverables/generate-phase") {
        return fakeResponse(
          {
            phase: 4,
            phaseLabel: "P4 Plan",
            queued: 2,
            total: 2,
            deliverables: [
              {
                deliverableTypeKey: "execution_roadmap",
                documentTitle: "Execution Roadmap",
                gateArtifact: true,
                runId: "run-roadmap",
                status: "queued",
              },
              {
                deliverableTypeKey: "mobilization_workshop_guide",
                documentTitle: "Mobilization Workshop Guide",
                gateArtifact: false,
                runId: "run-guide",
                status: "queued",
              },
            ],
          },
          202,
        );
      }
      if (url === "/api/v1/deliverables/runs/run-roadmap") {
        return fakeResponse({
          status: "succeeded",
          artifactId: "artifact-roadmap",
          blobUrl: "/api/v1/artifacts/artifact-roadmap",
          progressPct: 100,
          progressLabel: null,
          blockers: [],
        });
      }
      if (url === "/api/v1/deliverables/runs/run-guide") {
        return fakeResponse({
          status: "blocked",
          artifactId: null,
          blobUrl: null,
          progressPct: 100,
          progressLabel: null,
          blockers: ["length_ceiling_exceeded"],
        });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    }) as typeof fetch;

    const onBuildSettled = jest.fn<Promise<void>, [BuildSettledResult]>(
      async () => {},
    );
    render(
      <PhaseApproveAndBuild
        moveId="move-1"
        phaseNum={4}
        phaseLabel="P4 Plan"
        archetype="ai_enabled_sdlc"
        moveName="Example Move"
        clientDisplayName="Client"
        onBuildSettled={onBuildSettled}
      />,
    );

    await clickApproveAndBuild(/Approve & Build P4 Plan/i);
    await waitFor(() => expect(onBuildSettled).toHaveBeenCalledTimes(1), {
      timeout: 5000,
    });

    const result = onBuildSettled.mock.calls[0][0];
    expect(result.succeeded).toEqual([
      { deliverableTypeKey: "execution_roadmap", gateArtifact: true },
    ]);
    expect(result.failed).toEqual([
      {
        deliverableTypeKey: "mobilization_workshop_guide",
        gateArtifact: false,
      },
    ]);
    // The bare key lists stay exactly as they were for existing readers.
    expect(result.succeededKeys).toEqual(["execution_roadmap"]);
    expect(result.failedKeys).toEqual(["mobilization_workshop_guide"]);

    const settlement = classifyPhaseBuildSettlement({
      phase: 4,
      succeeded: result.succeeded,
      failed: result.failed,
    });
    expect(settlement.refusal).toBeNull();
    expect(settlement.workingDocumentCaveat).toContain(
      "mobilization_workshop_guide",
    );
  });
});

// ---------------------------------------------------------------------------
// Poll-budget wiring.
//
// The component used to hold its own `MAX_MS = 15 minutes`, started once per
// batch, and silently stopped rescheduling every still-pending run when it
// expired. That left the rows frozen reading "Queued", kept onBuildSettled from
// ever firing (so the gate approval the batch exists to feed was never
// submitted), and — because both `building` and `anyRunning` stayed true — left
// the one forward action permanently disabled. Only a full page reload escaped
// it, and a reload loses the run ids.
//
// The budget now comes from `deliverable-run-poll-plan`, which is sized from the
// server's own guarantees. These cases pin the WIRING: that the component asks
// the plan, schedules from its delay, reports a failed read to it, and treats a
// hand-off as neither a success nor a failure.
// ---------------------------------------------------------------------------

function mockNeverTerminalRun(
  runId: string,
  opts: { failReads?: number; holdStill?: boolean } = {},
) {
  let reads = 0;
  const failReads = opts.failReads ?? 0;
  global.fetch = (async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url === "/api/v1/deliverables/generate-phase") {
      return fakeResponse(
        {
          phase: 3,
          phaseLabel: "P3 Design",
          queued: 1,
          total: 1,
          deliverables: [
            {
              deliverableTypeKey: "charter",
              documentTitle: "Program Charter",
              gateArtifact: true,
              runId,
              status: "queued",
            },
          ],
        },
        202,
      );
    }
    if (url === `/api/v1/deliverables/runs/${runId}`) {
      reads += 1;
      if (reads <= failReads) throw new Error("network");
      return fakeResponse({
        status: "running",
        artifactId: null,
        blobUrl: null,
        // Held still when asked, so the "nothing moved" clock is observable.
        progressPct: opts.holdStill ? 20 : 20 + reads,
        progressLabel: null,
        blockers: [],
        packageReadiness: null,
      });
    }
    throw new Error(`Unexpected fetch: ${url}`);
  }) as typeof fetch;
  return () => reads;
}

const planMock = planDeliverableRunPoll as jest.MockedFunction<
  typeof planDeliverableRunPoll
>;

describe("PhaseApproveAndBuild poll budget", () => {
  const actualPlan = jest.requireActual<
    typeof import("@/lib/programs/deliverable-run-poll-plan")
  >("@/lib/programs/deliverable-run-poll-plan").planDeliverableRunPoll;
  afterEach(() => {
    planMock.mockReset();
    planMock.mockImplementation(actualPlan);
  });

  it("schedules the next poll from the plan's delay rather than a fixed interval", async () => {
    const readCount = mockNeverTerminalRun("run_long");
    // A fixed 4s interval would make the second read arrive ~4s later; the plan
    // asks for it immediately, so three reads land inside this assertion window.
    planMock.mockImplementation(() => ({ kind: "poll_again", delayMs: 0 }));

    render(
      <PhaseApproveAndBuild
        moveId="move-1"
        phaseNum={3}
        phaseLabel="P3 Design"
        archetype="ai_enabled_sdlc"
        moveName="Example Move"
        clientDisplayName="Client"
      />,
    );
    await clickApproveAndBuild(/Approve & Build P3 Design/i);
    await waitFor(() => expect(readCount()).toBeGreaterThanOrEqual(3), {
      timeout: 2000,
    });
    expect(planMock).toHaveBeenCalled();
  });

  it("reports a real unchanged clock for a run that is sitting still", async () => {
    // A run queued behind the serial worker reports the same state on every
    // poll. The plan must see that time accumulating, because that is what the
    // back-off keys on — a hardcoded zero would poll a stalled queue at the
    // fast interval forever.
    const GAP_MS = 120;
    mockNeverTerminalRun("run_still", { holdStill: true });
    planMock.mockImplementation(() => ({
      kind: "poll_again",
      delayMs: GAP_MS,
    }));

    render(
      <PhaseApproveAndBuild
        moveId="move-1"
        phaseNum={3}
        phaseLabel="P3 Design"
        archetype="ai_enabled_sdlc"
        moveName="Example Move"
        clientDisplayName="Client"
      />,
    );
    await clickApproveAndBuild(/Approve & Build P3 Design/i);
    await waitFor(() => expect(planMock.mock.calls.length).toBeGreaterThan(2), {
      timeout: 4000,
    });
    const first = planMock.mock.calls[0][0];
    expect(first.lastPollFailed).toBe(false);
    expect(first.unchangedMs).toBeLessThan(GAP_MS);
    const later = planMock.mock.calls[2][0];
    expect(later.unchangedMs).toBeGreaterThanOrEqual(GAP_MS);
    expect(later.elapsedMs).toBeGreaterThanOrEqual(later.unchangedMs);
  });

  it("resets the unchanged clock for a run that is advancing", async () => {
    // The mirror of the case above: this run reports a new percentage on every
    // poll, so it must never be read as sitting still.
    const GAP_MS = 120;
    mockNeverTerminalRun("run_moving");
    planMock.mockImplementation(() => ({
      kind: "poll_again",
      delayMs: GAP_MS,
    }));

    render(
      <PhaseApproveAndBuild
        moveId="move-1"
        phaseNum={3}
        phaseLabel="P3 Design"
        archetype="ai_enabled_sdlc"
        moveName="Example Move"
        clientDisplayName="Client"
      />,
    );
    await clickApproveAndBuild(/Approve & Build P3 Design/i);
    await waitFor(() => expect(planMock.mock.calls.length).toBeGreaterThan(2), {
      timeout: 4000,
    });
    for (const [args] of planMock.mock.calls) {
      expect(args.unchangedMs).toBeLessThan(GAP_MS);
    }
    expect(planMock.mock.calls[2][0].elapsedMs).toBeGreaterThanOrEqual(GAP_MS);
  });

  it("tells the plan a read failed instead of treating the run as terminal", async () => {
    mockNeverTerminalRun("run_flaky", { failReads: 1 });
    planMock.mockImplementation(() => ({ kind: "hand_off" }));
    const onBuildSettled = jest.fn<Promise<void>, [BuildSettledResult]>(
      async () => {},
    );

    render(
      <PhaseApproveAndBuild
        moveId="move-1"
        phaseNum={3}
        phaseLabel="P3 Design"
        archetype="ai_enabled_sdlc"
        moveName="Example Move"
        clientDisplayName="Client"
        onBuildSettled={onBuildSettled}
      />,
    );
    await clickApproveAndBuild(/Approve & Build P3 Design/i);
    await waitFor(() => expect(planMock).toHaveBeenCalled());
    expect(planMock.mock.calls[0][0].lastPollFailed).toBe(true);
    // A failed read is not a run outcome, so nothing settled on it.
    expect(onBuildSettled).not.toHaveBeenCalled();
  });

  it("hands the batch back to the server instead of freezing the row at Queued", async () => {
    mockNeverTerminalRun("run_handoff");
    planMock.mockImplementation(() => ({ kind: "hand_off" }));
    const onBuildSettled = jest.fn<Promise<void>, [BuildSettledResult]>(
      async () => {},
    );

    render(
      <PhaseApproveAndBuild
        moveId="move-1"
        phaseNum={3}
        phaseLabel="P3 Design"
        archetype="ai_enabled_sdlc"
        moveName="Example Move"
        clientDisplayName="Client"
        onBuildSettled={onBuildSettled}
      />,
    );
    await clickApproveAndBuild(/Approve & Build P3 Design/i);

    // The row stops claiming to be queued, and says where the work actually is.
    await waitFor(() =>
      expect(
        screen.getByText("Still building on the server"),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText("Queued")).not.toBeInTheDocument();

    // The headline stops telling the reader to keep the page open, and says all
    // three things the reader needs to decide what to do.
    expect(screen.queryByText(/Keep this page open/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(describeDeliverableRunHandOff("P3 Design")),
    ).toBeInTheDocument();

    // A hand-off is not a settlement: the gate approval must NOT be submitted,
    // because documents may still be building.
    expect(onBuildSettled).not.toHaveBeenCalled();

    // And the phase is not a dead end — the forward action is usable again.
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Build P3 Design/i }),
      ).not.toBeDisabled(),
    );
  });

  it("does not settle a hand-off as a failure either", async () => {
    mockNeverTerminalRun("run_handoff_2");
    planMock.mockImplementation(() => ({ kind: "hand_off" }));
    const onBuildSettled = jest.fn<Promise<void>, [BuildSettledResult]>(
      async () => {},
    );

    render(
      <PhaseApproveAndBuild
        moveId="move-1"
        phaseNum={3}
        phaseLabel="P3 Design"
        archetype="ai_enabled_sdlc"
        moveName="Example Move"
        clientDisplayName="Client"
        onBuildSettled={onBuildSettled}
      />,
    );
    await clickApproveAndBuild(/Approve & Build P3 Design/i);
    await waitFor(() =>
      expect(
        screen.getByText("Still building on the server"),
      ).toBeInTheDocument(),
    );
    // Neither "Failed" nor "Build blocked" — the build was not given a verdict.
    expect(screen.queryByText("Failed")).not.toBeInTheDocument();
    expect(screen.queryByText("Build blocked")).not.toBeInTheDocument();
    expect(onBuildSettled).not.toHaveBeenCalled();
  });
});

// ─── Submitting the gate approval without a rebuild ─────────────────────────
//
// onBuildSettled used to have exactly one trigger: the tail of a fresh build
// batch. Two HARD gate checks (P1's charter approval, P2's discovery-report
// sign-off) read a sign-off that can only be recorded after that batch wrote the
// document, so the first submission always failed them — and re-running the
// build to submit again regenerates the document as a new unapproved draft,
// clearing the sign-off. These cases pin the second trigger: a submission that
// reports the documents already on the record and starts no build.

describe("PhaseApproveAndBuild gate submission without a rebuild", () => {
  const CHARTER_ARTIFACT = {
    artifactId: "art_charter",
    deliverableTypeKey: "charter",
    documentTitle: "Program Charter",
    phase: 1,
    status: "approved",
    version: 1,
    downloadUrl: "/api/v1/programs/move-1/artifacts/art_charter/download",
  };

  function renderWithArtifacts(
    artifacts: Array<typeof CHARTER_ARTIFACT>,
    onBuildSettled?: (result: BuildSettledResult) => Promise<void>,
  ) {
    return render(
      <PhaseApproveAndBuild
        moveId="move-1"
        phaseNum={1}
        phaseLabel="P1 Charter"
        archetype="ai_enabled_sdlc"
        moveName="Example Move"
        clientDisplayName="Client"
        initialArtifacts={artifacts}
        deliverableKeys={["charter"]}
        {...(onBuildSettled ? { onBuildSettled } : {})}
      />,
    );
  }

  it("offers the submission once the gate document is on the record, and starts no build", async () => {
    const settled: BuildSettledResult[] = [];
    global.fetch = (async (input: RequestInfo | URL) => {
      throw new Error(
        `no request expected: ${typeof input === "string" ? input : input.toString()}`,
      );
    }) as typeof fetch;

    renderWithArtifacts([CHARTER_ARTIFACT], async (result) => {
      settled.push(result);
    });

    const submit = screen.getByRole("button", {
      name: /Submit P1 Charter gate approval/i,
    });
    await act(async () => {
      submit.click();
    });
    await act(async () => {
      within(screen.getByRole("dialog"))
        .getByRole("button", { name: /^Submit gate approval$/i })
        .click();
    });

    await waitFor(() => expect(settled).toHaveLength(1));
    expect(settled[0]).toEqual({
      succeededKeys: ["charter"],
      failedKeys: [],
      total: 1,
      succeeded: [{ deliverableTypeKey: "charter", gateArtifact: true }],
      failed: [],
      source: "existing_documents",
    });
  });

  it("states in the confirmation that the document is not rebuilt", async () => {
    renderWithArtifacts([CHARTER_ARTIFACT], async () => {});
    await act(async () => {
      screen
        .getByRole("button", { name: /Submit P1 Charter gate approval/i })
        .click();
    });
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByText(/without rebuilding/i),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(/new unapproved draft/i),
    ).toBeInTheDocument();
  });

  it("does not offer the submission before the gate document is built", () => {
    renderWithArtifacts([], async () => {});
    expect(
      screen.queryByRole("button", { name: /Submit .* gate approval/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Approve & Build P1 Charter/i }),
    ).toBeInTheDocument();
  });

  it("does not offer the submission for a gate document held below its quality bar", () => {
    renderWithArtifacts(
      [{ ...CHARTER_ARTIFACT, status: "quarantined" }],
      async () => {},
    );
    expect(
      screen.queryByRole("button", { name: /Submit .* gate approval/i }),
    ).not.toBeInTheDocument();
  });

  // A held gate document used to render as "Built" in green, count toward
  // "P1 Charter documents are built", and offer a download — on the same screen
  // where the submission button had withdrawn itself because that same document
  // is not on the record. The reader was told everything was built and given no
  // forward control and no reason. These cases pin the row against the control.

  it("does not report a held gate document as built", () => {
    renderWithArtifacts(
      [{ ...CHARTER_ARTIFACT, status: "quarantined" }],
      async () => {},
    );
    expect(screen.queryByText("Built")).not.toBeInTheDocument();
    expect(screen.getByText("Build blocked")).toBeInTheDocument();
  });

  it("does not tell the reader the phase documents are built when one is held", () => {
    renderWithArtifacts(
      [{ ...CHARTER_ARTIFACT, status: "quarantined" }],
      async () => {},
    );
    expect(screen.queryByText(/documents are built/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(/blocked by evidence or build-quality checks/i),
    ).toBeInTheDocument();
  });

  it("states why the held document is not on the record", () => {
    renderWithArtifacts(
      [{ ...CHARTER_ARTIFACT, status: "quarantined" }],
      async () => {},
    );
    expect(
      screen.getByText(/Why this output is blocked/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/held below its quality bar/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Re-run Approve & Build to replace it/i),
    ).toBeInTheDocument();
  });

  it("does not offer a download of a held document as the final one", () => {
    renderWithArtifacts(
      [{ ...CHARTER_ARTIFACT, status: "quarantined" }],
      async () => {},
    );
    expect(screen.queryByText(/Download final/i)).not.toBeInTheDocument();
  });

  it("keeps the re-run control available on a held document", () => {
    // The row is blocked, not the phase. Re-running is the remediation the
    // blocker sentence names, so it must not be disabled by the hold.
    renderWithArtifacts(
      [{ ...CHARTER_ARTIFACT, status: "quarantined" }],
      async () => {},
    );
    expect(
      screen.getByRole("button", { name: /Re-run & Build P1 Charter/i }),
    ).toBeEnabled();
  });

  it("names a control that reads as a re-run when a document is held", () => {
    // The blocker sentence says "Re-run Approve & Build". A held document makes
    // nothing built, so the button used to read "Approve & Build" — a blocker
    // naming a control that is not on screen under that name.
    renderWithArtifacts(
      [{ ...CHARTER_ARTIFACT, status: "quarantined" }],
      async () => {},
    );
    expect(
      screen.getByText(/Re-run Approve & Build to replace it/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Re-run & Build P1 Charter/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Approve & Build P1 Charter/i }),
    ).not.toBeInTheDocument();
  });

  it("says a superseded document is not current rather than below quality", () => {
    renderWithArtifacts(
      [{ ...CHARTER_ARTIFACT, status: "superseded" }],
      async () => {},
    );
    expect(screen.getByText("Build blocked")).toBeInTheDocument();
    expect(screen.getByText(/has been superseded/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/held below its quality bar/i),
    ).not.toBeInTheDocument();
  });

  it("still reports a usable stored document as built", () => {
    // The guard must not catch the ordinary case: an approved artifact is a
    // build, and withdrawing "Built" from it would strand the phase.
    renderWithArtifacts([CHARTER_ARTIFACT], async () => {});
    expect(screen.getByText("Built")).toBeInTheDocument();
    expect(screen.queryByText("Build blocked")).not.toBeInTheDocument();
    expect(screen.getByText(/documents are built/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Submit P1 Charter gate approval/i }),
    ).toBeInTheDocument();
  });

  it("lets a fresh build overrule a stale held artifact status", async () => {
    mockFetchSequence({
      runId: "run_requalify",
      intermediateStatus: "running",
      finalStatus: "succeeded",
    });
    render(
      <PhaseApproveAndBuild
        moveId="move-1"
        phaseNum={1}
        phaseLabel="P1 Charter"
        archetype="ai_enabled_sdlc"
        moveName="Example Move"
        clientDisplayName="Client"
        initialArtifacts={[{ ...CHARTER_ARTIFACT, status: "quarantined" }]}
        deliverableKeys={["charter"]}
        onBuildSettled={async () => {}}
      />,
    );
    // Seeded as held, so there is nothing to submit yet.
    expect(
      screen.queryByRole("button", { name: /Submit .* gate approval/i }),
    ).not.toBeInTheDocument();

    await clickApproveAndBuild(/Re-run & Build P1 Charter/i);
    await waitFor(
      () =>
        expect(
          screen.getByRole("button", {
            name: /Submit P1 Charter gate approval/i,
          }),
        ).toBeInTheDocument(),
      { timeout: 15000 },
    );
  }, 20000);

  it("keeps the submission disabled while the parent reports an open blocker", () => {
    renderWithArtifacts([CHARTER_ARTIFACT], async () => {});
    expect(
      screen.getByRole("button", {
        name: /Submit P1 Charter gate approval/i,
      }),
    ).toBeEnabled();

    render(
      <PhaseApproveAndBuild
        moveId="move-1"
        phaseNum={1}
        phaseLabel="P1 Charter"
        archetype="ai_enabled_sdlc"
        moveName="Example Move"
        clientDisplayName="Client"
        initialArtifacts={[CHARTER_ARTIFACT]}
        deliverableKeys={["charter"]}
        disabledReason="Complete 2 phase inputs before Approve & Build."
        onBuildSettled={async () => {}}
      />,
    );
    const disabled = screen.getAllByRole("button", {
      name: /Submit P1 Charter gate approval/i,
    });
    expect(disabled[disabled.length - 1]).toBeDisabled();
  });

  // The in-flight guard has one case that nothing else covers: a batch where the
  // gate document has already succeeded while a sibling is still running. Without
  // the guard the submission would be offered mid-batch, racing the settle effect
  // that will submit the same gate again when the batch finishes.
  it("does not offer the submission mid-batch once only the gate document has built", async () => {
    global.fetch = (async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url === "/api/v1/deliverables/generate-phase") {
        return fakeResponse(
          {
            phase: 1,
            phaseLabel: "P1 Charter",
            queued: 2,
            total: 2,
            deliverables: [
              {
                deliverableTypeKey: "charter",
                documentTitle: "Program Charter",
                gateArtifact: true,
                runId: "run_gate",
                status: "queued",
              },
              {
                deliverableTypeKey: "discovery_plan",
                documentTitle: "Discovery Plan",
                gateArtifact: false,
                runId: "run_working",
                status: "queued",
              },
            ],
          },
          202,
        );
      }
      if (url === "/api/v1/deliverables/runs/run_gate") {
        return fakeResponse({
          status: "succeeded",
          artifactId: "art_gate",
          blobUrl: "/api/v1/artifacts/art_gate",
          progressPct: 100,
          progressLabel: null,
          blockers: [],
        });
      }
      if (url === "/api/v1/deliverables/runs/run_working") {
        return fakeResponse({
          status: "running",
          artifactId: null,
          blobUrl: null,
          progressPct: 40,
          progressLabel: null,
          blockers: [],
        });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    }) as typeof fetch;

    render(
      <PhaseApproveAndBuild
        moveId="move-1"
        phaseNum={1}
        phaseLabel="P1 Charter"
        archetype="ai_enabled_sdlc"
        moveName="Example Move"
        clientDisplayName="Client"
        deliverableKeys={["charter", "discovery_plan"]}
        onBuildSettled={async () => {}}
      />,
    );

    await clickApproveAndBuild(/Approve & Build P1 Charter/i);
    await waitFor(() =>
      expect(screen.getByText("Built")).toBeInTheDocument(),
    );
    expect(screen.getByText("Building")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Submit .* gate approval/i }),
    ).not.toBeInTheDocument();
  });

  it("sends both forward actions through the step-header portal", () => {
    render(
      <>
        <div id="phase-progress-both-actions" />
        <PhaseApproveAndBuild
          moveId="move-1"
          phaseNum={1}
          phaseLabel="P1 Charter"
          archetype="ai_enabled_sdlc"
          moveName="Example Move"
          clientDisplayName="Client"
          initialArtifacts={[CHARTER_ARTIFACT]}
          deliverableKeys={["charter"]}
          actionPortalTargetId="phase-progress-both-actions"
          onBuildSettled={async () => {}}
        />
      </>,
    );
    const portal = within(
      document.getElementById("phase-progress-both-actions")!,
    );
    expect(
      portal.getByRole("button", { name: /Re-run & Build P1 Charter/i }),
    ).toBeInTheDocument();
    expect(
      portal.getByRole("button", {
        name: /Submit P1 Charter gate approval/i,
      }),
    ).toBeInTheDocument();
  });

  it("reports a failed submission without claiming the gate was approved", async () => {
    renderWithArtifacts([CHARTER_ARTIFACT], async () => {
      throw new Error("Charter approved by an authorized Move user");
    });
    await act(async () => {
      screen
        .getByRole("button", { name: /Submit P1 Charter gate approval/i })
        .click();
    });
    await act(async () => {
      within(screen.getByRole("dialog"))
        .getByRole("button", { name: /^Submit gate approval$/i })
        .click();
    });
    await waitFor(() =>
      expect(
        screen.getByText("Charter approved by an authorized Move user"),
      ).toBeInTheDocument(),
    );
    // The action must come back, not latch: the reader records the sign-off and
    // submits again.
    expect(
      screen.getByRole("button", { name: /Submit P1 Charter gate approval/i }),
    ).toBeEnabled();
  });
});
