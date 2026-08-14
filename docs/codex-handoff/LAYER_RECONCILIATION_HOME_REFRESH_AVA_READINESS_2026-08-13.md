# Codex Handoff: Reconcile Source Through All Layers, Refresh Home, Prove aVa Can Speak

Date: 2026-08-13. Author: Claude Code lane. Audience: Codex as execution owner.

## Role

You own execution. Anand owns the decisions marked **DECISION** below — do not resolve them by
picking the reasonable-looking option, because each one changes what the other layers should contain.

Public repository disclosure applies. Commit messages, PR text, code comments and release records are
readable by anyone. Write governance language in terms of mechanism, not narrative.

## Repository

```text
/Users/anand/Projects/nexus
```

## Read First

```text
docs/architecture/ENTERPRISE_INFORMATION_ARCHITECTURE.md
docs/governance/TENANT_CONTEXT_SINGLE_SOURCE_OF_TRUTH_REDO_PLAN_2026-08-12.md   (GATE-08 decision section)
docs/governance/CONTEXT_CORPUS_POLICY.md
datasets/tenant-inputs/templates/universal/standard-2026-07-v3/ontology.json
datasets/tenant-inputs/templates/universal/standard-2026-07-v3/template-manifest.json
reports/tenant-layer-refresh-2026-08-12/gated-apply-plan.md
```

---

## Current State — measured on `main`, not remembered

### Layer 1 — column contract conformance and content

| Tenant | Dimensions conformant | Contract fields carrying data | Notes |
| --- | ---: | ---: | --- |
| skyharbor-air | 19/19 | 283/286 (99%) | the reference package |
| healthcare-demo-new | 19/19 | 284/286 (99%) | Phase-0 frozen, blocked from data landing by its own control doc |
| apex-retail | 19/19 | 167/286 (58%) | unexamined whether sparse or under-populated |
| first-capital-financial | 19/19 | 167/286 (58%) | as above |
| lakeshore-holdings | 19/19 | 167/286 (58%) | as above |
| lakeshore-industries | 19/19 | 168/286 (59%) | 564 hollow rows, waived to 2026-09-30 |
| meridian-health | **1/19** | **65/286 (23%)** | off-contract, waived to 2026-09-30 |

A remediated meridian package exists at
`datasets/tenant-inputs/meridian-health/v2026-08-governed-intake/canonical-dimensions/` at 19/19
conformance and 66% fill. **It is a draft. The active root still serves the old shape.**

### Layer 3 — graph integrity

| Tenant | Edges | Usable | Integrity | Violations |
| --- | ---: | ---: | ---: | ---: |
| skyharbor-air | 3,318 | 3,318 | 99% | 90 |
| healthcare-demo-new | 2,302 | 2,302 | 92% | 612 |
| lakeshore-holdings | 364 | 364 | 64% | 431 |
| apex-retail | 1,713 | 1,713 | 58% | 2,427 |
| meridian-health | 1,037 | 1,037 | 2% | 2,788 |
| first-capital-financial | 380 | 380 | 0% | 1,203 |
| lakeshore-industries | 519 | **0** | n/a | 515 |

Integrity percentages are not comparable to figures quoted before 2026-08-13; the denominator changed
when previously-undeclared node types began to be resolved.

### What already exists — reuse, do not rebuild

```text
scripts/audit/validate-tenant-ontology.mjs        graph validation against the declared ontology
scripts/audit/tenant-layer-refresh.mjs            L1-L4 classification, claim reconciliation, gate register
scripts/audit/tenant-input-quality-depth.ts       conformance + depth + fill + terminators + hollow rows
scripts/data/remediate-v3-envelope-to-contract.mjs   off-contract package -> contract shape
scripts/data/generate-missing-contract-attributes.mjs synthetic attribute generation, labelled
scripts/data/assign-stable-identity.mjs           identity ledger + endpoint IDs
scripts/data/apply-segmentation.mjs               segmentation + graph inheritance
scripts/data/apply-ontology-wave0-fixes.mjs       endpoint retype / direction repair
scripts/data/normalise-csv-line-endings.mjs       terminator repair
scripts/tower/fact-lineage-report.mjs             AGREE / CONFLICT / ONE_SOURCE per metric
```

---

## Task 1 — Reconcile Layer 1 into Layer 2

For each active tenant, produce a reconciliation showing, per canonical dimension: which adapter
family should consume it, whether an adapter exists, and whether its required source fields are
satisfiable from that tenant's own columns.

**2026-08-14 correction:** this section is stale for Layer 2. Re-measurement on
`origin/main@d7b2de2aac93cc379052a45f9e730281bb328236` shows Layer 2 is no longer the
blocker: 23 mapping profiles exist and 133 of 133 adapter dry-run rows are `would-run`.
Use `reports/layer-refresh-status/current-main-v2/layer-refresh-status-v2.md` for the
current status before building anything on top of this handoff.

Do not invent an adapter to close a gap. Record the gap.

Output: `reports/layer-reconciliation-2026-08/<tenant>/layer2-adapter-reconciliation.csv`

## Task 2 — Reconcile Layer 2 into Layer 3

The graph is the weakest layer and the numbers above show why. Three distinct failure modes, and they
need different fixes:

1. **Dangling references.** 70% of meridian's system endpoints (77 of 111) name objects that appear
   nowhere in its dimensions, in any column — `AWS`, `BI tools`, `Caboodle`. These are informal
   mentions, not references. Either catalogue the objects or drop the edges; do not invent rows to
   satisfy the edges.
2. **Phantom edges.** lakeshore-industries has 519 edges with empty endpoint names. Its
   `original_source_file` points at itself, so there is no upstream to restore. This is a **DECISION**,
   not a repair.
3. **Disconnected dimensions.** In the reference tenant, data assets (499 rows), AI use cases (13) and
   workforce roles (38) appear as graph endpoints **zero** times. They exist and connect to nothing,
   so nothing about them is answerable through the graph and segmentation cannot reach them.

Output: `reports/layer-reconciliation-2026-08/<tenant>/layer3-graph-reconciliation.csv`, one row per
defect with class, count, and whether it is repairable from existing data.

## Task 3 — Reconcile Layer 3 into Layer 4, then refresh Home

Home reads these paths. Confirm each before changing anything:

```text
datasets/tenant-inputs/active/<tenant>/current            local-cxo-runtime.ts
datasets/tenant-inputs/<tenant>/standard-2026-07-v3        local-cxo-runtime.ts
datasets/tenant-inputs/<tenant>/derived/relationship-graph.json
datasets/tenant-inputs/<tenant>/approved-content/home/design-contract-pack.json
```

**Note the layering violation this implies:** Home reads Layer 1 directly. The architecture says
products read Layer 4 projections only. Do not silently preserve that; report it and propose the
projection boundary.

For each tenant, rebuild the derived Home projection from the current Layer 3 state and record what
changed. The reference tenant's relationship graph changed materially on 2026-08-13 — 1,025 endpoints
retyped, 62 edge directions corrected — and Home renders `from_object_type` and `relationship_type` as
display strings, so its relationship view will differ from any screenshot taken before that date.

Output: `reports/layer-reconciliation-2026-08/<tenant>/layer4-home-refresh.md`, with before/after
counts per surface.

## Task 4 — Prove aVa can speak for the refreshed datasets

This is the acceptance test for everything above, and the four states must be reported separately:

> loaded ≠ indexed ≠ retrievable ≠ cited

For each tenant in scope:

1. Every context object passes `evaluateGovernedObject`; objects that evaluate to `block` never reach
   the model. Agents consume only `buildValidatedAgentContextBundle`
   (`src/lib/governance/agent-context-bundle.ts:146`).
2. Run `node scripts/tower/fact-lineage-report.mjs` before any figure is surfaced. A metric reported
   `CONFLICT` may not be quoted at all; `ONE_SOURCE` may be quoted only with that status stated. At
   last run, `promised_value_usd` was `CONFLICT` for both cover tenants.
3. Ask aVa a question that requires a graph traversal, not a lookup — for example which systems support
   a named business function, who owns them, and which contracts sit behind them. A correct answer
   requires Layer 3 to actually resolve. Capture the response and its citations.
4. Ask a question that must be refused or caveated — a metric in `CONFLICT`, or a segment marked
   `UNDECLARED`. An answer that confidently fills those gaps is a failure, not a success.

Output: `reports/layer-reconciliation-2026-08/<tenant>/ava-readiness.md` with the four states reported
separately and the refusal cases included.

---

## Hard Gates — do not perform without explicit approval on exact scope

- registry activation or active-root replacement
- Azure/Postgres load (ACA job only, per `docs/ops/aca-data-build-job-rule.md`)
- retrieval index rebuild
- enabling aVa or any product surface on refreshed data
- runtime route changes
- retiring, moving or deleting any file
- changing CSV column contracts

`reports/tenant-layer-refresh-2026-08-12/gated-apply-plan.md` holds the current plan for these, with
scope, command, rollback and approver. Execution record reads `no` throughout.

## DECISIONS — Anand, not Codex

1. **Segmentation drafts.** `datasets/tenant-inputs/<tenant>/segmentation.json` are proposals from
   analysis, not client knowledge. Four assignments carry an explicit `judgementCall`. Also unresolved:
   whether the line-of-business split is the legal-entity view or the P&L view. Correcting the file and
   re-running `apply-segmentation.mjs` is the whole change.
2. **The 97 free-text fields** in the remediated meridian package. Filling them means generating prose
   about how an organisation makes decisions, which reads as researched fact and is hard to distinguish
   later. Deliberately not done.
3. **Interview evidence placement.** 247 interview endpoints cannot resolve because interview evidence
   lives outside the active package. Currently classified `expected-external`, which was a pragmatic
   choice to let the gate go green, not a considered one.
4. **lakeshore-industries.** Decide what its spend and relationship data should be, or declare it as
   having none so coverage reporting stops counting phantom rows.
5. **Two healthcare tenants remain registered active.** `meridian-health` is what the product runs on
   (626 runtime references) and is off-contract; `healthcare-demo-new` is contract-clean at 99% with 13
   references and is blocked from data landing by its own control document. A branch
   `chore/sunset-healthcare-demo-new` holds unfinished, **type-unchecked** auth and data-plane edits.
   Do not merge that branch without verifying whether live Clerk proof logins for it are in use.

---

## Verification Discipline — read this before trusting any number, including your own

Five confident diagnoses dissolved on inspection while producing the current state. Each looked like a
finding and would have caused real work on a non-problem.

| Claimed | Actually |
| --- | --- |
| "Two files have an unbalanced quote" | One inconsistent line terminator. The wrong cause stood for two waves. |
| "11,790 rows at risk across five tenants" | Zero. It counted normal LF endings in Unix files. |
| "Vendor spend is 117% of IT budget — inconsistent" | Invalid comparison. The two files have different populations, neither declared. |
| "1,695 hollow rows across two tenants" | 564 in one. Two thirds was an already-tracked defect counted twice. |
| "Six of seven tenants fail the ontology" | The ontology was derived from one tenant and imposed on six. |

Four practices that caught these, all cheap:

1. **A transform's own summary is not evidence.** A script reported success while corrupting 131 rows
   with a CRLF round trip. Diff every cell against `origin/main` after any data write.
2. **Prove a gate fails before trusting that it passes.** Every gate added this cycle was
   fault-injected. A green gate that has never been seen to fail is an assumption.
3. **A dramatic number is usually the wrong measurement.** Twice, a large and alarming figure would
   have justified a large and unnecessary migration.
4. **When a sweep contradicts a defect you have already proven, the sweep is wrong.** That is what
   surfaced the hollow-row measurement error.

## Acceptance Criteria

- Layer 1 → 2 → 3 → 4 reconciliation exists for every active tenant, defects classified as repairable
  or decision-blocked.
- Home projections rebuilt from current Layer 3, with before/after counts, and the Layer 1 read
  reported rather than preserved silently.
- aVa readiness reported with loaded / indexed / retrievable / cited as four separate states, including
  at least one correct refusal.
- No figure quoted anywhere that `fact-lineage-report` reports as `CONFLICT`.
- Every data write verified by cell-level diff; row and column counts unchanged unless intended.
- `npm run audit:tenant-input-quality`, `npm run validate:context-corpus`, `npm run release:check` all
  pass, with results quoted, not asserted.
- No hard gate executed. No decision above resolved by Codex.

## Report Back

Files changed; per-layer reconciliation outputs; Home before/after; the four aVa states; fact-lineage
result; validation commands with actual output; which decisions remain open; and anything you found
that contradicts this document — including anything above that turns out to be wrong.
