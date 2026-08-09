import {
  findUnsatisfiedDraftableUpstream,
  findUnsatisfiedRequiredUpstream,
} from "../upstream-satisfaction";
import type { SourceGenerationContext } from "@/lib/source/agent-generation/types";

const sourceArtifactsMock = jest.fn();
const acceptancesMock = jest.fn();

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: () => ({
    from: (table: string) => ({
      select: () => ({
        in: (_col: string, ids: string[]) => sourceArtifactsMock(table, ids),
      }),
    }),
  }),
}));

jest.mock("@/lib/source/artifact-acceptances", () => ({
  getLatestArtifactAcceptancesByArtifactIds: (ids: string[]) =>
    acceptancesMock(ids),
}));

function makeCtx(
  artifactStates: Array<{
    artifactCode: string;
    linkedArtifactId: string | null;
    body?: string | null;
  }>,
  currentStageKey: string,
): SourceGenerationContext {
  return {
    tenantKey: "apexretail",
    tenantName: "Apex Retail",
    event: {
      id: "event-1",
      code: "APX-001",
      name: "Test Event",
      archetype: null,
      rigor: null,
      currentStageKey: currentStageKey as never,
      statusLabel: "Active",
      owner: null,
      triggerDescription: null,
      scopeDescription: null,
      estimatedValueUsd: null,
    },
    artifactStates: artifactStates as never,
    gateCriteria: [],
    evidence: [],
  };
}

describe("findUnsatisfiedRequiredUpstream", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    acceptancesMock.mockResolvedValue(new Map());
    sourceArtifactsMock.mockResolvedValue({ data: [], error: null });
  });

  it("returns [] immediately for an empty required-codes list, with no DB calls", async () => {
    const ctx = makeCtx([], "strategy");
    const result = await findUnsatisfiedRequiredUpstream(ctx, []);
    expect(result).toEqual([]);
    expect(sourceArtifactsMock).not.toHaveBeenCalled();
  });

  it("a code with no linked artifact at all is unsatisfied", async () => {
    const ctx = makeCtx(
      [{ artifactCode: "d01_strategy_memo", linkedArtifactId: null }],
      "strategy",
    );
    const result = await findUnsatisfiedRequiredUpstream(ctx, [
      "d01_strategy_memo",
    ]);
    expect(result).toEqual(["d01_strategy_memo"]);
  });

  it("a code with a linked artifact that has no acceptance record is unsatisfied — a body existing is not enough", async () => {
    sourceArtifactsMock.mockResolvedValue({
      data: [
        {
          id: "artifact-1",
          status: "draft",
          lifecycle_state: "current",
          approval_state: null,
          approved_by: null,
        },
      ],
      error: null,
    });
    acceptancesMock.mockResolvedValue(new Map()); // never accepted
    const ctx = makeCtx(
      [{ artifactCode: "d05_scope_memo", linkedArtifactId: "artifact-1" }],
      "scope",
    );
    const result = await findUnsatisfiedRequiredUpstream(ctx, [
      "d05_scope_memo",
    ]);
    expect(result).toEqual(["d05_scope_memo"]);
  });

  it("a code with an accepted, stage-eligible, non-superseded linked artifact IS satisfied", async () => {
    sourceArtifactsMock.mockResolvedValue({
      data: [
        {
          id: "artifact-1",
          status: "approved",
          lifecycle_state: "current",
          approval_state: null,
          approved_by: "user-1",
        },
      ],
      error: null,
    });
    acceptancesMock.mockResolvedValue(
      new Map([["artifact-1", { id: "acc-1" }]]),
    );
    const ctx = makeCtx(
      [{ artifactCode: "d05_scope_memo", linkedArtifactId: "artifact-1" }],
      "scope",
    );
    const result = await findUnsatisfiedRequiredUpstream(ctx, [
      "d05_scope_memo",
    ]);
    expect(result).toEqual([]);
  });

  it("a superseded linked artifact is unsatisfied even with an acceptance record", async () => {
    sourceArtifactsMock.mockResolvedValue({
      data: [
        {
          id: "artifact-1",
          status: "approved",
          lifecycle_state: "superseded",
          approval_state: null,
          approved_by: "user-1",
        },
      ],
      error: null,
    });
    acceptancesMock.mockResolvedValue(
      new Map([["artifact-1", { id: "acc-1" }]]),
    );
    const ctx = makeCtx(
      [{ artifactCode: "d05_scope_memo", linkedArtifactId: "artifact-1" }],
      "scope",
    );
    const result = await findUnsatisfiedRequiredUpstream(ctx, [
      "d05_scope_memo",
    ]);
    expect(result).toEqual(["d05_scope_memo"]);
  });

  it("mixed batch: reports exactly the codes that are unsatisfied, one query for the whole batch", async () => {
    sourceArtifactsMock.mockResolvedValue({
      data: [
        {
          id: "artifact-1",
          status: "approved",
          lifecycle_state: "current",
          approval_state: null,
          approved_by: "user-1",
        },
        {
          id: "artifact-2",
          status: "draft",
          lifecycle_state: "current",
          approval_state: null,
          approved_by: null,
        },
      ],
      error: null,
    });
    acceptancesMock.mockResolvedValue(
      new Map([["artifact-1", { id: "acc-1" }]]), // only artifact-1 accepted
    );
    const ctx = makeCtx(
      [
        { artifactCode: "d01_strategy_memo", linkedArtifactId: "artifact-1" },
        { artifactCode: "d05_scope_memo", linkedArtifactId: "artifact-2" },
      ],
      "scope",
    );
    const result = await findUnsatisfiedRequiredUpstream(ctx, [
      "d01_strategy_memo",
      "d05_scope_memo",
    ]);
    expect(result).toEqual(["d05_scope_memo"]);
    expect(sourceArtifactsMock).toHaveBeenCalledTimes(1); // batched, not N+1
  });
});

describe("findUnsatisfiedDraftableUpstream", () => {
  it("treats a non-empty upstream draft body as enough for stage-entry drafting", () => {
    const ctx = makeCtx(
      [
        {
          artifactCode: "d01_strategy_memo",
          linkedArtifactId: "artifact-1",
          body: "# Strategy draft awaiting review",
        },
        {
          artifactCode: "d05_scope_memo",
          linkedArtifactId: "artifact-2",
          body: "# Scope draft awaiting review",
        },
      ],
      "rfp",
    );

    expect(
      findUnsatisfiedDraftableUpstream(ctx, [
        "d01_strategy_memo",
        "d05_scope_memo",
      ]),
    ).toEqual([]);
  });

  it("still reports required upstream codes that have no usable draft body", () => {
    const ctx = makeCtx(
      [
        {
          artifactCode: "d01_strategy_memo",
          linkedArtifactId: "artifact-1",
          body: "   ",
        },
        {
          artifactCode: "d05_scope_memo",
          linkedArtifactId: null,
          body: null,
        },
      ],
      "rfp",
    );

    expect(
      findUnsatisfiedDraftableUpstream(ctx, [
        "d01_strategy_memo",
        "d05_scope_memo",
      ]),
    ).toEqual(["d01_strategy_memo", "d05_scope_memo"]);
  });
});
