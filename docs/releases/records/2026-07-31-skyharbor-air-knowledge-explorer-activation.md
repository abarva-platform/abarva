# 2026-07-31-skyharbor-air-knowledge-explorer-activation — Activate the Knowledge Explorer route for skyharbor-air

## Release ID

`2026-07-31-skyharbor-air-knowledge-explorer-activation`

## Status

`candidate`

## Plain-English Summary

The `/home/knowledge` Knowledge Explorer product route was activated only for `airline-demo-new`, gated
in three separate places: the `FOUNDATION_TENANT_KEYS` registry, `foundation-route-access.ts`'s
metadata-based route-access check, and a redundant literal check in the page component itself. This
release adds `skyharbor-air` — the actual canonical, registered airline tenant
(`src/config/tenants/CANONICAL_TENANTS.ts`: `key: "skyharbor-air"`, `name: "Airline Demo"`) — to all
three gates, and adds matching Foundation proof-login config entries
(`src/lib/auth/foundation-proof-logins.ts`) so a real signed-in proof session can eventually be
provisioned for it, following the exact existing pattern used for `airline-demo-new`.

This is an **allow-list expansion only** — no existing tenant's access changes, `healthcare-demo-new`
stays excluded from this route exactly as it was before (that exclusion was already deliberate, not
something this PR touches), and no design/content change was made. Before making any UI change I
compared the live `BriefMode.tsx` composition (`StoryHeader → IdentityPanel → PurposePanel → GoalsPanel →
AbarvaViewsPanel → PerspectivesPanel → BenchmarksPanel → PatternsPanel → DecisionLanesPanel →
ConditionStrip → SourcesPanel`) against the original design mockup Anand shared
(`AbarVa Knowledge - Airline Demo New.html`) and confirmed it's a faithful, section-by-section
implementation of that exact design — the code's own comment even documents the one deliberate
deviation (the mockup's "Design notes" tab is intentionally not shipped). There was no "which flavor"
decision to make; the live code already is the design.

## Layer Impact

**Release lane: `global-control-lane`** (shared app/control-plane auth logic, feature-gated by tenant
allow-list — not client-scoped data).

- Layer 4 (product surface) access-control only. No canonical model, schema, or data-plane change.

## Client Applicability

- All clients: No.
- Specific clients: `skyharbor-air` gains access; `airline-demo-new` unaffected;
  `healthcare-demo-new` remains excluded (unchanged).
- Internal only: Yes — this route requires a Foundation proof-login session, not general product access.
- Public/demo only: No.
- Feature flag: None (this route was never gated by `home_knowledge_vnext`; it's gated by Clerk metadata
  allow-lists, which this PR extends).

## Changes Included

- `src/lib/tenant/foundation-tenants.ts` — added `"skyharbor-air"` to `FOUNDATION_TENANT_KEYS`.
- `src/lib/auth/foundation-route-access.ts` — `isFoundationRouteAllowedForMetadata` now allows
  `tenantKey === "skyharbor-air"` alongside the existing `"airline-demo-new"` check for the
  `/home/knowledge` route.
- `src/app/(maestro)/home/knowledge/page.tsx` — replaced the single-tenant literal check with a
  `KNOWLEDGE_ACTIVATED_TENANTS` allow-list set containing both tenants; updated the page's own
  documentation comment and metadata description to stop claiming this is airline-demo-new-only.
- `src/lib/auth/foundation-proof-logins.ts` — added `"skyharbor-air"` to `FoundationProofTenantKey`, and
  two new proof-login config entries (`anand-skyharbor-foundation`, `agent-skyharbor-foundation`)
  following the exact existing pattern (human_owner + automation_agent, reserved NANPA 202-555-01xx
  phone numbers not used by any existing entry: `.105/.185/.187` and `.106/.186/.188`).

## QA / Validation

- `npx eslint` on all four changed files — passed clean, zero errors/warnings.
- Local `tsc --noEmit` crashed in this fresh worktree (exit 134) even after symlinking `node_modules` —
  matches a known, already-documented local-tsc-reliability issue in this repo; CI's typecheck step is
  authoritative, not a local rerun.
- Manually traced the full access chain (`resolveFoundationPreviewTenantKeyForSession` →
  `resolveFoundationTenantKeyFromMetadata` → `isFoundationRouteAllowedForMetadata` →
  `KNOWLEDGE_ACTIVATED_TENANTS`) end to end against the real, current source — confirmed no other
  hardcoded `"airline-demo-new"`-only gate remains in this specific path (the remaining hardcoded
  references found via `grep` are: test fixtures, unrelated legacy-route redirects to a default tenant,
  and `/home`'s own unrelated fallback-default logic — none of them block `skyharbor-air`'s access to
  `/home/knowledge` once a real proof session exists for it).
- `node scripts/release-check.mjs` — passed after this record was added.

## Rollout Plan

Merge to `main` via the standard squash-merge path. **This triggers `aca-main-deploy.yml`
(`on: push: branches: [main]`), which redeploys the shared production `app.abarva.ai` web app** — same
consideration flagged for every other merge today. Not merged without that being an explicit, separate
decision.

This change alone does **not** produce a working, signed-in, live proof for `skyharbor-air` — that also
requires running `scripts/auth/provision-foundation-proof-logins.ts` (or its equivalent) to actually
create the two new Clerk proof-login accounts. That was deliberately **not run** as part of this
release — creating real user accounts is a separate, explicit action, not a side effect of a code change.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`, triggered automatically on merge to `main` (not
  something this PR itself invokes).
- Shared runtime mutators: Yes, indirectly — any merge to `main` redeploys the shared web app. This PR's
  own diff does not touch shared infrastructure, secrets, or traffic configuration directly.
- Approved image digest: Not applicable — this PR doesn't build or reference an image itself; the next
  `aca-main-deploy.yml` run (whenever this merges) resolves and builds from whatever is on `main` at
  that time.
- ACA runtime invariant: To be proven after merge + deploy, same discipline as every other merge today.
- Worker image invariant: Not applicable — no worker-job behavior changes.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: **Yes, but blocked** on the proof-login provisioning step described
  above — cannot be completed as part of this record.

## Rollback Plan

Revert the merge commit — this is a pure allow-list expansion with no data-plane or schema
dependency, so reverting fully restores the prior `airline-demo-new`-only gating with no side effects.

## Audit Evidence

- PR (this change) — see PR description for link.
- `eslint` output captured in this record's QA section.
- Design-comparison finding (mockup vs. `BriefMode.tsx` composition) documented in the Plain-English
  Summary above.

## Known Gaps

- No real, live signed-in proof exists yet for `skyharbor-air` — needs the proof-login provisioning
  script run (a separate, explicit action) before this can be demonstrated end-to-end.
- Even once provisioned, the page will render with genuinely empty/thin content until skyharbor-air's
  Foundation V2 pipeline (Gates 3-7, in progress in parallel) reaches Phase 7 publication — this PR only
  controls *who can reach the route*, not what data it has to show.
- No test coverage was added for the `skyharbor-air` allow-list additions (existing tests for
  `airline-demo-new`'s equivalent gates were left as-is, not extended) — a reasonable fast-follow, not
  done here to keep this change narrowly scoped to the access-control fix itself.
