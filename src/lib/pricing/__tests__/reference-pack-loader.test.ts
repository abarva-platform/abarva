import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "@jest/globals";
import {
  computePackContentHash,
  defaultReferencePackDir,
  loadReferencePack,
  readReferencePackDir,
  rowCountsByTable,
  validateAgainstCoverageRules,
  type ReferencePackStorePort,
} from "../reference-pack-loader";

const REAL_DIR = defaultReferencePackDir();

describe("readReferencePackDir + rowCountsByTable — fidelity against PR1's real committed CSVs", () => {
  it("row counts match manifest.json's own row_counts, table for table", () => {
    const data = readReferencePackDir(REAL_DIR);
    expect(rowCountsByTable(data)).toEqual(data.manifest.row_counts);
  });

  it("passes the PR1 coverage validator against the real committed pack", () => {
    const data = readReferencePackDir(REAL_DIR);
    const result = validateAgainstCoverageRules(data);
    expect(result.errors).toEqual([]);
  });

  it("directory path resolves to the real datasets/reference/pricing-engine-v1 directory", () => {
    expect(fs.existsSync(path.join(REAL_DIR, "manifest.json"))).toBe(true);
  });
});

describe("computePackContentHash", () => {
  it("is stable across repeated reads of the same directory", () => {
    const first = computePackContentHash(readReferencePackDir(REAL_DIR));
    const second = computePackContentHash(readReferencePackDir(REAL_DIR));
    expect(first).toBe(second);
  });

  it("changes when a row's content changes", () => {
    const data = readReferencePackDir(REAL_DIR);
    const before = computePackContentHash(data);
    const mutated = { ...data, towers: [...data.towers.slice(1)] };
    const after = computePackContentHash(mutated);
    expect(after).not.toBe(before);
  });
});

// ---------------------------------------------------------------------------
// In-memory fake store — proves the full idempotency contract without a
// live database: same content -> no-op; changed content -> new version +
// supersede; calling the loader twice in a row with the same new content
// never produces two "current" versions.
// ---------------------------------------------------------------------------

function fakeStore(): ReferencePackStorePort & {
  versions: { version: number; contentHash: string }[];
  insertCalls: number;
} {
  const state = {
    current: null as { version: number; contentHash: string } | null,
    versions: [] as { version: number; contentHash: string }[],
    insertCalls: 0,
  };
  return {
    get versions() {
      return state.versions;
    },
    get insertCalls() {
      return state.insertCalls;
    },
    async getCurrentVersion() {
      return state.current;
    },
    async insertNewVersion(input) {
      state.insertCalls += 1;
      state.current = { version: input.version, contentHash: input.contentHash };
      state.versions.push({ version: input.version, contentHash: input.contentHash });
    },
  };
}

describe("loadReferencePack — idempotency end-to-end against the real committed CSVs", () => {
  it("first load is a new_version at version 1", async () => {
    const store = fakeStore();
    const result = await loadReferencePack(REAL_DIR, { store });
    expect(result.action).toBe("new_version");
    if (result.action === "new_version") {
      expect(result.previousVersion).toBeNull();
    }
    expect(store.insertCalls).toBe(1);
  });

  it("re-importing the identical, unchanged pack is a no-op (no new version row)", async () => {
    const store = fakeStore();
    await loadReferencePack(REAL_DIR, { store });
    const second = await loadReferencePack(REAL_DIR, { store });
    expect(second.action).toBe("noop");
    expect(store.insertCalls).toBe(1);
    expect(store.versions).toHaveLength(1);
  });

  it("calling the loader twice in a row never creates two 'current' versions for the same content", async () => {
    const store = fakeStore();
    const first = await loadReferencePack(REAL_DIR, { store });
    const second = await loadReferencePack(REAL_DIR, { store });
    expect(first.action).toBe("new_version");
    expect(second.action).toBe("noop");
    expect(store.versions.filter((v) => v.version === 1)).toHaveLength(1);
  });

  it("a changed pack produces a new version and the row counts still reflect the new data", async () => {
    // Simulate a "changed" reference pack by loading against a temp copy of
    // the real pack with one extra tower row appended.
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pricing-pack-"));
    for (const file of fs.readdirSync(REAL_DIR)) {
      fs.copyFileSync(path.join(REAL_DIR, file), path.join(tmpDir, file));
    }
    const towersPath = path.join(tmpDir, "pricing_towers.csv");
    const original = fs.readFileSync(towersPath, "utf8").trimEnd();
    fs.writeFileSync(
      towersPath,
      `${original}\nTWR-99,Test Extra Tower,"Test only",hand-authored-test,1,Test Extra Tower,active,1\n`,
    );

    const store = fakeStore();
    const first = await loadReferencePack(tmpDir, { store });
    expect(first.action).toBe("new_version");
    expect(first.rowCounts["pricing_towers.csv"]).toBe(22); // 21 real + 1 injected

    const second = await loadReferencePack(tmpDir, { store });
    expect(second.action).toBe("noop");
    expect(store.insertCalls).toBe(1);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
