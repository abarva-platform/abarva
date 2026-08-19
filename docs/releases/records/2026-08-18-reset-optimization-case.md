# 2026-08-18-reset-optimization-case — Reset Persisted Optimization Case for a Contract

## Release ID

`2026-08-18-reset-optimization-case`

## Status

`candidate`

## Plain-English Summary

`getPersistedContractOptimizationOpportunitySet` in `read-adapter.ts` checks for a persisted
optimization case for a contract before doing anything else, and returns it as-is if found — the
underlying evidence is never re-queried once a case has been opened. This is a reasonable production
design (a locked baseline should not silently drift), but it means an operator's own earlier visit to a
contract's Optimize Contract page, made while the underlying evidence data still had an error, persists
that stale computation indefinitely. Correcting the source data and reloading it afterward has no
visible effect: the page keeps rendering the frozen, pre-correction result.

This adds `reset-optimization-case.mjs`, an operator tool that deletes the persisted case for one
contract across `source.optimization_case`, `source.optimization_opportunity`, and
`source.optimization_baseline`, scoped to `tenant_key + contract_id`. Plan mode (default) only counts
rows; nothing is deleted without `--apply`. Scope is deliberately narrow: it does not touch the
approval/outcome/finance tables further downstream in this workflow's data model, because those are
genuine user actions that should never be silently discarded — this tool only clears the *baseline
computation snapshot* so it can be recomputed, not anything a person did with it.

## Layer Impact

- Release lane: `internal-admin`
- Products: Source (Optimize Contract workflow) — this is an operator tool, not a product feature or
  route.
- Canonical model: No schema/migration change. Deletes rows from three existing tables, scoped
  narrowly.

## Client Applicability

- All clients: No.
- Specific clients: Any tenant an operator explicitly targets; used today for the synthetic demo
  airline tenant only.
- Internal only: Yes — operator-run ACA Job.
- Public/demo only: No (the tool itself is generic; today's use is demo-prep).
- Feature flag: None.

## Changes Included

- `scripts/source/reset-optimization-case.mjs` (new).
- `package.json` — adds `source:reset-optimization-case:plan` and
  `source:reset-optimization-case:apply` npm scripts.

## QA / Validation

- `node --check scripts/source/reset-optimization-case.mjs` — syntax valid.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — pass.
- Plan-mode output (row counts before any delete) captured in the operator run summary, not in this
  record, per the public-repo disclosure rule against narrating a specific engagement's data in a
  public artifact.
- Deliberately scoped to a `BEGIN`/`COMMIT` transaction with `ROLLBACK` on any error, so a failure
  partway through (for example, a foreign-key constraint from a downstream table this tool does not
  target) leaves no partial deletion.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the new
image. Run plan mode first via ACA Job to confirm row counts, then `--apply` per
`docs/ops/aca-data-build-job-rule.md`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Produced by the deploy workflow.
- ACA runtime invariant: Verify template image, 100% traffic revision image match the deployed digest
  before running the operator job.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes — confirm the Optimize Contract page recomputes and the
  baseline-conflict gate clears after the reset.

## Rollback Plan

The delete is scoped and the affected rows are recomputable by revisiting the contract's Optimize
Contract page (which recreates the case fresh from current evidence). There is no data to restore from
backup; the "rollback" for a bad reset is simply re-visiting the page to regenerate a new persisted
case.

## Audit Evidence

- Pull request URL after PR creation.
- GitHub Actions checks for the PR.
- ACA main deploy run after merge.
- ACA operator job execution logs for both the plan pass and the apply pass.
- Live read of the Optimize Contract workflow showing the case recomputed with current evidence.

## Known Gaps

- This tool's scope (three tables) assumes nothing downstream of the baseline was ever created for the
  target contract. If a case has progressed further (an approval request, outcome, or finance
  confirmation exists), this tool does not clear those tables, and the underlying foreign-key
  relationships may cause the `optimization_opportunity`/`optimization_case` deletes to fail rather than
  orphan data — a safe failure mode, but one that would require widening this tool's scope before it
  could complete for such a contract.
