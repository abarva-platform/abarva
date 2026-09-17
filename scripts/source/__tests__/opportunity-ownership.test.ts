import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

describe("Source package opportunity ownership", () => {
  const repoRoot = path.resolve(__dirname, "../../..");
  const manifestPath = path.join(repoRoot, "datasets/source/opportunity-ownership-manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const writer = manifest.packages.find((entry: { contracts: { role: string }[] }) =>
    entry.contracts.some((contract) => contract.role === "canonical_writer"),
  );
  const contributor = manifest.packages.find((entry: { contracts: { role: string }[] }) =>
    entry.contracts.some((contract) => contract.role === "evidence_only"),
  );

  function plan(packageEntry: { package_dir: string; dataset_version: string }, ownershipPath = manifestPath) {
    const proofDir = fs.mkdtempSync(path.join(os.tmpdir(), "source-ownership-plan-"));
    const isCloud = packageEntry.package_dir.includes("/cloud-consumption/");
    const command = isCloud ? process.execPath : path.join(repoRoot, "node_modules/.bin/tsx");
    const loader = isCloud
      ? "scripts/source/load-cloud-consumption-package.mjs"
      : "scripts/source/load-contract-depth-package.ts";
    try {
      const result = spawnSync(command, [
        loader,
        "--mode=plan",
        `--dataset-version=${packageEntry.dataset_version}`,
        `--package-dir=${packageEntry.package_dir}`,
        `--opportunity-ownership-manifest=${ownershipPath}`,
        `--proof-dir=${proofDir}`,
      ], {
        cwd: repoRoot,
        encoding: "utf8",
        env: isCloud ? process.env : {
          ...process.env,
          SOURCE_CONTRACT_DEPTH_PACKAGE_PROOF_DIR: proofDir,
        },
      });
      const summaryFile = path.join(proofDir, isCloud ? "summary.json" : "plan.json");
      return {
        ...result,
        summary: fs.existsSync(summaryFile) ? JSON.parse(fs.readFileSync(summaryFile, "utf8")) : null,
      };
    } finally {
      fs.rmSync(proofDir, { recursive: true, force: true });
    }
  }

  function withManifest(copy: unknown, check: (filePath: string) => void) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "source-ownership-manifest-"));
    const filePath = path.join(dir, "manifest.json");
    try {
      fs.writeFileSync(filePath, JSON.stringify(copy));
      check(filePath);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  it("plans one canonical writer and keeps the contributor's evidence counts", () => {
    const ownerPlan = plan(writer);
    expect(ownerPlan.status).toBe(0);
    expect(ownerPlan.summary.opportunity_ownership.canonical_contract_ids).toEqual(
      [writer.contracts[0].contract_id],
    );
    expect(ownerPlan.summary.layer3_expected_readback.source_optimization_opportunity).toBe(6);

    const evidencePlan = plan(contributor);
    expect(evidencePlan.status).toBe(0);
    expect(evidencePlan.summary.opportunity_ownership.evidence_only_contract_ids).toEqual(
      [contributor.contracts[0].contract_id],
    );
    expect(evidencePlan.summary.layer3_expected.optimization_opportunity).toBe(0);
    expect(evidencePlan.summary.layer3_expected.source_contract_term).toBeGreaterThan(0);
    expect(evidencePlan.summary.layer3_expected.source_contract_consumption_observation).toBeGreaterThan(0);
    expect(evidencePlan.summary.layer3_expected.canonical_fact_assertion).toBeGreaterThan(0);
    expect(evidencePlan.summary.layer2_expected_counts.optimization_opportunity_adapter).toBe(4);
  });

  it("fails closed when a required ownership declaration is missing or conflicts", () => {
    const missing = structuredClone(manifest);
    missing.packages[1].contracts = [];
    withManifest(missing, (filePath) => {
      expect(plan(writer, filePath).status).not.toBe(0);
      expect(plan(contributor, filePath).status).not.toBe(0);
    });

    const conflicting = structuredClone(manifest);
    conflicting.packages[1].contracts[0].canonical_writer_dataset_version = "another-version";
    withManifest(conflicting, (filePath) => {
      expect(plan(writer, filePath).status).not.toBe(0);
      expect(plan(contributor, filePath).status).not.toBe(0);
    });
  });

  it("keeps unrelated package opportunity plans unchanged", () => {
    const cloudRoot = path.join(repoRoot, "datasets/source/cloud-consumption");
    const unrelatedDir = fs.readdirSync(cloudRoot).find((name) =>
      name !== path.basename(writer.package_dir),
    );
    expect(unrelatedDir).toBeDefined();
    const packageDir = path.join("datasets/source/cloud-consumption", unrelatedDir!);
    const packageManifest = JSON.parse(fs.readFileSync(path.join(repoRoot, packageDir, "package-manifest.json"), "utf8"));
    const legacy = { package_dir: packageDir, dataset_version: packageManifest.dataset_version };
    const result = plan(legacy);
    expect(result.status).toBe(0);
    expect(result.summary.layer3_expected_readback.source_optimization_opportunity).toBe(8);
  });

  it("keeps package hashes stable when only unrelated ownership entries change", () => {
    const extra = structuredClone(manifest);
    extra.packages.push(
      {
        package_dir: "datasets/source/cloud-consumption/test-unrelated-writer",
        tenant_key: "test-tenant",
        dataset_version: "test-unrelated-writer",
        contracts: [{
          contract_id: "TEST-CONTRACT",
          role: "canonical_writer",
          evidence_only_dataset_versions: ["test-unrelated-contributor"],
        }],
      },
      {
        package_dir: "datasets/source/contract-depth/test-unrelated-contributor",
        tenant_key: "test-tenant",
        dataset_version: "test-unrelated-contributor",
        contracts: [{
          contract_id: "TEST-CONTRACT",
          role: "evidence_only",
          canonical_writer_dataset_version: "test-unrelated-writer",
        }],
      },
    );
    const cloudRoot = path.join(repoRoot, "datasets/source/cloud-consumption");
    const unrelatedDir = fs.readdirSync(cloudRoot).find((name) =>
      name !== path.basename(writer.package_dir),
    );
    expect(unrelatedDir).toBeDefined();
    const packageDir = path.join("datasets/source/cloud-consumption", unrelatedDir!);
    const packageManifest = JSON.parse(fs.readFileSync(path.join(repoRoot, packageDir, "package-manifest.json"), "utf8"));
    const packages = [writer, contributor, { package_dir: packageDir, dataset_version: packageManifest.dataset_version }];
    const baseline = packages.map((entry) => plan(entry).summary.package_sha256);
    withManifest(extra, (filePath) => {
      expect(packages.map((entry) => plan(entry, filePath).summary.package_sha256)).toEqual(baseline);
    });
  });
});
