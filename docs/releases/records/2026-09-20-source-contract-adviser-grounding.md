# 2026-09-20-source-contract-adviser-grounding — Bind ordinary questions to governed contract facts

## Release ID

`2026-09-20-source-contract-adviser-grounding`

## Status

`candidate`

## Plain-English Summary

Source contract chat now recognizes ordinary contract questions such as what is
being purchased, what has been paid, and how much annual commitment remains
unused. Those questions stay on the governed Contract 360 answer path instead
of falling through to a generic answer path.

The response also distinguishes annual committed spend from full-term committed
value, calculates undrawn annual commitment only when both annual inputs exist,
and removes unsupported numeric confidence percentages from the client-visible
opportunity table.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Products: Source Contract 360 answer routing and presentation only.
- Layers 1-3: no intake, adapter, canonical fact, schema, migration, loader, or
  tenant-data change.

## Client Applicability

- All clients: yes, for Source Contract 360 chat.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Expand the governed Source question classifier to cover ordinary purchasing,
  invoice, payment, commitment, and support questions.
- Rehydrate annual committed spend and the corresponding undrawn annual amount
  from the tenant-scoped Contract 360 read model.
- Label annual and full-term commitment measures separately.
- Remove numeric opportunity-confidence values from client-visible answers when
  the displayed percentage has no separately rendered evidence basis.
- Add route and answer-contract behavior tests for the accepted question forms.

## QA / Validation

- Red test: five of six ordinary contract prompts bypassed the governed Source
  answer before the implementation.
- Red test: the answer omitted the distinction between annual committed spend,
  full-term committed value, and undrawn annual commitment.
- Red test: opportunity rows exposed numeric confidence values without a
  client-visible evidence basis.
- Focused validation: 4 suites, 59 tests, all passing.
- Broader Source validation, lint, TypeScript, and release checks are required
  before the pull request is ready to merge.
- No live signed-in claim is made by this candidate record.

## Rollout Plan

Squash-merge through the protected pull-request path. The repo-owned ACA main
deploy workflow builds and deploys the exact merge SHA. After the ACA runtime
invariant is proven, repeat the signed-in Contract 360 prompt set on the deployed
revision.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: pending merge and workflow output.
- ACA runtime invariant: template image, 100% traffic revision, and approved
  digest must match before deployment is reported complete.
- Worker image invariant: no worker change.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the pull request and redeploy the prior approved digest through the
repo-owned ACA workflow. No data rollback or migration reversal is required.

## Audit Evidence

- Pull-request diff and CI checks.
- Focused route and answer-contract test output.
- ACA workflow run, merge SHA, revision, and digest readback after deployment.
- Signed-in Contract 360 prompt results after deployment.

## Known Gaps

- This release does not repair page hydration latency, generic contract-purpose
  fallback text, file identity display, or contract-register/evidence identity
  reconciliation.
- A successful deploy is not signed-in acceptance; the exact prompt set must be
  repeated after deployment.
