# 2026-07-30-source-operational-demo-control-package - Source Operational Demo Control Package

## Release ID

`2026-07-30-source-operational-demo-control-package`

## Status

`candidate`

## Plain-English Summary

Adds a governed, lab-only Source operational demo package plus Source-local provider, assembler, validation, and loader dry-run support. The package is synthetic workflow state for Source testing and is not a canonical Knowledge publication or production activation.

## Layer Impact

- Release lane: `public-demo` for the synthetic demo package and `internal-admin` for the operator loader/dry-run proof path.
- CLIENT INTAKE: No change to client intake ownership or canonical tenant inputs.
- SOURCE ADAPTERS: Adds an operator script that can map the approved Source operational release into existing Source operational tables when run through the governed lab path.
- CANONICAL MODEL: No canonical Knowledge promotion, new baseline, review-decision application, or publication.
- PRODUCTS: Adds a Source-local provider and view-model assembler for the operational demo surface.

## Client Applicability

- All clients: No.
- Specific clients: No live-client applicability.
- Internal only: Yes, operator proof and dry-run artifacts.
- Public/demo only: Synthetic lab-only Source operational demo package.
- Feature flag: None in this candidate.

## Changes Included

- New deterministic Source operational release generator.
- New release package and runtime fixture for `airline-demo-new-source-operational-demo-v1.0.0`.
- New file-backed `SourceOperationalProvider`.
- New `SourceViewModelAssembler` for a shell-compatible Source proof view model.
- New loader script with `--dry-run` default and explicit `--apply` mode for governed lab execution.
- Focused provider/assembler tests.

## QA / Validation

- `node scripts/source/generate-airline-source-operational-demo.mjs`: pass.
- `npx tsx scripts/source/load-airline-source-operational-demo.ts --dry-run`: pass.
- `npx tsx scripts/source/load-airline-source-operational-demo.ts --dry-run --release-dir scripts/source/fixtures/airline-demo-new-source-operational-demo-v1.0.0 --proof-dir reports/source-operational-demo/airline-demo-new-source-operational-demo-v1.0.0-fixture`: pass.
- `npx jest src/lib/source/operational/__tests__/source-view-model-assembler.test.ts --runInBand`: pass with pre-existing duplicate manual mock warnings.
- `npx eslint src/lib/source/operational scripts/source/generate-airline-source-operational-demo.mjs scripts/source/load-airline-source-operational-demo.ts`: pass.
- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false`: pass.

## Rollout Plan

Merge to main through PR. Build and deploy only through the repo-owned Azure Container Apps main deploy workflow if runtime or job execution is required. Run the loader only through a governed lab-only ACA Job using `--apply`; do not run local direct database mutation as proof.

## Deployment Authority

- Repo-owned deploy workflow: Required before the runtime image contains this loader and fixture.
- Shared runtime mutators: None authorized by this candidate.
- Approved image digest: To be captured after repo-owned ACA deploy.
- ACA runtime invariant: Required before claiming deployed or live proof.
- Worker image invariant: Required before running the lab-only loader job.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, after lab-only load and route/browser verification.

## Rollback Plan

Before apply, rollback is a code revert. After a lab-only apply, stop using the synthetic Source release and use a follow-up governed lab cleanup or superseding release marker; do not delete records without explicit approval.

## Audit Evidence

- Release package `SHA256SUMS`.
- Loader dry-run proof under `reports/source-operational-demo/`.
- Focused Jest, lint, and TypeScript command output.
- Future PR URL, ACA image digest, ACA job execution, readback proof, signed-in screenshots, console capture, and network capture.

## Known Gaps

- Lab-only apply has not run.
- Signed-in Source product proof has not been captured.
- Decision Brief export proof has not been captured.
- No canonical Knowledge publication, baseline activation, or production provider cutover is included.
