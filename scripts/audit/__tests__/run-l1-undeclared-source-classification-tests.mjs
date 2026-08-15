#!/usr/bin/env node

import assert from 'node:assert/strict';

import { classifyUndeclaredFile, summarizeBy } from '../build-l1-undeclared-source-classification.mjs';

assert.deepEqual(classifyUndeclaredFile('08_it_budget_spend_value.csv'), {
  classification: 'variant_of_declared_template',
  proposedDisposition: 'rename-or-map-to-existing-declared-template-after-review',
  targetContractFile: '08_spend_value.csv',
  contractAmendmentNeeded: false,
});

assert.equal(
  classifyUndeclaredFile('SA09_AI_Tool_Usage_Feed.csv').classification,
  'source_adapter_extract_contract_candidate',
);
assert.equal(
  classifyUndeclaredFile('20_itsm_ticket_sla_performance.csv').classification,
  'genuine_new_source_contract_candidate',
);
assert.equal(
  classifyUndeclaredFile('scratchpad.csv').classification,
  'artifact_or_unclassified_active_root_file',
);

assert.deepEqual(
  summarizeBy(
    [
      { classification: 'a' },
      { classification: 'b' },
      { classification: 'a' },
    ],
    'classification',
  ),
  [
    { classification: 'a', count: 2 },
    { classification: 'b', count: 1 },
  ],
);

console.log('l1-undeclared-source-classification tests passed');
