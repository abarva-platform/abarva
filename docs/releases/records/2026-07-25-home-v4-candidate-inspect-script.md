# 2026-07-25-home-v4-candidate-inspect-script — Read-only Home Knowledge V4 candidate inspector

## Release ID

`2026-07-25-home-v4-candidate-inspect-script`

## Status

`candidate` — script addition only.

## Plain-English Summary

The real book-mode canary+persist job (run today) persisted a `candidate_failed` row for
first-capital (12 validator findings). This environment has no route to the private-VNet
Postgres, so the actual `quality_report`/`validation_issues` content on that row could not be
inspected without a new tool. Adds one read-only script,
`home:knowledge-v4:inspect-candidate`, that `SELECT`s a single `home_knowledge_packs` row (by
`--id` or by `--tenant`'s most recent V4 book row) and prints it as JSON. No writes, no Claude
calls. Run via the same governed ACA operator job used for generation/persistence.

## Layer Impact

- `internal-admin`: operator diagnostic tooling only. No product-surface or client-data-lane
  code changes.

## Client Applicability

- Internal only. Read-only against already-persisted candidate rows; no tenant is affected.

## Changes Included

- `scripts/knowledge/inspect-home-knowledge-v4-candidate.mjs` (new).
- `package.json`: new `home:knowledge-v4:inspect-candidate` script.

## QA / Validation

- `pass` — `node --check` and `npx eslint`, exit 0.
- `pass` — `package.json` valid JSON.
- Not yet run against production (this PR ships the tool; running it is a separate, read-only
  governed job execution after merge+deploy).

## Rollout Plan

Merge → `aca-main-deploy.yml` builds and deploys. Then, as a separate action: submit a governed
ACA operator job with `--script home:knowledge-v4:inspect-candidate` and
`HOME_KNOWLEDGE_V4_INSPECT_ID=<row id>` to read the first-capital candidate's actual findings.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`, triggered by merge.
- Shared runtime mutators: none — this script only runs `SELECT`.
- Live signed-in proof required: no — no user-facing surface.

## Rollback Plan

Revert the PR; the npm script disappears. No data was written by merging this PR.

## Audit Evidence

- This release record; output of the inspector run (captured separately once executed) will be
  attached to the follow-up decision on first-capital's regeneration/fix.

## Known Gaps

None known -- purely additive, read-only diagnostic tooling with no product surface.
