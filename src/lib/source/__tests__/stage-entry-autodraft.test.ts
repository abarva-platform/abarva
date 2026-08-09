import {
  autoDraftCodesForStage,
  autoDraftOnStageEntry,
} from "../stage-entry-autodraft";
import type { SourceEventArtifactStatus } from "../canvas-substrate/types";

const baseInput = {
  eventId: "evt-1",
  clientKey: "skyharbor-air",
  enteredStage: "strategy" as const,
};

function row(
  artifactCode: string,
  over: Partial<{
    id: string;
    body: string | null;
    status: SourceEventArtifactStatus;
  }> = {},
) {
  return {
    id: over.id ?? `row-${artifactCode}`,
    artifact_code: artifactCode,
    body: over.body ?? null,
    status: over.status ?? "not_started",
  };
}

function okResponse() {
  return Response.json({ ok: true });
}

function queuedJob(artifactCode = "d01_strategy_memo") {
  return {
    id: `job-${artifactCode}`,
    client_key: "skyharbor-air",
    source_event_id: "evt-1",
    artifact_row_id: `row-${artifactCode}`,
    artifact_code: artifactCode,
    stage_key: "strategy",
    status: "queued",
    quality_tier: "real_engagement",
    requested_via: "stage_entry",
    requested_by_user_id: null,
    attempt_count: 0,
    max_attempts: 3,
    locked_by: null,
    locked_at: null,
    started_at: null,
    completed_at: null,
    last_error: null,
    result_metadata: {},
    created_at: "2026-06-16T00:00:00.000Z",
    updated_at: "2026-06-16T00:00:00.000Z",
  } as const;
}

function queuedDeps(
  over: Partial<Parameters<typeof autoDraftOnStageEntry>[1]> = {},
) {
  return {
    enqueueGenerationJob: jest.fn(async (input: { artifactCode: string }) =>
      queuedJob(input.artifactCode),
    ),
    processGenerationJob: jest.fn(async () => okResponse()),
    updateArtifactStatus: jest.fn(async () => undefined),
    ...over,
  };
}

describe("autoDraftOnStageEntry", () => {
  it("maps stage entry to all supported required gate-defining Source templates", () => {
    expect(autoDraftCodesForStage("strategy")).toEqual([
      "d01_strategy_memo",
      "d02_value_target",
    ]);
    expect(autoDraftCodesForStage("scope")).toEqual([
      "d04_app_inv",
      "d05_scope_memo",
      "d06_excl_log",
      "d07_ticket_synth",
    ]);
    expect(autoDraftCodesForStage("rfp")).toEqual([
      "d09_rfp_pack",
      "d11_response_checklist",
      "d12_vendor_shortlist",
    ]);
  });

  it("generates each empty required templated artifact once", async () => {
    const deps = queuedDeps();

    const result = await autoDraftOnStageEntry(
      { ...baseInput, enteredStage: "rfp" },
      {
        loadArtifactRows: async () => [
          row("d09_rfp_pack"),
          row("d11_response_checklist"),
          row("d12_vendor_shortlist"),
        ],
        ...deps,
        log: silentLog,
      },
    );

    expect(result).toEqual({
      queued: [
        "d09_rfp_pack",
        "d11_response_checklist",
        "d12_vendor_shortlist",
      ],
      generated: [
        "d09_rfp_pack",
        "d11_response_checklist",
        "d12_vendor_shortlist",
      ],
      skipped: [],
      failed: [],
    });
    expect(deps.updateArtifactStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        artifactRowId: "row-d09_rfp_pack",
        status: "drafting",
      }),
    );
    expect(deps.enqueueGenerationJob).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: "evt-1",
        clientKey: "skyharbor-air",
        artifactCode: "d09_rfp_pack",
        artifactRowId: "row-d09_rfp_pack",
        stageKey: "rfp",
      }),
    );
    expect(deps.processGenerationJob).toHaveBeenCalledTimes(3);
  });

  it("is idempotent when the artifact already has a body", async () => {
    const generateArtifact = jest.fn(async () => okResponse());

    const result = await autoDraftOnStageEntry(baseInput, {
      loadArtifactRows: async () => [
        row("d01_strategy_memo", { body: "# Existing strategy" }),
        row("d02_value_target", { body: "# Existing value target" }),
      ],
      generateArtifact,
      log: silentLog,
    });

    expect(result.generated).toEqual([]);
    expect(result.queued).toEqual([]);
    expect(result.skipped).toEqual([
      "d01_strategy_memo:already_authored",
      "d02_value_target:already_authored",
    ]);
    expect(result.failed).toEqual([]);
    expect(generateArtifact).not.toHaveBeenCalled();
  });

  it("skips terminal artifact states", async () => {
    const generateArtifact = jest.fn(async () => okResponse());

    const result = await autoDraftOnStageEntry(baseInput, {
      loadArtifactRows: async () => [
        row("d01_strategy_memo", { status: "locked" }),
        row("d02_value_target", { status: "locked" }),
      ],
      generateArtifact,
      log: silentLog,
    });

    expect(result.generated).toEqual([]);
    expect(result.queued).toEqual([]);
    expect(result.skipped).toEqual([
      "d01_strategy_memo:locked",
      "d02_value_target:locked",
    ]);
    expect(result.failed).toEqual([]);
    expect(generateArtifact).not.toHaveBeenCalled();
  });

  it("skips required artifacts that do not have a scaffold row yet", async () => {
    const generateArtifact = jest.fn(async () => okResponse());

    const result = await autoDraftOnStageEntry(
      { ...baseInput, enteredStage: "scope" },
      {
        loadArtifactRows: async () => [row("d05_scope_memo")],
        generateArtifact,
        log: silentLog,
      },
    );

    expect(result.skipped).toEqual([
      "d04_app_inv:missing_artifact_row",
      "d06_excl_log:missing_artifact_row",
      "d07_ticket_synth:missing_artifact_row",
    ]);
  });

  it("records generation failures without throwing", async () => {
    const result = await autoDraftOnStageEntry(baseInput, {
      loadArtifactRows: async () => [
        row("d01_strategy_memo"),
        row("d02_value_target", { body: "# Existing value target" }),
      ],
      ...queuedDeps({
        processGenerationJob: jest.fn(async () => {
          throw new Error("provider down");
        }),
      }),
      log: silentLog,
    });

    expect(result.generated).toEqual([]);
    expect(result.queued).toEqual(["d01_strategy_memo"]);
    expect(result.skipped).toEqual(["d02_value_target:already_authored"]);
    expect(result.failed).toEqual(["d01_strategy_memo:generation_failed"]);
  });

  it("records non-ok generation responses without throwing", async () => {
    const result = await autoDraftOnStageEntry(baseInput, {
      loadArtifactRows: async () => [
        row("d01_strategy_memo"),
        row("d02_value_target", { body: "# Existing value target" }),
      ],
      ...queuedDeps({
        processGenerationJob: jest.fn(async () =>
          Response.json({ error: "upstream_required" }, { status: 409 }),
        ),
      }),
      log: silentLog,
    });

    expect(result.generated).toEqual([]);
    expect(result.queued).toEqual(["d01_strategy_memo"]);
    expect(result.skipped).toEqual(["d02_value_target:already_authored"]);
    expect(result.failed).toEqual(["d01_strategy_memo:upstream_required"]);
  });

  it("falls back to direct generation when the durable queue is not migrated yet", async () => {
    const generateArtifact = jest.fn(async () => okResponse());

    const result = await autoDraftOnStageEntry(baseInput, {
      loadArtifactRows: async () => [
        row("d01_strategy_memo"),
        row("d02_value_target", { body: "# Existing value target" }),
      ],
      enqueueGenerationJob: jest.fn(async () => {
        throw new Error(
          'relation "source_artifact_generation_jobs" does not exist',
        );
      }),
      updateArtifactStatus: jest.fn(async () => undefined),
      generateArtifact,
      log: silentLog,
    });

    expect(result).toEqual({
      queued: [],
      generated: ["d01_strategy_memo"],
      skipped: ["d02_value_target:already_authored"],
      failed: [],
    });
    expect(generateArtifact).toHaveBeenCalledTimes(1);
  });

  it("marks direct fallback requests as internal stage auto-drafts", async () => {
    const generateArtifact = jest.fn(
      async (input: {
        eventId: string;
        artifactCode: string;
        request?: Request;
      }) => {
        void input;
        return okResponse();
      },
    );
    const request = new Request("https://app.abarva.ai/source/events/event-1", {
      headers: { "x-original": "kept" },
    });

    await autoDraftOnStageEntry(baseInput, {
      loadArtifactRows: async () => [row("d01_strategy_memo")],
      enqueueGenerationJob: jest.fn(async () => {
        throw new Error(
          'relation "source_artifact_generation_jobs" does not exist',
        );
      }),
      updateArtifactStatus: jest.fn(async () => undefined),
      generateArtifact,
      request,
      log: silentLog,
    });

    expect(generateArtifact).toHaveBeenCalledTimes(1);
    const generatedRequest = generateArtifact.mock.calls[0][0].request;
    expect(generatedRequest?.headers.get("x-source-stage-autodraft")).toBe("1");
    expect(generatedRequest?.headers.get("x-source-worker-call")).toBe("1");
    expect(generatedRequest?.headers.get("x-original")).toBe("kept");
  });
});

const silentLog = {
  warn: jest.fn(),
  error: jest.fn(),
};
