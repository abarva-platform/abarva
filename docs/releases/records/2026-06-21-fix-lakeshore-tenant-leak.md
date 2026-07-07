# 2026-06-21-fix-lakeshore-tenant-leak — P0: Lakeshore no longer reads Apex company-scale facts

## Release ID

`2026-06-21-fix-lakeshore-tenant-leak`

## Status

`candidate`

## Plain-English Summary

Fixes a P0 cross-tenant leak: a Lakeshore (diversified holdings) request about company scale/size returned Apex Retail's enterprise-profile facts. Root cause in `src/lib/intelligence/ask/retrievers/knowledge.ts`: the tenant fence resolves the active tenant to a marker via `normalizeTenantMarker`, but `lakeshore` was absent from that map → it returned `null` → the next guard `if (!activeTenant) return true` failed OPEN, admitting every row including Apex-marked, untagged company-scale rows (the industry-scope pre-filter only fences rows that carry industry tags, so an untagged Apex enterprise row slipped through). Fix: add a `lakeshore` marker branch, and harden the guard to fail CLOSED — when an active tenant signal exists but isn't a recognized marker, still exclude any row carrying another recognized tenant's marker (only a true no-tenant library browse blanket-allows). Apex path unchanged.

## Layer Impact

- **client-data-lane:** retrieval tenant-isolation in `knowledge.ts` (`normalizeTenantMarker` + the fail-open guard). Stricter fence; no schema/data change. A new co-located regression test.

## Client Applicability

- All clients: Tightens tenant isolation in knowledge retrieval — a tenant with no enterprise-profile rows now gets ABSENT, never another tenant's data.
- Specific clients: Fixes Lakeshore directly; Apex reads its own data unchanged.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/intelligence/ask/retrievers/knowledge.ts` — `lakeshore` marker + fail-closed guard.
- `src/lib/intelligence/ask/retrievers/knowledge.test.ts` — 2 regression cases (Lakeshore excludes Apex company_scale; Apex still reads its own).

## QA / Validation

Validation: Pass. `tsc --noEmit` clean on `knowledge.ts`. The retriever test suite passes 11/11 including the 2 new cases. Bug-catch proof: with the fix stashed, the Lakeshore regression test FAILS (it genuinely catches the leak); with the fix it passes. Live signed-in retrieval proof against the private DB is not run here (localhost cannot reach the private DB) — the unit-level isolation proof + the fail-catch is the evidence; a signed-in Lakeshore retrieval check is the follow-on.

## Rollout Plan

Merge to `main`; `aca-main-deploy` auto-deploys. Then a signed-in Lakeshore retrieval check (ask about company scale → no Apex facts).

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy` (auto on push to `main`).
- Shared runtime mutators: none (no migration).
- Approved image digest: built by the deploy workflow from this commit.
- ACA runtime invariant: web app serves the tightened fence after deploy.
- Worker image invariant: n/a.
- Feature/env flag update path: n/a.
- Live signed-in proof required: Yes — Lakeshore retrieval shows no Apex facts (follow-on).

## Rollback Plan

Revert the PR — restores the prior (leaky) fence. Code-only; no data/migration. (Note: reverting re-opens the P0 leak.)

## Known Gaps

- Lakeshore artifacts/KPI rows remain NOT_LOADED (a separate retrieval/data gap, not this fix).
- Signed-in live retrieval proof pending deploy.

## Audit Evidence

- PR URL: (filled on creation) `claude/scb-p0-lakeshore-leak` → `main`.
- CI: `npm run release:check`, tsc clean, retriever tests 11/11 + stash-proof that the test catches the leak.
