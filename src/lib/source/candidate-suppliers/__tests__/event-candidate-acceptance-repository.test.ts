const runMock = jest.fn();
const mockTx = jest.fn();

jest.mock("@/lib/data-plane/read-adapters/azureSession", () => ({
  createTxSession: () => mockTx,
}));

import { acceptEventCandidateSupplier } from "../event-candidate-acceptance-repository";

const input = {
  clientKey: "tenant-alpha",
  eventId: "11111111-1111-4111-8111-111111111111",
  supplierId: "supplier-1",
  expectedCategoryId: "ams",
  expectedArchetypeId: "AMS_MANAGED_SERVICES",
  expectedEventVersionId: "22222222-2222-4222-8222-222222222222",
  expectedSourceReference: "EVID-SUPPLIER-1",
  acceptedByUserId: "person-1",
  acceptedByName: "Named Procurement Reviewer",
  rationale: "Meets the governed Stage 04 eligibility review.",
};

function eligibleSupplier(overrides: Record<string, unknown> = {}) {
  return {
    vendor_id: "supplier-1",
    legal_name: "Example Services LLC",
    supplier_category: "managed-services",
    source_record_id: "supplier-master.csv#row-2",
    evidence_reference: "EVID-SUPPLIER-1",
    raw_payload: {
      candidate_supplier_registry: {
        authorityState: "accepted",
        categoryKeys: ["ams"],
        archetypeKeys: ["AMS_MANAGED_SERVICES"],
      },
    },
    ...overrides,
  };
}

describe("event candidate acceptance repository", () => {
  beforeEach(() => {
    runMock.mockReset();
    mockTx.mockReset();
    mockTx.mockImplementation(
      async (callback: (run: typeof runMock) => unknown) => callback(runMock),
    );
    runMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: input.eventId,
          event_type: "managed_service",
          classified_category: "ams",
        },
      ])
      .mockResolvedValueOnce([
        { id: input.expectedEventVersionId, request_accepted: true },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([eligibleSupplier()])
      .mockResolvedValueOnce([
        {
          authority_id: `stage04:${input.eventId}:${input.expectedEventVersionId}:${input.supplierId}`,
        },
      ]);
  });

  it("appends accepted authority for a current eligible registry suggestion only", async () => {
    await expect(acceptEventCandidateSupplier(input)).resolves.toEqual({
      ok: true,
      authorityId: `stage04:${input.eventId}:${input.expectedEventVersionId}:${input.supplierId}`,
    });

    const insertSql = runMock.mock.calls.at(-1)?.[0] as string;
    expect(insertSql).toContain(
      "INSERT INTO source_event_candidate_supplier_authority",
    );
    expect(insertSql).toContain("authority_state");
    expect(insertSql).toContain("accepted_by_user_id");
    expect(insertSql).toContain("accepted_by_name");
    expect(insertSql).toContain("acceptance_rationale");
    expect(insertSql).toContain("evidence_reference");
    expect(insertSql).not.toMatch(/contact|invite|invitation|award|email/i);
    expect(runMock.mock.calls[2]?.[0]).toContain(
      "FROM source_event_authority_versions",
    );
    expect(runMock.mock.calls[2]?.[1]).toEqual([
      input.clientKey,
      input.eventId,
    ]);
    expect(runMock.mock.calls.at(-1)?.[1]).toEqual([
      `stage04:${input.eventId}:${input.expectedEventVersionId}:${input.supplierId}`,
      input.clientKey,
      input.eventId,
      input.supplierId,
      input.acceptedByUserId,
      input.acceptedByName,
      input.rationale,
      input.expectedSourceReference,
    ]);
  });

  it("rejects a stale event mapping before supplier authority is inserted", async () => {
    runMock.mockReset();
    runMock.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        id: input.eventId,
        event_type: "managed_service",
        classified_category: "cloud_finops",
      },
    ]);

    await expect(acceptEventCandidateSupplier(input)).resolves.toEqual(
      expect.objectContaining({ ok: false, code: "stale_event_mapping" }),
    );
    expect(
      runMock.mock.calls.some((call) =>
        String(call[0]).includes("INSERT INTO"),
      ),
    ).toBe(false);
  });

  it("rejects a supplier whose registry source reference changed", async () => {
    runMock.mockReset();
    runMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: input.eventId,
          event_type: "managed_service",
          classified_category: "ams",
        },
      ])
      .mockResolvedValueOnce([
        { id: input.expectedEventVersionId, request_accepted: true },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        eligibleSupplier({ evidence_reference: "EVID-NEW" }),
      ]);

    await expect(acceptEventCandidateSupplier(input)).resolves.toEqual(
      expect.objectContaining({ ok: false, code: "stale_supplier_reference" }),
    );
    expect(
      runMock.mock.calls.some((call) =>
        String(call[0]).includes("INSERT INTO"),
      ),
    ).toBe(false);
  });

  it("rejects a stale request version before supplier authority is inserted", async () => {
    runMock.mockReset();
    runMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: input.eventId,
          event_type: "managed_service",
          classified_category: "ams",
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "33333333-3333-4333-8333-333333333333",
          request_accepted: true,
        },
      ]);

    await expect(acceptEventCandidateSupplier(input)).resolves.toEqual(
      expect.objectContaining({ ok: false, code: "stale_event_version" }),
    );
    expect(
      runMock.mock.calls.some((call) =>
        String(call[0]).includes("INSERT INTO"),
      ),
    ).toBe(false);
  });

  it("rejects a current Request version that is not accepted", async () => {
    runMock.mockReset();
    runMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: input.eventId,
          event_type: "managed_service",
          classified_category: "ams",
        },
      ])
      .mockResolvedValueOnce([
        { id: input.expectedEventVersionId, request_accepted: false },
      ]);

    await expect(acceptEventCandidateSupplier(input)).resolves.toEqual(
      expect.objectContaining({
        ok: false,
        code: "event_version_not_accepted",
      }),
    );
    expect(
      runMock.mock.calls.some((call) =>
        String(call[0]).includes("INSERT INTO"),
      ),
    ).toBe(false);
  });

  it("requires a named signed-in reviewer and rationale", async () => {
    await expect(
      acceptEventCandidateSupplier({
        ...input,
        acceptedByName: "User",
      }),
    ).resolves.toEqual(
      expect.objectContaining({ ok: false, code: "reviewer_required" }),
    );
    await expect(
      acceptEventCandidateSupplier({
        ...input,
        rationale: "short",
      }),
    ).resolves.toEqual(
      expect.objectContaining({ ok: false, code: "rationale_required" }),
    );
    expect(mockTx).not.toHaveBeenCalled();
  });

  it("maps a concurrent active-authority collision to already accepted", async () => {
    mockTx.mockReset();
    mockTx.mockRejectedValueOnce(
      Object.assign(new Error("duplicate active authority"), { code: "23505" }),
    );

    await expect(acceptEventCandidateSupplier(input)).resolves.toEqual({
      ok: false,
      code: "already_accepted",
      detail:
        "This supplier already has active candidate authority for the event.",
    });
  });
});
