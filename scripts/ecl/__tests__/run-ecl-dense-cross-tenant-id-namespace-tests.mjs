#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(__dirname, "../../..");
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ecl-dense-cross-tenant-id-test-"));

const uuidPattern = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;

function run(command, args, env) {
  const result = spawnSync(command, args, {
    cwd: repo,
    encoding: "utf8",
    env: {
      ...process.env,
      LANG: "C",
      LC_ALL: "C",
      ...env,
    },
  });
  assert.equal(
    result.status,
    0,
    `${command} ${args.join(" ")} failed\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`,
  );
  return result;
}

function buildSql(profile) {
  const denseOutDir = path.join(tmpRoot, profile.label, "dense");
  const outDir = path.join(tmpRoot, profile.label, "load");
  fs.mkdirSync(outDir, { recursive: true });
  run(
    "python3",
    [
      "-c",
      [
        "import sys",
        "from pathlib import Path",
        "sys.path.insert(0, 'scripts/ecl')",
        "import execute_dense_all_layer_load as load",
        `load.build_layer_sql(Path(${JSON.stringify(denseOutDir)}), Path(${JSON.stringify(outDir)}))`,
      ].join("; "),
    ],
    profile.env,
  );
  return { denseOutDir, outDir };
}

function collectUuids(outDir) {
  const values = new Set();
  for (const file of fs.readdirSync(outDir)) {
    if (!file.endsWith(".sql")) continue;
    const text = fs.readFileSync(path.join(outDir, file), "utf8");
    for (const match of text.matchAll(uuidPattern)) {
      values.add(match[0].toLowerCase());
    }
  }
  return values;
}

try {
  const profiles = [
    {
      label: "meridian",
      env: {
        ECL_DENSE_PROFILE: "meridian-health",
        ECL_DENSE_TENANT_KEY: "meridian-health",
        ECL_DENSE_ASSESSMENT_ID: "assessment-dense-source-room-20260823",
        ECL_DENSE_ENTERPRISE_NAME: "Meridian Health",
        ECL_DENSE_ENTERPRISE_KEY: "MERIDIAN-HEALTH",
      },
    },
    {
      label: "skyharbor",
      env: {
        ECL_DENSE_PROFILE: "skyharbor-airline",
        ECL_DENSE_TENANT_KEY: "skyharbor-air",
        ECL_DENSE_ASSESSMENT_ID: "assessment-dense-skyharbor-20260827",
        ECL_DENSE_ENTERPRISE_NAME: "SkyHarbor Global",
        ECL_DENSE_ENTERPRISE_KEY: "SKYHARBOR-GLOBAL",
        ECL_DENSE_PROFILE_ANCHOR:
          "$50B+ global airline synthetic estate with mainframe, Teradata, airport operations, loyalty, cargo, and disruption-recovery complexity",
      },
    },
  ];

  const meridian = buildSql(profiles[0]);
  const skyharbor = buildSql(profiles[1]);
  const meridianIds = collectUuids(meridian.outDir);
  const skyharborIds = collectUuids(skyharbor.outDir);
  const overlap = [...meridianIds].filter((id) => skyharborIds.has(id));

  assert.ok(meridianIds.size > 30_000, `expected many Meridian UUIDs, found ${meridianIds.size}`);
  assert.ok(skyharborIds.size > 30_000, `expected many SkyHarbor UUIDs, found ${skyharborIds.size}`);
  assert.deepEqual(overlap, [], "dense ECL UUIDs must not collide across active tenant profiles");

  console.log(
    JSON.stringify(
      {
        accepted: true,
        meridianUuidCount: meridianIds.size,
        skyharborUuidCount: skyharborIds.size,
        overlapCount: overlap.length,
      },
      null,
      2,
    ),
  );
} finally {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}
