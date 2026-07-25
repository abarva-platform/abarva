# 2026-07-25-home-v4-book-canary-and-persist-job — Combined generate+persist operator job script

## Release ID

`2026-07-25-home-v4-book-canary-and-persist-job`

## Status

`candidate` — script addition only; not yet invoked against production.

## Plain-English Summary

Adds one new npm script, `home:knowledge-v4:canary-and-persist-job`, that chains the existing
real (Claude-calling) book-mode generation script and the existing Postgres persist script into a
single command. This is needed because the governed ACA operator job
(`scripts/ops/submit-aca-operator-job.mjs`) runs one npm script per job execution inside an
ephemeral container — the two existing scripts (`home:knowledge-v4:canary-job` and
`home:knowledge-v4:persist-book:write`) can't be chained across two separate job executions,
because the first script's output directory doesn't survive into a second, fresh container.
Running them as one shell-chained npm script keeps both steps in the same container/execution, so
the persist step can read the generation step's output directly.

No new logic — this is a one-line `package.json` addition wiring two already-shipped, already-
verified scripts (`2026-07-25-home-v4-book-live-cutover.md`) together.

## Layer Impact

- `internal-admin`: operator tooling only, invoked via the existing governed ACA operator-job
  path. No product-surface or client-data-lane code changes.

## Client Applicability

- Internal only. Running this job persists `status='candidate'` rows only (see the referenced
  persist script's own documented behavior) — no tenant is approved or made live by this script.

## Changes Included

- `package.json`: new `home:knowledge-v4:canary-and-persist-job` script.

## QA / Validation

- `pass` — `node --check` on both chained scripts (unchanged by this PR).
- `pass` — `package.json` remains valid JSON.
- Both underlying scripts were already verified in `2026-07-25-home-v4-book-live-cutover.md`
  (`--reresolve-visuals` proof, hand-verified numbers, `client_visible_technical_leakage` fix,
  evidence-fallback fix, architecture-rules fix).

## Rollout Plan

Merge → `aca-main-deploy.yml` builds and deploys the image containing this script. Then, as a
separate governed action (not part of this PR): submit an ACA operator job with
`--script home:knowledge-v4:canary-and-persist-job` and `HOME_KNOWLEDGE_V4_TENANT`,
`HOME_KNOWLEDGE_V4_BOOK_MODE=true`, `ANTHROPIC_API_KEY` (secret ref) for the 3 proven tenants
(skyharbor-air, first-capital, meridian-health). `--plan-only` first, per standing operating
practice.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`, triggered by merge.
- Shared runtime mutators: none in this PR itself. The job it enables writes to
  `home_knowledge_packs` as `status='candidate'` only, run separately after this merges.
- Feature/env flag update path: none.
- Live signed-in proof required: no — this PR adds no user-facing surface.

## Rollback Plan

Revert the PR; the npm script disappears. No data was written by merging this PR alone.

## Audit Evidence

- This release record; the referenced live-cutover record for the underlying scripts' own
  verification evidence.

## Known Gaps

None known -- this is a one-line wiring addition; both chained scripts already ship their own
documented gaps in the referenced live-cutover release record.
