# 2026-06-02-home-executive-brief — Home redesign: real per-tenant Executive Brief

## Release ID

`2026-06-02-home-executive-brief`

## Status

`candidate`

## Plain-English Summary

`/home` was visually polished but empty of substance — abstract copy ("what changed, what matters", "value story: Changed"), a decorative constellation graphic, the same "you have a decision" idea stated four times, and **entirely hardcoded mock data** identical for every client (sourcing/moves/tower insight arrays were module-level constants). This replaces it with an Apple-calm "Executive Morning Brief": a client identity band (logo + name + industry), one greeting bound to the signed-in user, a four-metric KPI strip (value at stake / realized / decisions / at-risk), the single most-urgent decision as one dark focal card, the real initiative portfolio table, and a "needs attention" rail. Every number is **real and per-tenant** — derived from `listInitiativesForClient` (committed/measured USD, stage, owner, status) and `getApprovalQueueForTenant` — with honest empty states ("No initiatives in flight yet") and never a fabricated value. Per design review, **Home only surfaces decision urgency and routes into the owning workspace (Moves/Source) to act** — it never performs approve/send-back inline.

## Layer Impact

- `global-control-lane`: the shared `/home` executive surface for all clients, no feature gate. Presentation + read-only data binding.
- `client-data-lane` (read-only): Home now reads each client's real AI-initiative portfolio + program-approval queue — client-scoped, no cross-client data, no writes.

## Client Applicability

- All clients: yes — every tenant sees its own real portfolio + decision, or an honest empty state.
- Specific clients: none singled out.
- Internal only: no. Public/demo only: no. Feature flag: none.

## Changes Included

- `src/lib/home/home-brief.ts` — new pure composer: turns initiatives + approvals into the brief (KPIs, portfolio rows, single decision, greeting). Honest empty states; never fabricates a number; the decision `href` routes into `/strategic-moves` (the owning workspace), never an inline action.
- `src/lib/home/__tests__/home-brief.test.ts` — unit tests: real-money KPIs, empty-state, and decision-routing branches.
- `src/components/home/ImpactInsightsHome.tsx` — rewritten (855 → 452 lines) to the calm brief: identity band, KPI strip, one dark decision card (route-only), portfolio table, attention rail, evidence line. Locked design system. Removed the hardcoded insight/decision/output arrays + decorative constellation animation (a small static insight mark retained).
- `src/app/(maestro)/home/page.tsx` — fetches `listInitiativesForClient` + `getApprovalQueueForTenant` (client-scoped, parallel, fail-safe to []), resolves the signed-in user's first name + client logo/vertical, passes the composed brief.
- `src/app/(maestro)/home/__tests__/no-readmin-reexports.test.ts` — updated the one stale copy-pin (`'Tenant workspace read'` → `'Client locked'`) retired in this redesign; the real banned-phrase contract is unchanged and still enforced.

## QA / Validation

- `npx jest --testPathPatterns "home/"` → **54 passed, 1 failed**. The single failure is `HomeOverviewV2.tenant-switcher` — a **pre-existing failure on clean `origin/main`** (verified by stash-and-rerun: MAIN = 1 failed) in the *legacy* `HomeOverviewV2` component, which this change does not touch.
- New `home-brief` unit tests + the `ImpactInsightsHome.copy` contract + the `home-admin-boundary-contract` + `no-readmin-reexports` hygiene tests all pass.
- `npx eslint` clean on all touched files. `npx tsc --noEmit` clean on touched files (one unrelated pre-existing error in a Playwright a11y spec: missing `@axe-core/playwright` dev-dep).
- Home/Admin separation preserved: zero banned phrases (admin/setup/upload/connectors/templates/cross-tenant); all links route to product surfaces (`/strategic-moves`, `/tower`, `/intelligence`), never the `/admin/*` tree or a `/home/*` re-export shim.
- Renders inside the existing `AppShell` (Codex review point 6) — not a replacement nav.

## Rollout Plan

Merge to `main` → Vercel production deploy. No migration, env var, or feature flag.

## Rollback Plan

`gh pr revert <pr>` and redeploy. Presentation + read-only binding; new files are additive; rollback restores the prior mock-data Home with no data dependency.

## Audit Evidence

- PR: (filled on open)
- Wireframe (v3, with the 6 Codex review points): `docs/build/home-redesign/HOME_WIREFRAME_2026-06-02.html`
- Reuses verified tenant-keyed reads: `listInitiativesForClient`, `getApprovalQueueForTenant`. Deliberately NOT used: `buildValueAtRiskPortfolioView()` (platform seed, not tenant-keyed — would re-introduce cross-tenant fake numbers).

## Known Gaps

- The decision card routes to `/strategic-moves?program=<id>`; if a future approval originates in Source rather than Moves, the route should branch on the request's source module (single-line follow-up once Source approvals exist).
- The "needs attention" rail is derived from real at-risk initiatives + the pending decision (no fabricated timestamps); a richer time-ordered activity feed from `ai_egress`/module audit is a follow-up once that read is exposed to the home surface.
- The pre-existing `HomeOverviewV2.tenant-switcher` failure is out of scope (legacy component, not on `/home`).
