# 2026-09-23-home-evidence-provenance-language — Home Evidence Provenance Language

## Release ID

`2026-09-23-home-evidence-provenance-language`

## Status

`candidate`

## Plain-English Summary

Home now presents incomplete evidence mapping as an executive-readable evidence state instead of surfacing internal rendering and citation-resolution language. Claims, evidence cards, page-shape summaries, and unsupported evidence views still show gaps, but the labels are framed for a buyer or operator reading the walkthrough.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: updates Home v4 and Home preview presentation labels only. The deterministic evidence state remains visible and fail-closed.
- Canonical model: no schema, tenant data, or governed record mutation.

## Client Applicability

- All clients: yes, wherever Home v4 or Home preview evidence cards render.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Home routing only; no new flag.

## Changes Included

- Evidence sidenotes now say when source mapping is pending instead of reporting unresolved citation mechanics.
- Evidence inspection cards use reader-facing labels such as governed records and leadership interviews.
- Unsupported table/view gaps now render as pending evidence views, while keeping the missing view details visible.
- Page-shape summaries use the same executive-readable pending-evidence wording.
- Regression tests pin the new visible language and the continued visibility of evidence gaps.

## QA / Validation

- `npm test -- --runTestsByPath src/components/home/v4/__tests__/every-surface.test.tsx src/components/home/v4/__tests__/visual-impact.test.tsx src/components/home/preview/__tests__/ClaimCard.test.tsx src/components/home/preview/__tests__/evidence-resolver.test.ts` passed.

## Rollout Plan

Merge to main through a pull request. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting image to the shared Product/Lab web runtime.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: resolved by the deploy workflow after merge.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: required by the deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Home route proof after deployment.

## Rollback Plan

Revert the merge commit and run the repo-owned ACA main deploy workflow again. No data rollback or migration rollback is required.

## Audit Evidence

- Pull request URL, CI runs, merge commit SHA, ACA deploy workflow run, and signed-in Home proof will be attached when the candidate is merged and deployed.

## Known Gaps

This release does not repair underlying evidence mappings, generate new governed data, add cross-family findings, change aVa behavior, or implement full walkthrough export.
