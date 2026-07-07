import {
  authoredPatternIds,
  discoverDatasetTenants,
  runTruthGates,
  type TruthGateSnapshot,
} from "../intelligence/scb-truth-gates";
import { CDP_PATTERN_COUNT } from "@/lib/intelligence/seed-patterns-cdp";
import { EXPERT_PACKS } from "@/lib/intelligence/expert-pack/registry";

const rootDir = process.cwd();

function cleanSnapshot(): TruthGateSnapshot {
  return {
    enterpriseContextRecords: Object.fromEntries(
      discoverDatasetTenants(rootDir).map((tenant) => [tenant.tenantKey, 1]),
    ),
    embeddedNullVectorCount: 0,
    expertPackIds: EXPERT_PACKS.map((pack) => pack.identity.id),
    patternManifestIds: authoredPatternIds(rootDir),
  };
}

function failures(
  findings: Awaited<ReturnType<typeof runTruthGates>>,
): string[] {
  return findings
    .filter((finding) => finding.severity === "fail")
    .map((finding) => finding.gate);
}

describe("scb truth gates", () => {
  it("loads the CDP pattern shim without relying on runtime tsconfig aliases", () => {
    expect(CDP_PATTERN_COUNT).toBeGreaterThan(0);
  });

  it("passes with a clean deterministic snapshot", async () => {
    const findings = await runTruthGates({
      rootDir,
      snapshot: cleanSnapshot(),
    });

    expect(failures(findings)).toEqual([]);
    expect(findings.some((finding) => finding.severity === "pass")).toBe(true);
  });

  it("fails when a dataset tenant has zero enterprise_context_records", async () => {
    const snapshot = cleanSnapshot();
    const tenantKey = Object.keys(snapshot.enterpriseContextRecords ?? {})[0];
    expect(tenantKey).toBeTruthy();
    snapshot.enterpriseContextRecords![tenantKey] = 0;

    const findings = await runTruthGates({ rootDir, snapshot });

    expect(failures(findings)).toContain("datasets-have-records");
    expect(findings.map((finding) => finding.message).join("\n")).toContain(
      "zero enterprise_context_records",
    );
  });

  it("fails when an embedded chunk lacks embedding_vector", async () => {
    const snapshot = cleanSnapshot();
    snapshot.embeddedNullVectorCount = 1;

    const findings = await runTruthGates({ rootDir, snapshot });

    expect(failures(findings)).toContain("embedded-chunks-have-vectors");
    expect(findings.map((finding) => finding.message).join("\n")).toContain(
      "embedding_vector IS NULL",
    );
  });

  it("fails when an authored pattern is absent from the retrievable manifest", async () => {
    const snapshot = cleanSnapshot();
    const missing = snapshot.patternManifestIds?.[0];
    expect(missing).toBeTruthy();
    snapshot.patternManifestIds = snapshot.patternManifestIds!.slice(1);

    const findings = await runTruthGates({ rootDir, snapshot });

    expect(failures(findings)).toContain("authored-patterns-retrievable");
    expect(findings.map((finding) => finding.message).join("\n")).toContain(
      missing,
    );
  });

  it("fails when an authored ExpertPack is absent from the retrievable pack index", async () => {
    const snapshot = cleanSnapshot();
    const missing = snapshot.expertPackIds?.[0];
    expect(missing).toBeTruthy();
    snapshot.expertPackIds = snapshot.expertPackIds!.slice(1);

    const findings = await runTruthGates({ rootDir, snapshot });

    expect(failures(findings)).toContain("authored-expert-packs-retrievable");
    expect(findings.map((finding) => finding.message).join("\n")).toContain(
      missing,
    );
  });
});
