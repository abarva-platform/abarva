# 2026-08-30-home-ecl-criticality-normalization — Home ECL Display Normalization

## Release ID

`2026-08-30-home-ecl-criticality-normalization`

## Status

`candidate`

## Plain-English Summary

Home's ECL-backed record browser, architecture map, and data-flow view now normalize source values before they reach visible executive surfaces. Criticality variants such as `tier-1` and `tier 1` compute as tier-one, and data-flow endpoints prefer governed application/platform refs instead of source-extract provenance labels.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Home display logic now uses normalized criticality values for record-browser metrics and architecture-slice metrics, and resolves data-flow endpoints through the Home technology-estate projection before rendering them.
- Layer 3 Canonical Model: No canonical schema, data, or serving-view mutation.

## Client Applicability

- All clients: Home ECL preview and default Home pages that read ECL projection rows.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Normalizes criticality values in the Home ECL projection bundle before creating Home technology-estate rows.
- Normalizes visible tier-one metrics in the Home record browser and architecture map.
- Resolves data-flow source and target endpoints from application/platform references before falling back to raw payload labels.
- Adds regression coverage for ECL payload normalization, visible record-browser tier-one metrics, and data-flow endpoint provenance handling.

## QA / Validation

- `npx jest src/lib/home/preview/__tests__/ecl-projection-bundle.test.ts src/components/home/v4/__tests__/RecordBrowser.criticality.test.tsx src/components/home/v4/__tests__/ArchitecturePage.grain.test.tsx --runInBand` passed.
- `git diff --check` passed.

## Rollout Plan

Merge through pull request, then deploy through the repo-owned Azure Container Apps main deploy workflow. No data-build job or migration is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for live web rollout.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: To be produced by the deploy workflow.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Required by the deploy workflow.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, Home Application Register and Architecture Map should show non-zero tier-one counts when source rows contain tier-one values; the Home data-flow view should not collapse source systems to a single source-extract label.

## Rollback Plan

Revert the pull request and redeploy the previous digest-pinned image through the repo-owned ACA workflow.

## Audit Evidence

- Pull request, CI output, deploy workflow run, and signed-in Home browser screenshots.

## Known Gaps

This change fixes criticality count normalization and data-flow endpoint resolution only. It does not redesign the Home executive story, architecture attribution, full data-flow domain enrichment, or source-evidence depth.
