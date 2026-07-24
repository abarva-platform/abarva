import { describe, expect, it } from "@jest/globals";
import {
  createClientProfileVersion,
  type ClientProfileStorePort,
} from "../client-profile-repository";

function fakeStore(): ClientProfileStorePort & {
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
  tenantKey: "apex-retail",
  values: [{ assumptionKey: "offshore_ratio_default", assumptionValue: 0.35 }],
};

describe("createClientProfileVersion — idempotency contract", () => {
  it("creates version 1 when there is no current profile", async () => {
    const store = fakeStore();
    const result = await createClientProfileVersion(baseInput, store);
    expect(result).toMatchObject({ action: "new_version", version: 1, previousVersion: null });
    expect(store.insertCalls).toBe(1);
  });

  it("is a no-op on a second call with identical values", async () => {
    const store = fakeStore();
    await createClientProfileVersion(baseInput, store);
    const second = await createClientProfileVersion(baseInput, store);
    expect(second.action).toBe("noop");
    expect(store.insertCalls).toBe(1);
  });

  it("creates version 2 and supersedes version 1 when an assumption value changes", async () => {
    const store = fakeStore();
    await createClientProfileVersion(baseInput, store);
    const changed = {
      ...baseInput,
      values: [{ assumptionKey: "offshore_ratio_default", assumptionValue: 0.5 }],
    };
    const result = await createClientProfileVersion(changed, store);
    expect(result).toMatchObject({ action: "new_version", version: 2, previousVersion: 1 });
    expect(store.insertCalls).toBe(2);
  });

  it("is insensitive to assumption ordering (content hash sorts by assumption_key)", async () => {
    const store = fakeStore();
    await createClientProfileVersion(
      {
        tenantKey: "apex-retail",
        values: [
          { assumptionKey: "b_key", assumptionValue: 1 },
          { assumptionKey: "a_key", assumptionValue: 2 },
        ],
      },
      store,
    );
    const second = await createClientProfileVersion(
      {
        tenantKey: "apex-retail",
        values: [
          { assumptionKey: "a_key", assumptionValue: 2 },
          { assumptionKey: "b_key", assumptionValue: 1 },
        ],
      },
      store,
    );
    expect(second.action).toBe("noop");
    expect(store.insertCalls).toBe(1);
  });
});
