# 2026-06-03-client-paper-review-playbook - Client Paper Review Playbook

## Release ID

`2026-06-03-client-paper-review-playbook`

## Status

`candidate`

## Plain-English Summary

Adds a counsel-review draft playbook for reviewing client-provided NDA, MSA,
and SOW paper. The playbook maps directly to backlog rows T019, T020, and T021
and gives AbarVa a repeatable issue-log process before signing pilot or
production agreements.

## Layer Impact

`internal-admin`: adds a legal operations artifact and verifier script for
AbarVa operators and counsel coordination.

`contract-legal-readiness`: clarifies NDA, MSA, and SOW redline workflow,
escalation triggers, evidence packet, and status rules. No runtime behavior,
database schema, product UI, or client data-plane behavior changes.

## Client Applicability

- All clients: future client negotiations can use the same draft intake
  process.
- Specific clients: none.
- Internal only: the artifact is internal and counsel-review only.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `docs/legal/client-paper-review-playbook.md`
- `docs/legal/contract-redline-brief.md`
- `scripts/legal/verify-client-paper-playbook.mjs`
- `package.json`
- `docs/releases/records/2026-06-03-client-paper-review-playbook.md`

## QA / Validation

- Pass: `npm run legal:client-paper:verify`
- Pass: `node --check scripts/legal/verify-client-paper-playbook.mjs`
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main` through the protected PR path. The playbook becomes available
for AbarVa internal legal intake and counsel review. It should not be sent to a
client or used as final legal advice without lawyer approval.

## Rollback Plan

Revert the PR to remove the playbook, verifier, package script, and release
record. No migration, runtime, deployment, or data rollback is required.

## Audit Evidence

- PR URL after opening.
- Local validation output listed in this release record and PR.
- Tracker update for T019, T020, and T021 after PR evidence exists.

## Known Gaps

- Not lawyer-approved final contract language.
- Does not mark T019, T020, or T021 Done; they remain In progress until counsel
  reviews actual client paper or pre-approves reusable positions.
- Does not close T016 lawyer pre-blessing.
