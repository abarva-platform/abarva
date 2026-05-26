import { NORTHSTAR_CONTEXT_TEMPLATES } from './template-registry';

export const NORTHSTAR_PROFILE = {
  tenantKey: 'northstar',
  displayName: 'Northstar Clinical Technologies',
  revenue: '$22.6B',
  employees: '58,000',
  countries: 85,
  plants: 42,
  businessUnits: 6,
  itBudget: '$1.15B',
  ecosystemPeople: '~3,400',
  productEngineers: '~1,100',
};

export const NORTHSTAR_INGESTION_STAGES = [
  { stage: 'Upload Received', files: 96, facts: 0, issues: 0, approved: 0 },
  { stage: 'Classified', files: 96, facts: 0, issues: 0, approved: 0 },
  { stage: 'Parsed', files: 96, facts: 7820, issues: 0, approved: 0 },
  { stage: 'Mapped', files: 96, facts: 7820, issues: 184, approved: 0 },
  { stage: 'Validated', files: 96, facts: 7820, issues: 184, approved: 0 },
  { stage: 'Awaiting Approval', files: 96, facts: 7820, issues: 184, approved: 5120 },
  { stage: 'Committed', files: 96, facts: 7636, issues: 0, approved: 7636 },
  { stage: 'Available to Agents', files: 96, facts: 7636, issues: 0, approved: 7636 },
];

export const NORTHSTAR_CONTEXT_SUMMARY = {
  templateCount: NORTHSTAR_CONTEXT_TEMPLATES.length,
  uploadScenarioCount: 8,
  canonicalQuestionCount: 36,
  applicationCount: 240,
  integrationEdges: 820,
  activeInitiatives: 55,
  closedInitiatives: 25,
  vendorContracts: 90,
  roles: 3400,
  orgLeaders: 275,
};

export const NORTHSTAR_DEMO_PERSONAS = [
  ['CEO', 'Maya Rangan', 'ceo@northstar-clinical.example.com'],
  ['CFO', 'Daniel Okafor', 'cfo@northstar-clinical.example.com'],
  ['CIO', 'Priya Mehta', 'cio@northstar-clinical.example.com'],
  ['Chief Quality Officer', 'Elena Kovacs', 'cqo@northstar-clinical.example.com'],
  ['EVP Health Information Systems', 'Marcus Lee', 'evp-his@northstar-clinical.example.com'],
];
