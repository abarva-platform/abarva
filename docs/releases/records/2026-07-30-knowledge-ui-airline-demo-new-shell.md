# 2026-07-30-knowledge-ui-airline-demo-new-shell — Knowledge UI shell for airline-demo-new (render-gated, no live data)

## Release ID

`2026-07-30-knowledge-ui-airline-demo-new-shell`

## Status

`candidate`

## Plain-English Summary

Adds a new, self-contained "Knowledge" page (`/home/knowledge`) for the `airline-demo-new`
tenant: four modes (Brief, Explore, Relationships, Evidence & gaps), an aVa companion dock, and
an evidence drawer, built to match a prior UX prototype. Every component reads through a typed
provider contract (`GovernedKnowledgeProvider`) and renders a real, honest empty/blocked/stale
state rather than any number, chart, or claim — because `airline-demo-new` has zero reconciled
consumption projections today (0 of 62 audited UI components are `SUPPORTED_AND_RECONCILED`; see
`reports/airline-knowledge-ui-binding-2026-07-29/`). This PR ships UI/UX only. No canonical data,
projection, or Cube work is included — that is a separate, already-in-progress workstream.

## Layer Impact

**Release lane: `experimental`** (non-default capability — not linked from any nav, tenant not
registered, reachable by direct URL only).

- **Layer 4 (Products)**: adds one new route and ~55 new UI components under
  `src/components/knowledge/` and `src/app/(maestro)/home/knowledge/`. Does not modify any
  existing product route.
- **Layer 3 (Canonical model)**: no changes. `GovernedKnowledgeProvider`'s live implementation is
  an honest stub (`createUnreconciledGovernedKnowledgeProvider`) that withholds everything; it
  does not read or write any canonical table.
- No Layer 1/2 (client intake, source adapters) impact.

## Client Applicability

- All clients: No
- Specific clients: `airline-demo-new` only (tenant key is hardcoded in the route; not
  tenant-switchable)
- Internal only: Effectively yes today — the route is not linked from any product nav, and
  `airline-demo-new` is intentionally absent from `CANONICAL_TENANTS.ts` (per the tenant's own
  freeze-manifest rule against wiring before baseline publication proof)
- Public/demo only: No
- Feature flag: None — reachability is via direct URL only; not discoverable through normal
  navigation, so no flag was judged necessary for this shell-only change

## Changes Included

- New route: `src/app/(maestro)/home/knowledge/page.tsx`
- New provider layer: `src/lib/knowledge/providers/` (`types.ts`, `governed-knowledge-provider.ts`,
  `design-harness-provider.ts`, `read-models.ts`)
- New components: `src/components/knowledge/**` (shell, Brief/Explore/Relationships/Evidence
  modes, aVa dock, evidence drawer, current-vs-target panel, decision-readiness quadrant,
  saved-view/export bar, module-handoff modal)
- New tests: `src/components/knowledge/__tests__/**` (35 tests), plus a new Playwright E2E spec
  `tests/e2e/knowledge-airline-demo-new-smoke.spec.ts`
- Fixes one defect found during this work: `CurrentVsTargetPanel` and `DecisionReadinessQuadrant`
  were built but never mounted anywhere; both are now wired to real integration points
  (`EvidenceDrawer` via a real node id, `EvidenceMode`) — see
  `orphan-component-wiring.test.tsx` for regression coverage
- Does not modify any pre-existing file outside `src/components/knowledge/`,
  `src/lib/knowledge/providers/`, the one route file, and this record

## QA / Validation

- `npx tsc --noEmit -p tsconfig.json` — pass, clean on all touched files
- `npx eslint src/components/knowledge src/lib/knowledge/providers` — pass, no findings
- `npx jest src/components/knowledge src/lib/knowledge/providers` — 35/35 tests pass, including
  render-gate primitives, an integration suite against the real stub provider, a full-tree smoke
  render, and the orphan-component wiring regression test
- `npm run build` (clean production build, not dev mode) — exit 0, `/home/knowledge` compiles
- `next start` against that build — route resolves, zero server errors, zero unexplained console
  errors
- **Signed-in browser proof: blocked, not run.** Reproduced identically via three independent
  methods (this session's browser tool, a real Playwright run using the repo's own approved
  `DemoCodeSignIn` E2E harness, and a bare `curl`) that this sandbox environment injects an
  `x-abarva-accessibility-axe` header on all outbound HTTP traffic, which combined with this
  environment's `ACCESSIBILITY_AXE_DISABLE_CLERK=1` forces every request through
  `SignInShell`'s accessibility-scan stub instead of real Clerk — confirmed sandbox-level, not
  an application defect, and not something worked around by touching `proxy.ts`, middleware,
  Clerk config, or `.env.local` (none of which were touched). This is the reason for opening this
  PR: to reach an environment where a real signed-in proof is possible.
- `node scripts/release-check.mjs --base main --head HEAD` — the Azure/tenant-input audit checks
  pass; the overall gate currently reports pre-existing failures in unrelated, already-merged
  release records dated 2026-07-14/07-20/07-21 (missing "Known Gaps" sections, missing Layer
  Impact lane names) that are **not touched by this PR's diff** and predate this work — flagged
  here for visibility, not fixed in this PR (out of scope for a UI-only shell change)

## Rollout Plan

Merge to `main` via the standard squash-merge path. The repo-owned `aca-main-deploy.yml` workflow
builds and deploys the image to the lab Container App on merge. This PR intentionally does not
request a lab traffic cutover or production promotion — the route is not linked from any nav and
the tenant is not registered, so there is no reachable surface change for any real user even
after deploy. The next step after merge is running the live signed-in proof (blocked in this
sandbox, per QA section above) against the deployed lab environment.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (not triggered by this
  agent; triggers automatically on merge to `main`)
- Shared runtime mutators: None used or requested by this PR
- Approved image digest: N/A — no manual `az acr build` or `az containerapp update` was run
- ACA runtime invariant: Not asserted by this PR — no traffic-weight or template-image change
  requested
- Worker image invariant: N/A, no worker job changes
- Feature/env flag update path: N/A, no flag introduced
- Live signed-in proof required: **Yes, outstanding.** Must be captured against the lab
  environment before this route is linked from any nav or the tenant is registered in
  `CANONICAL_TENANTS.ts`

## Rollback Plan

Revert the merge commit. No migrations, no data changes, no flag flips, no traffic-weight
changes are part of this PR, so rollback is a pure code revert with no other cleanup required.

## Audit Evidence

- This release record
- `reports/airline-e2e-data-quality-lineage-audit-2026-07-29.md` and
  `reports/airline-knowledge-ui-binding-2026-07-29/` (the binding-matrix package this UI was
  built against)
- Local test run output referenced in QA / Validation above (not yet captured as a CI artifact —
  will be produced by the PR's CI run)
- PR URL: to be filled in after `gh pr create`

## Known Gaps

- Live signed-in browser proof (screenshots, console/network logs, visual comparison to the
  approved prototype across all 4 modes and interaction states) is not yet captured — blocked in
  this sandbox for the reason stated in QA / Validation, expected to be resolved once this
  environment reaches the lab deploy.
- `CurrentVsTargetPanel` and `DecisionReadinessQuadrant` are wired to real integration points but
  cannot be exercised with real data yet, since 0 of 62 audited components have reconciled data
  (tracked separately in `KNOWLEDGE_CODEX_DATA_LAYER_HANDOFF.csv` — data-plane lane, not this
  PR's scope).
- No canonical data, projection, or Cube work is included; that is explicitly a separate,
  already-in-progress workstream per the Claude=UI / Codex=data-plane lane split established for
  this tenant.
- This route is not yet linked from any product navigation and `airline-demo-new` is not yet
  registered in `CANONICAL_TENANTS.ts` — both intentional, per the tenant's own freeze-manifest
  rule, and should remain that way until the data-plane gaps above close.
