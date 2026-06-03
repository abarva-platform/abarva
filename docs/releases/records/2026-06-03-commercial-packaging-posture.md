# 2026-06-03-commercial-packaging-posture — Commercial Packaging Posture

## Release ID

`2026-06-03-commercial-packaging-posture`

## Status

`candidate`

## Plain-English Summary

Turns several commercial backlog rows into a durable pricing and positioning
posture. The pilot pricing document now explicitly defines tiered user
packaging, Source module add-on and wedge pricing, a smaller CTO-buyer entry
tier, and new-leader foundation positioning.

## Layer Impact

- `internal-admin`: gives the founder and sales preparation workflow a
  consistent pricing posture to reuse in SOW drafting and buyer conversations.
- `public-demo`: no public copy changes, but the posture may inform future
  client-facing sales materials.

## Client Applicability

- All clients: commercial posture for pilots and year-1 conversion unless a
  signed SOW supersedes it.
- Specific clients: none.
- Internal only: source-of-truth commercial guidance.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `docs/gtm/pilot-pricing-and-packaging.md`
- This release record.

## QA / Validation

- Pass: `git diff --check origin/main...HEAD`
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge through the protected PR path. After merge, this becomes the current
internal commercial packaging guidance for T057, T058, T270, T271, and T283.

## Rollback Plan

Revert this PR if the founder reopens the posture or replaces it with
client-specific pricing. Signed SOWs continue to control over this internal
guidance.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/2969
- Backlog rows: `T057`, `T058`, `T270`, `T271`, `T283`.
- Local QA commands listed above.

## Known Gaps

- External customer SOWs still require founder review before signature.
- Multi-year and annual prepay discount rows remain separate backlog items.
