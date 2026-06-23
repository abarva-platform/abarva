# 2026-06-23-brain-contract-visual-source-selection — Structured Visual Source Selection

## Release ID

`2026-06-23-brain-contract-visual-source-selection`

## Status

`candidate`

## Plain-English Summary

Ask Ava already knows how to render typed tables, charts, and graphs when it receives cited structured rows. The deployed #3897 crawl proved tables improved, but chart and graph questions still often missed the structured source rows and therefore had nothing truthful to draw. This release expands the canonical tenant structured-fact retriever so visual questions about applications, vendors, initiatives, value at stake, and dependencies retrieve the existing Postgres-backed rows automatically. It also adds an application-count-by-function aggregate for chart-by-domain questions.

## Layer Impact

- `global-control-lane`: changes the shared Ask Ava retrieval path for all clients and all surfaces that consume the shared Intelligence answer engine.
- `client-data-lane`: reads existing tenant-scoped Postgres rows from `applications`, `vendor_contracts`, and `ai_initiatives`; no schema or data migration is included.

## Client Applicability

- All clients: yes, any tenant with these structured rows can benefit.
- Specific clients: not tenant-specific.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag; this improves the existing shared engine path.

## Changes Included

- `src/lib/knowledge/tenant-enterprise-context.ts`
  - broadens visual/dependency source-selection rules for application, vendor, initiative, and value-at-stake questions.
  - adds deterministic application-count-by-function structured facts with chart hints.
- `src/lib/knowledge/__tests__/tenant-enterprise-context.test.ts`
  - adds regression tests for chart-by-domain, AI-spend/value-at-stake, and dependency-graph source retrieval.
- `docs/build/BRAIN_CONTRACT_PROGRESS.md`
  - records the deployed #3897 deep-crawl result and this candidate step.

## QA / Validation

- `npx jest src/lib/knowledge/__tests__/tenant-enterprise-context.test.ts src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts --runInBand`
  - passed: 2 suites, 39 tests.
- Deployed baseline measured before this release:
  - #3897 deployed at `497848f2`, ACA revision `ca-abarva-web-lab-eastus--m497848f2`, digest `sha256:f1b87ee1c54c12ec49145cf1db1ac261343cc37aea18b4a6d36be2b1bdcab704`.
  - signed-in tenant matrix: 5/5.
  - post-deploy crawl run `28017082298`: success, 0 P0 / 0 P1 / 0 P2, 132/132 surfaces captured.
  - deep reality crawl after #3897: `156/290`, tables `48/50`, charts `3/50`, graphs `1/40`, report at `out/reality-crawl-497848f2/report.html`.

## Rollout Plan

Merge to `main`; repo-owned Azure Container Apps deploy builds and promotes the new image. After deployment, run the signed-in tenant matrix and the full `reality-crawl.mjs` + `reality-crawl-report.mjs` on the deployed app.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none outside the repo deploy workflow.
- Approved image digest: to be captured after deploy.
- ACA runtime invariant: template image, active revision image, and 100% traffic revision must match.
- Worker image invariant: not changed.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, all five tenants plus deep reality crawl.

## Rollback Plan

Revert this PR and let the repo-owned deploy workflow promote the previous image. No data rollback is required.

## Audit Evidence

- PR: pending.
- Targeted tests: see QA / Validation.
- Deployed proof required before marking the progress tracker green: tenant matrix, ACA digest, reality-crawl summary, and HTML report.

## Known Gaps

This release improves retrieval of structured rows for visual questions, but it does not add new tenant data where the source tables genuinely lack run/change budget, detailed integration lineage, or multi-series chart data. The deep crawl must prove the actual lift before the visual invariant can move from 🟡 to 🟩.
