/**
 * A tenant-fenced Moves read must accept every spelling the tenant's rows
 * are persisted under, and only those. These cases pin:
 *
 * 1. the helper itself — alias set per tenant, no overlap across tenants,
 *    an unknown key stays a singleton, the empty key never widens;
 * 2. the read path — `move_artifacts` is filtered with `.in` over that set
 *    (not `.eq` on one spelling), and the post-read tenant check accepts a
 *    row keyed under the canonical spelling when the caller holds the app
 *    client key, while still refusing another tenant's row.
 */
import { getObjectStorageAdapter } from "@/lib/data-plane/objectStorage";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import {
  downloadArtifactOutcome,
  getMoveArtifactForTenant,
} from "@/lib/programs/deliverables/move-artifacts";
import { tenantKeyReadValues } from "@/lib/programs/tenant-key-filter";
import type { TenancyCtx } from "@/lib/programs/types.db";
import {
  CANONICAL_TENANT_KEYS,
  appClientKeyForTenant,
  canonicalTenantKey,
} from "@/lib/tenant/aliases";

jest.mock("@/lib/data-plane/objectStorage", () => ({
  getObjectStorageAdapter: jest.fn(),
}));
jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: jest.fn(),
}));

const APP_KEY = "meridian";
const CANONICAL_KEY = canonicalTenantKey(APP_KEY);

describe("tenantKeyReadValues", () => {
  it("returns the app client key and the canonical key for a known tenant", () => {
    expect(CANONICAL_KEY).not.toBe(APP_KEY);
    const values = tenantKeyReadValues(APP_KEY);
    expect(values).toContain(APP_KEY);
    expect(values).toContain(CANONICAL_KEY);
    expect(new Set(values).size).toBe(values.length);
  });

  it("resolves the same set from either spelling", () => {
    expect(new Set(tenantKeyReadValues(CANONICAL_KEY))).toEqual(
      new Set(tenantKeyReadValues(APP_KEY)),
    );
  });

  it("never overlaps across canonical tenants", () => {
    const sets = CANONICAL_TENANT_KEYS.map((key) => ({
      key,
      values: new Set(tenantKeyReadValues(appClientKeyForTenant(key) ?? key)),
    }));
    expect(sets.length).toBeGreaterThan(1);
    for (const a of sets) {
      for (const b of sets) {
        if (a.key === b.key) continue;
        for (const value of a.values) expect(b.values.has(value)).toBe(false);
      }
    }
  });

  it("keeps an unknown key as itself and the empty key as a single empty value", () => {
    expect(tenantKeyReadValues("tenant-nobody-declared")).toEqual([
      "tenant-nobody-declared",
    ]);
    expect(tenantKeyReadValues("")).toEqual([""]);
  });
});

describe("move_artifacts reads over the alias set", () => {
  const ctx = {
    clientId: "client-1",
    clientKey: APP_KEY,
    userId: "user-1",
    role: "maestro",
    email: "maestro@example.com",
  } as TenancyCtx;

  type Call = { op: "eq" | "in"; column: string; value: unknown };
  let calls: Call[];
  let row: Record<string, unknown> | null;

  function chain(): Record<string, unknown> {
    const q: Record<string, unknown> = {};
    q.eq = (column: string, value: unknown) => {
      calls.push({ op: "eq", column, value });
      return q;
    };
    q.in = (column: string, value: unknown) => {
      calls.push({ op: "in", column, value });
      return q;
    };
    q.order = () => q;
    q.limit = () => q;
    q.maybeSingle = async () => ({ data: row, error: null });
    q.then = (resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: row ? [row] : [], error: null }).then(resolve);
    return q;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    calls = [];
    row = null;
    (getAzureWriteFluentClient as jest.Mock).mockReturnValue({
      from: () => ({ select: () => chain() }),
    });
    (getObjectStorageAdapter as jest.Mock).mockReturnValue({
      download: jest.fn(async () => Buffer.from("bytes")),
    });
  });

  it("filters tenant_key with the alias set rather than one spelling", async () => {
    row = {
      artifact_id: "art-1",
      tenant_key: CANONICAL_KEY,
      move_id: "move-1",
    };
    const found = await getMoveArtifactForTenant(ctx, "art-1");
    expect(found?.artifact_id).toBe("art-1");
    const tenantFilters = calls.filter((c) => c.column === "tenant_key");
    expect(tenantFilters).toHaveLength(1);
    expect(tenantFilters[0].op).toBe("in");
    expect(tenantFilters[0].value).toEqual(tenantKeyReadValues(APP_KEY));
  });

  it("serves a file whose row is keyed under the canonical spelling", async () => {
    row = {
      blob_container: "c",
      blob_path: "p",
      file_name: "f.pptx",
      file_format: "pptx",
      tenant_key: CANONICAL_KEY,
      metadata: {},
    };
    const outcome = await downloadArtifactOutcome(ctx, "art-1", "move-1");
    expect(outcome.ok).toBe(true);
  });

  it("still refuses a row that belongs to another tenant", async () => {
    const other = CANONICAL_TENANT_KEYS.find((k) => k !== CANONICAL_KEY);
    expect(other).toBeDefined();
    row = {
      blob_container: "c",
      blob_path: "p",
      file_name: "f.pptx",
      file_format: "pptx",
      tenant_key: other,
      metadata: {},
    };
    const outcome = await downloadArtifactOutcome(ctx, "art-1", "move-1");
    expect(outcome.ok).toBe(false);
  });
});
