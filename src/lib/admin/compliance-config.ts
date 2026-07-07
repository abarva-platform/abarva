/**
 * Compliance posture — static, admin-edited config.
 *
 * Wave 3 PR-4 (2026-05-30) · `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md`
 * §3 (panel-07 dead link) and §7 Wave 3 PR-4. Kill the `href: '#'` on the
 * "Compliance" panel by building a posture digest at `/admin/compliance`.
 *
 * Why a static TS config (not a DB read):
 *
 *   - AbarVa is pre-pilot. There is no live compliance-tracking system,
 *     no SOC 2 GRC tool wired in, no DPA template store. Standing up a
 *     fake DB read to make the cards look "live" would be dishonest
 *     theater (memory · feedback_no_demo_thinking.md).
 *   - Admin operators edit this file directly via PR. That keeps the
 *     posture under change-control and surfaceable in
 *     `release-ledger.ts` once the audit lane learns to watch it.
 *   - Forward-compat: when a real compliance-tracking system arrives
 *     (Vanta / Drata / in-house), the broker swaps this import for a
 *     live read and flips each card's `dataSource: 'live'`. The page
 *     shape does not need to change.
 *
 * Honesty doctrine:
 *
 *   - SOC 2 status is `in_progress`. AbarVa is NOT SOC 2 certified.
 *     Do not flip to `certified` without an actual auditor's report.
 *   - The breach-notification SLA is the policy commitment; the
 *     `playbookHref` points at the runbook owners actually follow.
 *
 * Broker-boundary doctrine: this file is a TS config import (no I/O).
 * `src/lib/admin/compliance-config.ts` is permitted to be read directly
 * by the broker AND by tests. Pages must still go through the broker.
 */

// ── Contract ────────────────────────────────────────────────────────

export type ComplianceCardStatus =
  | 'in_progress'
  | 'scheduled'
  | 'certified'
  | 'committed'
  | 'not_applicable';

export type ComplianceDataSource = 'config' | 'live';

export interface ComplianceCardPosture {
  /** Plain-language status the card eyebrow renders. */
  status: ComplianceCardStatus;
  /**
   * Human-readable status label. Editorial register: short, sober,
   * never marketing-flavored. e.g. "In progress · target Q4 2026".
   */
  statusLabel: string;
  /**
   * Where the field is sourced from today. `'config'` means "edited
   * directly in this file"; `'live'` will be set when a real
   * compliance-tracking system feeds the broker.
   */
  dataSource: ComplianceDataSource;
}

export interface Soc2Posture extends ComplianceCardPosture {
  /** Trust services criteria scope — e.g. "Security". */
  scope: string;
  /** Auditor / firm if engaged; null if not yet engaged. */
  auditor: string | null;
  /** Control owner inside AbarVa. */
  controlOwner: string;
  /** ISO date string of last audit milestone, or null. */
  lastAuditDate: string | null;
  /** ISO date string of next audit milestone (target), or null. */
  nextAuditDate: string | null;
  notes: string;
}

export interface GdprPosture extends ComplianceCardPosture {
  /** Data-plane region(s) where tenant rows live. */
  dataResidencyRegions: ReadonlyArray<string>;
  /** DPA template status (e.g. "v1 draft · counsel review pending"). */
  dpaStatus: string;
  /** Internal/canonical sub-processor inventory link. */
  subProcessorListHref: string;
  /** Lawful basis used for processing (typically "contract"). */
  lawfulBasis: string;
  notes: string;
}

export interface DpaPosture extends ComplianceCardPosture {
  /** Where the latest DPA template lives (docs/ path or external URL). */
  templateHref: string;
  /** ISO date the template was last touched. */
  lastUpdated: string;
  /** Internal owner for DPA negotiation. */
  owner: string;
  notes: string;
}

export interface BreachSlaPosture extends ComplianceCardPosture {
  /** Notification window in hours (e.g. 72 per GDPR Art. 33). */
  notificationHours: number;
  /** Severity tiers that trigger notification. */
  triggerSeverities: ReadonlyArray<string>;
  /** Link to the incident-response playbook. */
  playbookHref: string;
  /** Internal incident-response owner. */
  incidentLead: string;
  notes: string;
}

export interface OfacScreeningPosture extends ComplianceCardPosture {
  screeningProvider: string;
  reviewOwner: string;
  cadence: string;
  evidenceRequired: ReadonlyArray<string>;
  notes: string;
}

export interface ComplianceConfig {
  soc2: Soc2Posture;
  gdpr: GdprPosture;
  dpa: DpaPosture;
  breachSla: BreachSlaPosture;
  ofacScreening: OfacScreeningPosture;
  /**
   * ISO date string for when this config was last reviewed. Admins
   * update this whenever they touch the file so the page can render
   * an "as of" stamp under each card without lying.
   */
  lastReviewedAt: string;
}

// ── Live config ─────────────────────────────────────────────────────

/**
 * Pilot-stage compliance posture. Edit directly; the broker reads
 * this constant and the `/admin/compliance` page renders the cards.
 *
 * If a value moves from this file to a live source, set the
 * corresponding card's `dataSource` to `'live'` in the broker, not
 * here — this file is the canonical "config" lane.
 */
export const COMPLIANCE_CONFIG: ComplianceConfig = {
  soc2: {
    status: 'in_progress',
    statusLabel: 'In progress · readiness assessment',
    scope: 'Security (Type I → Type II planned)',
    auditor: null,
    controlOwner: 'Anand Sundaram',
    lastAuditDate: null,
    nextAuditDate: null,
    dataSource: 'config',
    notes:
      'Pre-audit readiness phase. Control inventory and evidence collection ' +
      'underway against AICPA Trust Services Criteria. No certification ' +
      'claimed; do not represent AbarVa as SOC 2 certified.',
  },
  gdpr: {
    status: 'committed',
    statusLabel: 'Committed · EU data plane, DPA available on request',
    dataResidencyRegions: ['EU (Frankfurt)', 'US (East)'],
    dpaStatus: 'v1 template available · per-tenant addendum on request',
    subProcessorListHref: '/admin/policies?tab=sub-processors',
    lawfulBasis: 'Contract (Art. 6(1)(b))',
    dataSource: 'config',
    notes:
      'Tenant rows reside in the region selected at provisioning. ' +
      'Sub-processor list is reviewed quarterly. No transfers outside the ' +
      'declared regions without DPA addendum.',
  },
  dpa: {
    status: 'committed',
    statusLabel: 'Template v1 · counsel-reviewed',
    templateHref: '/docs/legal/dpa-template-v1.md',
    lastUpdated: '2026-05-15',
    owner: 'Anand Sundaram',
    dataSource: 'config',
    notes:
      'DPA template covers controller/processor responsibilities, ' +
      'sub-processor disclosure, breach notification (72h SLA), ' +
      'and data-subject request handling.',
  },
  breachSla: {
    status: 'committed',
    statusLabel: 'Committed · 72h notification window',
    notificationHours: 72,
    triggerSeverities: ['high', 'critical'],
    playbookHref: '/docs/runbooks/incident-response.md',
    incidentLead: 'Anand Sundaram',
    dataSource: 'config',
    notes:
      'Aligns with GDPR Art. 33 (72-hour notification to supervisory ' +
      'authorities) and the DPA template. Severity classification per ' +
      'the incident-response playbook.',
  },
  ofacScreening: {
    status: 'committed',
    statusLabel: 'Committed · screen before customer onboarding',
    screeningProvider: 'OFAC Sanctions List Search or approved API equivalent',
    reviewOwner: 'Anand Sundaram',
    cadence: 'Before customer onboarding and quarterly for active customers',
    evidenceRequired: [
      'customer_name',
      'alias_list',
      'screened_at',
      'watchlist_source_version',
      'manual_review_disposition',
    ],
    dataSource: 'config',
    notes:
      'New customers must be screened against OFAC sanctions data before ' +
      'contracting or provisioning. Possible matches fail closed until a ' +
      'manual compliance disposition is recorded.',
  },
  lastReviewedAt: '2026-05-30',
};
