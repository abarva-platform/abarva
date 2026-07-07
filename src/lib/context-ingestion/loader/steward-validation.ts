// Admin Loader — Steward deterministic validation (the open-ended-checks half).
// Pure: no I/O, no model calls, no server-only. Fully unit-testable.
// The Claude-backed reviewer is injected elsewhere via the StewardAgentReviewer
// interface; nothing in this file calls any model or touches the network.

import {
  classifyConfidence,
  type ClarificationQuestion,
  type MappingProposal,
  type StewardFinding,
  type StewardValidation,
} from '@/lib/context-ingestion/loader/contract';

/**
 * A coarse snapshot of the organization, used for proportionality / realism
 * checks. All fields optional — checks that need a value are skipped when it
 * is absent rather than firing false positives.
 */
export interface OrgProfile {
  annualRevenueUsd?: number;
  headcount?: number;
  hospitals?: number;
  coveredMembers?: number;
  itBudgetUsd?: number;
}

/**
 * Proportionality bands (exported so callers/tests can reason about the math).
 * IT budget as a share of revenue typically lands in the 3–5% range; outside
 * that band we flag for human eyes rather than silently accepting.
 */
export const IT_BUDGET_REVENUE_RATIO = {
  MIN: 0.03,
  MAX: 0.05,
} as const;

/**
 * Rough plausibility band for the number of named executives relative to
 * revenue. A handful of execs at any revenue is fine; dozens-to-hundreds of
 * uniquely-titled C-suite rows at small revenue is implausible. We express the
 * ceiling as "one exec per this much revenue" plus a floor so tiny orgs are not
 * penalized for having a normal leadership team.
 */
export const EXEC_PLAUSIBILITY = {
  /** Always allow at least this many execs regardless of revenue. */
  FREE_FLOOR: 12,
  /** Above the floor, expect ~1 exec per this much annual revenue (USD). */
  REVENUE_PER_EXEC_USD: 50_000_000,
} as const;

/** Canonical fields that read as leadership/org people rows. */
const PERSON_TITLE_FIELDS = ['person.title', 'title', 'role', 'job_title'];
const PERSON_NAME_FIELDS = ['person.name', 'name', 'full_name'];
const REPORTS_TO_FIELDS = ['reports_to', 'person.reports_to', 'manager', 'reports_to_name'];
const KPI_TARGET_FIELDS = ['kpi.target', 'target', 'target_value', 'goal'];

/** Executive titles we treat as "should be unique / current" for conflict checks. */
const SINGLETON_EXEC_TITLES = new Set([
  'cfo',
  'ceo',
  'coo',
  'cio',
  'cto',
  'cdo',
  'ciso',
  'cmo',
  'chro',
  'cdao',
  'cdio',
]);

function isString(v: unknown): v is string {
  return typeof v === 'string';
}

/** First matching key (case-insensitive) present on a row. */
function pickField(row: Record<string, unknown>, candidates: string[]): unknown {
  const lowerKeys = new Map<string, string>();
  for (const k of Object.keys(row)) lowerKeys.set(k.toLowerCase(), k);
  for (const cand of candidates) {
    const real = lowerKeys.get(cand.toLowerCase());
    if (real !== undefined) return row[real];
  }
  return undefined;
}

function normalizeTitle(v: unknown): string | undefined {
  if (!isString(v)) return undefined;
  const t = v.trim().toLowerCase();
  return t.length > 0 ? t : undefined;
}

/** Canonical key for duplicate detection: name+title, or whichever exists. */
function canonicalKey(row: Record<string, unknown>): string | undefined {
  const name = pickField(row, PERSON_NAME_FIELDS);
  const title = pickField(row, PERSON_TITLE_FIELDS);
  const parts: string[] = [];
  if (isString(name) && name.trim()) parts.push(name.trim().toLowerCase());
  if (isString(title) && title.trim()) parts.push(title.trim().toLowerCase());
  return parts.length > 0 ? parts.join('|') : undefined;
}

function isKpiDimension(proposal: MappingProposal): boolean {
  return proposal.dimension === 'kpis';
}

function isLeadershipDimension(proposal: MappingProposal): boolean {
  return proposal.dimension === 'leadership_org';
}

/**
 * Run the deterministic (non-model) checks over a mapping proposal and its
 * sample rows. Returns zero or more findings, each marked
 * `source: 'deterministic'`. Never throws on malformed rows — it degrades to
 * fewer findings instead.
 */
export function runDeterministicChecks(args: {
  proposal: MappingProposal;
  orgProfile?: OrgProfile;
  rows?: Array<Record<string, unknown>>;
}): StewardFinding[] {
  const { proposal, orgProfile } = args;
  const rows = args.rows ?? proposal.sampleRows ?? [];
  const findings: StewardFinding[] = [];

  // ---- schema: KPI rows missing a target ----------------------------------
  if (isKpiDimension(proposal)) {
    rows.forEach((row, idx) => {
      const target = pickField(row, KPI_TARGET_FIELDS);
      const missing = target === undefined || target === null || (isString(target) && target.trim() === '');
      if (missing) {
        const label = pickField(row, ['kpi.name', 'name', 'metric', 'kpi']);
        findings.push({
          kind: 'schema',
          severity: 'warn',
          message: `KPI ${isString(label) && label.trim() ? `"${label.trim()}"` : `(row ${idx + 1})`} has no target value.`,
          rowRef: `row ${idx + 1}`,
          suggestedAction: 'Add a target so progress can be measured, or confirm this KPI is tracked without one.',
          source: 'deterministic',
        });
      }
    });
  }

  // ---- duplicate: same canonical key appearing twice ----------------------
  const keyToRows = new Map<string, number[]>();
  rows.forEach((row, idx) => {
    const key = canonicalKey(row);
    if (!key) return;
    const list = keyToRows.get(key) ?? [];
    list.push(idx);
    keyToRows.set(key, list);
  });
  for (const [key, idxs] of keyToRows) {
    if (idxs.length > 1) {
      findings.push({
        kind: 'duplicate',
        severity: 'warn',
        message: `Duplicate entry "${key.replace('|', ' / ')}" appears ${idxs.length} times.`,
        rowRef: `rows ${idxs.map((i) => i + 1).join(', ')}`,
        suggestedAction: 'Merge or remove the duplicate so it is committed once.',
        source: 'deterministic',
      });
    }
  }

  // ---- conflict: two rows uniquely-titled the same singleton exec ----------
  if (isLeadershipDimension(proposal) || rows.some((r) => pickField(r, PERSON_TITLE_FIELDS) !== undefined)) {
    const titleToRows = new Map<string, number[]>();
    rows.forEach((row, idx) => {
      const title = normalizeTitle(pickField(row, PERSON_TITLE_FIELDS));
      if (!title || !SINGLETON_EXEC_TITLES.has(title)) return;
      const list = titleToRows.get(title) ?? [];
      list.push(idx);
      titleToRows.set(title, list);
    });
    for (const [title, idxs] of titleToRows) {
      // distinct people only (duplicate identical rows handled above)
      const distinctKeys = new Set(idxs.map((i) => canonicalKey(rows[i]) ?? `idx:${i}`));
      if (distinctKeys.size > 1) {
        findings.push({
          kind: 'conflict',
          severity: 'warn',
          message: `Two people titled ${title.toUpperCase()} — pick current.`,
          rowRef: `rows ${idxs.map((i) => i + 1).join(', ')}`,
          suggestedAction: 'Confirm which holder is current; mark the other as former or remove.',
          source: 'deterministic',
        });
      }
    }
  }

  // ---- orphan: reports_to that doesn't resolve to another row -------------
  {
    const resolvable = new Set<string>();
    rows.forEach((row) => {
      const name = pickField(row, PERSON_NAME_FIELDS);
      const title = pickField(row, PERSON_TITLE_FIELDS);
      if (isString(name) && name.trim()) resolvable.add(name.trim().toLowerCase());
      if (isString(title) && title.trim()) resolvable.add(title.trim().toLowerCase());
    });
    rows.forEach((row, idx) => {
      const target = pickField(row, REPORTS_TO_FIELDS);
      if (!isString(target) || !target.trim()) return;
      const needle = target.trim().toLowerCase();
      if (!resolvable.has(needle)) {
        const who = pickField(row, PERSON_NAME_FIELDS) ?? pickField(row, PERSON_TITLE_FIELDS);
        findings.push({
          kind: 'orphan',
          severity: 'warn',
          message: `${isString(who) && who.trim() ? `"${who.trim()}"` : `Row ${idx + 1}`} reports to "${target.trim()}", which is not in this upload.`,
          rowRef: `row ${idx + 1}`,
          suggestedAction: 'Add the manager row or correct the reports-to reference.',
          source: 'deterministic',
        });
      }
    });
  }

  // ---- proportionality / realism (needs orgProfile) -----------------------
  if (orgProfile) {
    // IT budget vs revenue band
    if (
      typeof orgProfile.itBudgetUsd === 'number' &&
      typeof orgProfile.annualRevenueUsd === 'number' &&
      orgProfile.annualRevenueUsd > 0
    ) {
      const ratio = orgProfile.itBudgetUsd / orgProfile.annualRevenueUsd;
      if (ratio < IT_BUDGET_REVENUE_RATIO.MIN || ratio > IT_BUDGET_REVENUE_RATIO.MAX) {
        const pct = (ratio * 100).toFixed(1);
        findings.push({
          kind: 'realism',
          severity: 'warn',
          message: `IT budget reads ${pct}% of revenue, expected 3–5%.`,
          suggestedAction: 'Confirm the IT budget and revenue figures, or note why this org runs outside the typical band.',
          source: 'deterministic',
        });
      }
    }

    // Exec count vs revenue plausibility
    if (typeof orgProfile.annualRevenueUsd === 'number' && orgProfile.annualRevenueUsd >= 0) {
      const execCount = rows.filter((row) => {
        const title = normalizeTitle(pickField(row, PERSON_TITLE_FIELDS));
        return !!title && SINGLETON_EXEC_TITLES.has(title);
      }).length;
      const allowed =
        EXEC_PLAUSIBILITY.FREE_FLOOR +
        Math.floor(orgProfile.annualRevenueUsd / EXEC_PLAUSIBILITY.REVENUE_PER_EXEC_USD);
      if (execCount > allowed) {
        findings.push({
          kind: 'realism',
          severity: 'warn',
          message: `${execCount} executives for $${Math.round(orgProfile.annualRevenueUsd).toLocaleString('en-US')} revenue looks high (expected at most ~${allowed}).`,
          suggestedAction: 'Confirm these are all current C-suite holders, or correct the revenue figure.',
          source: 'deterministic',
        });
      }
    }
  }

  return findings;
}

/**
 * Interface for a Claude-backed open-ended reviewer. The implementation is
 * injected by the caller (server-side); this module never imports or calls a
 * model. Provided so the compose step and tests can type the agent half.
 */
export type StewardAgentReviewer = (
  proposal: MappingProposal,
  parsedText?: string,
) => Promise<StewardFinding[]>;

/**
 * Merge deterministic + agent findings, derive clarification questions from
 * low-confidence ('ask') field mappings, and decide whether to escalate to a
 * scoped Ask-Steward conversation.
 *
 * Escalates when ANY of:
 *  - a finding has severity 'block'
 *  - the proposal dimension is 'unknown'
 *  - more than one field mapping scores 'ask'
 */
export function composeStewardValidation(args: {
  proposal: MappingProposal;
  deterministic: StewardFinding[];
  agent?: StewardFinding[];
}): StewardValidation {
  const { proposal } = args;
  const flags: StewardFinding[] = [...args.deterministic, ...(args.agent ?? [])];

  const askFields = proposal.fieldMappings.filter(
    (fm) => classifyConfidence(fm.confidence) === 'ask',
  );

  const questions: ClarificationQuestion[] = askFields.map((fm) => ({
    fileObjectKey: proposal.source.objectKey,
    question: `How should column "${fm.sourceColumn}" be mapped?`,
    options: [
      `Map to "${fm.canonicalField}"`,
      'Map to a different field',
      'Ignore this column',
    ],
    bestGuessIndex: 0,
    field: fm.canonicalField,
  }));

  const hasBlock = flags.some((f) => f.severity === 'block');
  const dimensionUnknown = proposal.dimension === 'unknown';
  const tooManyAsks = askFields.length > 1;

  return {
    flags,
    questions,
    escalateToConversation: hasBlock || dimensionUnknown || tooManyAsks,
  };
}
