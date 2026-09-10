# 2026-09-09-source-rfp-domain-neutrality — Keep Generated RFPs Domain-Safe

## Release ID

`2026-09-09-source-rfp-domain-neutrality`

## Status

`candidate`

## Plain-English Summary

Generated Source RFP packages now open with explicit vendor-facing scope and response instructions. The deterministic completion appendix no longer injects industry-specific locations, workforce volumes, compliance regimes, or award dates that were not supplied by the event evidence.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 / product generation: changes the deterministic completion of future RFP package drafts.
- Layers 1-3: no intake, adapter, canonical model, schema, or tenant-data changes.

## Client Applicability

- All clients: Yes.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Add a deterministic vendor-facing solicitation opening when the generated draft omits one.
- Replace fixed industry examples and dates with evidence-safe, domain-neutral controls.
- Add regression coverage that fails if cross-domain terms or invented planning facts return.

## QA / Validation

- PASS: focused RFP completion and documentation-quality tests.
- PASS: scoped ESLint.
- PASS: TypeScript no-emit validation.
- PASS: release and diff checks.

## Rollout Plan

Merge through a protected pull request. The repository-owned ACA main workflow builds and deploys the exact merge SHA. Newly generated RFP drafts receive the corrected completion; existing accepted finals remain unchanged until an operator deliberately replaces them.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the workflow.
- Approved image digest: Recorded by the workflow after merge.
- ACA runtime invariant: Template, traffic revision, and approved digest must match.
- Worker image invariant: Updated by the main workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, generate a non-final RFP draft or verify current generator behavior without overwriting an accepted final.

## Rollback Plan

Revert the squash merge through a new pull request and deploy through the repository-owned ACA workflow. Existing artifact bodies are not rewritten by this release.

## Audit Evidence

- Pull request, merge SHA, focused tests, lint, typecheck, release checks, ACA workflow run, and signed-in Source event proof.

## Known Gaps

Existing accepted RFP finals are intentionally not rewritten automatically; a human-approved replacement remains required.
