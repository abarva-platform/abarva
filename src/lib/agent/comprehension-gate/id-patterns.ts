export interface ComprehensionPattern {
  kind: 'raw_id' | 'internal_code' | 'code_identifier' | 'unexplained_acronym';
  pattern: RegExp;
  describe: (value: string) => string;
}

export const COMPREHENSION_PATTERNS: ComprehensionPattern[] = [
  {
    kind: 'raw_id',
    pattern: /\bsignal:[a-z0-9:_-]{8,}\b/gi,
    describe: () => 'portfolio signal',
  },
  {
    kind: 'raw_id',
    pattern: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
    describe: () => 'record identifier',
  },
  {
    kind: 'internal_code',
    pattern: /\bSTRESS-P\d+-\d+\b/gi,
    describe: () => 'stress-test finding',
  },
  {
    kind: 'code_identifier',
    pattern: /\b(?:client_id|tenant_id|source_event_id|engagement_id|initiative_id)\b/gi,
    describe: (value) => value.replace(/_/g, ' '),
  },
];

export const EXECUTIVE_ACRONYMS = new Set([
  'AI',
  'API',
  'BAA',
  'BAFO',
  'CDO',
  'CDP',
  'CFO',
  'CHRO',
  'CIO',
  'CISO',
  'CMIO',
  'CMO',
  'COO',
  'CXO',
  'ERP',
  'IT',
  'KPI',
  'NPS',
  'RFI',
  'RFP',
  'ROI',
  'SI',
  'SLA',
  'SOW',
  'TCO',
]);
