const canReadProgramMock = jest.fn();
const mockAzureSelect = jest.fn();

jest.mock("@/lib/auth/program-access-policy", () => ({
  canReadProgram: (...args: unknown[]) => canReadProgramMock(...args),
}));

jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: {
    select: (...args: unknown[]) => mockAzureSelect(...args),
  },
}));

import {
  CANONICAL_TENANT_KEYS,
  appClientKeyForTenant,
} from "@/lib/tenant/aliases";
import { moveEvidenceReadTenantKeys } from "../evidence-readiness/tenant-read-scope";
import {
  formatProgramEvidenceForPrompt,
  listProgramEvidenceForPrompt,
} from "../evidence-context";

// A move-scoped evidence read is scoped to the caller's tenant, and a context
// without a client key reads nothing at all by design — so these cases, which
// are about approved-vs-pending filtering rather than about tenancy, need a
// context that names a real tenant. The key comes from code, never hand-typed.
// The scope the module is expected to ask for, derived rather than restated so
// this suite cannot drift from the read-scope contract it does not own.
const TENANT_SCOPE = moveEvidenceReadTenantKeys(
  appClientKeyForTenant(CANONICAL_TENANT_KEYS[0]),
);

const CTX = {
  clientId: "client-1",
  clientKey: appClientKeyForTenant(CANONICAL_TENANT_KEYS[0])!,
  userId: "user-1",
  role: "program_user",
};

describe("program evidence context prompt block", () => {
  beforeEach(() => {
    canReadProgramMock.mockReset();
    canReadProgramMock.mockResolvedValue(true);
    mockAzureSelect.mockReset();
    mockAzureSelect.mockResolvedValue([]);
  });

  it("lists only APPROVED captured program evidence after access is allowed", async () => {
    mockAzureSelect
      .mockResolvedValueOnce([
        {
          evidence_id: "evidence-1",
          reviewed_at: "2026-05-03T00:00:00.000Z",
          updated_at: "2026-05-03T00:00:00.000Z",
          source_ref: {
            reviewed_extraction: {
              version: 1,
              summary: "Human-corrected evidence summary",
              structured: {
                decisions: ["Use a phased rollout"],
                risks: ["Legacy feed quality remains unverified"],
                baselineCandidates: ["Feed completeness is 81 percent"],
                actionItems: ["Confirm source owner"],
                observations: ["Two source systems are in scope"],
                assumptions: ["Daily refresh is feasible"],
                openQuestions: ["Who owns exception handling?"],
                citations: [{ quote: "81% complete", locator: "page 4" }],
              },
            },
          },
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "evidence-1",
          title: "pasted-workshop-notes-2026-05-02.txt",
          evidence_type: "meeting_notes",
          phase: 2,
          summary: "Original parser summary",
          extracted_text:
            "Baseline candidate: application inventory completeness is 72 percent.",
          extracted_structured: {
            parse_method: "text-line-parser",
            baseline_candidates: [
              "Application inventory completeness is 72 percent.",
            ],
          },
          created_at: "2026-05-02T03:36:02.000Z",
        },
      ]);

    const items = await listProgramEvidenceForPrompt(
      CTX,
      "program-1",
    );

    expect(canReadProgramMock).toHaveBeenCalledWith(
      CTX,
      "program-1",
    );
    expect(items).toEqual([
      expect.objectContaining({
        title: "pasted-workshop-notes-2026-05-02.txt",
        parseMethod: "text-line-parser",
        summary: "Human-corrected evidence summary",
        structuredSignals: [
          "Feed completeness is 81 percent",
          "Use a phased rollout",
          "Confirm source owner",
          "Legacy feed quality remains unverified",
        ],
        observations: ["Two source systems are in scope"],
        assumptions: ["Daily refresh is feasible"],
        openQuestions: ["Who owns exception handling?"],
        citations: [{ quote: "81% complete", locator: "page 4" }],
        extractedText: null,
        approvedAt: "2026-05-03T00:00:00.000Z",
      }),
    ]);
    expect(items[0].extractedText).toBeNull();
    const prompt = formatProgramEvidenceForPrompt(items);
    expect(prompt).toContain("Human-corrected evidence summary");
    expect(prompt).toContain('"81% complete" (page 4)');
    expect(prompt).not.toContain("72 percent");
    expect(mockAzureSelect).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        table: "program_evidence_reviews",
        where: {
          tenant_key: { op: "in", value: TENANT_SCOPE },
          program_id: "program-1",
          decision: "approved",
        },
        limit: 500,
      }),
    );
    expect(mockAzureSelect).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        table: "program_evidence_items",
        where: {
          tenant_key: { op: "in", value: TENANT_SCOPE },
          program_id: "program-1",
          id: { op: "in", value: ["evidence-1"] },
        },
        orderBy: { column: "created_at", direction: "desc" },
        limit: 500,
      }),
    );
  });

  it("scopes the program_evidence_items query to a specific phase when provided", async () => {
    mockAzureSelect
      .mockResolvedValueOnce([
        {
          evidence_id: "evidence-2",
          reviewed_at: "2026-05-03T00:00:00.000Z",
          updated_at: "2026-05-03T00:00:00.000Z",
        },
      ])
      .mockResolvedValueOnce([]);

    await listProgramEvidenceForPrompt(
      CTX,
      "program-1",
      2,
    );

    expect(mockAzureSelect).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        table: "program_evidence_items",
        where: {
          tenant_key: { op: "in", value: TENANT_SCOPE },
          program_id: "program-1",
          id: { op: "in", value: ["evidence-2"] },
          phase: 2,
        },
      }),
    );
  });

  it("returns nothing when no evidence has been approved", async () => {
    mockAzureSelect.mockResolvedValueOnce([]);
    const items = await listProgramEvidenceForPrompt(
      CTX,
      "program-1",
    );
    expect(items).toEqual([]);
    expect(mockAzureSelect).toHaveBeenCalledTimes(1);
  });

  it("formats evidence so Nexus cannot call the ledger empty", () => {
    const block = formatProgramEvidenceForPrompt([
      {
        id: "evidence-1",
        title: "pasted-workshop-notes-2026-05-02.txt",
        evidenceType: "meeting_notes",
        phase: 2,
        summary: "Parsed workshop notes",
        extractedText:
          "Baseline candidate: application inventory completeness is 72 percent.",
        parseMethod: "text-line-parser",
        structuredSignals: [
          "Average monthly invoice exceptions: 1,872.",
          "Manual touch hours per month: 2,345.",
          "Average resolution days: 7.4.",
        ],
        createdAt: "2026-05-02T03:36:02.000Z",
        approvedAt: "2026-05-03T00:00:00.000Z",
        observations: [],
        assumptions: [],
        openQuestions: [],
        citations: [],
      },
    ]);

    expect(block).toContain("PROGRAM EVIDENCE LEDGER");
    expect(block).toContain("pasted-workshop-notes-2026-05-02.txt");
    expect(block).toContain("Structured signals");
    expect(block).toContain("1,872");
    expect(block).toContain("2,345");
    expect(block).toContain("7.4");
    expect(block).toContain("Do not say there are zero uploaded items");
  });
});
