# 2026-07-27-airline-source-corpus-semantic-repair — Source Corpus Semantic Repair

## Release ID

`2026-07-27-airline-source-corpus-semantic-repair`

## Status

`candidate`

## Plain-English Summary

Repairs the synthetic airline source-corpus package that was previously blocked by semantic audit. The repair keeps the large enterprise scale, but replaces generator-pattern relationships with valid multi-hop operating chains, adds structured procurement evidence, expands contract commercial fields, and grows the restricted evaluator reconstruction set.

## Layer Impact

- Release lane: `client-data-lane`.

- Client intake: no client-facing workflow change.
- Source adapters: adds parser-visible structured source samples for procurement evidence families so later parser waves can test Source reconstruction without using hidden evaluator truth.
- Canonical model: strengthens source-to-truth reconstruction inputs and relationship candidates; no canonical database rows are created.
- Products: no Home, Source, Moves, Tower, Intelligence, Cube, API, UI, runtime or deployment changes.

## Client Applicability

- All clients: none.
- Specific clients: synthetic airline source-design package only.
- Internal only: review/audit package for operators and implementation reviewers.
- Public/demo only: synthetic demonstration preparation artifact.
- Feature flag: none.

## Changes Included

- Adds `scripts/knowledge/build-airline-source-corpus-repair.mjs`, a deterministic repair and audit script for the airline package.
- Regenerates airline application placement to remove broad modulo-style function distribution.
- Regenerates the relationship sample as valid multi-hop relationship candidates across capability, process, application, integration, data product, infrastructure, vendor, contract, KPI, risk, control, workforce, program, procurement lot and proposal nodes.
- Expands the contract sample with commercial, renewal, SLA, invoice, rate-card, transition and Source-event fields.
- Adds structured procurement sample files for incumbent baseline, rate cards, invoice/change-order history, SLA/incident history, vendor proposals, pricing schedules, assumptions/exceptions, formal final revisions, evaluation scorecards and transition commitments.
- Expands restricted evaluator truth and source-to-truth crosswalk rows while preserving evaluator/source separation.
- Refreshes the package manifest, review index and review ZIP.

## QA / Validation

- `node scripts/knowledge/build-airline-source-corpus-repair.mjs --write` — pass.
- `node scripts/knowledge/build-airline-source-corpus-repair.mjs` — pass.
- Independent semantic audit now reports:
  - `endpointIssueCount`: `0`
  - relationship origin types: `14`
  - application-origin share: `0.05`
  - hidden truth objects: `311`
  - source-to-truth crosswalk rows: `338`
  - blockers: `[]`

## Rollout Plan

Merge only after review. This does not apply Azure infrastructure, migrate PostgreSQL, land source files, run parser jobs, publish a Knowledge Baseline, expose data through Cube, or change product runtime behavior.

## Deployment Authority

- Repo-owned deploy workflow: not applicable; design/data-artifact merge only.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not required.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because no runtime behavior changes.

## Rollback Plan

Revert this package repair commit. No runtime, Azure, database, source landing or publication rollback is needed because this candidate does not mutate shared environments.

## Audit Evidence

- Repair/audit script: `scripts/knowledge/build-airline-source-corpus-repair.mjs`.
- Audit report: `clients/airline-demo-new/19-template-instantiation-source-corpus/05-validation/INDEPENDENT_SEMANTIC_AUDIT_REPORT.md`.
- Audit JSON: `clients/airline-demo-new/19-template-instantiation-source-corpus/05-validation/independent-semantic-audit.json`.
- Review index: `clients/airline-demo-new/19-template-instantiation-source-corpus/06-review-package/REVIEW_INDEX.html`.
- Package manifest: `clients/airline-demo-new/19-template-instantiation-source-corpus/PACKAGE_MANIFEST.json`.

## Known Gaps

This makes the package eligible for freeze review; it does not itself freeze the source release. Azure planning/apply, source landing, parser execution, reconciliation, Knowledge Baseline publication and product consumption proof remain separate gated phases.
