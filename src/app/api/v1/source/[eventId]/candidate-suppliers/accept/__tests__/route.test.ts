const requireTenancyMock = jest.fn();
const getActiveClientRowMock = jest.fn();
const getCurrentUserMock = jest.fn();
const loadPolicyMock = jest.fn();
const acceptMock = jest.fn();
const revalidatePathMock = jest.fn();

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: () => requireTenancyMock(),
  tenancyErrorResponse: () =>
    Response.json({ error: "forbidden" }, { status: 403 }),
}));
jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: () => getActiveClientRowMock(),
}));
jest.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: () => getCurrentUserMock(),
}));
jest.mock("@/lib/auth/source-access-policy", () => ({
  loadUserSourceAccessPolicy: (...args: unknown[]) => loadPolicyMock(...args),
}));
jest.mock(
  "@/lib/source/candidate-suppliers/event-candidate-acceptance-repository",
  () => ({
    acceptEventCandidateSupplier: (...args: unknown[]) => acceptMock(...args),
  }),
);
jest.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}));

import { POST } from "../route";

const params = {
  params: Promise.resolve({ eventId: "11111111-1111-4111-8111-111111111111" }),
};

function request() {
  const body = new FormData();
  body.set("supplierId", "supplier-1");
  body.set("categoryId", "managed-services");
  body.set("archetypeId", "application-managed-services");
  body.set("sourceReference", "EVID-SUPPLIER-1");
  body.set("rationale", "Meets the governed Stage 04 eligibility review.");
  return new Request(
    "https://app.example.test/api/v1/source/11111111-1111-4111-8111-111111111111/candidate-suppliers/accept",
    { method: "POST", body },
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  requireTenancyMock.mockResolvedValue({
    clientKey: "tenant-alpha",
    userId: "person-1",
  });
  getActiveClientRowMock.mockResolvedValue({
    key: "tenant-alpha",
    name: "Example client",
  });
  getCurrentUserMock.mockResolvedValue({
    name: "Named Procurement Reviewer",
  });
  loadPolicyMock.mockResolvedValue({ canApproveSourceStages: true });
  acceptMock.mockResolvedValue({ ok: true, authorityId: "authority-1" });
});

describe("candidate supplier acceptance route", () => {
  it("records acceptance with server-side tenant and named signed-in reviewer", async () => {
    const response = await POST(request(), params);

    expect(response.status).toBe(303);
    expect(acceptMock).toHaveBeenCalledWith({
      clientKey: "tenant-alpha",
      eventId: "11111111-1111-4111-8111-111111111111",
      supplierId: "supplier-1",
      expectedCategoryId: "managed-services",
      expectedArchetypeId: "application-managed-services",
      expectedSourceReference: "EVID-SUPPLIER-1",
      acceptedByUserId: "person-1",
      acceptedByName: "Named Procurement Reviewer",
      rationale: "Meets the governed Stage 04 eligibility review.",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/source/new/11111111-1111-4111-8111-111111111111",
    );
  });

  it("blocks users without Source stage approval authority", async () => {
    loadPolicyMock.mockResolvedValue({ canApproveSourceStages: false });

    const response = await POST(request(), params);

    expect(response.status).toBe(403);
    expect(acceptMock).not.toHaveBeenCalled();
  });
});
