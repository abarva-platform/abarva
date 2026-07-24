import { describe, expect, it, beforeEach } from "@jest/globals";
import { azureRead } from "@/lib/data-plane/azureRead";
import {
  createRateCardVersion,
  getCurrentRateCard,
  resolveRateCardInheritance,
  type RateCardStorePort,
} from "../rate-card-repository";
import type { PricingRateCardLineRow } from "../types";

jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: {
    select: jest.fn(),
    maybeSingle: jest.fn(),
  },
}));

const maybeSingleMock = azureRead.maybeSingle as jest.MockedFunction<typeof azureRead.maybeSingle>;

function line(overrides: Partial<PricingRateCardLineRow>): PricingRateCardLineRow {
  return {
    id: "line-id",
    card_version_id: "card-id",
    role_or_band_ref: "ROL-001",
    level: "LVL-03",
    provider_ref: null,
    location_ref: null,
    rate_basis: "onshore_si_t1_benchmark",
    unit: "hour",
    rate_value: 300,
    currency: "USD",
    valid_from: "2026-07-23",
    valid_to: null,
    tenant_key: null,
    content_hash: "irrelevant",
    created_at: "2026-07-23T00:00:00.000Z",
    ...overrides,
  };
}

describe("resolveRateCardInheritance — 3-tier scope walk", () => {
  it("prefers a client override for a role/level the global card also prices, and falls back to global elsewhere", () => {
    const global = [
      line({ role_or_band_ref: "ROL-001", level: "LVL-03", rate_value: 300 }),
      line({ role_or_band_ref: "ROL-002", level: "LVL-04", rate_value: 200 }),
    ];
    const client = [line({ role_or_band_ref: "ROL-001", level: "LVL-03", rate_value: 450, tenant_key: "apex-retail" })];

    const resolved = resolveRateCardInheritance({ global, client });

    const rol001 = resolved.find((r) => r.role_or_band_ref === "ROL-001" && r.level === "LVL-03");
    expect(rol001?.rate_value).toBe(450);
    expect(rol001?.resolvedFromScope).toBe("client");

    const rol002 = resolved.find((r) => r.role_or_band_ref === "ROL-002");
    expect(rol002?.rate_value).toBe(200);
    expect(rol002?.resolvedFromScope).toBe("global");
  });

  it("a move_exception override wins over both client and global for the same key", () => {
    const global = [line({ role_or_band_ref: "ROL-001", level: "LVL-03", rate_value: 300 })];
    const client = [line({ role_or_band_ref: "ROL-001", level: "LVL-03", rate_value: 450 })];
    const moveException = [line({ role_or_band_ref: "ROL-001", level: "LVL-03", rate_value: 900 })];

    const resolved = resolveRateCardInheritance({ global, client, moveException });
    expect(resolved).toHaveLength(1);
    expect(resolved[0].rate_value).toBe(900);
    expect(resolved[0].resolvedFromScope).toBe("move_exception");
  });

  it("distinguishes lines by the full key (role/level/provider/location/basis/unit), not just role", () => {
    const global = [
      line({ role_or_band_ref: "ROL-001", level: "LVL-03", location_ref: "LOC-ATLANTA", rate_value: 300 }),
      line({ role_or_band_ref: "ROL-001", level: "LVL-03", location_ref: "LOC-AUSTRALIA", rate_value: 320 }),
    ];
    const client = [
      line({ role_or_band_ref: "ROL-001", level: "LVL-03", location_ref: "LOC-ATLANTA", rate_value: 340 }),
    ];

    const resolved = resolveRateCardInheritance({ global, client });
    expect(resolved).toHaveLength(2);
    const atlanta = resolved.find((r) => r.location_ref === "LOC-ATLANTA");
    const australia = resolved.find((r) => r.location_ref === "LOC-AUSTRALIA");
    expect(atlanta?.rate_value).toBe(340);
    expect(atlanta?.resolvedFromScope).toBe("client");
    expect(australia?.rate_value).toBe(320);
    expect(australia?.resolvedFromScope).toBe("global");
  });
});

describe("getCurrentRateCard — tenant isolation at the repository layer", () => {
  beforeEach(() => {
    maybeSingleMock.mockReset();
  });

  it("never leaks a different tenant's current rate card: apex-retail's query cannot return meridian-health's row", async () => {
    const table = [
      { scope_type: "client", tenant_key: "apex-retail", card_code: "ENTERPRISE", is_current: true, id: "apex-card" },
      {
        scope_type: "client",
        tenant_key: "meridian-health",
        card_code: "ENTERPRISE",
        is_current: true,
        id: "meridian-card",
      },
    ];
    maybeSingleMock.mockImplementation(async (request) => {
      const where = request.where as Record<string, unknown>;
      return (
        table.find(
          (row) =>
            row.scope_type === where.scope_type &&
            row.tenant_key === where.tenant_key &&
            row.card_code === where.card_code,
        ) ?? null
      ) as never;
    });

    const apexCard = await getCurrentRateCard("client", "apex-retail", "ENTERPRISE");
    expect(apexCard?.id).toBe("apex-card");

    const meridianCard = await getCurrentRateCard("client", "meridian-health", "ENTERPRISE");
    expect(meridianCard?.id).toBe("meridian-card");

    // Sanity: the two calls are genuinely distinguished by tenant_key, not
    // coincidentally returning the same row for both.
    expect(apexCard?.id).not.toBe(meridianCard?.id);
  });
});

describe("createRateCardVersion — idempotency contract", () => {
  function fakeStore(): RateCardStorePort & {
    current: { id: string; version: number; contentHash: string } | null;
    insertCalls: number;
  } {
    const state: {
      current: { id: string; version: number; contentHash: string } | null;
      insertCalls: number;
    } = { current: null, insertCalls: 0 };
    return {
      get current() {
        return state.current;
      },
      get insertCalls() {
        return state.insertCalls;
      },
      async getCurrent() {
        return state.current;
      },
      async insertNewVersion(input) {
        state.insertCalls += 1;
        state.current = { id: input.id, version: input.version, contentHash: input.contentHash };
      },
    };
  }

  const baseInput = {
    scopeType: "client" as const,
    tenantKey: "apex-retail",
    cardCode: "ENTERPRISE",
    lines: [
      {
        roleOrBandRef: "ROL-001",
        level: "LVL-03",
        rateBasis: "onshore_si_t1_benchmark",
        unit: "hour",
        rateValue: 300,
        validFrom: "2026-07-23",
      },
    ],
  };

  it("creates version 1 when there is no current card", async () => {
    const store = fakeStore();
    const result = await createRateCardVersion(baseInput, store);
    expect(result).toMatchObject({ action: "new_version", version: 1, previousVersion: null });
    expect(store.insertCalls).toBe(1);
  });

  it("is a no-op on a second call with the identical payload", async () => {
    const store = fakeStore();
    await createRateCardVersion(baseInput, store);
    const second = await createRateCardVersion(baseInput, store);
    expect(second.action).toBe("noop");
    expect(store.insertCalls).toBe(1); // no duplicate insert
  });

  it("creates version 2 and supersedes version 1 when the line content changes", async () => {
    const store = fakeStore();
    await createRateCardVersion(baseInput, store);
    const changed = {
      ...baseInput,
      lines: [{ ...baseInput.lines[0], rateValue: 450 }],
    };
    const result = await createRateCardVersion(changed, store);
    expect(result).toMatchObject({ action: "new_version", version: 2, previousVersion: 1 });
    expect(store.insertCalls).toBe(2);
  });

  it("calling the loader twice in a row with the same new content never produces two current versions", async () => {
    const store = fakeStore();
    const first = await createRateCardVersion(baseInput, store);
    const second = await createRateCardVersion(baseInput, store);
    expect(first.action).toBe("new_version");
    expect(second.action).toBe("noop");
    // Only one row was ever inserted as "current" — no duplicate current row.
    expect(store.insertCalls).toBe(1);
    expect(store.current?.version).toBe(1);
  });
});
