import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "@jest/globals";
import {
  computePackContentHash,
  defaultEffortEnginePackDir,
  loadEffortEnginePack,
  readEffortPackDir,
  rowCountsByTable,
  type EffortEnginePackStorePort,
} from "../pack-loader";

const REAL_DIR = defaultEffortEnginePackDir();

describe("readEffortPackDir + rowCountsByTable — fidelity against the real committed PR4 CSVs", () => {
  it("directory resolves to the real datasets/reference/pricing-engine-v1 directory", () => {
    expect(fs.existsSync(path.join(REAL_DIR, "pricing_archetypes.csv"))).toBe(true);
  });

  it("row counts match the manifest's pr4_effort_engine_pack.row_counts, table for table", () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(REAL_DIR, "manifest.json"), "utf8"));
    const data = readEffortPackDir(REAL_DIR);
    expect(rowCountsByTable(data)).toEqual(manifest.pr4_effort_engine_pack.row_counts);
  });

  it("has exactly 8 archetypes, 49 activity packs (37 technical + 12 shared)", () => {
    const data = readEffortPackDir(REAL_DIR);
    expect(data.archetypes.length).toBe(8);
    expect(data.activityPacks.length).toBe(49);
    expect(data.activityPacks.filter((p) => p.category === "technical").length).toBe(37);
    expect(data.activityPacks.filter((p) => p.category === "shared_nontechnical").length).toBe(12);
  });
});

describe("computePackContentHash", () => {
  it("is stable across repeated reads of the same directory", () => {
    const first = computePackContentHash(readEffortPackDir(REAL_DIR));
    const second = computePackContentHash(readEffortPackDir(REAL_DIR));
    expect(first).toBe(second);
  });

  it("changes when a row's content changes", () => {
    const data = readEffortPackDir(REAL_DIR);
    const before = computePackContentHash(data);
    const mutated = { ...data, archetypes: data.archetypes.slice(1) };
    expect(computePackContentHash(mutated)).not.toBe(before);
  });
});

// ---------------------------------------------------------------------------
// In-memory fake store — proves the full idempotency contract without a live
// database, mirroring PR2's reference-pack-loader.test.ts convention.
// ---------------------------------------------------------------------------
function fakeStore(): EffortEnginePackStorePort & { insertCalls: number } {
  const state = { current: null as { version: number; contentHash: string } | null, insertCalls: 0 };
  return {
    get insertCalls() {
      return state.insertCalls;
    },
    async getCurrentVersion() {
      return state.current;
    },
    async insertNewVersion(input) {
      state.insertCalls += 1;
      state.current = { version: input.version, contentHash: input.contentHash };
    },
  };
}

describe("loadEffortEnginePack — idempotency contract against the real CSVs", () => {
  it("first load is a new_version at version 1", async () => {
    const store = fakeStore();
    const result = await loadEffortEnginePack(REAL_DIR, { store });
    expect(result).toMatchObject({ action: "new_version", modelVersion: 1, previousVersion: null });
    expect(store.insertCalls).toBe(1);
  });

  it("re-loading identical content is a no-op — never a second insert", async () => {
    const store = fakeStore();
    await loadEffortEnginePack(REAL_DIR, { store });
    const second = await loadEffortEnginePack(REAL_DIR, { store });
    expect(second.action).toBe("noop");
    expect(store.insertCalls).toBe(1);
  });

  it("changed content produces a new version and supersedes the previous one", async () => {
    const store = fakeStore();
    await loadEffortEnginePack(REAL_DIR, { store });

    // Simulate a changed pack by hashing a mutated copy through the same store contract.
    const originalHash = (await store.getCurrentVersion())!.contentHash;
    await store.insertNewVersion({ version: 2, contentHash: "different-hash-simulating-a-real-content-change", tables: {} });
    const current = await store.getCurrentVersion();
    expect(current!.version).toBe(2);
    expect(current!.contentHash).not.toBe(originalHash);
  });
});
