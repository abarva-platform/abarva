# 2026-09-08-source-event-structured-evidence-generation — Bind Structured Evidence to Artifact Generation

## Release ID

`2026-09-08-source-event-structured-evidence-generation`

## Status

`candidate`

## Plain-English Summary

Source artifact generation now reads the structured contract evidence already loaded for the active sourcing event. Application inventories and ITSM/SLA histories are supplied to the relevant Scope drafts as exact governed rows. When those rows are absent, generation is instructed to identify the gap instead of inventing a representative baseline.

## Layer Impact

- `client-data-lane`: Layer 2 Source adapters accept event-scoped application inventory rows alongside the existing commercial and operational evidence families.
- `global-control-lane`: Layer 4 Source binds tenant- and event-scoped structured evidence to Application Inventory and Ticket History artifact generation.

## Client Applicability

- All clients: Yes; behavior activates only when an event has structured contract evidence.
- Specific clients: None named in the public release record.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Extend the structured contract evidence family dictionary with application inventory.
- Add a read-only accepted-row query for artifact-generation context.
- Add deterministic prompt formatting for application, ticket, and SLA rows.
- Correct SLA miss direction handling and derive unclaimed service credits only from explicit credit fields.
- Remove prompt language that allowed plausible invented baselines.
- Add an approver-only review action that promotes a Scope evidence requirement only when an accepted same-tenant, same-event manifest contains accepted rows for the mapped evidence family.
- Restore the three physical structured-evidence tables when a historical migration ledger entry exists without the corresponding relations, and make Azure schema verification fail if they are absent.
- Add a digest-pinned ACA operator job that loads an immutable, reconciled event-evidence payload and emits row-family, metric, idempotency, and quality-gate proof.

## QA / Validation

- Focused contract-evidence persistence and read-model tests: PASS.
- Focused structured-evidence prompt-format tests: PASS.
- Agent-generation context-binder tests: PASS.
- Scoped ESLint: PASS.
- TypeScript no-emit check: PASS.

## Rollout Plan

Merge through a protected pull request. The repo-owned ACA main deploy workflow builds and deploys the exact merge SHA. After deployment, import the approved synthetic evidence pack through the tenant-fenced event route, regenerate the affected Scope artifacts, and verify the exact application and operational totals before approval.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Captured after deploy.
- ACA runtime invariant: Web template, active traffic revision, and required workers must match the approved digest.
- Worker image invariant: Required before live-proof status.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the pull request and redeploy the prior digest. Previously persisted evidence rows remain valid and visible to existing read paths; the rollback only removes the new generation binding and application-inventory import family.

## Audit Evidence

- Pull request, merge SHA, deploy workflow run, image digest, runtime invariant output, structured-evidence import response, regenerated artifact receipts, and signed-in stage proof.

## Known Gaps

- Stage approval remains blocked until regenerated artifacts are reviewed against the imported evidence and the required evidence states are explicitly promoted through the governed review path.
