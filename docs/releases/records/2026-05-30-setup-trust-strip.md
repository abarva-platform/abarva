# 2026-05-30 Setup Trust Strip (Wave 1 PR-5)

## Release ID

`2026-05-30-setup-trust-strip`

## Status

`released`

## Plain-English Summary

The `/admin` landing now opens with a four-chip Trust strip immediately below the masthead. A CIO can read the entire tenant trust posture — Substrate, Isolation, Integrations, Governance — at a glance in one horizontal row, color-coded against the locked AbarVa palette. Each chip routes to its respective group page. Estimated chips render with a hollow dot and `(estimated)` suffix so the surface never overclaims live coverage. This is the visual centerpiece of the Trust Plane consolidation described in `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §5.6.

## Layer Impact

- Runtime application lane (UI): New `TrustStrip` component + page composition wiring on the `/admin` landing.
- Broker boundary: Consumes `getTrustSpine` from `@/lib/admin/broker/trust-spine-broker` (shipped in PR-4). No new Supabase imports; the broker-boundary hygiene gate stays green.
- Context layer / data layer: No schema change, no migrations, no writes.

## Client Applicability

- All clients: Yes — the strip renders for every tenant on `/admin`.
- Specific clients: None. Substrate + Governance chips wire to live broker data for all tenants; Isolation + Integrations chips render as `estimated` per PR-4's documented stubs.
- Internal only: No.
- Public/demo only: No — this is the pilot-grade landing page.
- Feature flag: None.

## Changes Included

- `src/components/admin/TrustStrip.tsx` — new server-renderable component plus the `spineToChips` composer.
- `src/app/(maestro)/admin/page.tsx` — adds `getTrustSpine(brokerTenantKey)` to the existing `Promise.all`; threads `trustChips` and `liveSnapshotPresent` into `HomeOverviewV2`.
- `src/components/home/HomeOverviewV2.tsx`:
  - Deleted the 64×64 brand-initials avatar tile in the masthead (per verdict §5.4 "DELETE. Replace with the Trust strip.").
  - Tightened the masthead lockup (28px display vertical rhythm, 30px h1 — keeps Georgia balance without the avatar's visual anchor).
  - Made the "Substrate live" pill conditional on a new `liveSnapshotPresent` prop. The unconditional truth-claim is gone.
  - Inserted the Trust strip block (Zone B, ~56px tall) between the masthead and the content `<main>`.
  - Moved the Steward orientation block from Section 02 → Section 03, now rendered AFTER the Action queue (operator-first, prose-second).
  - Renumbered eyebrow labels accordingly (02 = Action queue, 03 = Steward voice).
- `src/components/admin/__tests__/TrustStrip.test.tsx` — 12 unit tests pinning chip render contract (ready / attention / breach / estimated) and `spineToChips` composer behaviour including the empty-substrate state.
- `src/components/home/__tests__/HomeOverviewV2.dom-order.test.tsx` — 6 smoke tests pinning the landing-page DOM order (strip before queue, queue before Steward), the conditional substrate pill, and the deleted avatar tile.

## QA / Validation

- `npx eslint src/components/admin/TrustStrip.tsx src/components/home/HomeOverviewV2.tsx src/app/(maestro)/admin/page.tsx` — clean.
- `npx tsc --noEmit` — clean.
- `npx jest src/components/admin/__tests__/TrustStrip.test.tsx src/components/home/__tests__/HomeOverviewV2.dom-order.test.tsx` — 18/18 pass.
- `npx jest src/lib/admin/__tests__/broker-boundary.test.ts` — pass (no new Supabase imports introduced).
- `npm run test:behaviors` — pre-existing failure in `tenant-onboarding.test.ts` is unchanged on `main`; unrelated to this PR.

## Rollout Plan

Merge to `main`. Vercel preview + production builds redeploy `/admin` automatically. No data migration, no env changes, no feature flag.

## Rollback Plan

Revert this PR. The strip disappears; the masthead reverts to its pre-PR-5 brand-tile layout and the orientation block returns to Section 02. The TrustSpine broker remains in place (it shipped in PR-4) so no broker rollback is required.

## Audit Evidence

- North-star spec: `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §5.4 (Data Trust backbone) and §5.6 (The pivotal screen).
- Wave 1 PR-4 broker contract: `src/lib/admin/broker/trust-spine-broker.ts` (`getTrustSpine`).
- Broker-boundary hygiene gate: `src/lib/admin/__tests__/broker-boundary.test.ts` — green after PR-5.

## Known Gaps

- The Isolation and Integrations chips render with `evidence: 'estimated'` (hollow dot, muted "(estimated)" suffix). Wave 2 PR-1 (Connector health broker) and Wave 2 PR-2 (Isolation lane) will replace these with live data per the verdict §7 slicing.
- The empty-state Zone C card ("Upload your first dataset to begin grounding") is a Wave 3 polish item per verdict §7; today the empty-substrate path shows four `no data yet` chips and the existing action queue, which is honest but not yet the editorial empty state described in §5.6.
- The collapsible "Steward's read" pull-tab from §5.6 is not implemented; the orientation block is rendered inline below the action queue. Wave 2 polish.
