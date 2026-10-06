# 2026-10-05-census-gates-check-pr-head — Census gates validate the PR head, not merged-with-main

## Release ID

`2026-10-05-census-gates-check-pr-head`

## Status

`candidate`

## Plain-English Summary

Two generated-artifact gates — the tenancy fence-coverage census and the test-CI
coverage census — were false-failing nearly every PR. On a `pull_request` event,
GitHub's default checkout is the PR **merged with the latest base**, so whenever
`main` changed since the PR was pushed (a route or a test moved — which happens
constantly), the committed census no longer matched the merged tree and the gate
went red, even though the PR itself was internally consistent. Every PR then had
to re-merge main and regenerate the censuses, repeatedly, racing a moving base.

This changes both workflows to check out the **PR head** on `pull_request`
events, so each gate validates the PR's own code against its own committed
census. The gate's logic is unchanged — a PR whose census does not match its code
(e.g. it adds an unfenced route without updating the fence census) still fails.
`merge_group` and `push` events keep the default checkout, so the merged result
is still validated at merge time where a merge queue is used.

## Layer Impact

Release lane: `internal-admin` — CI gate configuration only; no product code.

- CI: `tenancy-fence-coverage.yml` and `test-ci-coverage-census.yml` set
  `actions/checkout` `ref` to the PR head for `pull_request` events, default
  otherwise.

## Client Applicability

- All clients: No product change.
- Specific clients: None.
- Internal only: Yes — CI behavior only.
- Public/demo only: No.
- Feature flag: none.

## Changes Included

- `.github/workflows/tenancy-fence-coverage.yml` — checkout the PR head on
  `pull_request`.
- `.github/workflows/test-ci-coverage-census.yml` — same.

## QA / Validation

- YAML shape — **PASS**: the `with: ref:` is added under each `actions/checkout`
  step with the conditional expression; `merge_group`/`push` unaffected.
- Behavior reasoning — **PASS**: on `pull_request` the gate now runs against the
  PR head (matching a local `--check`, which already passes on a consistent
  branch); base churn no longer invalidates it. The gate logic (census must
  match the checked-out code) is unchanged.
- Live CI confirmation — **NOT RUN** locally; proven by the gate turning green on
  this PR and stopping the recurring false-failures on open PRs.

## Rollout Plan

Merge to `main` via squash PR. Takes effect for subsequent `pull_request` CI
runs. No runtime/product impact.

## Rollback Plan

Revert the PR. Both workflows return to the default (merged-with-base) checkout;
no data or product impact.

## Deployment Authority

CI configuration only; no ACA/runtime change, no shared traffic, no Container App
template/secret touched.

## Known Gaps

- Does not change the census generation logic or the committed baselines; it only
  changes which commit the gate evaluates on a PR. The merge-time (merge_group)
  validation path is unchanged.

## Audit Evidence

- CI: the two workflows' own runs on this PR; `npm run release:check`.
