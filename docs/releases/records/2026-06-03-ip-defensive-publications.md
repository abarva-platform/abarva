# 2026-06-03-ip-defensive-publications - IP Defensive Publication Drafts

## Release ID

`2026-06-03-ip-defensive-publications`

## Status

`candidate`

## Plain-English Summary

Adds two counsel-ready defensive-publication drafts and a reusable invention
disclosure form template. The drafts cover the workflow-anchored agent pattern
and the pattern-to-Move funnel. They are internal review packets, not public
defensive publications until reviewed and posted through a public channel.

## Layer Impact

- `internal-admin`: Adds founder/legal operating documentation for IP readiness.
- `global-control-lane`: Documents architecture and workflow-control patterns
  that apply across product surfaces, without changing runtime behavior.

## Client Applicability

- All clients: No runtime client impact.
- Specific clients: None.
- Internal only: Founder, counsel, product leadership, and architecture review.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `docs/ip/defensive-publications/2026-06-03-workflow-anchored-agent-pattern.md`
- `docs/ip/defensive-publications/2026-06-03-pattern-to-move-funnel.md`
- `docs/ip/invention-disclosure-form-template.md`
- `docs/ip/defensive-publications/README.md`

## QA / Validation

- `git diff --check`
- `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`. No runtime rollout, migration, feature flag, Vercel deploy, or
Azure deploy is required. External publication remains a separate counsel/founder
approval step.

## Rollback Plan

Revert the documentation commit if the drafts should be removed or replaced.
There is no runtime rollback.

## Audit Evidence

- Pull request URL after opening.
- Release record in this file.
- Defensive-publication index at
  `docs/ip/defensive-publications/README.md`.

## Known Gaps

- Public defensive publication is not complete until counsel/founder review,
  public posting, and URL/date capture happen.
- This slice does not update trademark, insurance, or external counsel tasks.
