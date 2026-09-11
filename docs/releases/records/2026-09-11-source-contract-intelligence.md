# 2026-09-11 — Source Contract Intelligence Boundary

## Release ID

`2026-09-11-source-contract-intelligence`

## Status

`candidate`

## Plain-English Summary

Adds a governed contract-intelligence record that explains what an agreement buys, what it covers, which evidence sources support it, how it maps to an archetype, and which documented negotiation levers follow from those facts. The record is designed for Source tabs and client-ready Optimize reports, with business-language labels instead of unexplained ratios or filler counts.

The loader now consumes structured negotiation findings and lever rows instead of dropping them at the projection boundary. It also refuses malformed CSV rows before they can shift owner, timing, or risk fields into the wrong columns.

## Layer Impact

- **Release lanes:** `global-control-lane` for reusable adapter/model/prompt behavior; `client-data-lane` for any future governed package load.
- **Layer 2 — Source adapters:** adds named adapter outputs and quality-gate coverage for negotiation findings and negotiation levers.
- **Layer 3 — Canonical model:** adds deterministic contract anatomy, evidence lanes, findings, levers, derived insights, provenance, and executive readout shapes.
- **Layer 4 — Products:** adds a prompt contract for Source contract optimization so Claude receives the evidence rules before generation.

## Client Applicability

- All clients: model and prompt code is reusable, but no client receives the new record until its governed package passes the data quality gate.
- Specific clients: none activated by this candidate.
- Internal only: local package projection and tests.
- Public/demo only: no separate demo path.
- Feature flag: none.

## Changes Included

- Contract-depth projection and adapter extensions for structured findings and levers.
- New contract-intelligence types, deterministic builder, anatomy relationships, executive readout, and prompt contract.
- Claude Design handoff now includes the complete record shape, tab binding rules, anatomy rendering rules, and the 8,192-token response requirement.
- Cohort audit records which managed-services packages pass the dense-page gate and keeps the separate cloud-consumption packages out of the pass count until their adapter mapping is reconciled.
- Source Optimize prompt directive expanded with evidence, benchmark, amount-state, anatomy, and output rules.
- Package projection script now writes the contract-intelligence extract and readout and rejects malformed CSV rows.

## QA / Validation

- `adapter.test.ts`, `projection.test.ts`, and `contract-intelligence/prompt.test.ts`: **5 tests passed**.
- TypeScript project check with `tsc --noEmit`: **passed**.
- Selected source-package projection: **correctly blocked**. The source package contains malformed negotiation CSV rows and has document inventory without page-text rows; no clean extract is approved from that package.
- Dense package projections also passed for the tracked managed-services cohort: each of the three companion packages carries page text, scope, clauses, twelve spend periods, invoices, performance, workload volume, change orders, and optimization rows. The five-contract bundle projects the intelligence records but its adapter gate remains blocked for the two managed-services rows that lack resource, invoice-detail, batch-volume, and QBR lanes.

## Rollout Plan

Merge through the protected pull-request path. After review, run the governed ACA data-build job with a corrected package, validate the adapter/projection quality gates, reconcile Layer 2/3/4 outputs, and only then bind the new read model to the Source tabs.

No Azure data mutation or production deployment is included in this candidate.

## Deployment Authority

- Repo-owned deploy workflow: not applicable to this local candidate.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: required for the later data-build rollout.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after the governed data-build and product binding are approved.

## Rollback Plan

Do not run the data-build job until the package quality gate passes. If the candidate is merged and causes a product regression, revert the read-model binding while preserving the canonical source rows; do not delete governed evidence. A later Azure data-build rollback must use the operator job's run-id and proof-bundle contract.

## Audit Evidence

- Adapter and projection unit-test output.
- TypeScript check output.
- Local package projection failure showing the malformed source-row gate.
- Extract and readout from an approved governed package that passes all gates.

## Known Gaps

- The current package needs corrected CSV quoting before negotiation fields can be loaded safely.
- The current package has document inventory but no searchable page-text rows; document-backed executive claims remain blocked until page text is loaded and cited.
- Azure refresh, Layer 3 persistence, Source UI binding, signed-in smoke, and deployment are out of scope for this candidate.
- Industry benchmark intelligence remains a separate governed source; no external market rate is inferred.
