# 2026-07-17-moves-readiness-blueprint-alignment — Moves Readiness Blueprint Alignment

## Release ID

`2026-07-17-moves-readiness-blueprint-alignment`

## Status

`candidate`

## Plain-English Summary

Aligns the Moves evidence-readiness surface with the same healthcare/contact-center Agent Assist blueprint that the generation/context-extract path already uses. A live Meridian proof after the prior lifecycle fix showed that accepted evidence was attached correctly and pending evidence was not promoted, but the readiness API still displayed `General (default)` for a Meridian Contact Center Agent Assist Move. This change lets readiness select the discovery blueprint from the Move name, problem statement, target outcome, plain-text classification, and charter context when explicit function-pack fields are absent.

## Layer Impact

- `global-control-lane`: Strategic Moves evidence-readiness blueprint selection.
- No client data migration, production write, candidate promotion, Active Tenant Access update, Tower runtime change, or Intelligence runtime change.

## Client Applicability

- All clients: yes, for Strategic Moves readiness blueprint selection when a Move has useful classification/context but no explicit function pack key.
- Specific clients: Meridian/Healthcare Demo benefits for Contact Center Agent Assist demo flows.
- Feature flag: none.

## Changes Included

- `src/lib/programs/discovery/evidence-readiness.ts`
- `src/lib/programs/discovery/__tests__/evidence-readiness.test.ts`

## QA / Validation

- Pass: `npx jest src/lib/programs/discovery/__tests__/evidence-readiness.test.ts --runInBand`
- Pass: `npm run audit:moves-agent-assist-blueprint`
- Pass: `npm run audit:moves-evidence-lifecycle`
- Pass: `npm run audit:moves-gate-consistency`
- Pass: `npx eslint src/lib/programs/discovery/evidence-readiness.ts src/lib/programs/discovery/__tests__/evidence-readiness.test.ts`
- Pending: PR, ACA deploy, and signed-in browser proof.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow must deploy the merged SHA before the change is live on `app.abarva.ai`. After deploy, rerun the Meridian Contact Center Agent Assist readiness proof and confirm the readiness API/UI no longer displays `General (default)` for the Agent Assist Move.

## Deployment Authority

- Repo-owned ACA main deploy workflow: required.
- Shared runtime mutators: none in this PR.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required.

## Audit Evidence

- Pre-fix live proof: `/Users/anand/Projects/nexus/proof/moves-evidence-lifecycle-gate-live-postfix-2026-07-17T05-15-28-804Z`
- PR URL: pending.

## Known Gaps

- This change does not finish generated-document quality proof. It only aligns evidence-readiness blueprint selection with the already-correct context-extract blueprint posture.
