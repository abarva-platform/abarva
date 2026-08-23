import type { TenantAiPolicy } from "@/lib/integrations/ai-egress";

type Row = Record<string, unknown>;

const mockRows: Row[] = [];

interface MockBuilder {
  insert: jest.Mock;
  update: jest.Mock;
  select: jest.Mock;
  eq: jest.Mock;
  in: jest.Mock;
  is: jest.Mock;
  contains: jest.Mock;
  like: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
  single: jest.Mock;
  maybeSingle: jest.Mock;
  then: (
    onFulfilled: (result: { data: Row[] | null; error: null }) => unknown,
  ) => unknown;
}

function makeBuilder(table: string): MockBuilder {
  let inserted: Row | null = null;
  let updatePayload: Row | null = null;
  const filters: Array<{
    kind: "eq" | "in" | "is" | "contains" | "like";
    column: string;
    value: unknown;
  }> = [];
  let sortDescending = false;
  let rowLimit: number | null = null;

  function matchesRow(row: Row): boolean {
    return filters.every((filter) => {
      if (filter.kind === "eq") return row[filter.column] === filter.value;
      if (filter.kind === "is")
        return (row[filter.column] ?? null) === filter.value;
      if (filter.kind === "in")
        return (filter.value as unknown[]).includes(row[filter.column]);
      if (filter.kind === "contains") {
        const rowValue = row[filter.column];
        const wanted = filter.value as Record<string, unknown>;
        return (
          typeof rowValue === "object" &&
          rowValue !== null &&
          Object.entries(wanted).every(
            ([k, v]) => (rowValue as Record<string, unknown>)[k] === v,
          )
        );
      }
      if (filter.kind === "like") {
        const pattern = String(filter.value)
          .replace(/[.+^${}()|[\]\\]/g, "\\$&")
          .replace(/%/g, ".*");
        return new RegExp(`^${pattern}$`).test(String(row[filter.column]));
      }
      return true;
    });
  }

  const builder: MockBuilder = {
    insert: jest.fn((payload: Row) => {
      inserted = {
        rendered_at: "2026-06-05T12:00:00.000Z",
        superseded_by: null,
        ...payload,
      };
      mockRows.push(inserted);
      return builder;
    }),
    update: jest.fn((payload: Row) => {
      updatePayload = payload;
      return builder;
    }),
    select: jest.fn(() => builder),
    eq: jest.fn((column: string, value: unknown) => {
      filters.push({ kind: "eq", column, value });
      return builder;
    }),
    in: jest.fn((column: string, value: unknown[]) => {
      filters.push({ kind: "in", column, value });
      return builder;
    }),
    is: jest.fn((column: string, value: unknown) => {
      filters.push({ kind: "is", column, value });
      return builder;
    }),
    contains: jest.fn((column: string, value: unknown) => {
      filters.push({ kind: "contains", column, value });
      return builder;
    }),
    like: jest.fn((column: string, value: unknown) => {
      filters.push({ kind: "like", column, value });
      return builder;
    }),
    order: jest.fn((_column: string, options?: { ascending?: boolean }) => {
      sortDescending = options?.ascending === false;
      return builder;
    }),
    limit: jest.fn((count: number) => {
      rowLimit = count;
      return builder;
    }),
    single: jest.fn(async () => ({
      data: inserted,
      error: inserted ? null : { message: "No rows returned" },
    })),
    maybeSingle: jest.fn(async () => {
      let matches = mockRows.filter(matchesRow);
      if (sortDescending) {
        matches = [...matches].sort((a, b) =>
          String(b.rendered_at).localeCompare(String(a.rendered_at)),
        );
      }
      if (rowLimit != null) matches = matches.slice(0, rowLimit);
      return { data: matches[0] ?? null, error: null };
    }),
    // A bare `select().eq()...` chain (no `.single()`/`.maybeSingle()`) or an
    // `.update()` chain is awaited directly by the real client — support both
    // by making the builder thenable.
    then: (onFulfilled) => {
      if (updatePayload) {
        const matches = mockRows.filter(matchesRow);
        for (const row of matches) Object.assign(row, updatePayload);
        return Promise.resolve(onFulfilled({ data: matches, error: null }));
      }
      const matches = mockRows.filter(matchesRow);
      return Promise.resolve(onFulfilled({ data: matches, error: null }));
    },
  };

  if (table !== "generated_artifacts") {
    throw new Error(`unexpected table ${table}`);
  }
  return builder;
}

const mockClient = {
  from: jest.fn((table: string) => makeBuilder(table)),
};

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: () => mockClient,
}));

import {
  generateAndSaveBoardPack,
  getGeneratedArtifactById,
  getLatestGeneratedArtifact,
  listGeneratedArtifactsForMoveAllRefs,
  renderedHtmlFromGeneratedArtifact,
  saveRenderedBoardGradeMoveArtifact,
  saveGeneratedArtifact,
} from "../repository";
import type { BoardPackRenderInput, BoardPackRenderResult } from "../types";

const tenantPolicy: TenantAiPolicy = {
  allowExternalAI: true,
  kernelOnlyMode: false,
  allowClaude: true,
  allowGamma: true,
  maxDataClass: "confidential",
  requireRedaction: false,
  requireHumanApprovalForExports: true,
  promptResponseRetentionDays: 30,
};

describe("generated artifact repository", () => {
  beforeEach(() => {
    mockRows.length = 0;
    mockClient.from.mockClear();
  });

  it("generates, saves, and retrieves a board-grade Move pack with a persisted artifact reference", async () => {
    const { rendered, record } = await generateAndSaveBoardPack({
      clientId: "meridian",
      sourceArtifactRef: "move:phs-rule-3:costed-business-case",
      artifactType: "move_board_pack",
      renderEngine: "internal",
      outputFormat: "html",
      renderedBy: "jest-user",
      title: "PHS Rule 3 Board Pack",
      tenantPolicy,
      facts: [
        {
          id: "baseline-cost",
          label: "Baseline cost",
          value: "$2.4M",
          evidenceLedgerId: "00000000-0000-4000-8000-000000000101",
        },
      ],
      sections: [
        {
          id: "summary",
          title: "Summary",
          claims: [
            "Baseline cost is $2.4M [00000000-0000-4000-8000-000000000101]",
          ],
        },
        {
          id: "decision",
          title: "Decision",
          claims: ["Shape the move [00000000-0000-4000-8000-000000000101]"],
        },
        {
          id: "evidence",
          title: "Evidence",
          claims: ["Evidence 00000000-0000-4000-8000-000000000101"],
        },
      ],
    });

    expect(record.clientId).toBe("meridian");
    expect(record.sourceArtifactRef).toBe(
      "move:phs-rule-3:costed-business-case",
    );
    expect(record.blobUrl).toBe(`/api/v1/artifacts/${record.id}`);
    expect(record.blobUrl).not.toContain("generated://");
    expect(record.blobSha256).toBe(rendered.blobSha256);
    expect(renderedHtmlFromGeneratedArtifact(record)).toBe(rendered.html);

    const byId = await getGeneratedArtifactById(record.id, {
      clientId: "meridian",
    });
    expect(byId?.id).toBe(record.id);
    expect(renderedHtmlFromGeneratedArtifact(byId!)).toContain(
      "PHS Rule 3 Board Pack",
    );

    const latest = await getLatestGeneratedArtifact({
      clientId: "meridian",
      artifactType: "move_board_pack",
      sourceArtifactRef: "move:phs-rule-3:costed-business-case",
      outputFormat: "html",
    });
    expect(latest?.id).toBe(record.id);
  });

  it("supersedes a prior artifact of the same logical deliverable on regeneration", async () => {
    const input: BoardPackRenderInput = {
      clientId: "codex-fs-e2e",
      sourceArtifactRef: "4bf889aa-d4ee-4c1d-936b-51574614d191",
      artifactType: "move_board_pack",
      renderEngine: "internal",
      outputFormat: "html",
      renderedBy: "jest-user",
      title: "Target Architecture — first title the model chose",
      tenantPolicy,
      facts: [],
      sections: [],
    };
    const rendered: BoardPackRenderResult = {
      artifactType: "move_board_pack",
      sourceArtifactRef: input.sourceArtifactRef,
      renderEngine: "internal",
      outputFormat: "html",
      html: "<html>first run</html>",
      blobUrl: "",
      blobSha256: "sha-first",
      qualityScore: 90,
      evidenceLedgerIds: [],
      generationEgressAudit: null,
      quarantined: false,
      quarantineReason: null,
    };

    const first = await saveGeneratedArtifact(input, rendered, {
      deliverableTypeKey: "target_architecture",
    });
    expect(first.supersededBy).toBeNull();

    const second = await saveGeneratedArtifact(
      { ...input, title: "Target Architecture — a completely different title" },
      {
        ...rendered,
        blobSha256: "sha-second",
        html: "<html>second run</html>",
      },
      { deliverableTypeKey: "target_architecture" },
    );

    const firstAfter = await getGeneratedArtifactById(first.id, {
      clientId: "codex-fs-e2e",
    });
    expect(firstAfter?.supersededBy).toBe(second.id);
    expect(second.supersededBy).toBeNull();

    // A different Move must never be superseded by this one's regeneration.
    const otherMoveInput: BoardPackRenderInput = {
      ...input,
      sourceArtifactRef: "some-other-move-id",
    };
    const otherMoveRendered: BoardPackRenderResult = {
      ...rendered,
      sourceArtifactRef: "some-other-move-id",
      blobSha256: "sha-other-move",
    };
    const otherMoveArtifact = await saveGeneratedArtifact(
      otherMoveInput,
      otherMoveRendered,
      { deliverableTypeKey: "target_architecture" },
    );
    expect(otherMoveArtifact.supersededBy).toBeNull();
    const firstStillIntact = await getGeneratedArtifactById(first.id, {
      clientId: "codex-fs-e2e",
    });
    expect(firstStillIntact?.supersededBy).toBe(second.id);

    // A different deliverable type for the SAME Move must never be superseded.
    const sourcingStrategy = await saveGeneratedArtifact(
      { ...input, title: "Sourcing Strategy" },
      { ...rendered, blobSha256: "sha-sourcing" },
      { deliverableTypeKey: "sourcing_strategy" },
    );
    expect(sourcingStrategy.supersededBy).toBeNull();
    const secondStillCurrent = await getGeneratedArtifactById(second.id, {
      clientId: "codex-fs-e2e",
    });
    expect(secondStillCurrent?.supersededBy).toBeNull();
  });

  it("supersedes legacy generated artifacts keyed by metadata artifactId", async () => {
    const input: BoardPackRenderInput = {
      clientId: "codex-fs-e2e",
      sourceArtifactRef: "move:move-legacy:target_architecture",
      artifactType: "move_board_pack",
      renderEngine: "internal",
      outputFormat: "html",
      renderedBy: "jest-user",
      title: "Target Architecture",
      tenantPolicy,
      facts: [],
      sections: [],
    };
    const rendered: BoardPackRenderResult = {
      artifactType: "move_board_pack",
      sourceArtifactRef: input.sourceArtifactRef,
      renderEngine: "internal",
      outputFormat: "html",
      html: "<html>legacy</html>",
      blobUrl: "",
      blobSha256: "sha-legacy",
      qualityScore: 90,
      evidenceLedgerIds: [],
      generationEgressAudit: null,
      quarantined: false,
      quarantineReason: null,
    };

    const legacy = await saveGeneratedArtifact(input, rendered, {
      artifactId: "target_architecture",
    });
    const current = await saveGeneratedArtifact(
      input,
      { ...rendered, html: "<html>clean</html>", blobSha256: "sha-clean" },
      { deliverableTypeKey: "target_architecture" },
    );

    const legacyAfter = await getGeneratedArtifactById(legacy.id, {
      clientId: "codex-fs-e2e",
    });
    expect(legacyAfter?.supersededBy).toBe(current.id);
  });

  it("persists structured renderable metadata for board-grade Move artifacts", async () => {
    const record = await saveRenderedBoardGradeMoveArtifact({
      clientId: "meridian",
      moveId: "move-structured",
      artifactId: "discover-brief",
      title: "Discover Brief",
      html: "<html><body>structured projection</body></html>",
      renderableDoc: {
        title: "Discover Brief",
        generatedSections: [{ key: "summary", title: "Summary" }],
      },
      renderableMetadata: {
        artifactType: "discover-brief",
        source: "moves_orchestrated_deliverables",
        evidenceRefs: ["ctx:1"],
      },
      renderedBy: "jest-user",
      routePath: "/api/v1/moves/board-grade-discover-brief",
      generatedOn: "2026-08-20",
    });

    expect(record.metadata.renderedHtml).toContain("structured projection");
    expect(record.metadata.deliverableTypeKey).toBe("discover-brief");
    expect(record.metadata.renderableDoc).toEqual(
      expect.objectContaining({ title: "Discover Brief" }),
    );
    expect(record.metadata.renderableMetadata).toEqual(
      expect.objectContaining({
        artifactType: "discover-brief",
        source: "moves_orchestrated_deliverables",
      }),
    );
  });

  it("links regenerated board-grade Move artifacts to the prior immutable version", async () => {
    const first = await saveRenderedBoardGradeMoveArtifact({
      clientId: "meridian",
      moveId: "move-versioned",
      artifactId: "business-case",
      title: "Business Case",
      html: "<html><body>first version</body></html>",
      renderableDoc: {
        title: "Business Case",
        generatedSections: [{ key: "summary", title: "Summary v1" }],
      },
      renderedBy: "jest-user",
      routePath: "/api/v1/moves/board-grade-business-case",
      generatedOn: "2026-08-20",
    });

    const second = await saveRenderedBoardGradeMoveArtifact({
      clientId: "meridian",
      moveId: "move-versioned",
      artifactId: "business-case",
      title: "Business Case",
      html: "<html><body>second version</body></html>",
      renderableDoc: {
        title: "Business Case",
        generatedSections: [{ key: "summary", title: "Summary v2" }],
      },
      renderedBy: "jest-user",
      routePath: "/api/v1/moves/board-grade-business-case",
      generatedOn: "2026-08-20",
    });

    const firstAfter = await getGeneratedArtifactById(first.id, {
      clientId: "meridian",
    });
    const secondAfter = await getGeneratedArtifactById(second.id, {
      clientId: "meridian",
    });

    expect(firstAfter?.supersededBy).toBe(second.id);
    expect(firstAfter?.metadata.renderedHtml).toContain("first version");
    expect(firstAfter?.metadata.renderableDoc).toEqual(
      expect.objectContaining({ title: "Business Case" }),
    );
    expect(secondAfter?.supersededBy).toBeNull();
    expect(secondAfter?.metadata.renderedHtml).toContain("second version");
  });

  it("lists generated Move artifacts across client UUID and tenant-key storage conventions", async () => {
    const rendered: BoardPackRenderResult = {
      artifactType: "move_board_pack",
      sourceArtifactRef: "move-1",
      renderEngine: "internal",
      outputFormat: "html",
      html: "<html>exact</html>",
      blobUrl: "",
      blobSha256: "sha-exact",
      qualityScore: 90,
      evidenceLedgerIds: [],
      generationEgressAudit: null,
      quarantined: false,
      quarantineReason: null,
    };
    const uuidStored = await saveGeneratedArtifact(
      {
        clientId: "client-uuid",
        sourceArtifactRef: "move-1",
        artifactType: "move_board_pack",
        renderEngine: "internal",
        outputFormat: "html",
        renderedBy: "jest-user",
        title: "Exact",
        tenantPolicy,
        facts: [],
        sections: [],
      },
      rendered,
      { deliverableTypeKey: "business_case" },
    );
    const keyStored = await saveRenderedBoardGradeMoveArtifact({
      clientId: "tenant-key",
      moveId: "move-1",
      artifactId: "target_architecture",
      title: "Prefixed",
      html: "<html>prefixed</html>",
      renderedBy: "jest-user",
      routePath: "/api/v1/moves/board-grade-target-architecture",
      generatedOn: "2026-08-23",
    });

    const rows = await listGeneratedArtifactsForMoveAllRefs({
      clientId: "client-uuid",
      clientIds: ["tenant-key"],
      moveId: "move-1",
    });

    expect(rows.map((row) => row.id)).toEqual(
      expect.arrayContaining([uuidStored.id, keyStored.id]),
    );
  });
});
