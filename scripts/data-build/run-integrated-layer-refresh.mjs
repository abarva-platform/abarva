#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const TRUE_VALUES = new Set(["1", "true", "yes"]);

function parseArgs(argv) {
  const args = new Map();
  const tenants = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--tenant") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("--tenant requires a value");
      tenants.push(value);
      index += 1;
      continue;
    }
    if (!arg.startsWith("--")) continue;
    const [key, inlineValue] = arg.slice(2).split("=", 2);
    if (inlineValue !== undefined) {
      args.set(key, inlineValue);
      continue;
    }
    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      args.set(key, next);
      index += 1;
    } else {
      args.set(key, "true");
    }
  }
  const git = gitSha();
  const buildVersion = args.get("build-version") ?? `integrated-layer-refresh-${git.slice(0, 9)}`;
  return {
    tenants,
    outDir: path.resolve(repoRoot, args.get("out-dir") ?? "reports/integrated-layer-refresh-run/latest"),
    buildVersion,
    inputSourceVersion: args.get("input-source-version") ?? git,
    idempotencyKey: args.get("idempotency-key") ?? `integrated-layer-refresh:${git}:${Date.now()}`,
    includeTenantNames: args.get("include-tenant-names") === "true",
    writeRequested: args.has("write") || TRUE_VALUES.has(String(process.env.INTEGRATED_LAYER_REFRESH_WRITE ?? "").toLowerCase()),
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
}

function gitSha() {
  const result = spawnSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : "unknown";
}

function registryTenants() {
  const registry = readJson(path.join(repoRoot, "datasets/tenant-inputs/tenant-input-registry.json"));
  return (registry.activeTenants ?? []).map((tenant) => tenant.tenantKey).filter(Boolean);
}

function runPhase(phase) {
  const startedAt = new Date().toISOString();
  const result = spawnSync(phase.command[0], phase.command.slice(1), {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, FORCE_COLOR: "0" },
    maxBuffer: 1024 * 1024 * 64,
  });
  const completedAt = new Date().toISOString();
  fs.mkdirSync(phase.outDir, { recursive: true });
  fs.writeFileSync(path.join(phase.outDir, "_stdout.txt"), result.stdout ?? "");
  fs.writeFileSync(path.join(phase.outDir, "_stderr.txt"), result.stderr ?? "");
  return {
    name: phase.name,
    layer: phase.layer,
    status: result.status === 0 ? "pass" : "fail",
    exitCode: result.status,
    command: phase.command.join(" "),
    outDir: path.relative(repoRoot, phase.outDir),
    startedAt,
    completedAt,
  };
}

function summarizePhaseOutput(outDir, file) {
  const filePath = path.join(outDir, file);
  if (!fs.existsSync(filePath)) return null;
  try {
    return readJson(filePath);
  } catch {
    return null;
  }
}

function buildMarkdown(summary) {
  const lines = [
    "# Integrated Layer Refresh Run",
    "",
    "## Direct Answer",
    "",
    summary.mode === "dry-run"
      ? "This run proves the layers are executed as one ordered refresh plan, but it does not write canonical records, materialize graph tables, update product read models, or verify live cubes."
      : "This run requested writes, but the orchestrator currently refuses direct writes; use the governed ACA data-build job contract for mutating refreshes.",
    "",
    "## Scope",
    "",
    `- Git SHA: \`${summary.gitSha}\``,
    `- Build version: \`${summary.buildVersion}\``,
    `- Input source version: \`${summary.inputSourceVersion}\``,
    `- Idempotency key: \`${summary.idempotencyKey}\``,
    `- Tenant scope: ${summary.tenantScope.map((tenant) => `\`${tenant}\``).join(", ")}`,
    `- Mode: ${summary.mode}`,
    "",
    "## Phase Results",
    "",
    "| Order | Layer | Phase | Status | Output |",
    "| ---: | --- | --- | --- | --- |",
  ];
  summary.phases.forEach((phase, index) => {
    lines.push(`| ${index + 1} | ${phase.layer} | ${phase.name} | ${phase.status} | \`${phase.outDir}\` |`);
  });
  lines.push(
    "",
    "## Integrated Volumetrics",
    "",
    "| Area | Count | Basis |",
    "| --- | ---: | --- |",
    `| L1 CSV rows | ${summary.volumetrics.l1CsvRows} | tenant input quality audit |`,
    `| L1 mapped source rows | ${summary.volumetrics.l1MappedSourceRows} | tenant input quality audit |`,
    `| L3 source rows inspected | ${summary.volumetrics.l3SourceRowsInspected} | canonical source integration coverage |`,
    `| L3 source mentions represented | ${summary.volumetrics.l3SourceMentionsRepresented} | canonical entity resolution summary |`,
    `| L3 distinct entities accepted | ${summary.volumetrics.l3DistinctEntitiesAccepted} | canonical entity resolution summary |`,
    `| L3 duplicate mentions collapsed | ${summary.volumetrics.l3DuplicateMentionsCollapsed} | canonical entity resolution summary |`,
    `| L3 references resolved | ${summary.volumetrics.l3ReferencesResolved} / ${summary.volumetrics.l3ReferenceMentions} (${Math.round(summary.volumetrics.l3ReferenceResolutionRate * 100)}%) | canonical entity resolution summary |`,
    `| L3 source rows blocked | ${summary.volumetrics.l3SourceRowsBlocked} | canonical source integration coverage |`,
    `| L2 dry-run failures | ${summary.volumetrics.l2DryRunFailures} | adapter dry-run report |`,
    `| L3 canonical objects planned | ${summary.volumetrics.l3CanonicalObjectsPlanned} | runtime layer dry-run |`,
    `| L3 graph edges planned | ${summary.volumetrics.l3GraphEdgesPlanned} | runtime layer dry-run |`,
    `| L3 quarantined relationships | ${summary.volumetrics.l3QuarantinedRelationships} | runtime layer dry-run |`,
    `| L4 Source projected rows | ${summary.volumetrics.l4SourceProjectedRows} | Source cube dry-run |`,
    `| L4 Source cube views verified | ${summary.volumetrics.l4SourceCubeViewsVerified ? "1" : "0"} | Source cube readback |`,
    "",
    "## Boundary",
    "",
    "- This orchestrator is report-only and dry-run by default.",
    "- It refuses direct writes so canonical/data-plane writes, graph materialization, product read-model refresh, retrieval indexing, and live-client claims remain governed by their existing jobs and readbacks.",
    "- A successful dry run is readiness evidence, not a runtime refresh claim.",
    "",
  );
  return `${lines.join("\n")}\n`;
}

function deriveVolumetrics(args) {
  const quality = summarizePhaseOutput(path.join(args.outDir, "01-l1-quality"), "tenant-input-quality-depth.json");
  const layer = summarizePhaseOutput(path.join(args.outDir, "02-l2-layer"), "summary.json");
  const runtime = summarizePhaseOutput(path.join(args.outDir, "03-l3-runtime"), "summary.json");
  const sourceCoverage =
    summarizePhaseOutput(path.join(args.outDir, "03-l3-runtime", "canonical-build"), "source-integration-coverage.json") ??
    [];
  const entityResolution =
    summarizePhaseOutput(path.join(args.outDir, "03-l3-runtime", "canonical-build"), "entity-resolution-summary.json") ??
    [];
  const sourceCube = summarizePhaseOutput(path.join(args.outDir, "04-l4-source-cube"), "summary.json");
  const projectedRows = Object.values(sourceCube?.projectedRows ?? {}).reduce((total, value) => total + Number(value || 0), 0);
  return {
    l1CsvRows: (quality?.tenants ?? []).reduce((total, tenant) => total + Number(tenant.csvRows ?? 0), 0),
    l1MappedSourceRows: (quality?.tenants ?? []).reduce((total, tenant) => total + Number(tenant.mappedCsvRows ?? 0), 0),
    l3SourceRowsInspected: sourceCoverage.reduce((total, item) => total + Number(item.sourceRows ?? 0), 0),
    l3SourceMentionsRepresented: entityResolution.reduce((total, item) => total + Number(item.sourceMentions ?? 0), 0),
    l3DistinctEntitiesAccepted: entityResolution.reduce((total, item) => total + Number(item.distinctEntities ?? 0), 0),
    l3DuplicateMentionsCollapsed: entityResolution.reduce((total, item) => total + Number(item.duplicateMentionsCollapsed ?? 0), 0),
    l3ReferenceMentions: entityResolution.reduce((total, item) => total + Number(item.referenceMentions ?? 0), 0),
    l3ReferencesResolved: entityResolution.reduce((total, item) => total + Number(item.referencesResolved ?? 0), 0),
    l3ReferenceResolutionRate: (() => {
      const resolved = entityResolution.reduce((total, item) => total + Number(item.referencesResolved ?? 0), 0);
      const mentions = entityResolution.reduce((total, item) => total + Number(item.referenceMentions ?? 0), 0);
      return mentions === 0 ? 0 : Number((resolved / mentions).toFixed(4));
    })(),
    l3SourceRowsBlocked: sourceCoverage
      .filter(
        (item) =>
          item.disposition === "blocked_unmapped_source_file" ||
          item.disposition === "blocked_no_canonical_records",
      )
      .reduce((total, item) => total + Number(item.sourceRows ?? 0), 0),
    l2DryRunFailures: Number(layer?.layer2DryRunFailures?.totalFailures ?? 0),
    l3CanonicalObjectsPlanned: Number(runtime?.canonicalObjectsPlanned ?? 0),
    l3GraphEdgesPlanned: Number(runtime?.graphEdgesPlanned ?? 0),
    l3QuarantinedRelationships: Number(runtime?.quarantinedRelationships ?? 0),
    l4SourceProjectedRows: projectedRows,
    l4SourceCubeViewsVerified: Boolean(sourceCube?.cubeViewsVerified),
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.writeRequested) {
    throw new Error(
      "Integrated runner refuses direct writes. Run this dry-run first, then use the governed ACA data-build job for approved writes/readbacks.",
    );
  }
  const tenants = args.tenants.length > 0 ? args.tenants : registryTenants();
  if (tenants.length === 0) throw new Error("No tenant scope found in registry or --tenant arguments.");
  fs.rmSync(args.outDir, { recursive: true, force: true });
  fs.mkdirSync(args.outDir, { recursive: true });
  const tenantArgs = tenants.flatMap((tenant) => ["--tenant", tenant]);
  const phases = [
    {
      name: "L1 tenant input quality",
      layer: "L1",
      outDir: path.join(args.outDir, "01-l1-quality"),
      command: ["npx", "tsx", "scripts/audit/tenant-input-quality-depth.ts", "--out-dir", path.join(args.outDir, "01-l1-quality")],
    },
    {
      name: "L2 adapter and workstream dry-run",
      layer: "L2",
      outDir: path.join(args.outDir, "02-l2-layer"),
      command: ["node", "scripts/audit/tenant-layer-refresh.mjs", ...tenantArgs, "--out", path.join(args.outDir, "02-l2-layer"), "--no-package"],
    },
    {
      name: "L3 canonical and graph dry-run",
      layer: "L3",
      outDir: path.join(args.outDir, "03-l3-runtime"),
      command: [
        "npx",
        "tsx",
        "scripts/data-build/refresh-runtime-layers.ts",
        ...tenantArgs,
        "--out-dir",
        path.join(args.outDir, "03-l3-runtime"),
        "--build-version",
        args.buildVersion,
        "--input-source-version",
        args.inputSourceVersion,
        "--idempotency-key",
        args.idempotencyKey,
      ],
    },
    {
      name: "L4 Source cube dry-run",
      layer: "L4",
      outDir: path.join(args.outDir, "04-l4-source-cube"),
      command: [
        "npx",
        "tsx",
        "scripts/data-build/refresh-source-l4-cube.ts",
        ...tenantArgs,
        "--out-dir",
        path.join(args.outDir, "04-l4-source-cube"),
        "--build-version",
        args.buildVersion,
        "--input-source-version",
        args.inputSourceVersion,
        "--idempotency-key",
        args.idempotencyKey,
      ],
    },
    {
      name: "Integrated inventory",
      layer: "L1-L4",
      outDir: path.join(args.outDir, "05-integrated-inventory"),
      command: [
        "node",
        "scripts/audit/build-integrated-layer-refresh-inventory.mjs",
        "--out-dir",
        path.join(args.outDir, "05-integrated-inventory"),
        "--layer-dir",
        path.join(args.outDir, "02-l2-layer"),
        "--quality-dir",
        path.join(args.outDir, "01-l1-quality"),
        "--runtime-dir",
        path.join(args.outDir, "03-l3-runtime"),
        "--source-cube-dir",
        path.join(args.outDir, "04-l4-source-cube"),
        "--include-tenant-names",
        String(args.includeTenantNames),
      ],
    },
  ];

  const phaseResults = [];
  for (const phase of phases) {
    const result = runPhase(phase);
    phaseResults.push(result);
    if (result.status !== "pass") break;
  }
  const status = phaseResults.every((phase) => phase.status === "pass") && phaseResults.length === phases.length ? "pass" : "fail";
  const summary = {
    generatedAt: new Date().toISOString(),
    status,
    mode: "dry-run",
    gitSha: gitSha(),
    buildVersion: args.buildVersion,
    inputSourceVersion: args.inputSourceVersion,
    idempotencyKey: args.idempotencyKey,
    tenantScope: tenants,
    phases: phaseResults,
    volumetrics: deriveVolumetrics(args),
    writesPerformed: false,
    graphTablesWritten: false,
    productReadModelsUpdated: false,
    cubeViewsVerified: false,
    caveat:
      "This is an integrated local dry run. It does not replace governed ACA data-build write/readback proof for canonical tables, graph tables, product read models, cube views, or retrieval indexes.",
  };
  writeJson(path.join(args.outDir, "integrated-layer-refresh-run.json"), summary);
  writeText(path.join(args.outDir, "integrated-layer-refresh-run.md"), buildMarkdown(summary));
  console.log(JSON.stringify(summary, null, 2));
  if (summary.status !== "pass") process.exitCode = 1;
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
}
