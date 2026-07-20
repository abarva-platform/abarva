// Source IA v2 — the audit's information-architecture consolidation flag.
//
// Background (reports/2026-06-03-source-simplicity-audit/, Tier 1): Source had
// four overlapping "home" surfaces. `/source` redirected to `/source/events`
// (the busiest, lowest-clarity page), and the sub-nav exposed Queue + Events +
// Portfolio as three peer views of the same event set.
//
// IA v2 consolidates to two surfaces:
//   - Portfolio book (at /source/portfolio) — the landing surface.
//   - Event shell workspaces for stage, files, intelligence, and approvals.
// `/source` lands on Decisions, `/source/events` folds into Portfolio, and the
// sub-nav drops to two tabs.
//
// Gated by `NEXT_PUBLIC_SOURCE_IA_V2` so the change is reversible without a code
// revert. Public-prefixed because the sub-nav is a client component and must
// read the same switch the server redirects use — one source of truth.
//
//   - Default (unset): ON — IA v2 is the shipped behavior.
//   - `NEXT_PUBLIC_SOURCE_IA_V2=0` (or false/off/no): OFF — restores the prior
//     four-surface behavior. Takes effect on the next deploy.

/** True when Source IA v2 (the two-surface consolidation) is active. Default ON. */
export function isSourceIaV2(): boolean {
  const raw = (process.env.NEXT_PUBLIC_SOURCE_IA_V2 ?? '').trim().toLowerCase();
  return !(raw === '0' || raw === 'false' || raw === 'off' || raw === 'no');
}
