#!/usr/bin/env node

import assert from 'node:assert/strict';

import { redactSensitiveTokens, scanFile, summarizeBy } from '../build-home-layer4-boundary-report.mjs';

const activeRoot = ['datasets', 'tenant-inputs', 'active', 'example-client', 'current'].join('/');
const layer1Findings = scanFile(
  'src/lib/home/local-cxo-runtime.ts',
  `
import { existsSync, readFileSync } from "node:fs";
const datasetDir = "${activeRoot}";
const runtimeSource = "local-v3-active";
readFileSync(datasetDir, "utf8");
`,
);

assert.equal(
  layer1Findings.some((finding) => finding.findingId === 'layer1_active_intake_read'),
  true,
);
assert.equal(
  layer1Findings.some((finding) => finding.findingId === 'filesystem_api_for_repository_data'),
  true,
);

const fixtureFindings = scanFile(
  'src/lib/home/readTenantAiSuccessHome.ts',
  'import snapshot from "./ai-success-data/data-capability-packet.json";',
);
assert.deepEqual(fixtureFindings.map((finding) => finding.findingId), ['static_json_fixture_snapshot']);

assert.equal(
  redactSensitiveTokens('datasets/context-artifacts/approved/example-client/home-knowledge/story.json'),
  '[legacy-home-artifact-root]/story.json',
);
assert.equal(
  redactSensitiveTokens('src/lib/home/readTenantExampleAiSuccessHome.ts'),
  'src/lib/home/readTenantAiSuccessHome.ts',
);

assert.deepEqual(
  summarizeBy(
    [
      { findingId: 'a' },
      { findingId: 'b' },
      { findingId: 'a' },
    ],
    'findingId',
  ),
  [
    { findingId: 'a', count: 2 },
    { findingId: 'b', count: 1 },
  ],
);

console.log('home-layer4-boundary-report tests passed');
