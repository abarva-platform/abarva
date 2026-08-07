# 2026-08-07-source-optimization-evidence-lineage-graph — Show how each ledger number connects to its evidence

## Release ID

`2026-08-07-source-optimization-evidence-lineage-graph`

## Status

`candidate`

## Plain-English Summary

The Optimization tab's four-ledger cockpit (shipped this same day) shows each line item's amount, state, and evidence class as a flat card. That answers "what is the number" but not "why should I believe it" — a reader still has to mentally assemble the path from contract, to ledger category, to line item, to the evidence behind it. This release adds a "Why we believe this" section to the same tab, between the ledger cockpit and the lever cards: a compact, executive-scannable list of every line item grouped by its ledger, each marked with the same evidence-class taxonomy already shipped (● System evidenced / ■ Document evidenced / ✓ Human validated / ◇ Inferred / ○ Missing). The list stays compact by default — clicking an item reveals its evidence chain (its real source refs, in order, down to the finding) in a panel beside it, rather than expanding everything at once. The marker encodes evidence strength, not whether the underlying finding is good or bad news — a large leakage number can carry a solid System evidenced marker precisely because its evidence is strong. No new data model, no new backend call: this renders the exact same `vm.optLedger.lines` objects (same `id`, same `kind`) the ledger cards above it already render from, so the cockpit and this section can never drift out of sync.

## Layer Impact

- `global-control-lane`: `src/app/(maestro)/source/preview/workspace/{buildViewModel.ts,canvases/ContractCanvas.tsx}` (small, additive) and a new file `canvases/EvidenceLineageGraph.tsx`. No data or computation change — pure presentation over the existing `vm.optLedger` view-model object.

## Client Applicability

- All clients: yes — any tenant viewing a contract's Optimization tab.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `canvases/EvidenceLineageGraph.tsx` (new): renders `vm.optLedger.lines` grouped by `kind` into the four ledgers, as a compact per-ledger list (one row per line item, marker + label + amount) — nothing expanded by default. Clicking a row selects it and reveals a side panel: its real `sourceRefs` rendered as a step-by-step chain ending in the finding amount, its `evidence` text, `nextAction`, and required `lineageFields` — all fields the ledger service already computes, none invented. When an item has zero source refs, the panel says so plainly rather than showing an empty chain. Marker shapes follow the requested taxonomy exactly (filled circle / filled square / check / open diamond / open circle) and are colored by `evidenceTone`, which encodes evidence strength, not sentiment.
- `canvases/ContractCanvas.tsx`: renders `<EvidenceLineageGraph vm={vm} />` inside the existing Optimization tab block, positioned between the four-ledger cockpit and the lever cards — so the tab reads as one continuous story (what we found → why we believe it → what levers exist → what to do), not a separate destination. A standalone new tab was tried first and rejected: it forced a reader to leave the optimization narrative to see the evidence trace behind it.
- `buildViewModel.ts`: no new fields; only consumes the existing `optLedger`/`c` fields already exposed.

## QA / Validation

- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit -p . --pretty false` — passed, clean.
- `npx eslint` on all three files — passed, clean.
- `npx jest buildViewModel.numeric.test viewModel.explore.test contract-optimization-ledger` — passed, 18/18, unaffected (this release adds no new ledger logic to test; the underlying `contract-optimization-ledger.test.ts` suite already covers the data this view renders).
- Live signed-in proof required post-deploy (see below) — no local dev server verification possible (page requires live Azure Postgres).

## Rollout Plan

Merge through PR to `main`; `aca-main-deploy` builds and deploys automatically. No migration, no feature flag — pure rendering addition.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: assigned by the deploy workflow on merge.
- ACA runtime invariant: standard post-deploy check applies (template image, 100%-traffic revision, worker jobs all match digest).
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes — open a contract's Optimization tab, confirm the "Why we believe this" list renders below the ledger cockpit with real per-contract data (not placeholder text) and stays compact until a row is clicked, click at least two different line items and confirm the side panel updates with that item's real evidence chain/next-action/lineage-fields, confirm an item with no source refs shows the honest "no source record linked yet" state instead of a fake chain, and confirm the list's per-ledger grouping and item counts match what the existing ledger cards above it already show for the same contract.

## Rollback Plan

Revert the PR. The Optimization tab returns to ledger cockpit → lever cards → scenario comparison, without the "Why we believe this" section in between.

## Audit Evidence

- PR diff for the three changed/new files.
- This record's QA section.
- Post-deploy: live signed-in screenshot of the Optimization tab showing the compact list and, separately, a selected item's revealed evidence chain.

## Known Gaps

`lineageFields` currently lists the *names* of fields a fully-populated evidence record would carry (e.g. `source_system`, `source_record_id`, `extract_timestamp`) — it is a schema checklist, not yet hydrated per-record data (an actual invoice number, a specific Fieldglass work order ID). The chain reveal renders that honestly: it steps through whatever real `sourceRefs` exist today (table/column-level references), not a fabricated specific record. Populating real per-record lineage (the literal invoice/PO/document identifiers behind a number) is a further, separate data-ingestion step, out of scope here.

Two follow-ups requested alongside this release, deliberately not built now given the same-day timeline: (1) letting aVa explain a selected finding in narrative form, grounded in the same `evidence`/`sourceRefs`/`nextAction` fields this panel already shows — blocked on the same aVa tool-calling/surface-context gaps identified earlier today (no tool registered for `/source/preview/workspace`, no per-contract identifiers in aVa's grounding context); (2) an "Expand evidence graph ↗" full-canvas forensic view connecting the contract to documents, invoices, work orders, SLA measurements, applications, vendor, sourcing events, and Tower claims — a materially larger relationship graph than the four-ledger data this release renders, requiring new cross-entity read models. Both are real, valuable next steps, not attempted here.
