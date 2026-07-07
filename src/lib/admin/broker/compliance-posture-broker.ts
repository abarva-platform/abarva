/**
 * Compliance Posture broker · Wave 3 PR-4
 *
 * Composes the compliance-posture digest that backs the
 * `/admin/compliance` page. The four cards — SOC 2 · GDPR data
 * residency · DPA template · Breach-notification SLA — derive from
 * the static `COMPLIANCE_CONFIG` in
 * `src/lib/admin/compliance-config.ts` today. When a live
 * compliance-tracking system arrives later, this broker swaps the
 * import for a live read and flips the relevant card's `dataSource`
 * to `'live'`. The page surface stays unchanged.
 *
 * Broker-boundary doctrine: per
 * `src/lib/admin/__tests__/broker-boundary.test.ts`, this file lives
 * under `src/lib/admin/broker/**` and is therefore the canonical
 * zone where direct data composition happens. The `compliance-config`
 * import is a pure TS constant — no Supabase, no I/O. That keeps the
 * boundary clean while the surface lights up.
 *
 * See `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §3 (panel-07
 * dead link) and §7 Wave 3 PR-4 for the narrative this fulfills.
 */

import 'server-only';

import {
  COMPLIANCE_CONFIG,
  type ComplianceConfig,
  type Soc2Posture,
  type GdprPosture,
  type DpaPosture,
  type BreachSlaPosture,
  type OfacScreeningPosture,
} from '@/lib/admin/compliance-config';

// ── Contract ────────────────────────────────────────────────────────

export type {
  Soc2Posture,
  GdprPosture,
  DpaPosture,
  BreachSlaPosture,
  OfacScreeningPosture,
} from '@/lib/admin/compliance-config';

export interface CompliancePosture {
  soc2: Soc2Posture;
  gdpr: GdprPosture;
  dpa: DpaPosture;
  breachSla: BreachSlaPosture;
  ofacScreening: OfacScreeningPosture;
  lastReviewedAt: string;
}

// ── Entry point ─────────────────────────────────────────────────────

/**
 * Compose the compliance posture digest.
 *
 * Pure today — the broker reads the static config constant and
 * returns it as the posture shape. Kept async so the signature
 * stays compatible with a future live read (Vanta / Drata feed)
 * without forcing every caller to migrate.
 */
export async function getCompliancePosture(): Promise<CompliancePosture> {
  return composePosture(COMPLIANCE_CONFIG);
}

function composePosture(config: ComplianceConfig): CompliancePosture {
  return {
    soc2: config.soc2,
    gdpr: config.gdpr,
    dpa: config.dpa,
    breachSla: config.breachSla,
    ofacScreening: config.ofacScreening,
    lastReviewedAt: config.lastReviewedAt,
  };
}
