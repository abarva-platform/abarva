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

describe("autoDraftOnStageEntry", () => {
  it("maps stage entry to the primary supported Source template", () => {
    expect(autoDraftCodesForStage("strategy")).toEqual(["d01_strategy_memo"]);
    expect(autoDraftCodesForStage("scope")).toEqual(["d05_scope_memo"]);
    expect(autoDraftCodesForStage("rfp")).toEqual(["d09_rfp_pack"]);
    expect(autoDraftCodesForStage("responses")).toEqual([]);
  });

  it("generates an empty templated artifact once", async () => {
    const generateArtifact = jest.fn(async () => okResponse());

    const result = await autoDraftOnStageEntry(baseInput, {
      loadArtifactRows: async () => [row("d01_strategy_memo")],
      generateArtifact,
      log: silentLog,
    });

    expect(result).toEqual({
      generated: ["d01_strategy_memo"],
      skipped: [],
      failed: [],
    });
    expect(generateArtifact).toHaveBeenCalledTimes(1);
    expect(generateArtifact).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: "evt-1",
        artifactCode: "d01_strategy_memo",
      }),
    );
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
      generated: [],
      skipped: ["responses:no_supported_templates"],
      failed: [],
    });
    expect(generateArtifact).not.toHaveBeenCalled();
  });

  it("records generation failures without throwing", async () => {
    const result = await autoDraftOnStageEntry(baseInput, {
      loadArtifactRows: async () => [row("d01_strategy_memo")],
      generateArtifact: jest.fn(async () => {
        throw new Error("provider down");
      }),
      log: silentLog,
    });

    expect(result.generated).toEqual([]);
    expect(result.skipped).toEqual([]);
    expect(result.failed).toEqual(["d01_strategy_memo:generation_failed"]);
  });

  it("records non-ok generation responses without throwing", async () => {
    const result = await autoDraftOnStageEntry(baseInput, {
      loadArtifactRows: async () => [row("d01_strategy_memo")],
      generateArtifact: jest.fn(async () =>
        Response.json({ error: "upstream_required" }, { status: 409 }),
      ),
      log: silentLog,
    });

    expect(result.generated).toEqual([]);
    expect(result.skipped).toEqual([]);
    expect(result.failed).toEqual(["d01_strategy_memo:upstream_required"]);
  });
});

const silentLog = {
  warn: jest.fn(),
  error: jest.fn(),
};
