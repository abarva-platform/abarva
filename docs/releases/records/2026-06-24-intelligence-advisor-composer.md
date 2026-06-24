# 2026-06-24-intelligence-advisor-composer — Intelligence Advisor Composer

## Release ID

`2026-06-24-intelligence-advisor-composer`

## Status

`candidate`

## Plain-English Summary

Adds a task-specific Intelligence advisor composer for the airline IROPS AI/ROI benchmark. Instead of handing Claude only a generic senior-advisor prompt, aVa now detects the IROPS ROI question pattern and supplies a case-team brief: evidence order, required expert lenses, required tables/charts, SkyHarbor applicability, ROI caveats, architecture prerequisites, and explicit failure rules. Also removes legacy agent labels from the live Intelligence prompt path so the product voice is aVa.

## Layer Impact

- `global-control-lane`: updates shared Intelligence answer composition for all clients, scoped to a narrow advisor route.
- `client-data-lane`: no schema, migration, data-load, or tenant-data mutation.

## Client Applicability

- All clients: yes, for Intelligence questions matching the airline IROPS AI/ROI route.
- Specific clients: especially SkyHarbor Air, because the benchmark question is airline-specific.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag.

## Changes Included

- `src/lib/intelligence/ask/advisor-composer.ts`
- `src/lib/intelligence/ask/synthesizer.ts`
- `src/lib/agent/module-context-contract.ts`
- `src/lib/agent-trace/*`
- `src/app/(maestro)/intelligence/ask/AvaReasoningCards.tsx`
- `src/app/api/intelligence/ask/route.ts`
- `src/app/api/source/synthesis/route.ts`
- `src/components/home/AgenticHomeEntry.tsx`
- `src/lib/design/abarva-theme.ts`
- `tests/intelligence/golden-irops-answer.test.ts`
- `docs/intelligence-redesign/GOLDEN_IROPS_ANSWER_BENCHMARK.md`
- `docs/intelligence-redesign/GOLDEN_IROPS_BEFORE_AFTER.md`

## QA / Validation

Current status before PR:

- Focused Jest for the Golden IROPS composer, aVa chat shell, telemetry, module context, and ask policy tests: pass (`57 passed` across 6 suites).
- Focused ESLint for changed TS/TSX files: pass.
- TypeScript where repo baseline permits: blocked by existing repo-wide missing type packages (`js-yaml`, `@azure-rest/ai-document-intelligence`, `@axe-core/playwright`), not by this change.
- `npm run release:check`: pass.

## Rollout Plan

Merge to `main`; Azure Container Apps main deploy publishes the change to `app.abarva.ai`. No migration or data load required.

## Deployment Authority

- Repo-owned deploy workflow: required for production.
- Shared runtime mutators: none introduced.
- Approved image digest: produced by ACA main deploy.
- ACA runtime invariant: main deploy workflow verifies template image, traffic revision, and active revision.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: run the Golden IROPS question on SkyHarbor Intelligence after deploy.

## Rollback Plan

Revert the PR and redeploy main through the ACA workflow. No database rollback required.

## Audit Evidence

PR URL, CI checks, release check output, and signed-in SkyHarbor browser proof after deploy.

## Known Gaps

This PR improves the aVa prompt packet and route-specific answer budget. It does not add public web browsing to the runtime. If public/current sources are absent from supplied sources, the composer instructs Claude to label that limitation instead of inventing examples.

Legacy boundary: this PR removes retired labels from the live Intelligence/aVa prompt, telemetry, Source prompt, and visible Home badge paths. It does not perform a repo-wide historical rename of compatibility modules such as `sentinel-reasoning`; those remain internal implementation names until a separate low-risk migration retires them.

## Follow-up Correction

After the first deployment, live browser proof showed the airline IROPS advisor
route improved the prose but still surfaced retail expert chips when the active
tenant was Apex Retail. The follow-up patch makes the advisor route expose its
own expert refs and lets the Intelligence API use those refs in the emitted
`agent-answer`, so route-specific airline questions show airline experts instead
of the active tenant's default vertical experts.

Additional validation:

- Focused Jest for Golden IROPS composer + Intelligence ask route telemetry:
  pass (`14 passed` across 2 suites).
- Focused ESLint for the changed route/composer/test files: pass.
- `npm run release:check`: pass after this release-record update.
