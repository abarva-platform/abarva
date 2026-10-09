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
  canonicalTenantKey,
} from "@/lib/tenant/aliases";
import type { TenancyCtx } from "../types.db";
import { listProgramEvidenceForPrompt } from "../evidence-context";

// Tenant keys come from code, never hand-typed.
const SPLIT_KEY_TENANT = CANONICAL_TENANT_KEYS.find(
  (key) => appClientKeyForTenant(key) !== key,
)!;
const APP_KEY = appClientKeyForTenant(SPLIT_KEY_TENANT)!;
const CANONICAL_KEY = canonicalTenantKey(SPLIT_KEY_TENANT);
const OTHER_TENANT_KEY = CANONICAL_TENANT_KEYS.find(
  (key) => key !== SPLIT_KEY_TENANT,
)!;

const MOVE_ID = "move-under-generation";

type SelectRequest = {
  table: string;
  where?: Record<string, unknown>;
};

/** The tenant scope the Nth `azureRead.select` call asked for. */
function tenantScopeOfCall(index: number): unknown {
  const request = mockAzureSelect.mock.calls[index]?.[0] as
    | SelectRequest
    | undefined;
  return request?.where?.tenant_key;
}

function ctxFor(clientKey: string | null): TenancyCtx {
  return { clientId: "client-id", clientKey } as unknown as TenancyCtx;
}

beforeEach(() => {
  canReadProgramMock.mockReset();
  canReadProgramMock.mockResolvedValue(true);
  mockAzureSelect.mockReset();
  mockAzureSelect.mockResolvedValue([]);
});

describe("program evidence prompt tenant scope", () => {
  it("the fixture these cases rest on exists: a tenant with two distinct keys", () => {
    expect(SPLIT_KEY_TENANT).toBeTruthy();
    expect(APP_KEY).toBeTruthy();
    expect(CANONICAL_KEY).toBeTruthy();
    expect(APP_KEY).not.toEqual(CANONICAL_KEY);
    expect(OTHER_TENANT_KEY).toBeTruthy();
  });

  it("scopes the approved-review lookup to the tenant's whole alias set", async () => {
    await listProgramEvidenceForPrompt(ctxFor(APP_KEY), MOVE_ID, 2);

    const scope = tenantScopeOfCall(0) as { op: string; value: string[] };
    expect(scope.op).toBe("in");
    // A single-key scope here builds the generation prompt from one producer's
    // rows and treats the other producer's approved evidence as absent.
    expect(scope.value).toContain(APP_KEY);
    expect(scope.value).toContain(CANONICAL_KEY);
  });

  it("scopes the evidence-item read to the same alias set as the review lookup", async () => {
    mockAzureSelect.mockResolvedValueOnce([
      {
        evidence_id: "loaded-evidence",
        reviewed_at: "2026-10-06T12:00:00.000Z",
        updated_at: "2026-10-06T12:00:00.000Z",
        source_ref: {},
      },
    ]);

    await listProgramEvidenceForPrompt(ctxFor(APP_KEY), MOVE_ID, 2);

    // Widening the review half alone finds the approval and then drops the
    // item, which reads as no evidence just the same.
    expect(tenantScopeOfCall(1)).toEqual(tenantScopeOfCall(0));
  });

  it("is reflexive: either of the tenant's keys asks for the same scope", async () => {
    await listProgramEvidenceForPrompt(ctxFor(APP_KEY), MOVE_ID, 2);
    const viaAppKey = tenantScopeOfCall(0) as { value: string[] };
    mockAzureSelect.mockClear();
    await listProgramEvidenceForPrompt(ctxFor(CANONICAL_KEY), MOVE_ID, 2);
    const viaCanonicalKey = tenantScopeOfCall(0) as { value: string[] };

    expect(new Set(viaCanonicalKey.value)).toEqual(new Set(viaAppKey.value));
  });

  it("never asks for another tenant's key", async () => {
    await listProgramEvidenceForPrompt(ctxFor(APP_KEY), MOVE_ID, 2);

    // The mirror of the widening: without it the cases above would pass for a
    // scope that matched every tenant.
    const scope = tenantScopeOfCall(0) as { value: string[] };
    expect(scope.value).not.toContain(OTHER_TENANT_KEY);
  });

  it("reads nothing at all without a tenant, rather than matching every row", async () => {
    const items = await listProgramEvidenceForPrompt(ctxFor(null), MOVE_ID, 2);

    expect(items).toEqual([]);
    expect(mockAzureSelect).not.toHaveBeenCalled();
  });

  it("still returns approved evidence through the widened scope", async () => {
    mockAzureSelect
      .mockResolvedValueOnce([
        {
          evidence_id: "loaded-evidence",
          reviewed_at: "2026-10-06T12:00:00.000Z",
          updated_at: "2026-10-06T12:00:00.000Z",
          source_ref: {},
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "loaded-evidence",
          title: "Current-state evidence",
          evidence_type: "upload",
          phase: 2,
          summary: "Approved discovery input.",
          extracted_text: "Baseline completeness is 81 percent.",
          extracted_structured: {},
          created_at: "2026-10-06T11:00:00.000Z",
        },
      ]);

    const items = await listProgramEvidenceForPrompt(
      ctxFor(APP_KEY),
      MOVE_ID,
      2,
    );

    expect(items.map((item) => item.id)).toEqual(["loaded-evidence"]);
    expect(items[0]?.approvedAt).toBe("2026-10-06T12:00:00.000Z");
  });

  it("leaves the access check ahead of the widened read", async () => {
    canReadProgramMock.mockResolvedValue(false);

    const items = await listProgramEvidenceForPrompt(
      ctxFor(APP_KEY),
      MOVE_ID,
      2,
    );

    expect(items).toEqual([]);
    expect(mockAzureSelect).not.toHaveBeenCalled();
  });
});
