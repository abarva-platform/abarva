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

const sharedPath = 'src/lib/programs/intelligence-promotion-approval.ts';
const submitPath = 'src/lib/programs/origination-submit.ts';
const workspacePath =
  'src/components/programs/origination/ProgramOriginationWorkspace.tsx';
const panelPath = 'src/components/programs/origination/ProgramBriefPanel.tsx';
const sharedTestPath =
  'src/lib/programs/__tests__/intelligence-promotion-approval.test.ts';
const panelTestPath =
  'src/components/programs/origination/__tests__/ProgramBriefPanel.test.tsx';
const submitContractTestPath =
  'src/lib/programs/__tests__/origination-submit-contract.test.ts';
const actionCatalogPath = 'docs/legal/AI_CONSEQUENTIAL_ACTION_CATALOG.md';
const uiCatalogPath = 'docs/legal/AI_GENERATED_UI_CATALOG.md';
const buildPath = 'docs/build/INTELLIGENCE_PROMOTION_APPROVAL_2026-06-03.md';
const releasePath =
  'docs/releases/records/2026-06-03-intelligence-promotion-approval.md';

const shared = read(sharedPath);
const submit = read(submitPath);
const workspace = read(workspacePath);
const panel = read(panelPath);
const sharedTest = read(sharedTestPath);
const panelTest = read(panelTestPath);
const submitContractTest = read(submitContractTestPath);
const actionCatalog = read(actionCatalogPath);
const uiCatalog = read(uiCatalogPath);
const build = read(buildPath);
const release = read(releasePath);

[
  'INTELLIGENCE_PROMOTION_RATIONALE_MIN_CHARS = 24',
  'requiresIntelligencePromotionGate',
  'humanPromotionAccepted !== true',
  'validateIntelligencePromotionApproval',
].forEach((snippet) => requireSnippet(sharedPath, shared, snippet));

[
  'validateIntelligencePromotionApproval(input)',
  "'intelligence_promotion_approval_required'",
  'briefSnapshot.intelligence_promotion_gate',
  'human_promotion_accepted',
  'human_promotion_rationale',
  'evidence_refs',
  'accepted_by_user_id: tenancy.userId',
].forEach((snippet) => requireSnippet(submitPath, submit, snippet));

[
  'requiresIntelligencePromotionGate',
  'promotionEvidenceRefs',
  'humanPromotionAccepted',
  'humanPromotionRationale',
  'promotionApproval=',
].forEach((snippet) => requireSnippet(workspacePath, workspace, snippet));

[
  'Intelligence pattern promotion approval',
  'Human promotion gate required',
  'minimumRationaleChars',
  'Submit brief for approval',
].forEach((snippet) => requireSnippet(panelPath, panel, snippet));

[
  'rejects a required promotion without explicit human acceptance',
  'rejects a required promotion with a short rationale',
  'accepts a required promotion with acceptance, rationale, and evidence',
].forEach((snippet) => requireSnippet(sharedTestPath, sharedTest, snippet));

[
  'requires promotion approval before an Intelligence-pattern Move can be submitted',
  'allows submit once promotion approval is complete',
].forEach((snippet) => requireSnippet(panelTestPath, panelTest, snippet));

[
  'requires and persists Intelligence pattern promotion approval evidence',
  'briefSnapshot.intelligence_promotion_gate',
].forEach((snippet) =>
  requireSnippet(submitContractTestPath, submitContractTest, snippet),
);

[
  'Covered: pattern cards state the human promotion gate',
  'origination panel now renders an Intelligence promotion approval card',
].forEach((snippet) =>
  requireSnippet(actionCatalogPath, actionCatalog, snippet),
);

[
  'Human promotion gate required',
  'promotion briefs carry source-thread and selected-pattern evidence refs',
].forEach((snippet) => requireSnippet(uiCatalogPath, uiCatalog, snippet));

[
  'Backlog: T234',
  'human_promotion_accepted',
  'Future promotion surfaces must call the same server gate',
].forEach((snippet) => requireSnippet(buildPath, build, snippet));

[
  '2026-06-03-intelligence-promotion-approval',
  'global-control-lane',
  'human approval checkbox, rationale, and evidence refs',
].forEach((snippet) => requireSnippet(releasePath, release, snippet));

const failed = checks.filter((check) => check.status === 'fail');
console.log(
  JSON.stringify(
    {
      audit: 'intelligence-promotion-approval',
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
