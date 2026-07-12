# 2026-07-12-moves-shadow-proof - Moves End-to-End Shadow Proof

## Release ID

`2026-07-12-moves-shadow-proof`

## Status

`candidate`

## Plain-English Summary

Adds a non-destructive Moves shadow proof for SkyHarbor. The proof shows how an
inactive candidate tenant data version can generate a governed P0 through P5
Moves execution preview, including phase readiness, gate criteria drafts,
deliverable previews, Module Memory preview records, evidence trace, and Tower
handoff preview.

This is proof/report work only. It does not write production tenant data,
advance a live Move, auto-approve a gate, write Moves tables, write Outcome
Ledger tables, update active tenant access, promote a candidate, change module
runtime behavior, make modules read candidate data by default, or claim realized
value.

## Layer Impact

- Release lane: `global-control-lane`.
- Candidate runway: reads existing SkyHarbor candidate proof artifacts.
- Moves: shadow proof only; no runtime route, UI, approval, or phase-state
  behavior changes.
- Module Memory: preview records only; no runtime memory writes.
- Tower / Outcome Ledger: handoff preview only; no physical ledger writes.
- Active Tenant Access Layer: no change.

## Client Applicability

- Receives the change: all clients receive the new audit/report capability in
  code, but no client runtime behavior changes.
- SkyHarbor: reference tenant for the first Moves shadow proof artifacts.
- Other tenants: no runtime impact and no candidate data consumption. Future
  tenants can reuse the same proof pattern after candidate packets and mappings
  exist.

## Changes Included

- Adds `npm run audit:moves-shadow-proof`.
- Adds a typed Moves shadow proof builder and CLI.
- Generates JSON, Markdown, HTML, CSV, Module Memory, Tower handoff, and
  evidence-trace reports.
- Adds architecture documentation for the Moves shadow proof boundary.

## QA / Validation

Current local status:

- Pass: `npm run audit:moves-shadow-proof`
- Pass: `npm run audit:candidate-module-workbench-preview`
- Pass: `npm run audit:module-readiness-proof`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run audit:architecture-rules`
- Pass: isolated TypeScript compile for changed enterprise-data files
- Pass: `git diff --check`
- Pass: `npm run release:check`

## Rollout Plan

Merge through a PR. The normal ACA main deploy workflow may ship the audit code
and reports, but no product runtime path reads candidate data by default.

## Deployment Authority

- Repo-owned deploy workflow: required for shared runtime deploy.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by ACA main deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not changed.
- Feature/env flag update path: none.
- Live signed-in proof required: post-deploy crawl after merge/deploy.

## Rollback Plan

Revert the PR. Because the change writes no production tenant data, updates no
active runtime pointer, and changes no Moves runtime behavior, rollback requires
no data cleanup.

## Audit Evidence

- PR URL after open.
- Local validation output.
- Generated reports under `reports/moves-shadow-proof/skyharbor/`.
- ACA deploy and post-deploy crawl evidence after merge.

## Known Gaps

Candidate readiness control panel, explicit candidate preview mode, and
operator promotion workflow remain separate follow-on milestones.
