/**
 * overview-data.ts · Admin Overview supplemental data fetchers
 *
 * Compatibility shim. The implementation has moved to
 * `src/lib/admin/broker/overview-supplemental-broker.ts` as part of
 * Wave 1 PR-4 (TrustSpine broker + boundary enforcement).
 *
 * This file remains so existing callers (`/admin/page.tsx`, the
 * `overview-data.test.ts` suite) keep their import paths during the
 * Wave 1 consolidation. New code should import directly from the
 * broker module.
 *
 * The broker-boundary hygiene test in
 * `src/lib/admin/__tests__/broker-boundary.test.ts` exempts this
 * shim from the no-direct-data-plane-access rule because it now
 * only re-exports.
 */

export {
  getOverviewSupplementalData,
  type OverviewSupplementalData,
} from '@/lib/admin/broker/overview-supplemental-broker';
