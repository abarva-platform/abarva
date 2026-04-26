// ACT3 · AI Adoption & Usage Read Model
//
// Operationalizes dimension #2 ("AI Adoption & Usage") of the AI
// Control Tower contract (ACT1). Projects a deterministic, cross-
// tenant inventory of AI tool adoption and usage records the Tower
// can compose into Atlas brief content, scorecards, and pressure
// cards.
//
// This is a deterministic seed-only read model. There are no:
//
// - live integrations,
// - external API calls,
// - migrations,
// - LLM / model invocations,
// - timestamp-dependent values,
// - random values,
// - tenant database lookups,
// - imports from Source / Sentinel / Atlas / Nexus / Agent runtime,
//   auth, or supabase.
//
// Future ACT3.x slices will:
//
// - bind these records to per-tenant captured adoption telemetry,
// - replace the seed with a connector-backed projection,
// - persist edits and audit trails through Steward,
// - feed the seed into Atlas brief composition (ACT9).
//
// Until then, this module is the only canonical source for AI
// adoption and usage shape across the Tower surface.

// ---------------------------------------------------------------------
// Canonical enums
// ---------------------------------------------------------------------

/**
 * Canonical AI tool keys. Each key names the tool the Tower expects
 * to find adoption telemetry for. The keys are vendor-neutral
 * identifiers — the Tower never claims endorsement of any tool, only
 * tracks whether the enterprise has captured adoption posture for it.
 */
export const AI_TOOL_KEYS = [
  'github_copilot',
  'claude_code',
  'codex',
  'cursor',
  'servicenow_ai_agents',
  'workday_ai_assistant',
  'erp_agents_generic',
  'salesforce_einstein',
  'microsoft_copilot_m365',
  'custom_internal_agents',
] as const;

export type AiToolKey = (typeof AI_TOOL_KEYS)[number];

/**
 * Canonical adoption health states. Tracks the lifecycle of the
 * tool's deployment within the enterprise.
 *
 * - `not_started` — tool is in evaluation; no adoption yet.
 * - `piloting` — tool is in a controlled cohort.
 * - `partial_adoption` — tool is rolling out beyond pilot.
 * - `broad_adoption` — tool is broadly available and used.
 * - `declining` — adoption is regressing relative to prior baseline.
 * - `retired` — tool is sunset.
 */
export const AI_ADOPTION_HEALTH_STATES = [
  'not_started',
  'piloting',
  'partial_adoption',
  'broad_adoption',
  'declining',
  'retired',
] as const;

export type AiAdoptionHealth = (typeof AI_ADOPTION_HEALTH_STATES)[number];

/**
 * Canonical usage volume bands. Captures qualitative usage intensity
 * without claiming a specific event count.
 */
export const AI_USAGE_VOLUME_BANDS = [
  'none',
  'low',
  'medium',
  'high',
  'very_high',
] as const;

export type AiUsageVolumeBand = (typeof AI_USAGE_VOLUME_BANDS)[number];

/**
 * Canonical workflow coverage status. Tracks how completely the tool
 * covers the workflows it is intended to serve.
 */
export const AI_WORKFLOW_COVERAGE_STATUSES = [
  'not_covered',
  'partial',
  'fully_covered',
] as const;

export type AiWorkflowCoverageStatus =
  (typeof AI_WORKFLOW_COVERAGE_STATUSES)[number];

/**
 * Canonical governance flag states. Tracks whether the adoption
 * record has been raised to governance review.
 */
export const AI_ADOPTION_GOVERNANCE_FLAGS = [
  'none',
  'review_required',
  'flagged',
] as const;

export type AiAdoptionGovernanceFlag =
  (typeof AI_ADOPTION_GOVERNANCE_FLAGS)[number];

/**
 * Single canonical AI tool adoption record. Every field is
 * deterministic. The `adoptionRate` is always derivable from
 * `activeUsers / potentialUsers`.
 */
export interface AiToolAdoptionRecord {
  /** Stable seed id of the form "ai-adopt-seed-{tool}-{n}". */
  readonly id: string;
  /** Canonical tool key. */
  readonly tool: AiToolKey;
  /** Human-readable tool name. */
  readonly toolName: string;
  /** Business function the adoption applies to. */
  readonly businessFunction: string;
  /** Active users (deterministic; never derived from a clock). */
  readonly activeUsers: number;
  /** Potential users in the same scope. */
  readonly potentialUsers: number;
  /**
   * Adoption rate in [0, 1]. Always equals
   * `activeUsers / potentialUsers` for the same record.
   */
  readonly adoptionRate: number;
  /** Usage volume band. */
  readonly usageVolume: AiUsageVolumeBand;
  /** Adoption health. */
  readonly adoptionHealth: AiAdoptionHealth;
  /** Workflows the adoption covers; ≥ 1 always. */
  readonly workflowsCovered: readonly string[];
  /** Workflow coverage status. */
  readonly workflowCoverageStatus: AiWorkflowCoverageStatus;
  /** Governance flag. */
  readonly governanceFlag: AiAdoptionGovernanceFlag;
  /** Provenance marker. Always 'deterministic_ai_adoption_seed'. */
  readonly createdFrom: 'deterministic_ai_adoption_seed';
}

/**
 * Aggregated adoption summary. All counts reconcile to
 * `totalRecords`.
 */
export interface AiAdoptionUsageSummary {
  readonly totalRecords: number;
  readonly byTool: Readonly<Record<AiToolKey, number>>;
  readonly byHealth: Readonly<Record<AiAdoptionHealth, number>>;
  readonly byUsageVolume: Readonly<Record<AiUsageVolumeBand, number>>;
  readonly totalActiveUsers: number;
  readonly totalPotentialUsers: number;
  readonly uniqueBusinessFunctions: readonly string[];
  readonly uniqueWorkflows: readonly string[];
}

// ---------------------------------------------------------------------
// Deterministic seed
// ---------------------------------------------------------------------

/**
 * Build a numbered seed id keyed by tool. Single source of truth so
 * callers cannot accidentally diverge id formats.
 */
function seedId(tool: AiToolKey, n: number): string {
  return `ai-adopt-seed-${tool}-${n}`;
}

/**
 * Derive a deterministic adoption rate from active and potential
 * users. Result is always in [0, 1] and rounded to four decimal
 * places to keep JSON.stringify byte-equal across runs.
 */
function computeAdoptionRate(active: number, potential: number): number {
  if (potential === 0) {
    return 0;
  }
  const raw = active / potential;
  return Math.round(raw * 10000) / 10000;
}

/**
 * The canonical adoption + usage seed. ≥ 18 records spread across
 * all ten tools and all six health states with the distribution
 * constraints enumerated in the ACT3 slice doc and asserted by the
 * test suite.
 *
 * Field-by-field determinism: every value is a string literal or a
 * literal numeric / boolean. There is no reliance on the host
 * environment's clock, randomness, or environment variables.
 *
 * Distribution (test-enforced):
 *
 * - ≥ 1 record per canonical tool (10 tools).
 * - ≥ 1 record per canonical health state (6 states).
 * - ≥ 6 distinct business functions.
 * - Every record has ≥ 1 workflow covered.
 * - Every record's `adoptionRate` equals
 *   `activeUsers / potentialUsers` (deterministic).
 * - ≥ 2 records carry `governanceFlag: 'flagged'`.
 * - No invented dollar amount in any string field.
 * - No branded vendor endorsement language.
 */
const AI_ADOPTION_USAGE_SEED: readonly AiToolAdoptionRecord[] = [
  // -----------------------------------------------------------------
  // github_copilot · Engineering · broad adoption in production
  // -----------------------------------------------------------------
  {
    id: seedId('github_copilot', 1),
    tool: 'github_copilot',
    toolName: 'GitHub Copilot (developer code completion)',
    businessFunction: 'Engineering',
    activeUsers: 420,
    potentialUsers: 500,
    adoptionRate: computeAdoptionRate(420, 500),
    usageVolume: 'high',
    adoptionHealth: 'broad_adoption',
    workflowsCovered: [
      'inline code completion',
      'unit test scaffold drafting',
      'pull-request comment summary',
    ],
    workflowCoverageStatus: 'partial',
    governanceFlag: 'none',
    createdFrom: 'deterministic_ai_adoption_seed',
  },
  {
    id: seedId('github_copilot', 2),
    tool: 'github_copilot',
    toolName: 'GitHub Copilot (developer code completion)',
    businessFunction: 'Quality Engineering',
    activeUsers: 35,
    potentialUsers: 80,
    adoptionRate: computeAdoptionRate(35, 80),
    usageVolume: 'medium',
    adoptionHealth: 'partial_adoption',
    workflowsCovered: [
      'test fixture drafting',
      'flaky-test annotation triage',
    ],
    workflowCoverageStatus: 'partial',
    governanceFlag: 'review_required',
    createdFrom: 'deterministic_ai_adoption_seed',
  },

  // -----------------------------------------------------------------
  // claude_code · Engineering / Platform piloting
  // -----------------------------------------------------------------
  {
    id: seedId('claude_code', 1),
    tool: 'claude_code',
    toolName: 'Claude Code (developer agent)',
    businessFunction: 'Platform Engineering',
    activeUsers: 18,
    potentialUsers: 60,
    adoptionRate: computeAdoptionRate(18, 60),
    usageVolume: 'medium',
    adoptionHealth: 'piloting',
    workflowsCovered: [
      'multi-file refactor drafting',
      'codebase question answering in pilot cohort',
    ],
    workflowCoverageStatus: 'partial',
    governanceFlag: 'review_required',
    createdFrom: 'deterministic_ai_adoption_seed',
  },
  {
    id: seedId('claude_code', 2),
    tool: 'claude_code',
    toolName: 'Claude Code (developer agent)',
    businessFunction: 'Engineering',
    activeUsers: 9,
    potentialUsers: 50,
    adoptionRate: computeAdoptionRate(9, 50),
    usageVolume: 'low',
    adoptionHealth: 'piloting',
    workflowsCovered: ['internal pilot exploration'],
    workflowCoverageStatus: 'not_covered',
    governanceFlag: 'review_required',
    createdFrom: 'deterministic_ai_adoption_seed',
  },

  // -----------------------------------------------------------------
  // codex · Engineering, declining (legacy)
  // -----------------------------------------------------------------
  {
    id: seedId('codex', 1),
    tool: 'codex',
    toolName: 'Codex (legacy code completion deployment)',
    businessFunction: 'Engineering',
    activeUsers: 22,
    potentialUsers: 200,
    adoptionRate: computeAdoptionRate(22, 200),
    usageVolume: 'low',
    adoptionHealth: 'declining',
    workflowsCovered: ['legacy IDE plugin completions'],
    workflowCoverageStatus: 'partial',
    governanceFlag: 'review_required',
    createdFrom: 'deterministic_ai_adoption_seed',
  },
  {
    id: seedId('codex', 2),
    tool: 'codex',
    toolName: 'Codex (legacy code completion deployment)',
    businessFunction: 'Data Engineering',
    activeUsers: 0,
    potentialUsers: 40,
    adoptionRate: computeAdoptionRate(0, 40),
    usageVolume: 'none',
    adoptionHealth: 'retired',
    workflowsCovered: ['legacy notebook completion (sunset)'],
    workflowCoverageStatus: 'not_covered',
    governanceFlag: 'none',
    createdFrom: 'deterministic_ai_adoption_seed',
  },

  // -----------------------------------------------------------------
  // cursor · Engineering, partial adoption
  // -----------------------------------------------------------------
  {
    id: seedId('cursor', 1),
    tool: 'cursor',
    toolName: 'Cursor (developer IDE assistant)',
    businessFunction: 'Engineering',
    activeUsers: 110,
    potentialUsers: 300,
    adoptionRate: computeAdoptionRate(110, 300),
    usageVolume: 'medium',
    adoptionHealth: 'partial_adoption',
    workflowsCovered: [
      'inline edit drafting',
      'codebase question answering',
    ],
    workflowCoverageStatus: 'partial',
    governanceFlag: 'review_required',
    createdFrom: 'deterministic_ai_adoption_seed',
  },

  // -----------------------------------------------------------------
  // servicenow_ai_agents · IT Service Management
  // -----------------------------------------------------------------
  {
    id: seedId('servicenow_ai_agents', 1),
    tool: 'servicenow_ai_agents',
    toolName: 'ServiceNow AI agents (ITSM)',
    businessFunction: 'IT Service Management',
    activeUsers: 75,
    potentialUsers: 250,
    adoptionRate: computeAdoptionRate(75, 250),
    usageVolume: 'medium',
    adoptionHealth: 'partial_adoption',
    workflowsCovered: [
      'incident summarization for service desk agents',
      'change ticket drafting assistance',
    ],
    workflowCoverageStatus: 'partial',
    governanceFlag: 'review_required',
    createdFrom: 'deterministic_ai_adoption_seed',
  },
  {
    id: seedId('servicenow_ai_agents', 2),
    tool: 'servicenow_ai_agents',
    toolName: 'ServiceNow AI agents (ITSM)',
    businessFunction: 'Customer Support',
    activeUsers: 5,
    potentialUsers: 200,
    adoptionRate: computeAdoptionRate(5, 200),
    usageVolume: 'low',
    adoptionHealth: 'not_started',
    workflowsCovered: ['support knowledge lookup (evaluation only)'],
    workflowCoverageStatus: 'not_covered',
    governanceFlag: 'none',
    createdFrom: 'deterministic_ai_adoption_seed',
  },

  // -----------------------------------------------------------------
  // workday_ai_assistant · HR
  // -----------------------------------------------------------------
  {
    id: seedId('workday_ai_assistant', 1),
    tool: 'workday_ai_assistant',
    toolName: 'Workday AI assistant (HR)',
    businessFunction: 'HR',
    activeUsers: 0,
    potentialUsers: 600,
    adoptionRate: computeAdoptionRate(0, 600),
    usageVolume: 'none',
    adoptionHealth: 'not_started',
    workflowsCovered: ['HR self-service question answering (planned)'],
    workflowCoverageStatus: 'not_covered',
    governanceFlag: 'none',
    createdFrom: 'deterministic_ai_adoption_seed',
  },

  // -----------------------------------------------------------------
  // erp_agents_generic · Finance
  // -----------------------------------------------------------------
  {
    id: seedId('erp_agents_generic', 1),
    tool: 'erp_agents_generic',
    toolName: 'ERP-embedded AI agents (vendor not selected)',
    businessFunction: 'Finance',
    activeUsers: 14,
    potentialUsers: 80,
    adoptionRate: computeAdoptionRate(14, 80),
    usageVolume: 'low',
    adoptionHealth: 'piloting',
    workflowsCovered: [
      'invoice exception triage assistance',
      'period close anomaly narrative drafting',
    ],
    workflowCoverageStatus: 'partial',
    governanceFlag: 'flagged',
    createdFrom: 'deterministic_ai_adoption_seed',
  },
  {
    id: seedId('erp_agents_generic', 2),
    tool: 'erp_agents_generic',
    toolName: 'ERP-embedded AI agents (vendor not selected)',
    businessFunction: 'Procurement',
    activeUsers: 0,
    potentialUsers: 90,
    adoptionRate: computeAdoptionRate(0, 90),
    usageVolume: 'none',
    adoptionHealth: 'retired',
    workflowsCovered: ['supplier risk briefing (sunset pilot)'],
    workflowCoverageStatus: 'not_covered',
    governanceFlag: 'none',
    createdFrom: 'deterministic_ai_adoption_seed',
  },

  // -----------------------------------------------------------------
  // salesforce_einstein · Sales / Customer Support
  // -----------------------------------------------------------------
  {
    id: seedId('salesforce_einstein', 1),
    tool: 'salesforce_einstein',
    toolName: 'Salesforce Einstein assistive features',
    businessFunction: 'Sales',
    activeUsers: 240,
    potentialUsers: 320,
    adoptionRate: computeAdoptionRate(240, 320),
    usageVolume: 'high',
    adoptionHealth: 'broad_adoption',
    workflowsCovered: [
      'opportunity scoring review',
      'next-best-action prompts in account workspace',
    ],
    workflowCoverageStatus: 'fully_covered',
    governanceFlag: 'none',
    createdFrom: 'deterministic_ai_adoption_seed',
  },
  {
    id: seedId('salesforce_einstein', 2),
    tool: 'salesforce_einstein',
    toolName: 'Salesforce Einstein assistive features',
    businessFunction: 'Customer Support',
    activeUsers: 60,
    potentialUsers: 220,
    adoptionRate: computeAdoptionRate(60, 220),
    usageVolume: 'medium',
    adoptionHealth: 'declining',
    workflowsCovered: ['case classification suggestions in support console'],
    workflowCoverageStatus: 'partial',
    governanceFlag: 'flagged',
    createdFrom: 'deterministic_ai_adoption_seed',
  },

  // -----------------------------------------------------------------
  // microsoft_copilot_m365 · Productivity surface
  // -----------------------------------------------------------------
  {
    id: seedId('microsoft_copilot_m365', 1),
    tool: 'microsoft_copilot_m365',
    toolName: 'Microsoft 365 Copilot (productivity surface)',
    businessFunction: 'Knowledge Worker Productivity',
    activeUsers: 850,
    potentialUsers: 2000,
    adoptionRate: computeAdoptionRate(850, 2000),
    usageVolume: 'high',
    adoptionHealth: 'broad_adoption',
    workflowsCovered: [
      'meeting summary drafting',
      'document drafting in Word',
      'spreadsheet formula explanation in Excel',
    ],
    workflowCoverageStatus: 'partial',
    governanceFlag: 'review_required',
    createdFrom: 'deterministic_ai_adoption_seed',
  },
  {
    id: seedId('microsoft_copilot_m365', 2),
    tool: 'microsoft_copilot_m365',
    toolName: 'Microsoft 365 Copilot (productivity surface)',
    businessFunction: 'Legal',
    activeUsers: 12,
    potentialUsers: 40,
    adoptionRate: computeAdoptionRate(12, 40),
    usageVolume: 'low',
    adoptionHealth: 'piloting',
    workflowsCovered: ['contract review summary drafting in pilot cohort'],
    workflowCoverageStatus: 'partial',
    governanceFlag: 'flagged',
    createdFrom: 'deterministic_ai_adoption_seed',
  },

  // -----------------------------------------------------------------
  // custom_internal_agents · Operations / Internal
  // -----------------------------------------------------------------
  {
    id: seedId('custom_internal_agents', 1),
    tool: 'custom_internal_agents',
    toolName: 'Custom internal agents (in-house framework)',
    businessFunction: 'Operations',
    activeUsers: 30,
    potentialUsers: 120,
    adoptionRate: computeAdoptionRate(30, 120),
    usageVolume: 'medium',
    adoptionHealth: 'partial_adoption',
    workflowsCovered: [
      'shift handover summary drafting',
      'incident narrative drafting',
    ],
    workflowCoverageStatus: 'partial',
    governanceFlag: 'review_required',
    createdFrom: 'deterministic_ai_adoption_seed',
  },
  {
    id: seedId('custom_internal_agents', 2),
    tool: 'custom_internal_agents',
    toolName: 'Custom internal agents (in-house framework)',
    businessFunction: 'Risk',
    activeUsers: 4,
    potentialUsers: 30,
    adoptionRate: computeAdoptionRate(4, 30),
    usageVolume: 'low',
    adoptionHealth: 'declining',
    workflowsCovered: ['risk control narrative drafting (declining usage)'],
    workflowCoverageStatus: 'partial',
    governanceFlag: 'flagged',
    createdFrom: 'deterministic_ai_adoption_seed',
  },
  {
    id: seedId('custom_internal_agents', 3),
    tool: 'custom_internal_agents',
    toolName: 'Custom internal agents (in-house framework)',
    businessFunction: 'Customer Support',
    activeUsers: 200,
    potentialUsers: 220,
    adoptionRate: computeAdoptionRate(200, 220),
    usageVolume: 'very_high',
    adoptionHealth: 'broad_adoption',
    workflowsCovered: [
      'agent assist suggestions',
      'self-service deflection on the support web channel',
    ],
    workflowCoverageStatus: 'fully_covered',
    governanceFlag: 'none',
    createdFrom: 'deterministic_ai_adoption_seed',
  },
];

// ---------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------

/**
 * Build the canonical AI adoption + usage inventory. Result is a
 * frozen, deterministic list — repeated calls return byte-equal data.
 */
export function buildAiAdoptionUsageInventory(): readonly AiToolAdoptionRecord[] {
  return AI_ADOPTION_USAGE_SEED;
}

/**
 * Initialize a per-tool record where every canonical tool is present
 * with count 0. Used as the starting point for `byTool` aggregation
 * so callers can rely on every tool key existing even when count is
 * zero.
 */
function emptyToolCounts(): Record<AiToolKey, number> {
  const out: Record<AiToolKey, number> = {
    github_copilot: 0,
    claude_code: 0,
    codex: 0,
    cursor: 0,
    servicenow_ai_agents: 0,
    workday_ai_assistant: 0,
    erp_agents_generic: 0,
    salesforce_einstein: 0,
    microsoft_copilot_m365: 0,
    custom_internal_agents: 0,
  };
  return out;
}

/**
 * Initialize a per-health-state record where every canonical state
 * is present with count 0.
 */
function emptyHealthCounts(): Record<AiAdoptionHealth, number> {
  const out: Record<AiAdoptionHealth, number> = {
    not_started: 0,
    piloting: 0,
    partial_adoption: 0,
    broad_adoption: 0,
    declining: 0,
    retired: 0,
  };
  return out;
}

/**
 * Initialize a per-usage-band record where every canonical band is
 * present with count 0.
 */
function emptyUsageVolumeCounts(): Record<AiUsageVolumeBand, number> {
  const out: Record<AiUsageVolumeBand, number> = {
    none: 0,
    low: 0,
    medium: 0,
    high: 0,
    very_high: 0,
  };
  return out;
}

/**
 * Sort a list of strings ascending without mutating the input.
 */
function sortedAscending(values: readonly string[]): readonly string[] {
  return [...values].sort((a, b) => a.localeCompare(b));
}

/**
 * Build the deterministic summary for an adoption inventory. When
 * no records list is provided, summarizes the canonical seed.
 *
 * Reconciliation guarantees:
 *
 * - `Object.values(byTool).reduce(...)` equals `totalRecords`.
 * - `Object.values(byHealth).reduce(...)` equals `totalRecords`.
 * - `Object.values(byUsageVolume).reduce(...)` equals `totalRecords`.
 * - `totalActiveUsers` equals the sum of `activeUsers` across all
 *   records.
 * - `totalPotentialUsers` equals the sum of `potentialUsers` across
 *   all records.
 * - `uniqueBusinessFunctions` and `uniqueWorkflows` are sorted
 *   ascending and contain no duplicates.
 */
export function summarizeAiAdoptionUsage(
  records: readonly AiToolAdoptionRecord[] = AI_ADOPTION_USAGE_SEED,
): AiAdoptionUsageSummary {
  const byTool = emptyToolCounts();
  const byHealth = emptyHealthCounts();
  const byUsageVolume = emptyUsageVolumeCounts();
  const businessFunctions = new Set<string>();
  const workflows = new Set<string>();
  let totalActiveUsers = 0;
  let totalPotentialUsers = 0;

  for (const record of records) {
    byTool[record.tool] += 1;
    byHealth[record.adoptionHealth] += 1;
    byUsageVolume[record.usageVolume] += 1;
    businessFunctions.add(record.businessFunction);
    for (const workflow of record.workflowsCovered) {
      workflows.add(workflow);
    }
    totalActiveUsers += record.activeUsers;
    totalPotentialUsers += record.potentialUsers;
  }

  return {
    totalRecords: records.length,
    byTool,
    byHealth,
    byUsageVolume,
    totalActiveUsers,
    totalPotentialUsers,
    uniqueBusinessFunctions: sortedAscending([...businessFunctions]),
    uniqueWorkflows: sortedAscending([...workflows]),
  };
}

/**
 * Filter adoption records by tool key. Returns the records in the
 * same order they appear in the input list. When no records list is
 * provided, filters the canonical seed.
 */
export function getAiAdoptionByTool(
  tool: AiToolKey,
  records: readonly AiToolAdoptionRecord[] = AI_ADOPTION_USAGE_SEED,
): readonly AiToolAdoptionRecord[] {
  return records.filter((record) => record.tool === tool);
}

/**
 * Return records whose `adoptionHealth` is `'declining'` or
 * `'retired'`. The Tower uses these as the "regression" pressure
 * input for Atlas brief composition.
 */
export function getDecliningOrRetiredTools(
  records: readonly AiToolAdoptionRecord[] = AI_ADOPTION_USAGE_SEED,
): readonly AiToolAdoptionRecord[] {
  return records.filter(
    (record) =>
      record.adoptionHealth === 'declining' ||
      record.adoptionHealth === 'retired',
  );
}

/**
 * Return records whose `governanceFlag` is `'review_required'` or
 * `'flagged'`. The Tower uses these as the "ungoverned adoption"
 * pressure input — adoption that has spread without a governance
 * trail.
 */
export function getUngovernedAdoption(
  records: readonly AiToolAdoptionRecord[] = AI_ADOPTION_USAGE_SEED,
): readonly AiToolAdoptionRecord[] {
  return records.filter(
    (record) =>
      record.governanceFlag === 'review_required' ||
      record.governanceFlag === 'flagged',
  );
}
