import {
  computeSourceAuthorityContentHash,
  evaluateRequestVersionApproval,
  evaluateStrategyVersionApprovals,
  planSourceAuthorityVersion,
  type SourceAuthorityApproval,
  type SourceAuthorityCurrentVersion,
} from "./source-version-authority";

const currentVersion = (
  overrides: Partial<SourceAuthorityCurrentVersion> = {},
): SourceAuthorityCurrentVersion => ({
  id: "version-1",
  versionNumber: 1,
  contentHash: computeSourceAuthorityContentHash({
    category: "managed services",
    need: "Run a market check",
  }),
  ...overrides,
});

describe("Source request and strategy version authority", () => {
  it("hashes version content deterministically and ignores object key order", () => {
    const left = computeSourceAuthorityContentHash({
      need: "Run a market check",
      category: "managed services",
      nested: { b: 2, a: 1 },
    });
    const right = computeSourceAuthorityContentHash({
      nested: { a: 1, b: 2 },
      category: "managed services",
      need: "Run a market check",
    });

    expect(left).toBe(right);
    expect(left).toMatch(/^[a-f0-9]{64}$/);
  });

  it("reuses the current immutable version when the content hash is unchanged", () => {
    const current = currentVersion();

    expect(
      planSourceAuthorityVersion({
        eventId: "event-1",
        clientKey: "tenant-1",
        authorityKind: "request",
        payload: {
          need: "Run a market check",
          category: "managed services",
        },
        createdByUserId: "person-1",
        currentVersion: current,
      }),
    ).toEqual({
      action: "reuse_current",
      eventId: "event-1",
      clientKey: "tenant-1",
      authorityKind: "request",
      versionId: "version-1",
      versionNumber: 1,
      contentHash: current.contentHash,
    });
  });

  it("creates a superseding version on material edit, and invalidates nothing itself", () => {
    const current = currentVersion();

    expect(
      planSourceAuthorityVersion({
        eventId: "event-1",
        clientKey: "tenant-1",
        authorityKind: "request",
        payload: {
          need: "Run a market check",
          category: "software",
        },
        createdByUserId: "person-1",
        currentVersion: current,
      }),
    ).toMatchObject({
      action: "create_version",
      eventId: "event-1",
      clientKey: "tenant-1",
      authorityKind: "request",
      versionNumber: 2,
      supersedesVersionId: "version-1",
      createdByUserId: "person-1",
    });
  });

  it("accepts a request only from a named actor approving the exact current version", () => {
    const approval: SourceAuthorityApproval = {
      versionId: "version-2",
      role: "request_acceptor",
      actorId: "person-2",
      decision: "approved",
    };

    expect(
      evaluateRequestVersionApproval({
        currentVersionId: "version-2",
        approvals: [
          { ...approval, versionId: "version-1" },
          { ...approval, actorId: "" },
          approval,
        ],
      }),
    ).toEqual({ status: "accepted", acceptedBy: "person-2" });

    expect(
      evaluateRequestVersionApproval({
        currentVersionId: "version-3",
        approvals: [approval],
      }),
    ).toEqual({ status: "pending", missing: ["Request acceptance pending"] });
  });

  it("requires business owner and procurement lead to approve the same strategy version as distinct actors", () => {
    const approvals: SourceAuthorityApproval[] = [
      {
        versionId: "strategy-v1",
        role: "business_owner",
        actorId: "person-2",
        decision: "approved",
      },
      {
        versionId: "strategy-v1",
        role: "procurement_lead",
        actorId: "person-3",
        decision: "approved",
      },
      {
        versionId: "strategy-v0",
        role: "procurement_lead",
        actorId: "person-4",
        decision: "changes_requested",
      },
    ];

    expect(
      evaluateStrategyVersionApprovals({
        currentVersionId: "strategy-v1",
        approvals,
      }),
    ).toEqual({
      status: "approved",
      approvedBy: {
        businessOwner: "person-2",
        procurementLead: "person-3",
      },
    });

    expect(
      evaluateStrategyVersionApprovals({
        currentVersionId: "strategy-v2",
        approvals,
      }),
    ).toEqual({
      status: "pending",
      missing: [
        "Business owner approval pending",
        "Procurement lead approval pending",
      ],
    });

    expect(
      evaluateStrategyVersionApprovals({
        currentVersionId: "strategy-v1",
        approvals: [approvals[0], { ...approvals[1], actorId: "person-2" }],
      }),
    ).toEqual({
      status: "blocked",
      blockers: ["Two distinct people must approve the Strategy version"],
    });

    expect(
      evaluateStrategyVersionApprovals({
        currentVersionId: "strategy-v1",
        approvals: [
          approvals[0],
          approvals[1],
          {
            versionId: "strategy-v1",
            role: "procurement_lead",
            actorId: "person-3",
            decision: "changes_requested",
          },
        ],
      }),
    ).toEqual({
      status: "changes_requested",
      blockers: ["Changes requested for this Strategy version"],
    });
  });
});
