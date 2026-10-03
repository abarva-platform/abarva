# 2026-10-01 Source Shortlist Candidate Draft

## Release ID

`2026-10-01-source-shortlist-candidate-draft`

## Status

`candidate`

## Plain-English Summary

The internal vendor-shortlist draft now starts from the event's explicitly accepted candidate panel. It carries canonical supplier IDs and the event acceptance references, while marking invitation, qualification, exclusions, and release as unapproved or unverified. Candidate identities are not sent to a model for this draft.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3: reads existing canonical supplier identity and event-scoped candidate authority; no canonical fact is changed.
- Layer 4: Source internal draft generation and rendered draft only. No Client Final, approval, supplier contact, or release behavior changes.

## Client Applicability

- All clients: yes, for the internal vendor-shortlist draft action.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Deterministic candidate-panel review draft with source IDs and evidence references.
- D12 generation route uses that draft after existing tenancy, candidate, upstream, and artifact checks.
- No schema, migration, loader, canonical write, model egress of supplier identity, or external action.

## QA / Validation

- PASS: red-first tests reproduced absent identity, evidence, pending-decision text, and table escaping.
- PASS: route-level regression failed before wiring the draft helper.
- PASS: removing the route's source-bound helper call failed the route regression; restoring it passed.
- PASS: seven focused/adjacent suites, 113 tests; TypeScript, scoped ESLint, and release check.
- PENDING: CI, deployment, and signed-in replay.

## Rollout Plan

Squash merge through protected main after applicable checks. Only the repo-owned ACA main workflow may deploy the digest-pinned image. No data job or feature flag is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: verify after deployment.
- ACA runtime invariant: verify web template, sole 100%-traffic revision, and both worker job images against the workflow digest.
- Live signed-in proof required: verify the current no-candidate action still refuses without a draft; a positive generated draft requires a separately accepted candidate panel and is not inferred from tests alone.

## Rollback Plan

Revert the squash commit through a PR and let the repo-owned main workflow redeploy. No data rollback is needed.

## Audit Evidence

Red/green tests, removal mutation, PR checks, official ACA run, digest readback, and signed-in negative-path replay.

## Known Gaps

Candidate-panel acceptance is not a shortlist or invitation decision. The draft does not establish coverage fit, NDA coverage, legal approval, Client Final, or RFx release. The positive live path cannot be accepted without event-scoped candidates.
