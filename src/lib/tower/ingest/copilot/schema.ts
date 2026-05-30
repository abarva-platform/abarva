// Tower ingest · GitHub Copilot usage + cost · canonical column shape.
//
// One row = one team-month observation. This is the contract between the
// Excel template (public/templates/tower/copilot/) and the parser. Keep
// header labels stable — they are the public-facing API for IT admins.

export const COPILOT_INGEST_VERSION = '1.0.0';
export const COPILOT_TOOL_KIND = 'github_copilot' as const;

export interface CopilotUsageRow {
  team: string;
  period_start: string; // ISO yyyy-mm-dd
  period_end: string; // ISO yyyy-mm-dd
  active_users: number;
  total_suggestions: number;
  accepted_suggestions: number;
  acceptance_rate_pct: number | null;
  monthly_cost_usd: number;
  seats_assigned: number;
  seats_used: number;
}

export interface CopilotColumnSpec {
  /** Canonical key on CopilotUsageRow. */
  key: keyof CopilotUsageRow;
  /** Header label written into the template. */
  label: string;
  /** Cell type — drives ExcelJS data validation. */
  type: 'string' | 'date' | 'integer' | 'number' | 'percent';
  required: boolean;
  description: string;
}

export const COPILOT_COLUMNS: CopilotColumnSpec[] = [
  {
    key: 'team',
    label: 'Team',
    type: 'string',
    required: true,
    description: 'Engineering team name as it appears in GitHub Org → Teams.',
  },
  {
    key: 'period_start',
    label: 'Period Start',
    type: 'date',
    required: true,
    description: 'First day of the billing/usage period (YYYY-MM-DD).',
  },
  {
    key: 'period_end',
    label: 'Period End',
    type: 'date',
    required: true,
    description: 'Last day of the billing/usage period (YYYY-MM-DD).',
  },
  {
    key: 'active_users',
    label: 'Active Users',
    type: 'integer',
    required: true,
    description: 'Distinct seats that produced at least one Copilot suggestion in the period.',
  },
  {
    key: 'total_suggestions',
    label: 'Total Suggestions',
    type: 'integer',
    required: true,
    description: 'Suggestions surfaced to the user (sum across the team for the period).',
  },
  {
    key: 'accepted_suggestions',
    label: 'Accepted Suggestions',
    type: 'integer',
    required: true,
    description: 'Suggestions the user accepted (Tab/Enter to keep). Must be ≤ Total Suggestions.',
  },
  {
    key: 'acceptance_rate_pct',
    label: 'Acceptance Rate %',
    type: 'percent',
    required: false,
    description: 'Optional. Derived as Accepted / Total × 100 when blank. Range 0–100.',
  },
  {
    key: 'monthly_cost_usd',
    label: 'Monthly Cost (USD)',
    type: 'number',
    required: true,
    description: 'Period-prorated cost charged for this team in USD (from GitHub billing API).',
  },
  {
    key: 'seats_assigned',
    label: 'Seats Assigned',
    type: 'integer',
    required: true,
    description: 'Copilot seats assigned to the team at period end.',
  },
  {
    key: 'seats_used',
    label: 'Seats Used',
    type: 'integer',
    required: true,
    description: 'Seats that produced any activity in the period. Must be ≤ Seats Assigned.',
  },
];

/** Header-row labels in canonical order — used by the parser to map cells. */
export const COPILOT_HEADER_ORDER: string[] = COPILOT_COLUMNS.map((c) => c.label);
