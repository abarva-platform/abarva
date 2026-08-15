# 2026-08-15-source-proof-backlog-control — Repair Source Proof Lane And Execution Plan

## Release ID

`2026-08-15-source-proof-backlog-control`

## Status

`merged-superseded-by-follow-up-proof`

## Plain-English Summary

This release makes the Source execution lane auditable before more feature work continues. It records the execution plan, updates the Source backlog with the first two required moves, and moves the Atlas production gauntlet toward durable automation identities instead of legacy human demo accounts.

Follow-up proof-scope and response-shape releases closed the default-scope proof
lane after this release. See
`2026-08-15-atlas-proof-scope-answer-shape.md` and
`2026-08-15-source-new-event-backlog-consolidation.md` for the current proof
register and remaining excluded hard gate.

## Layer Impact

Layer 4 Products and internal proof tooling only. Product data, workflow persistence, source adapters, canonical models, migrations, tenant projections, and live data-plane behavior are unchanged.

## Client Applicability

- All clients: No direct product behavior change.
- Specific clients: No client-specific product data change.
- Internal only: Yes, proof automation and execution planning.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Added `docs/codex-handoff/SOURCE_NEW_EVENT_EXECUTION_PLAN_2026-08-15.md`.
- Updated `docs/backlog/tracks/04-source-commercial/BACKLOG.md` with active execution control.
- Added an Apex non-human automation identity to `src/lib/auth/agent-client-logins.ts`.
- Updated `scripts/qa/atlas-prod-comprehensive-surface.ts` to resolve Atlas gauntlet users from `AGENT_CLIENT_LOGINS` and install the Clerk testing-token interceptor before ticket sign-in.
- Extended `scripts/smoke/p21-post-deploy-crawl.spec.ts` to guard against reverting the gauntlet to legacy human emails.

## QA / Validation

- PASS: `NODE_PATH=/Users/anand/Projects/nexus/node_modules PATH=/Users/anand/Projects/nexus/node_modules/.bin:$PATH tsx scripts/smoke/p21-post-deploy-crawl.spec.ts`
- PASS: `npx eslint src/lib/auth/agent-client-logins.ts scripts/qa/atlas-prod-comprehensive-surface.ts scripts/smoke/p21-post-deploy-crawl.spec.ts`
- PASS: `git diff --check`
- PASS: `npm run release:check`
- PR checks passed before merge.

## Rollout Plan

Open a pull request, merge through the protected PR lane after validation, and deploy through the repo-owned Azure Container Apps main workflow. Then rerun the Atlas gauntlet. If agent accounts are missing or banned, run the existing Clerk-only agent reconciler from a secret-bearing operator environment.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge.
- Shared runtime mutators: None in this release.
- Approved image digest: Produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not changed by this release.
- Feature/env flag update path: None.
- Live signed-in proof required: Required. The Atlas production CXO gauntlet must reach tenant sessions and record nonzero turns before CXO answer quality is considered evaluated.

## Rollback Plan

Revert the PR. The rollback returns the Atlas gauntlet to its previous user roster and removes the new planning doc/backlog control block.

## Audit Evidence

- PR: merged as part of the proof/backlog control sequence.
- Local validation: recorded above.
- Follow-up deploy proof: `31891161508` for the proof-scope response-shape SHA.
- Follow-up runtime/crawl proof: `31891515211`.
- Follow-up Atlas gauntlet rerun: `31891539660`, default-scope pass.

## Known Gaps

This release does not itself provision or unban Clerk users. If the live Clerk tenant lacks the agent accounts, the controlled operator command remains required:

```bash
npx tsx scripts/provision-cxo-personas.ts --agents --clerk-only --apply
```
