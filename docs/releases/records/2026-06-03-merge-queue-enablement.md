# 2026-06-03-merge-queue-enablement — Main Merge Queue Enablement

## Release ID

`2026-06-03-merge-queue-enablement`

## Status

`candidate`

## Plain-English Summary

This release prepares the transferred public GitHub repository for merge-queue governance. The required pull-request workflows now also run on GitHub merge-queue synthetic branches, so queued changes can be tested against the current main branch before they land.

## Layer Impact

- `global-control-lane`: Updates repository release-control mechanics for all code lanes by enabling required checks to run on `merge_group` events.
- `internal-admin`: Gives maintainers a safer merge path after the repository transfer from the personal account to the `abarva-platform` organization.

## Client Applicability

- All clients: Indirectly affected because release governance applies to every future product and data-plane change.
- Specific clients: None.
- Internal only: Directly affects maintainers and release operators.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Adds `merge_group` triggers to pull-request workflows that back required branch-protection checks.
- Updates `AGENTS.md` so future agents know the canonical repo moved to `abarva-platform/abarva` and that `main` should be merged through the queue.
- Documents the repository transfer and merge-queue enablement evidence path.
- No runtime product code, migrations, tenant data, or public route behavior changed.

## QA / Validation

- PASS: Workflow diff inspected to confirm only GitHub Actions trigger blocks changed.
- PASS: YAML syntax validation run for all changed workflows.
- PASS: Repository-governance instructions added to `AGENTS.md`.
- PASS: `git diff --check` run for whitespace validation.
- PASS: `npm run release:check -- --base origin/main --head HEAD` run before PR creation after this record was corrected.
- PENDING: Post-merge validation will verify that the active repository ruleset exists and that `main` requires the merge queue.

## Rollout Plan

Merge this PR to `main`, then create or update the active GitHub repository ruleset for `refs/heads/main` to require pull requests, required checks, and merge queue. No Vercel production deployment is required for application runtime behavior, although GitHub and Vercel checks may run as part of the PR.

## Rollback Plan

Revert the workflow trigger PR to remove `merge_group` triggers and disable the GitHub ruleset merge-queue rule. This rollback does not require database changes or a product runtime rollback.

## Audit Evidence

- Pre-transfer branch protection snapshot: `/Users/anand/Downloads/abarva-repo-protection-main-before-transfer.json`.
- Repository after transfer: `abarva-platform/abarva`.
- PR URL and ruleset ID to be added after creation.

## Known Gaps

The active merge-queue ruleset is created after this workflow-trigger PR lands, because required checks need to understand `merge_group` events before the queue is enforced.
