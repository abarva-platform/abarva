# 2026-05-24-p23-source-value-proof — Source Procurement Value Proof Loop v1

## Release ID

`2026-05-24-p23-source-value-proof`

## Status

`candidate`

## Plain-English Summary

Adds the Packet 23 foundation for proving Source economic value: a four-layer
value state model, service guardrails for baseline/intervention/negotiated/
realized states, event-level value waterfall, Tower portfolio rollup, and CFO
attestation queue placeholder.

## Layer Impact

- `source-lane`: every Source event can carry baseline, intervention,
  negotiated, and realized value states.
- `evidence-ledger-lane`: baseline and value transitions record Evidence
  Ledger citations before dollars are counted.
- `tower-lane`: Source portfolio value rollup exposes realized savings over
  90/180/365 day windows.
- `artifact-lane`: Packet 20 Source board packs can consume the value chain in
  a follow-up render slice.

## Client Applicability

- Specific clients: all tenants with Source enabled.
- Internal only: `/admin/cfo-attestation` is an admin/operator surface.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Adds `source_value_states` and `source_value_chain` schema with tenant RLS.
- Adds anti-fabrication checks: baseline requires at least two Evidence Ledger
  citations; realized value requires attestor and timestamp; realized rows are
  immutable after insertion.
- Adds `src/lib/source/value-chain.ts` with `computeBaseline`,
  `recordIntervention`, `recordNegotiatedOutcome`, `attestRealized`,
  `getValueChain`, and `computeCumulativeSavings`.
- Adds `/source/events/[eventId]/value` waterfall view.
- Adds `/tower/source-portfolio-value` rollup.
- Adds `/admin/cfo-attestation` queue surface.
- Adds a Source canvas "Value Proof" entry point.

## QA / Validation

- PASS: `npm run smoke:p23-source-value-proof`
- PASS: targeted ESLint for the P23 service, pages, Source canvas entry, and smoke script.
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- PASS: `npm run build`
- Pending before merge: remote CI.

## Rollout Plan

Merge after CI is green. Apply `npm run db:migrate` before relying on persisted
Source value proof rows.

## Rollback Plan

Revert the PR. The migration is additive and does not modify existing Source
events or value ledger rows.

## Audit Evidence

- Smoke asserts Source value schema, RLS, anti-fabrication checks, service
  methods, value waterfall route, Tower rollup route, CFO attestation route,
  and Source canvas entry point.

## Known Gaps

- CLM webhook integration is not included; negotiated outcome remains manual.
- The CFO attestation page is the governed queue home, but interactive attest /
  dispute / defer actions remain the next hardening slice.
- Source board-pack rendering will include the value waterfall after Packet 20
  artifact persistence and value-chain data are applied in the target database.
