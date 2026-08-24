import { azureRead } from "@/lib/data-plane/azureRead";
import { readIntelligenceEclContextPackPreview } from "../eclContextPackPreview";

jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: {
    query: jest.fn(),
  },
}));

const mockAzureRead = jest.mocked(azureRead);

describe("readIntelligenceEclContextPackPreview", () => {
  beforeEach(() => {
    mockAzureRead.query.mockReset();
  });

  it("summarizes the ECL context pack projection without mutating the default Intelligence surface", async () => {
    mockAzureRead.query.mockResolvedValue([
      {
        row_key: "pack-001",
        surface_key: "strategy",
        retrieval_state: "cited",
        value_state: "known",
        quality_state: "passed",
        access_class: "client_confidential",
        prompt_context_json: {
          title: "AI strategy pressure",
          summary: "Cited facts are ready for Intelligence grounding.",
        },
        permitted_facts_json: [{ id: "fact-1" }, { id: "fact-2" }],
        blocked_facts_json: [{ id: "blocked-1" }],
        citation_refs_json: [{ id: "cite-1" }],
        gap_flags_json: [],
        source_hash: "hash-1",
      },
      {
        row_key: "pack-002",
        surface_key: "source",
        retrieval_state: "indexed",
        value_state: "known",
        quality_state: "warning",
        access_class: "internal",
        prompt_context_json: {
          heading: "Commercial leverage",
          description: "Indexed Source facts need review before citation.",
        },
        permitted_facts_json: [{ id: "fact-3" }],
        blocked_facts_json: [],
        citation_refs_json: [],
        gap_flags_json: [{ code: "missing_review" }],
        source_hash: "hash-2",
      },
    ]);

    const preview = await readIntelligenceEclContextPackPreview(
      "meridian-health",
    );

    expect(mockAzureRead.query).toHaveBeenCalledWith(
      expect.stringContaining(
        "from ecl_projection.intelligence_context_pack",
      ),
      ["meridian-health", "assessment-dense-source-room-20260823"],
      { missingTable: "empty" },
    );
    expect(preview?.provider).toBe("ecl_projection_db");
    expect(preview?.rowCount).toBe(2);
    expect(preview?.totals).toEqual({
      permittedFacts: 3,
      blockedFacts: 1,
      citations: 1,
      gaps: 1,
    });
    expect(preview?.retrievalCounts).toEqual([
      { retrievalState: "cited", count: 1 },
      { retrievalState: "indexed", count: 1 },
    ]);
    expect(preview?.contextRows[0]).toEqual(
      expect.objectContaining({
        rowKey: "pack-001",
        title: "AI strategy pressure",
        citationCount: 1,
      }),
    );
  });

  it("fails loudly when the ECL provider is requested before rows exist", async () => {
    mockAzureRead.query.mockResolvedValue([]);

    await expect(
      readIntelligenceEclContextPackPreview("meridian-health"),
    ).rejects.toThrow(
      "Intelligence ECL preview: no ecl_projection.intelligence_context_pack rows",
    );
  });
});
