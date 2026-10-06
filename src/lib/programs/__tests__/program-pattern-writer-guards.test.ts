const requireTenancyMock = jest.fn();
const loadAccessPolicyMock = jest.fn();
const getActiveClientRowMock = jest.fn();
const resolvePatternMock = jest.fn();
const fromMock = jest.fn();

jest.mock("@/app/api/v1/programs/_auth", () => ({
  requireTenancy: (...args: unknown[]) => requireTenancyMock(...args),
  TenancyError: class TenancyError extends Error {
    code = "unauthenticated";
  },
}));

jest.mock("@/lib/auth/program-access-policy", () => ({
  loadUserProgramAccessPolicy: (...args: unknown[]) => loadAccessPolicyMock(...args),
}));

jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: (...args: unknown[]) => getActiveClientRowMock(...args),
}));

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: () => ({ from: fromMock }),
}));

jest.mock("../pattern-authority", () => ({
  programPatternLookupFromClient: () => jest.fn(),
  resolvePromotedProgramPatternKey: (...args: unknown[]) => resolvePatternMock(...args),
  isProgramPatternAuthorityError: (error: unknown) =>
    (error as { code?: string } | null)?.code === "program_pattern_not_promoted",
}));

import { submitOriginationBrief } from "../origination-submit";
import { originateProgram } from "../mutations";

function rejectedPattern(): Error & { code: string } {
  return Object.assign(new Error("Pattern key is not promoted in the Programs catalog."), {
    code: "program_pattern_not_promoted",
  });
}

describe("Programs pattern authority at write boundaries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireTenancyMock.mockResolvedValue({
      clientId: "client-1",
      clientKey: "tenant-a",
      userId: "user-1",
      role: "client_admin",
    });
    loadAccessPolicyMock.mockResolvedValue({ canCreatePrograms: true });
    getActiveClientRowMock.mockResolvedValue({
      id: "client-1",
      key: "tenant-a",
      name: "Example Organization",
      industry_code: "general",
    });
    resolvePatternMock.mockRejectedValue(rejectedPattern());
  });

  it("refuses an unpromoted key before the origination-submit path writes", async () => {
    await expect(
      submitOriginationBrief({
        surface: "/programs/new",
        programName: "Operating model reset",
        problemStatement: "The current operating model is not meeting its target outcomes.",
        sponsor: "Executive Sponsor",
        matchedPatternId: "PAT-INVENTED-001",
      }),
    ).rejects.toMatchObject({ code: "program_pattern_not_promoted" });

    expect(resolvePatternMock).toHaveBeenCalledWith(
      "PAT-INVENTED-001",
      expect.any(Function),
    );
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("refuses an unpromoted key before originateProgram writes", async () => {
    await expect(
      originateProgram(
        { clientId: "client-1", clientKey: "tenant-a", userId: "user-1" },
        {
          name: "Operating model reset",
          useCase: "Improve delivery reliability.",
          archetype: null,
          originSource: "user_initiated",
          acceptedPatternKey: "PAT-INVENTED-001",
        },
      ),
    ).rejects.toMatchObject({ code: "program_pattern_not_promoted" });

    expect(resolvePatternMock).toHaveBeenCalledWith(
      "PAT-INVENTED-001",
      expect.any(Function),
    );
    expect(fromMock).not.toHaveBeenCalled();
  });
});
