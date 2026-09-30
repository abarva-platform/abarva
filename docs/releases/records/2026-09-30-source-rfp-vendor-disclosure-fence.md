# 2026-09-30-source-rfp-vendor-disclosure-fence — Vendor Package Disclosure Check

## Release ID

`2026-09-30-source-rfp-vendor-disclosure-fence`

## Status

`candidate`

## Plain-English Summary

RFP drafting no longer automatically appends buyer-only negotiation material or sends the strategy value brief to the vendor-package generator. A draft with recognizable disclosure violations now fails its quality receipt after final text assembly. The RFP Client Final upload refuses the same content before storing the file.

## Layer Impact

- `global-control-lane`, Layer 4 Products: Source RFP drafting and final-artifact admission only. No canonical facts or source adapters change.

## Client Applicability

- All clients: Yes, for Source events using the D09 RFP package.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- D09 map-reduce instructions and completion helper.
- D09 disclosure detector, generated-draft quality receipt, and Client Final upload boundary.
- Focused generator, detector, and route behavior tests.
- No migration or data build.

## QA / Validation

- Red-first detector tests for private value, workflow, negotiation, evaluation, timing, and release-control content; clean vendor pricing control passes.
- Measured upload path: with the admission check deliberately disabled, the same unsafe D09 Client Final request returned `200` and reached the storage path; with the check restored, it returned `422` with zero blob, registry, or body writes.
- Generated-draft receipt: a previously passing model receipt becomes failed on the final assembled D09 text; removing the route call fails its AST wiring control.
- Source agent-generation and export suites: 41 suites, 477 tests passed. Adjacent generation and Client Final route suites: 3 suites, 17 tests passed.
- `npx tsc --noEmit` and scoped ESLint passed.
- CI and signed-in post-deploy replay: pending.

## Rollout Plan

Squash-merge the reviewed PR to main. Only the repo-owned ACA main workflow builds and deploys the new digest. Check the template, 100% traffic revision, and required worker images, then replay D09 drafting and Client Final admission signed in.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: main workflow only.
- Approved image digest: pending main deployment.
- ACA runtime invariant: pending main deployment.
- Worker image invariant: pending main deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, D09 draft and final-admission replay.

## Rollback Plan

Revert this PR through a new reviewed PR and deploy through the main workflow. Do not restore an unsafe vendor package to external-release eligibility. Existing AI drafts remain drafts and require a separately reviewed final.

## Audit Evidence

- PR, applicable CI, deploy run, immutable digest readback, and signed-in replay to be linked after release.
- Local focused test output and route mutation result are recorded in the PR.

## Known Gaps

- Pattern detection is a backstop for known disclosure mechanisms, not a complete fact-lineage or supplier-isolation proof. A frozen audience-scoped packet and rendered-file release check remain necessary before external issue.
- This change does not approve a legal template, scoring weights, release calendar, recipient list, or supplier contact.
