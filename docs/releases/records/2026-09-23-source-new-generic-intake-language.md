# 2026-09-23-source-new-generic-intake-language - Cross-domain request wording

## Release ID

`2026-09-23-source-new-generic-intake-language`

## Status

`candidate`

## Plain-English Summary

The default Source New request form now asks about the accountable sourcing
decision and scope in business-neutral terms. Its advisor context no longer
assumes every request is for technology. The five required facts, category
selection, imported-request review, and event-creation gates are unchanged.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Source presentation: request prompts, examples, and advisor context
  only. No canonical data, adapter, or intake schema changes.

## Client Applicability

- All clients: default manual Source New intake.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Generic request wording in `SourceOriginatePage` and a rendered behavior test.
- No schema, migration, loader, supplier-contact, or approval change.

## QA / Validation

- Red-first rendered intake test failed on the prior wording and passes after
  the change.
- A deliberate advisor-context mutation made that test fail; restoration passes.
- Scoped ESLint, Node 24 TypeScript, and `npm run release:check` pass.
- The broader legacy intake integration suite has pre-existing failures and is
  not represented as passing by this focused test.

## Rollout Plan

Squash merge after applicable checks pass. The repo-owned ACA main workflow
builds and deploys the resulting image; replay the signed-in default intake.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: pending deployment.
- ACA runtime invariant: pending deployment.
- Worker image invariant: pending deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: default Source New request form and advisor context.

## Rollback Plan

Revert this UI-only change through a PR and redeploy via the same repo-owned
workflow. No data rollback is needed.

## Audit Evidence

- PR, hosted CI, deployed digest, and signed-in replay to be recorded after
  each distinct gate completes.

## Known Gaps

An imported request must still be reviewed against its versioned authority
record before an event is created. This change does not complete an end-to-end
request-to-award journey.
