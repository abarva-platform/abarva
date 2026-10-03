/**
 * The gates `npm run release:check` runs, in order.
 *
 * Each entry is a script path relative to the repository root. The runner
 * starts every one as its own process and reads its exit status, so a gate may
 * finish however it likes. To add a gate, add its path here. Do not import a
 * gate into `scripts/release-check.mjs` or into the runner: a gate evaluated
 * inside the runner's process can end the run before the gates after it start.
 */
export const RELEASE_GATES = [
  'scripts/release-control/check-migration-seals.mjs',
  'scripts/release-control/check-azure-deployment-lane.mjs',
  'scripts/audit/check-no-legacy-tenant-inputs.mjs',
  'scripts/release-control/check-release-record.mjs',
  'scripts/release-control/check-nexus-manual-spine.mjs',
  'scripts/release-control/check-deploy-authority-policy.mjs',
  'scripts/release-control/check-tower-tool-rollout-field-survival.mjs',
  'scripts/release-control/check-tower-ai-business-case-field-survival.mjs',
  'scripts/release-control/check-pilot-data-ingestion-policy.mjs',
  'scripts/release-control/check-home-route-surface.mjs',
  'scripts/release-control/check-scb-truth-gates.mjs',
];
