import type { TenantAiPolicy } from "@/lib/integrations/ai-egress";

type Row = Record<string, unknown>;

const mockRows: Row[] = [];

interface MockBuilder {
  insert: jest.Mock;
  select: jest.Mock;
  eq: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
  single: jest.Mock;
  maybeSingle: jest.Mock;
}

function makeBuilder(table: string): MockBuilder {
  let inserted: Row | null = null;
  const filters: Array<{ column: string; value: unknown }> = [];
  let sortDescending = false;
  let rowLimit: number | null = null;

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
    select: jest.fn(() => builder),
    eq: jest.fn((column: string, value: unknown) => {
      filters.push({ column, value });
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
      let matches = mockRows.filter((row) =>
        filters.every((filter) => row[filter.column] === filter.value),
      );
      if (sortDescending) {
        matches = [...matches].sort((a, b) =>
          String(b.rendered_at).localeCompare(String(a.rendered_at)),
        );
      }
      if (rowLimit != null) matches = matches.slice(0, rowLimit);
      return { data: matches[0] ?? null, error: null };
    }),
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
  renderedHtmlFromGeneratedArtifact,
} from "../repository";

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
});
