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

function queuedDeps(over: Partial<Parameters<typeof autoDraftOnStageEntry>[1]> = {}) {
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
  it("maps stage entry to the primary supported Source template", () => {
    expect(autoDraftCodesForStage("strategy")).toEqual(["d01_strategy_memo"]);
    expect(autoDraftCodesForStage("scope")).toEqual(["d05_scope_memo"]);
    expect(autoDraftCodesForStage("rfp")).toEqual(["d09_rfp_pack"]);
    expect(autoDraftCodesForStage("responses")).toEqual([]);
  });

  it("generates an empty templated artifact once", async () => {
    const deps = queuedDeps();

    const result = await autoDraftOnStageEntry(baseInput, {
      loadArtifactRows: async () => [row("d01_strategy_memo")],
      ...deps,
      log: silentLog,
    });

    expect(result).toEqual({
      queued: ["d01_strategy_memo"],
      generated: ["d01_strategy_memo"],
      skipped: [],
      failed: [],
    });
    expect(deps.updateArtifactStatus).toHaveBeenCalledWith({
      artifactRowId: "row-d01_strategy_memo",
      status: "drafting",
    });
    expect(deps.enqueueGenerationJob).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: "evt-1",
        clientKey: "skyharbor-air",
        artifactCode: "d01_strategy_memo",
        artifactRowId: "row-d01_strategy_memo",
        stageKey: "strategy",
      }),
    );
    expect(deps.processGenerationJob).toHaveBeenCalledTimes(1);
  });

  it("is idempotent when the artifact already has a body", async () => {
    const generateArtifact = jest.fn(async () => okResponse());

    const result = await autoDraftOnStageEntry(baseInput, {
      loadArtifactRows: async () => [
        row("d01_strategy_memo", { body: "# Existing strategy" }),
      ],
      generateArtifact,
      log: silentLog,
    });

    expect(result.generated).toEqual([]);
    expect(result.queued).toEqual([]);
    expect(result.skipped).toEqual(["d01_strategy_memo:already_authored"]);
    expect(result.failed).toEqual([]);
    expect(generateArtifact).not.toHaveBeenCalled();
  });

  it("skips terminal artifact states", async () => {
    const generateArtifact = jest.fn(async () => okResponse());

    const result = await autoDraftOnStageEntry(baseInput, {
      loadArtifactRows: async () => [
        row("d01_strategy_memo", { status: "locked" }),
      ],
      generateArtifact,
      log: silentLog,
    });

    expect(result.generated).toEqual([]);
    expect(result.queued).toEqual([]);
    expect(result.skipped).toEqual(["d01_strategy_memo:locked"]);
    expect(result.failed).toEqual([]);
    expect(generateArtifact).not.toHaveBeenCalled();
  });

  it("no-ops for stages without a supported primary template", async () => {
    const generateArtifact = jest.fn(async () => okResponse());

    const result = await autoDraftOnStageEntry(
      { ...baseInput, enteredStage: "responses" },
      {
        loadArtifactRows: async () => [row("d13_vendor_responses")],
        generateArtifact,
        log: silentLog,
      },
    );

    expect(result).toEqual({
      queued: [],
      generated: [],
      skipped: ["responses:no_supported_templates"],
      failed: [],
    });
    expect(generateArtifact).not.toHaveBeenCalled();
  });

  it("records generation failures without throwing", async () => {
    const result = await autoDraftOnStageEntry(baseInput, {
      loadArtifactRows: async () => [row("d01_strategy_memo")],
      ...queuedDeps({
        processGenerationJob: jest.fn(async () => {
          throw new Error("provider down");
        }),
      }),
      log: silentLog,
    });

    expect(result.generated).toEqual([]);
    expect(result.queued).toEqual(["d01_strategy_memo"]);
    expect(result.skipped).toEqual([]);
    expect(result.failed).toEqual(["d01_strategy_memo:generation_failed"]);
  });

  it("records non-ok generation responses without throwing", async () => {
    const result = await autoDraftOnStageEntry(baseInput, {
      loadArtifactRows: async () => [row("d01_strategy_memo")],
      ...queuedDeps({
        processGenerationJob: jest.fn(async () =>
          Response.json({ error: "upstream_required" }, { status: 409 }),
        ),
      }),
      log: silentLog,
    });

    expect(result.generated).toEqual([]);
    expect(result.queued).toEqual(["d01_strategy_memo"]);
    expect(result.skipped).toEqual([]);
    expect(result.failed).toEqual(["d01_strategy_memo:upstream_required"]);
  });

  it("falls back to direct generation when the durable queue is not migrated yet", async () => {
    const generateArtifact = jest.fn(async () => okResponse());

    const result = await autoDraftOnStageEntry(baseInput, {
      loadArtifactRows: async () => [row("d01_strategy_memo")],
      enqueueGenerationJob: jest.fn(async () => {
        throw new Error('relation "source_artifact_generation_jobs" does not exist');
      }),
      updateArtifactStatus: jest.fn(async () => undefined),
      generateArtifact,
      log: silentLog,
    });

    expect(result).toEqual({
      queued: [],
      generated: ["d01_strategy_memo"],
      skipped: [],
      failed: [],
    });
    expect(generateArtifact).toHaveBeenCalledTimes(1);
  });
});

const silentLog = {
  warn: jest.fn(),
  error: jest.fn(),
};
