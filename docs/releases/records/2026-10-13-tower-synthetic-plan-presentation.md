# Tower synthetic plan presentation

## Release ID

`2026-10-13-tower-synthetic-plan-presentation`

## Status

`candidate`

## Plain-English Summary

Tower can explain a source-stated synthetic AI plan case by case: proposed funding, expected yearly benefit, projected ROI, tool adoption, and the separate Finance proof gate. An older projection remains readable through its declared build identity. Newer projections must explicitly label the source plan basis. No planning amount becomes approved funding, achieved savings, or a cleared portfolio total because it appears in this view.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4: the Tower reader carries source-stated planning fields through a separate presentation channel. The six Tower tabs and their subviews present case plans, linked project spend, tool adoption, and proof needs in plain language. Tool views flag inconsistent usage counts.
- Layers 1–3: no change in this release.

## Client Applicability

- All clients: the presentation rules apply to any served Tower projection with the declared plan marker.
- Specific clients: none named in this public record.
- Internal only: no.
- Public/demo only: older synthetic planning projections can use the compatibility path; no new data is loaded by this change.
- Feature flag: none.

## Changes Included

- Preserve historic synthetic case plans from the versioned Tower serving projection only when its build identity and source references are present.
- Read newer synthetic plans only with the explicit `source_plan_basis` marker and source references.
- Keep those plan fields separate from independently approved funding and Finance-cleared value.
- Show case-level plans and ROI ranges without publishing an unreconciled portfolio money total.
- Show source-stated project spend on linked cases. Show a distinct-project FY26 total only when every case has a unique project ID, a common project-source date and file, a valid project reference, and a nonnegative amount.
- Replace unsupported aggregate charts with case-level plans and proof questions across the Tower tabs when a synthetic plan is served.
- Withhold a tool adoption rate when active users exceed enabled users in the same source row.

## QA / Validation

- Focused Tower reader, view-model, financial story, and panel Jest tests: 117 passed.
- ESLint on all changed source and test files: passed.
- TypeScript `tsc --noEmit`: passed with an 8 GB heap.
- Signed-in runtime and served-data checks: pending deployment and any separately governed data decision.

## Rollout Plan

Review and merge through a protected PR. The repository-owned ACA main deployment workflow is the only path to the shared web runtime. This code makes no selector change. Any data-stage or serving decision is a separate governed operation with its own exact assessment and proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none from this change.
- Approved image digest: assigned by the main workflow after merge.
- ACA runtime invariant: verify template, traffic revision, and required worker image digests after deployment.
- Worker image invariant: no worker job change in this release.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, across all six tabs and their subviews.

## Rollback Plan

Revert this presentation commit through a protected PR and the repository-owned ACA main deploy workflow. It does not alter tenant data, the active assessment selector, or schema.

## Audit Evidence

Inspect the PR diff, focused test results, release check, deployment digest parity, and signed-in page readback when available. No runtime proof is claimed in this candidate record.

## Known Gaps

Source-stated plan figures remain synthetic estimates. Overall budget, combined AI funding, combined benefit, Finance-cleared result, and tool license spend require independent source reconciliation and governed readback before Tower can state them as facts. The conditional FY26 project spend total is a single synthetic source measure through its recorded source date, not a current spend figure or a tool bill. A historic synthetic source package cannot be reloaded through this presentation release.
