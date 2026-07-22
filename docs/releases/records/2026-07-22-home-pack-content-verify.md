# 2026-07-22-home-pack-content-verify — read-only content verification for live Home packs

## Release ID

`2026-07-22-home-pack-content-verify`

## Status

`candidate`

## Plain-English Summary

Adds a read-only script that reports, per tenant, whether the currently-live (approved) Home Knowledge Pack actually has its Claude-authored content — or whether a surface will render thin/empty.

Why it's needed: after the first full population there was no way to answer "do we have all the strategic narratives content?" without reading operator run logs and inferring. Run logs report what a run *did*; they don't report what is *live now*. The private-VNet database is unreachable from a laptop, and `az containerapp exec` requires an interactive TTY that CI/agent shells don't have. So the only reliable way to know is a governed read-only job.

The script reports per tenant: pack status, forward-looking narratives broken out by type (industry movements / new ways of operating / change theses), executive read, AI readiness, next-evidence, and dimensions. It applies presentability thresholds rather than a bare non-empty check — a single narrative is technically "not empty" but still renders as a thin page, which is the actual thing to avoid. It prints a machine-greppable `HOME_PACK_CONTENT_VERDICT` line and exits non-zero when any tenant is incomplete, so an operator run fails visibly instead of quietly passing.

## Layer Impact

- `global-control-lane`: adds one read-only verification script + npm script. No schema, no writes, no runtime change.

## Client Applicability

- All clients: reports on every tenant's live pack.
- Internal only: operator/QA tooling.
- Feature flag: None.

## Changes Included

- `scripts/knowledge/verify-home-knowledge-pack-content.mjs` (new, read-only SELECTs only)
- `package.json`: adds `home:knowledge-pack-v2:verify`

## QA / Validation

- `pass` — `node --check` clean.
- `pass` — Executed against a local Postgres carrying the same schema: correctly reported the one fully-generated tenant as `COMPLETE` (5 industry movements / 5 new ways of operating / 4 change theses / exec read / 5 AI readiness) and correctly flagged deterministic-only tenants as `NEEDS WORK` with specific reasons. Verdict line and non-zero exit both behaved as intended.
- `n/a` — No migration, no runtime change, no writes.
- `pass` — `node scripts/release-check.mjs --base origin/main --head HEAD` (run pre-push).

## Rollout Plan

Merge + deploy through the normal ACA lane, then run through the governed operator job (`home:knowledge-pack-v2:verify`) with the database secret, to get the authoritative live per-tenant content state. Re-run after any future population.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main deploy after merge.
- Shared runtime mutators: none — read-only.
- Migration application: none.
- Feature/env flag update path: none.
- Live signed-in proof required: no runtime-visible change.

## Rollback Plan

Revert the PR. The script is additive and read-only; reverting removes a diagnostic only.

## Audit Evidence

- Local execution output showing correct COMPLETE vs NEEDS WORK classification and per-reason detail.

## Known Gaps

- Thresholds (min 3 new-ways-of-operating, min 6 narratives total, min 3 AI-readiness) are a first-pass presentability bar, not a product-approved standard; tune once the dashboard renders them.
- Reports counts and completeness, not editorial quality — it cannot tell "generic narration" from "sharp narration". Content quality still needs human review of the actual text.
