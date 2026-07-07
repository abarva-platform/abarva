# 2026-06-21-skyharbor-irops-honest-deliverable-repair — Honest Deliverable Repair

## Release ID

`2026-06-21-skyharbor-irops-honest-deliverable-repair`

## Status

`candidate`

## Plain-English Summary

Repairs the Moves deliverable-generation path so number-heavy artifacts do not invent or overstate unsupported numbers, dates, dollar values, percentages, timelines, ROI, NPV, or payback. When finance-grade evidence is absent, generation now downgrades the artifact into an honest client-ready form, such as a Business Case Readiness Memo or Financial Model Input Register, and consolidates missing inputs into one Open Inputs Required table.

## Layer Impact

- `global-control-lane`: Changes shared deliverable orchestration, prompt discipline, quality-contract input mapping, and registry routing for all tenants using governed Moves deliverable generation.
- `client-data-lane`: No schema or data mutation. SkyHarbor IROPS is the live validation tenant only.

## Client Applicability

- All clients: Applies to governed Moves deliverable generation.
- Specific clients: SkyHarbor Air is the repair/proof target.
- Internal only: None.
- Public/demo only: None.
- Feature flag: Existing `deliverable_quality_contract` and `deliverable_structured_exhibits` flags continue to control enforcement/rendering where configured.

## Changes Included

- Adds prompt-level honest-generation discipline for numeric/date/value claims.
- Captures unsupported figure claims before deterministic repair.
- Labels uncited figure claims as assumptions rather than scattered client-complete tags.
- Adds a single Open Inputs Required table for missing evidence and unsupported claims.
- Downgrades Moves Business Case and Financial Model titles into honest modes when finance-grade inputs are absent.
- Routes `value_measurement_contract` to its dedicated quality profile.
- Allows Business Case Readiness Memo titles in the business-mode gate.
- Reads exhibit `key` as well as `id` when building quality-contract inputs.

## QA / Validation

- PASS — `npx eslint src/lib/deliverables/orchestrator/section-generation.ts src/lib/deliverables/orchestrator/orchestrator.ts src/lib/deliverables/orchestrator/prompt-builder.ts src/lib/deliverables/quality/transformation-gates.ts src/lib/deliverables/quality/deliverable-key-map.ts src/lib/programs/orchestrated-deliverable-map.ts src/lib/programs/__tests__/orchestrated-deliverable-map.test.ts`
- PASS — `npx jest src/lib/deliverables/orchestrator/__tests__/section-generation.test.ts src/lib/deliverables/quality/__tests__/transformation-gates.test.ts src/lib/programs/__tests__/orchestrated-deliverable-map.test.ts --runInBand`
- PASS — `npx jest src/app/api/v1/deliverables/generate-phase/__tests__/route.test.ts src/app/api/v1/deliverables/generate/__tests__/route.test.ts src/scripts/__tests__/process-deliverable-queue.test.ts src/lib/deliverables/orchestrator/__tests__/tenant-invariant.test.ts src/lib/deliverables/orchestrator/__tests__/surface.test.ts src/lib/deliverables/orchestrator/__tests__/persistence-quality.test.ts --runInBand`
- PASS — `git diff --check`

## Rollout Plan

Merge the repair PR, build a new Azure Container Apps image from the merge SHA, update the web app and deliverable worker jobs to the same image, then regenerate the five blocked SkyHarbor IROPS deliverables and verify `generated_artifacts.quarantined = false`.

## Deployment Authority

- Repo-owned deploy workflow: Manual ACR build and ACA update for the lab environment.
- Shared runtime mutators: Web app and deliverable worker jobs.
- Approved image digest: To be recorded after build.
- ACA runtime invariant: Web and workers must run the same image tag.
- Worker image invariant: `job-abarva-deliv-worker` and `job-abarva-deliv-worker-event` updated before live regeneration.
- Feature/env flag update path: No new flags.
- Live signed-in proof required: Yes, SkyHarbor IROPS move artifacts and browser/API state.

## Rollback Plan

Rollback ACA web and worker jobs to the previously deployed image tag. No database migrations or destructive data changes are included.

## Audit Evidence

- Pull request and commit for this repair.
- Focused unit test output.
- Broader deliverable route/worker test output.
- ACR image digest and ACA revision after deployment.
- SkyHarbor IROPS regenerate receipts for the five repaired deliverables.

## Known Gaps

The existing duplicate Jest manual mock warnings are repo noise and do not fail the focused suites. The unrelated `governance-evaluate-gates.test.ts` mock-missing-`.in()` issue remains out of scope.
