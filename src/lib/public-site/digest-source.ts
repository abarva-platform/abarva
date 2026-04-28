import { CANONICAL_URLS } from './canonical-urls';

export interface DigestPattern {
  id: string;
  title: string;
  tier: 'validated' | 'draft';
}

export interface DigestContradiction {
  id: string;
  title: string;
  change: string;
}

export interface DigestSignal {
  id: string;
  summary: string;
}

export interface DigestEntry {
  weekOf: string;          // ISO date string e.g. "2026-04-28"
  weekLabel: string;       // "Week of April 28, 2026"
  newPatterns: DigestPattern[];
  contradictionsUpdated: DigestContradiction[];
  signalsIngested: DigestSignal[];
  patternRevisions: { id: string; title: string; change: string }[];
  url: string;             // canonical permalink for this entry
}

export function getDigestEntries(): DigestEntry[] {
  return [
    {
      weekOf: '2026-04-28',
      weekLabel: 'Week of April 28, 2026',
      url: `${CANONICAL_URLS.digest}#2026-04-28`,
      newPatterns: [
        { id: 'PAT-CDP-011', title: 'Real-time vs batch CDP architecture decision', tier: 'validated' },
        { id: 'PAT-AI-015', title: 'Agentic IDE rollout pattern', tier: 'draft' },
        { id: 'PAT-IND-FIN-004', title: 'Reg-tech AI in capital markets', tier: 'draft' },
      ],
      contradictionsUpdated: [
        {
          id: 'CON-001',
          title: 'CDP deployment timeline',
          change: 'Vendor B retracted 90-day claim; now claiming 110 days. Confidence delta now -28% from internal evidence.',
        },
      ],
      signalsIngested: [
        { id: 'SIG-001', summary: 'Microsoft Copilot pricing change (effective May 15)' },
        { id: 'SIG-002', summary: 'Anthropic Claude 4.7 release — cost reduction, capability uplift' },
        { id: 'SIG-003', summary: 'ServiceNow Now Assist v2 announcement' },
        { id: 'SIG-004', summary: 'SAP Joule enterprise rollout update' },
        { id: 'SIG-005', summary: 'Salesforce Einstein Copilot Q1 adoption report' },
        { id: 'SIG-006', summary: 'AWS Bedrock pricing reduction for Claude models' },
        { id: 'SIG-007', summary: 'Google Workspace Gemini rollout status' },
        { id: 'SIG-008', summary: 'OpenAI enterprise pricing restructure' },
        { id: 'SIG-009', summary: 'Azure AI Foundry GA announcement' },
        { id: 'SIG-010', summary: 'Snowflake Cortex AI new feature release' },
        { id: 'SIG-011', summary: 'Databricks Unity Catalog AI governance update' },
        { id: 'SIG-012', summary: 'Workday AI assistant enterprise availability' },
      ],
      patternRevisions: [
        { id: 'PAT-AI-005', title: 'Shadow AI Governance', change: 'Added §6 on policy-as-code patterns' },
        { id: 'PAT-SRC-001', title: 'Vendor BAFO Scoring', change: 'Added n=4 calibration data' },
      ],
    },
  ];
}

export function getLatestDigestEntry(): DigestEntry {
  return getDigestEntries()[0];
}
