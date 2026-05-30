// S4 — Cursor usage + cost ingest
// Column schema for the Cursor team-usage template. Drives template
// generation, the CSV/XLSX parser, and the validator so they cannot
// drift apart.
//
// Source: Cursor Admin Dashboard → Team usage CSV (org-level) +
//         Cursor billing portal (monthly cost per team).
// Grain:  one row per team × calendar month.

export const CURSOR_TEMPLATE_VERSION = '1.0';

export type CursorColumnType = 'string' | 'number' | 'date';

export interface CursorColumnSpec {
  key: string;
  label: string;
  required: boolean;
  type: CursorColumnType;
  description: string;
  example: string;
}

export const CURSOR_COLUMNS: CursorColumnSpec[] = [
  {
    key: 'team',
    label: 'team',
    required: true,
    type: 'string',
    description:
      'Team name as it appears in the Cursor Admin Dashboard (Settings → Teams). Stable across months.',
    example: 'Platform Engineering',
  },
  {
    key: 'period_start',
    label: 'period_start',
    required: true,
    type: 'date',
    description:
      'YYYY-MM-DD. First day of the billing month (the canonical period grain).',
    example: '2025-10-01',
  },
  {
    key: 'period_end',
    label: 'period_end',
    required: true,
    type: 'date',
    description: 'YYYY-MM-DD. Last day of the billing month, inclusive.',
    example: '2025-10-31',
  },
  {
    key: 'seats_assigned',
    label: 'seats_assigned',
    required: true,
    type: 'number',
    description:
      'Cursor seats assigned to the team for the period (the billed count, not the cap).',
    example: '24',
  },
  {
    key: 'active_users',
    label: 'active_users',
    required: true,
    type: 'number',
    description:
      'Distinct users on the team who completed at least one Cursor action in the period. Must be ≤ seats_assigned.',
    example: '21',
  },
  {
    key: 'completions_shown',
    label: 'completions_shown',
    required: true,
    type: 'number',
    description:
      'Total Cursor completions / suggestions shown to the team in the period.',
    example: '184320',
  },
  {
    key: 'completions_accepted',
    label: 'completions_accepted',
    required: true,
    type: 'number',
    description:
      'Total completions accepted by team members in the period. Must be ≤ completions_shown.',
    example: '52608',
  },
  {
    key: 'monthly_cost_usd',
    label: 'monthly_cost_usd',
    required: true,
    type: 'number',
    description:
      'Total USD invoiced for this team in the period (from Cursor billing portal). Non-negative.',
    example: '960.00',
  },
];

export const CURSOR_SHEET_NAME = 'Data';
export const CURSOR_HOWTO_SHEET = 'How to fill';
export const CURSOR_SCHEMA_SHEET = 'Schema';

export const CURSOR_TEMPLATE_FILENAME = 'template.xlsx';
export const CURSOR_SAMPLE_FILENAME = 'sample-filled.xlsx';

export const CURSOR_REQUIRED_KEYS: ReadonlySet<string> = new Set(
  CURSOR_COLUMNS.filter((c) => c.required).map((c) => c.key),
);

export const CURSOR_HEADER_ORDER: ReadonlyArray<string> = CURSOR_COLUMNS.map(
  (c) => c.label,
);
