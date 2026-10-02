jest.mock("@/lib/auth/program-access-policy", () => ({
  canReadProgram: jest.fn(),
  allowedProgramIdsForUser: jest.fn(),
}));

jest.mock("@/lib/data-plane/read-adapters/programsReadAdapter", () => ({
  createSupabaseProgramsReadAdapter: jest.fn(),
  selectProgramsReadAdapter: jest.fn(),
}));

import { canReadProgram } from "@/lib/auth/program-access-policy";
import { selectProgramsReadAdapter } from "@/lib/data-plane/read-adapters/programsReadAdapter";
import { getProgramForTurnByGraphNodeId } from "../queries";

const mockCanReadProgram = jest.mocked(canReadProgram);
const mockSelectProgramsReadAdapter = jest.mocked(selectProgramsReadAdapter);

const tenancy = {
  clientId: "client-1",
  clientKey: "tenant-one",
  userId: "user-1",
} as never;

const row = {
  id: "move-1",
  client_id: "client-1",
  graph_node_id: "graph-1",
  name: "Move",
  industry_code: null,
  function_code: null,
  objective_code: null,
  topic_code: null,
  sponsor_person_id: "contact-1",
  current_phase: 1,
};

describe("getProgramForTurnByGraphNodeId", () => {
  const getProgramByGraphNodeIdRow = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectProgramsReadAdapter.mockReturnValue({
      getProgramByGraphNodeIdRow,
    } as never);
    getProgramByGraphNodeIdRow.mockResolvedValue(row);
    mockCanReadProgram.mockResolvedValue(true);
  });

  it("uses the active client's graph-id query and then checks per-Move access", async () => {
    await expect(
      getProgramForTurnByGraphNodeId(tenancy, "graph-1"),
    ).resolves.toEqual(row);

    expect(mockSelectProgramsReadAdapter).toHaveBeenCalledWith(
      undefined,
      "tenant-one",
    );
    expect(getProgramByGraphNodeIdRow).toHaveBeenCalledWith(
      "graph-1",
      "client-1",
    );
    expect(mockCanReadProgram).toHaveBeenCalledWith(tenancy, "move-1");
  });

  it("returns no Move when the caller's workspace policy denies access", async () => {
    mockCanReadProgram.mockResolvedValue(false);

    await expect(
      getProgramForTurnByGraphNodeId(tenancy, "graph-1"),
    ).resolves.toBeNull();
  });

  it("does not evaluate a Move policy when the active-client query finds no row", async () => {
    getProgramByGraphNodeIdRow.mockResolvedValue(null);

    await expect(
      getProgramForTurnByGraphNodeId(tenancy, "other-tenant-graph"),
    ).resolves.toBeNull();
    expect(mockCanReadProgram).not.toHaveBeenCalled();
  });
});
