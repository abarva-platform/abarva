jest.mock("server-only", () => ({}));
jest.mock("@/lib/evidence/ledger", () => ({
  getEvidenceProofPointCount: jest.fn(async () => ({ total: 0 })),
}));
jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: jest.fn(),
}));

import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import {
  getDecisionThreadDossier,
  recordDecisionOptions,
  type DecisionThreadOptionRow,
} from "@/lib/decisions/auto-linker";

const getClientMock = getAzureWriteFluentClient as jest.MockedFunction<
  typeof getAzureWriteFluentClient
>;

function mockDecisionClient() {
  const inserted: DecisionThreadOptionRow[] = [];
  const deletedThreadIds: string[] = [];
  const touchedThreadIds: string[] = [];
  const thread = {
    id: "thread-1",
    client_id: "meridian",
    thread_slug: "meridian-agent-assist",
    title: "Agent Assist approach",
    originating_intelligence_session: null,
    primary_owner_role: "CDIO",
    status: "in_flight",
    created_at: "2026-07-18T00:00:00.000Z",
    last_activity_at: "2026-07-18T00:00:00.000Z",
  };
  const link = {
    id: "link-1",
    thread_id: "thread-1",
    surface: "moves",
    artifact_ref: "move-1",
    linked_at: "2026-07-18T00:00:00.000Z",
    linked_by: "test",
    link_reason: "test link",
  };

  const client = {
    from: jest.fn((table: string) => ({
      delete: () => ({
        eq: async (_column: string, value: string) => {
          deletedThreadIds.push(value);
          return { error: null };
        },
      }),
      insert: (rows: Array<Record<string, unknown>>) => ({
        select: async () => {
          inserted.splice(
            0,
            inserted.length,
            ...rows.map((row, index) => ({
              id: `option-${index + 1}`,
              created_at: `2026-07-18T00:00:0${index}.000Z`,
              ...(row as Omit<DecisionThreadOptionRow, "id" | "created_at">),
            })),
          );
          return { data: inserted, error: null };
        },
      }),
      update: () => ({
        eq: async (_column: string, value: string) => {
          touchedThreadIds.push(value);
          return { error: null };
        },
      }),
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: table === "decision_threads" ? thread : null,
            error: null,
          }),
          order: async () => ({
            data:
              table === "decision_thread_links"
                ? [link]
                : table === "decision_thread_options"
                  ? inserted
                  : [],
            error: null,
          }),
        }),
      }),
    })),
  };

  getClientMock.mockReturnValue(
    client as unknown as ReturnType<typeof getAzureWriteFluentClient>,
  );
  return { client, deletedThreadIds, inserted, touchedThreadIds };
}

describe("decision thread options", () => {
  beforeEach(() => {
    getClientMock.mockReset();
  });

  it("replaces selected and rejected KDD alternatives and round-trips them in the dossier", async () => {
    const { deletedThreadIds, inserted, touchedThreadIds } = mockDecisionClient();

    const rows = await recordDecisionOptions("thread-1", [
      {
        label: "Process-first assist",
        rationaleFor: "Fastest path",
        rationaleAgainst: "Lower transformation value",
      },
      {
        label: "Balanced platform path",
        rationaleFor: "Best balance",
        rationaleAgainst: "More coordination",
        isSelected: true,
        decidedBy: "CDIO",
      },
      {
        label: "Full redesign",
        rationaleFor: "Largest upside",
        rationaleAgainst: "Highest readiness burden",
      },
    ]);

    expect(deletedThreadIds).toEqual(["thread-1"]);
    expect(touchedThreadIds).toEqual(["thread-1"]);
    expect(rows).toHaveLength(3);
    expect(inserted.filter((row) => row.is_selected)).toHaveLength(1);
    expect(inserted[1]).toMatchObject({
      label: "Balanced platform path",
      rationale_for: "Best balance",
      rationale_against: "More coordination",
      is_selected: true,
      decided_by: "CDIO",
    });

    const dossier = await getDecisionThreadDossier("thread-1");
    expect(dossier?.options.map((option) => option.label)).toEqual([
      "Process-first assist",
      "Balanced platform path",
      "Full redesign",
    ]);
    expect(dossier?.options.find((option) => option.is_selected)?.label).toBe(
      "Balanced platform path",
    );
  });

  it("requires exactly one selected alternative", async () => {
    mockDecisionClient();

    await expect(
      recordDecisionOptions("thread-1", [
        { label: "Option A", isSelected: true },
        { label: "Option B", isSelected: true },
      ]),
    ).rejects.toThrow("exactly one selected");
  });
});
