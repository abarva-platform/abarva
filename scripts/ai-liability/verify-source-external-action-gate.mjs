#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const checks = [];

function read(path) {
  const body = readFileSync(join(root, path), 'utf8');
  checks.push({ name: `file.${path}`, status: 'pass' });
  return body;
}

function requireSnippet(path, body, snippet) {
  checks.push({
    name: `snippet.${path}.${snippet}`,
    status: body.includes(snippet) ? 'pass' : 'fail',
  });
}

const gatePath = 'src/lib/source/external-action-gate.ts';
const routePath = 'src/app/api/v1/source/work-items/route.ts';
const componentPath = 'src/components/source/RenewalCockpitActionBar.tsx';
const testPath =
  'src/__tests__/integration/source/source-external-action-gate.test.ts';
const actionCatalogPath = 'docs/legal/AI_CONSEQUENTIAL_ACTION_CATALOG.md';
const uiCatalogPath = 'docs/legal/AI_GENERATED_UI_CATALOG.md';
const buildPath = 'docs/build/SOURCE_EXTERNAL_ACTION_GATE_2026-06-03.md';
const releasePath =
  'docs/releases/records/2026-06-03-source-external-action-gate.md';

const gate = read(gatePath);
const route = read(routePath);
const component = read(componentPath);
const test = read(testPath);
const actionCatalog = read(actionCatalogPath);
const uiCatalog = read(uiCatalogPath);
const build = read(buildPath);
const release = read(releasePath);

[
  'SOURCE_EXTERNAL_ACTION_RATIONALE_MIN_CHARS = 24',
  'validateSourceExternalActionGate',
  'human_external_action_gate_required',
  "'serve_notice'",
  "'vendor_notification'",
  "'contract_draft_commit'",
].forEach((snippet) => requireSnippet(gatePath, gate, snippet));

[
  'validateSourceExternalActionGate',
  'human_external_action_gate_required',
  'minimumRationaleChars',
  "metadata.externalActionGate = 'human_confirmed'",
  "metadata.externalActionControl = 'ai_draft_human_review_human_sends'",
].forEach((snippet) => requireSnippet(routePath, route, snippet));

[
  'serveNoticeJustification',
  'Human approval rationale',
  'humanConfirmed: true',
  'humanJustification: serveNoticeJustification.trim()',
  'evidenceRefs: serveNoticeEvidenceRefs',
].forEach((snippet) => requireSnippet(componentPath, component, snippet));

[
  'rejects serve_notice without explicit human confirmation',
  'rejects serve_notice when the human rationale is too short',
  'accepts a confirmed serve_notice with rationale and evidence refs',
  'keeps the API route and cockpit wired to the gate',
].forEach((snippet) => requireSnippet(testPath, test, snippet));

[
  'serve_notice` external-action work items now fail closed',
  'RFP-send, contract-draft-commit, or vendor-notification',
].forEach((snippet) =>
  requireSnippet(actionCatalogPath, actionCatalog, snippet),
);

[
  'serve-notice work item',
  'serve-notice requires a human rationale before the button enables',
].forEach((snippet) => requireSnippet(uiCatalogPath, uiCatalog, snippet));

[
  'Backlog: T239',
  'AbarVa records the coordination task only',
  'Future RFP-send, contract-draft-commit, and vendor-notification',
].forEach((snippet) => requireSnippet(buildPath, build, snippet));

[
  '2026-06-03-source-external-action-gate',
  'global-control-lane',
  'AbarVa still does not send external legal notice or vendor email',
].forEach((snippet) => requireSnippet(releasePath, release, snippet));

const failed = checks.filter((check) => check.status === 'fail');
console.log(
  JSON.stringify(
    {
      audit: 'source-external-action-gate',
      status: failed.length === 0 ? 'pass' : 'fail',
      summary: {
        pass: checks.length - failed.length,
        fail: failed.length,
      },
      checks,
    },
    null,
    2,
  ),
);

if (failed.length > 0) {
  process.exitCode = 1;
}
