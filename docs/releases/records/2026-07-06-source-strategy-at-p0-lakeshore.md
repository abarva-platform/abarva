# 2026-07-06-source-strategy-at-p0-lakeshore — enroll Lakeshore in the strategy-stage-kill flags

## Release ID

`2026-07-06-source-strategy-at-p0-lakeshore`

## Status

`candidate`

## Plain-English Summary

On `app.abarva.ai`, a freshly-created Lakeshore Source event still lands on a **standalone
Strategy stage** — a separate 0/3 gate (sponsor sign-off / value target set / archetype
confirmed) and a manual "Draft with aVa" button — even after the intake was approved. That
is the *pre-kill* behavior.

Main already contains the complete, tested implementation that eliminates that step, behind
two tenant flags that were off for every tenant:

- **`source_strategy_at_p0`** — on intake approval the event advances straight to Scope and
  the three GATE-STRATEGY criteria are waived with an audit reason; the Strategy stage is
  shown *done* on the rail rather than presented as a separate to-do page.
- **`source_strategy_auto_draft`** — on entering Strategy with no memo yet, auto-runs the
  governed Draft-with-Sentinel generation once (no manual click).

This change simply **enrolls the `lakeshore` tenant in both flags** so the strategy-stage
kill is live for Lakeshore, for live proof. No new logic — the behavior, its GATE-STRATEGY
waiver, the stage-entry auto-draft, and their tests already ship on main.

## Layer Impact

- `experimental` (primary lane): a feature-flag enrollment, no code-path change. Two entries
  in `src/lib/features/registry.ts` gain `includeTenants: ["lakeshore"]`. Off for all other
  tenants — their Source flow is byte-identical.
- `client-data-lane` (secondary): the enabled behavior is client-scoped to Lakeshore only.
  No schema, seed, migration, or shared-runtime change.

## Client Applicability

- All clients: no — flags remain off for everyone except Lakeshore.
- Specific clients: **Lakeshore** (`lakeshore`) — strategy folded into P0 approval; events
  advance intake-approval → Scope; strategy memo auto-drafts.
- Internal only: no
- Public/demo only: no
- Feature flag: `source_strategy_at_p0` + `source_strategy_auto_draft` (both now include
  `lakeshore`; also overridable via `ABARVA_FEATURE_SOURCE_STRATEGY_AT_P0_TENANTS` /
  `ABARVA_FEATURE_SOURCE_STRATEGY_AUTO_DRAFT_TENANTS`).

## Changes Included

- `src/lib/features/registry.ts` — add `"lakeshore"` to `includeTenants` for
  `source_strategy_at_p0` and `source_strategy_auto_draft`; note the enrollment date in each
  summary.
- `docs/releases/records/2026-07-06-source-strategy-at-p0-lakeshore.md` — this record.

## QA / Validation

- `npx jest src/lib/features src/lib/source/__tests__/stage-entry-autodraft.test.ts
  src/__tests__/integration/source/source-access-control-static.test.ts` → **3 suites / 37
  tests pass.** **pass.**
- `npx tsc --noEmit` (full project, exit-code gated) → **0 errors.** **pass.**
- Live signed-in proof required on deploy: create a fresh Lakeshore Source event → approve
  intake → confirm it advances to **Scope** (not a standalone Strategy to-do), the Strategy
  stage reads *done* on the rail, and no manual "Draft with aVa" gate blocks. **verify on
  deploy.**

## Rollout Plan

Merge to `main` via PR + squash. ACA main deploy auto-runs on merge; record the revision.
Flag is tenant-scoped to Lakeshore — no impact to other tenants. To broaden later, add more
client keys to `includeTenants` (or set the env allowlist).

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps lab lane per
  `docs/runbooks/azure-container-apps-deploy.md` (auto-runs on merge to main).
- Shared runtime mutators: none — flag registry constant only.
- Approved image digest: recorded on deploy.
- ACA runtime invariant: new revision healthy before 100% traffic; single deploy authority.
- Worker image invariant: n/a.
- Feature/env flag update path: `includeTenants` in registry, or
  `ABARVA_FEATURE_SOURCE_STRATEGY_AT_P0_TENANTS` env override.
- Live signed-in proof required: yes — Lakeshore fresh-event walk on `app.abarva.ai`.

## Rollback Plan

Revert the one-line-per-flag `includeTenants` change (or remove `lakeshore` from the env
allowlist) and redeploy. Instantly returns Lakeshore to the standard Strategy stage. No
schema/data to unwind.

## Audit Evidence

- PR URL (added on open).
- CI: `release:check`, jest, tsc.
- The enabled behavior + its GATE-STRATEGY waiver audit reason and stage-entry auto-draft are
  main's existing, tested code (`approve/route.ts`, `stage-entry-autodraft.ts`,
  `UniversalCanvasShell.tsx`); this record only flips the enrollment.

## Known Gaps

- Live-proven only once the Lakeshore fresh-event walk passes on ACA (flag was never
  enabled for any tenant before). Broadening beyond Lakeshore is a follow-up once proven.
