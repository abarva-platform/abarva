# 2026-05-30-setup-posture-grid — Setup/Admin Trust Posture Grid (Wave 2 PR-4)

## Release ID

`2026-05-30-setup-posture-grid`

## Status

`candidate`

## Plain-English Summary

Adds the 2×2 **Posture grid** to the `/admin` Setup landing — Zone D of the Trust Plane verdict (§5.6). Four cards — *Substrate readiness*, *Connector health*, *Auth & RLS posture*, *Approvals & policy* — each compose their numbers and one-line plain-English concern from the same `TrustSpine` that drives the strip above. Each card is a single clickable target that jumps to its group's destination, so an operator can read the posture and act on it without a second click.

The grid sits between the Action queue and the Steward orientation. The operator-first read order — what to do (queue), what's the posture (grid), then the editorial voice (Steward) — is the verdict's pinned ordering.

## Layer Impact

- `runtime-app-lane`: New `PostureGrid` section on the `/admin` landing between the Action queue (Section 02) and the Steward orientation (Section 03). When the broker resolves null we still render a no-data grid via `emptyPostureCards()` so the page shape stays stable for brand-new tenants.
- `qa-validation-lane`: 17 new tests across two new suites + 2 added cases on the existing DOM-order suite. All 17 `src/components/{admin,home}/__tests__` suites still pass (90/90).

## Client Applicability

- All clients: The grid is rendered on every tenant's `/admin` landing. Cards adapt to per-tenant TrustSpine output; an empty tenant sees four muted "no data yet" cards rather than synthetic numbers.
- Specific clients: None.
- Internal only: No. This is a tenant-admin surface.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/admin/PostureGrid.tsx` (new) — `PostureGrid` component, `spineToPostureCards(spine)` composer, `emptyPostureCards()` no-data state, `PostureCard` contract. Pure server-renderable; consumes the `TrustSpine` contract only.
- `src/components/admin/__tests__/PostureGrid.test.tsx` (new) — 15 tests covering composer ordering, status thresholds (substrate ≥5 mature / ≥1 / 0; connector >2 degraded / >0 / 0 with `estimated` short-circuit; isolation anomaly + estimated; governance approvals + invites), footer copy honesty, href routing (approvals branches on `openApprovals > 0`), border palette, and the empty-spine no-data state.
- `src/components/home/HomeOverviewV2.tsx` (modified) — added `postureCards` prop; renders the PostureGrid section as `02b · POSTURE AT A GLANCE` between the Action queue and the Steward orientation block.
- `src/app/(maestro)/admin/page.tsx` (modified) — composes `postureCards = trustSpine ? spineToPostureCards(trustSpine) : emptyPostureCards()` and threads it through to `HomeOverviewV2`.
- `src/components/home/__tests__/HomeOverviewV2.dom-order.test.tsx` (modified) — added 2 cases: posture grid lives between the queue and the Steward block; grid is omitted when `postureCards` is null.

## QA / Validation

- PASS: `npx jest src/components/admin/__tests__/PostureGrid.test.tsx src/components/home/__tests__/HomeOverviewV2.dom-order.test.tsx` — 25/25.
- PASS: `npx jest src/components/admin/__tests__ src/components/home/__tests__` — 90/90 across 17 suites.
- PASS: `npx eslint` over every touched file.
- PASS: `npx tsc --noEmit` clean for every touched file (pre-existing `@azure/*` / `pptxgenjs` / `@resvg/resvg-js` module-not-found errors are workflow artifacts in fresh worktrees, unrelated to this PR).
- PASS: `npm run test:behaviors` — same 5 pre-existing failures as main (tenant-onboarding script's `CLIENT_KEY_TO_DB_SLUGS` regex), 69/74 pass — matches main.

## Rollout Plan

Merge to main after CI passes. No migration, no feature flag, no deploy gate. The landing page renders the grid section on every tenant; the broker null-fallback path keeps the page coherent when the TrustSpine resolves null.

## Rollback Plan

Revert the PR. The PostureGrid section is a single import + a single conditional block in `HomeOverviewV2.tsx`; the page composer change is a single derived constant. No data-plane or schema change to back out.

## Audit Evidence

- Audit verdict driving this work: `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §5.6 Zone D and §7 Wave 2 PR-4.
- Upstream broker: `src/lib/admin/broker/trust-spine-broker.ts` (Wave 1 PR-4, extended Wave 2 PR-1/PR-2 to wire integration + isolation live).
- Companion surfaces this PR routes to: `/admin/data-trust`, `/admin/connectors`, `/admin/audit?tab=isolation`, `/admin/programs/approvals`, `/admin/users-access`.

## Known Gaps

- Connector card honors `evidence: 'estimated'` from the broker — when the integration upstream goes back to estimated (e.g. broker failure mode), the card renders muted with no synthetic numbers. Same for isolation. This is honest; it is also a flat affordance — the card does not yet surface "why estimated" inline. Future polish.
- The approvals card collapses two signals (openApprovals + openInvites > 5) into one "attention" status. The verdict's later-wave Compliance panel can split these if operators need finer triage.
- The grid does not yet animate on TrustSpine refresh; it re-renders on the next server response. Consistent with the rest of the landing page.
