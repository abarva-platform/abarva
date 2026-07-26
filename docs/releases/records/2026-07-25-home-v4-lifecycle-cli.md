# 2026-07-25-home-v4-lifecycle-cli — governed CLI for reject/retire/rollback

## Release ID

`2026-07-25-home-v4-lifecycle-cli`

## Status

`candidate` — verified locally, not yet merged.

## Plain-English Summary

`2026-07-25-home-v4-approval-activation-lifecycle.md` added reject/retire/rollback actions to the
`/home/v4-preview` admin UI, gated by a live platform-admin Clerk session. That UI isn't reachable
from every context an authorized reviewer might record a decision in (e.g. an operator running a
scheduled or agent-assisted review pass without a browser session). This adds a governed CLI,
`scripts/knowledge/manage-home-knowledge-v4-lifecycle.mjs`, that performs the exact same three
actions via the same SQL, runnable through the governed ACA operator job — the same pattern already
used for `persist-home-knowledge-v4-book.mjs --approve`. Defaults to dry-run; every action requires
an explicit actor and a written reason, same as the UI path.

## Layer Impact

- `internal-admin` lane: operator CLI only, mutating the same governed table the UI path already
  mutates, through the same governed ACA operator job pattern used for every other Home Knowledge V4
  mutation this workstream has performed. No new data model, no client-visible surface.

## Client Applicability

- Internal only. No tenant-facing route or content change.

## Changes Included

- `scripts/knowledge/manage-home-knowledge-v4-lifecycle.mjs` (new): `--reject`, `--retire`,
  `--rollback` actions, dry-run by default, requiring `--by`/`--reason`. SQL kept in sync by hand
  with `src/lib/home/home-knowledge-v4-review.ts` (script and Next.js lib run in different
  environments, same reasoning as the existing persist script's `approveTenantPack`).
- `package.json`: new `home:knowledge-v4:lifecycle` script entry.

## QA / Validation

- `pass` — `node --check` and `npx eslint`, zero findings.
- `pass` — local dry-run invocation confirmed argument parsing and the dry-run guard (no database
  touched without `--write-db`).
- No live-database exercise was possible from this environment (no route to the private-VNet
  Postgres); the SQL is identical to the already-tested TS lib functions in
  `2026-07-25-home-v4-approval-activation-lifecycle.md` (18 passing tests against a faithful mock
  of this exact SQL), so correctness rests on that prior verification plus this script's own
  argument-handling being exercised in dry-run.

## Rollout Plan

1. Merge to `main` → `aca-main-deploy.yml` builds the new image.
2. Run via the governed ACA operator job for the specific reject/retire/rollback decisions this
   record's companion qualitative-review documentation calls for.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`, triggered by merge.
- Shared runtime mutators: none in this PR itself — the governed operator job execution that uses
  this script afterward is a separate, explicit, one-off action, not a shared-runtime traffic change.
- Live signed-in proof required: no — CLI tool, not a rendered surface.

## Rollback Plan

Revert the PR. No schema change in this PR (reuses columns added by the prior migration); no
existing call site is affected.

## Audit Evidence

- This PR's diff and CI run.
- The governed operator-job execution logs for each lifecycle action taken with this script,
  captured via Log Analytics per the established retrieval pattern.

## Known Gaps

This CLI and the web UI both write to the same table via independently-maintained but
functionally-identical SQL (same duplication tradeoff the existing approve action already accepted,
documented in `home-knowledge-v4-review.ts`'s own comment). A shared SQL/query layer between the
Next.js runtime and standalone Node scripts would remove this duplication; not attempted here to
keep this change small and reviewable.
