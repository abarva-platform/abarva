# 2026-07-23-home-knowledge-v4-review-bundle — Home Knowledge V4 Review Bundle Operator

## Release ID

`2026-07-23-home-knowledge-v4-review-bundle`

## Status

`candidate`

## Plain-English Summary

This release lets the private Azure operator job generate the Home Knowledge V4 candidate review package with Claude-authored prompts, responses, assembled candidate JSON, validation output, and HTML/CSV review artifacts, then return the full proof bundle to the operator. The package is review-only. It does not publish, approve, or load Home content into Azure/Postgres.

## Layer Impact

- `internal-admin`: adds an operator-facing npm script for V4 Home review generation.
- `client-data-lane`: prepares review artifacts for tenant-specific candidate content, but does not mutate the data plane.
- Runtime UI: no direct UI behavior change.

## Client Applicability

- All clients: no runtime content change.
- Specific clients: all synthetic/demo tenants can be included in a review-only candidate generation run.
- Internal only: yes, this release is for AbarVa operators and reviewers.
- Public/demo only: no public-route change.
- Feature flag: none.

## Changes Included

- `package.json`: adds `home:knowledge-v4:review-job`.
- `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`: emits the standard ACA proof tarball markers when `EMIT_ACA_PROOF_BUNDLE=true`.
- `docs/releases/records/2026-07-23-home-knowledge-v4-review-bundle.md`: records release scope and proof requirements.

## QA / Validation

- `pass`: `node --check scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`
- `pass`: operator `--plan-only` for `home:knowledge-v4:review-job` with the deployed digest image and redacted Anthropic secret binding.
- `pending`: `npm run release:check`
- `pending`: private ACA operator run with `ANTHROPIC_API_KEY` and proof extraction.
- `not-run`: Azure/Postgres publication, intentionally out of scope.

## Rollout Plan

Merge through PR, deploy through the repo-owned ACA main lane, then run the private operator job with the deployed digest image:

```bash
node scripts/ops/submit-aca-operator-job.mjs \
  --image <deployed-digest-pinned-image> \
  --script home:knowledge-v4:review-job \
  --secret-env ANTHROPIC_API_KEY=anthropic-api-key \
  --env EMIT_ACA_PROOF_BUNDLE=true
```

The extracted proof bundle becomes the review ZIP for human approval. Do not run `--write-db` for V4 candidate review generation.

## Deployment Authority

- Repo-owned deploy workflow: required before using this operator entrypoint from the runtime image.
- Shared runtime mutators: repo-owned ACA main deploy workflow for image deployment; private ACA operator job for review generation only.
- Approved image digest: required for the operator job.
- ACA runtime invariant: required after main deploy.
- Worker image invariant: operator job must restore to documented idle state after execution.
- Feature/env flag update path: none.
- Live signed-in proof required: not for the review-generation entrypoint itself; required before any future generated candidate is promoted to live Home.

## Rollback Plan

Revert this release to remove the operator script and proof-bundle emission. No data rollback is required because this release does not mutate Azure/Postgres.

## Audit Evidence

- PR URL and CI checks for this release.
- Operator plan-only output showing the digest-pinned image, named npm script, redacted secret binding, and proof-bundle env var.
- After execution: operator run folder, logs, extracted proof bundle, idle verification, and review ZIP copied to Downloads.

## Known Gaps

- This release does not regenerate Home V4 content by itself; it only makes the governed review run retrievable.
- This release does not load or approve any V4 candidate content.
- The existing approved live Home packs remain unchanged until a future candidate passes review and is explicitly loaded/promoted.

