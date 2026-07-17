# 2026-07-17-meridian-interview-insight-projection — Meridian Interview Insight Graph and Moves Context Artifacts

## Release ID

`2026-07-17-meridian-interview-insight-projection`

## Status

`candidate`

## Plain-English Summary

This release projects Meridian executive interview rows into governed, reviewable derived artifacts. Interview facts now support graph edges, Home context summaries, and a Moves readiness context view so leadership interview evidence can shape gates, gaps, priorities, and candidate move opportunities without creating funding, realized value, or approved program status.

## Layer Impact

- `client-data-lane`: adds Meridian-only row-level interview insight artifacts and explicit relationship graph edges sourced from Meridian V3 interview rows.
- `client-data-lane`: extends Meridian Home context artifacts with stakeholder signals and interview-supported gaps, and creates a Moves context artifact for candidate opportunities and readiness gates.
- Runtime layer: no change. These artifacts are not loaded to Azure/Postgres, Active Tenant Access, or live module runtime.

## Client Applicability

- All clients: No.
- Specific clients: Meridian Health synthetic/demo tenant artifacts only.
- Internal only: Yes, for artifact review and reload planning.
- Public/demo only: No live demo behavior changes.
- Feature flag: None.

## Changes Included

- Extends `scripts/tenant-v3/build-meridian-v3-derived-layer.mjs` to generate row-level interview insights, interview graph edges, Home interview summaries, and `moves-context-view.json`.
- Extends `scripts/tenant-v3/audit-meridian-v3-derived-layer.mjs` with interview insight, graph edge, and Moves context validation.
- Adds package scripts for scoped interview/Moves audits.
- Adds proof artifacts under `reports/meridian-interview-insight-projection/`.

## QA / Validation

- Pass: `npm run generate:meridian-v3-derived-layer`
- Pass: `npm run audit:meridian-interview-insight-projection`
- Pass: `npm run audit:meridian-moves-context-view`
- Pass: `npm run audit:meridian-interview-graph-edges`
- Pending in final PR validation: broader Meridian artifact, source packet, release, and diff checks.

## Rollout Plan

No runtime rollout. This is an artifact-only release candidate. It becomes reviewable when merged, but it does not become visible in Home, Moves, Tower, Intelligence, aVa, Azure/Postgres, or Active Tenant Access until a separate governed data-plane load, preview, promotion, and runtime wiring sequence is approved.

## Deployment Authority

- Repo-owned deploy workflow: Not applicable.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No, because this PR does not deploy or alter runtime behavior.

## Rollback Plan

Revert the PR. Because this release writes only repository artifacts, scripts, reports, and release records, rollback does not require database migration, Azure data-plane cleanup, ACA revision change, or tenant promotion rollback.

## Audit Evidence

- `datasets/tenant-inputs/meridian-health/derived/interview-insights.json`
- `datasets/tenant-inputs/meridian-health/derived/relationship-graph.json`
- `datasets/tenant-inputs/meridian-health/derived/module-context/home-context-view.json`
- `datasets/tenant-inputs/meridian-health/derived/module-context/moves-context-view.json`
- `reports/meridian-interview-insight-projection/summary.md`
- `reports/meridian-interview-insight-projection/proof.html`
- Scoped audit JSON/MD files under `reports/meridian-v3-derived-and-claude-layer/`

## Known Gaps

- Not loaded into Azure/Postgres.
- Not indexed or retrievable by live aVa/Intelligence.
- Not promoted to Active Tenant Access.
- Not wired to live Home or Moves runtime.
- Does not create approved funding, realized value, or funded program status.
