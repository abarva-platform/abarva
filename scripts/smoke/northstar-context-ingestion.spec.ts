import assert from 'node:assert/strict';

import { runNorthstarContextIngestion } from '../../src/lib/context-ingestion/sync-runner';
import type { ContextEvidenceRow, ContextValidationFinding } from '../../src/lib/context-ingestion/types';

function assertFinding(
  findings: ContextValidationFinding[],
  code: string,
  field: string,
  actual: string,
): void {
  assert.ok(
    findings.some((finding) =>
      finding.code === code
      && finding.field === field
      && finding.actual === actual
      && finding.severity === 'error',
    ),
    `Expected ${code} finding on ${field} with actual=${actual}`,
  );
}

function assertEvidenceHasLocatorAndConfidence(rows: ContextEvidenceRow[]): void {
  assert.ok(rows.length > 0, 'Expected committed evidence rows');
  for (const row of rows) {
    assert.ok(row.sourceLocator.fileName, `Evidence row ${row.evidenceId} is missing source file locator`);
    assert.ok(row.confidence > 0 && row.confidence <= 1, `Evidence row ${row.evidenceId} has invalid confidence`);
    assert.ok(row.sourceText.includes(row.sourceLocator.fileName), `Evidence row ${row.evidenceId} has weak source text`);
  }
}

const cmdbCsv = [
  'app_id,name,criticality,owner_role,system_of_record,time_classification,annual_value_usd',
  'NST-APP-001,Northstar SAP S/4 Clinical Finance,tier_0,CIO ERP Transformation,SAP S/4HANA,invest,42000000',
  'NST-APP-002,Northstar AS400 Recall Bridge,tier_1,VP Enterprise Architecture,IBM i,hibernate,1600000',
  'NST-APP-003,Northstar Legacy Quality Data Mart,tier_2,VP Enterprise Architecture,Oracle,retire,not-a-number',
].join('\n');

const cmdbResult = runNorthstarContextIngestion({
  fileName: 'northstar-cmdb-application-portfolio.csv',
  mimeType: 'text/csv',
  text: cmdbCsv,
});

assert.equal(cmdbResult.run.classification.dimension, 'application_portfolio');
assert.equal(cmdbResult.run.classification.templateType, 'application-portfolio');
assert.equal(cmdbResult.run.classification.extractionStrategy, 'structured_rows');
assert.equal(cmdbResult.run.classification.llmExtractionNeeded, false);
assertFinding(cmdbResult.run.validationFindings, 'invalid_enum_value', 'time_classification', 'hibernate');
assertFinding(cmdbResult.run.validationFindings, 'invalid_numeric_value', 'annual_value_usd', 'not-a-number');
assert.ok(
  cmdbResult.run.committedFactIds.some((factId) => factId.includes('nst-app-001')),
  'Expected the valid CMDB row to commit facts',
);
assert.ok(
  cmdbResult.run.approvedFactIds.length === cmdbResult.committed.committedFacts.length,
  'Approved fact count should match committed fact count',
);
assert.ok(cmdbResult.committed.availableToAgents, 'Committed CMDB facts should unlock agent availability');
assertEvidenceHasLocatorAndConfidence(cmdbResult.committed.evidenceRows);
assert.ok(
  cmdbResult.committed.evidenceRows.some((row) => row.sourceLocator.row === 2),
  'Expected CMDB evidence to retain row-level source locator metadata',
);

console.log('PASS 1: CMDB CSV classification, validation defects, commits, and evidence locators are deterministic.');

const strategyPdfText = [
  'Northstar Clinical Technologies board strategy memo.',
  'Priority: stabilize regulated ERP modernization before accelerating AI in QMS workflows.',
  'Owner role: CIO and Chief Quality Officer.',
  'Time horizon: FY2026-FY2028.',
].join('\n');

const strategyResult = runNorthstarContextIngestion({
  fileName: 'northstar-strategy-board-priorities.pdf',
  mimeType: 'application/pdf',
  text: strategyPdfText,
});

assert.equal(strategyResult.run.classification.dimension, 'c_suite_strategy');
assert.equal(strategyResult.run.classification.extractionStrategy, 'document_facts');
assert.equal(strategyResult.run.classification.llmExtractionNeeded, true);
assert.ok(strategyResult.run.facts.length > 0, 'Expected PDF strategy upload to emit staged facts');
assert.ok(
  strategyResult.run.facts.every((fact) => fact.extractionMethod === 'hybrid'),
  'Expected PDF facts to use hybrid extraction marker',
);
assert.ok(strategyResult.committed.committedFacts.length > 0, 'Expected non-required PDF facts to commit for review evidence');
assertEvidenceHasLocatorAndConfidence(strategyResult.committed.evidenceRows);
assert.ok(
  strategyResult.committed.evidenceRows.every((row) => row.sourceLocator.page === 1),
  'Expected PDF evidence rows to retain page-level source locator metadata',
);

console.log('PASS 2: Strategy PDF marks LLM-needed document extraction and still stages/commits evidence-backed facts.');

const financialFactsJson = JSON.stringify([
  {
    period: '2026-Q1',
    metric: 'organic_revenue_growth_pct',
    value: '4.2',
    currency_or_unit: 'pct',
    segment: 'Health Information Systems',
  },
  {
    period: '2026-Q1',
    metric: 'adjusted_operating_margin_pct',
    value: '22.8',
    currency_or_unit: 'pct',
    segment: 'Surgical Technologies',
  },
]);

const financialResult = runNorthstarContextIngestion({
  fileName: 'northstar-financial-kpis.json',
  mimeType: 'application/json',
  text: financialFactsJson,
});

assert.equal(financialResult.run.classification.dimension, 'financial_kpis');
assert.equal(financialResult.run.classification.extractionStrategy, 'structured_rows');
assert.equal(financialResult.run.validationFindings.length, 0, 'Expected clean structured JSON facts');
assert.equal(financialResult.run.rejectedFactIds.length, 0, 'Approval queue should not reject clean structured JSON facts');
assert.equal(
  financialResult.run.approvedFactIds.length,
  financialResult.committed.committedFacts.length,
  'Approval queue should deterministically commit every approved JSON fact',
);
assert.ok(
  financialResult.committed.committedFacts.some((fact) => fact.entityKey.includes('row:2') && fact.field === 'metric'),
  'Expected JSON extraction to preserve deterministic row-based entity keys',
);
assertEvidenceHasLocatorAndConfidence(financialResult.committed.evidenceRows);

console.log('PASS 3: Structured financial JSON extraction and approval queue behavior are deterministic.');

console.log('PASS: Northstar context-ingestion smoke test completed.');
