# 2026-08-31-intake-family-coverage-gate — Prove every intake workbook reaches the model

## Release ID

`2026-08-31-intake-family-coverage-gate`

## Status

`candidate`

## Plain-English Summary

A client fills in nineteen intake workbooks. Until now nothing checked that the contents of each one
actually reached the model that writes the executive narrative — only that the files had been read.

Those are different questions, and the difference is not academic. The enterprise profile workbook
was read, parsed, and described in the packet for the whole time the Home executive story was
opening on a cross-domain operating-risk sentence instead of who the enterprise is. A file-level
coverage report would have said 100%. What had actually happened is that one of the two packet
builders set the industry, revenue, business model and every declared priority to null before
assembling anything.

This adds a check that asks the second question: for each workbook, is there anything from *inside*
it that a claim could cite? A workbook is either contributing, or declared absent with a reason and
an owner. Nothing else passes.

Run against the current governed packets for the two active tenants, it reports **16 of 19** and
**15 of 19**. Those gaps were not visible before.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 1 / client intake:** unchanged. The family list is read from the existing template
  manifest rather than restated.
- **Layer 3 / canonical model:** unchanged. No schema, migration, or projection change.
- **Layer 4 / products:** unchanged. Nothing in this release is on a request path.
- **Build/QA tooling:** adds `npm run check:intake-family-coverage`.

## Client Applicability

- All clients: the check applies to any tenant whose packet is inspected
- Specific clients: measured today for both active registry tenants
- Internal only: yes — build tooling
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/data-build/intake-family-coverage.ts` (new) — family declarations read from the template
  manifest, a non-empty rule that rejects present-but-empty, the four-state evaluation, and a
  reserved-slot helper.
- `scripts/data-build/check-intake-family-coverage.ts` (new) — CLI over a packet JSON; exits 1 on
  any required family that is not contributing and not signed for.
- `docs/governance/intake-family-coverage-exceptions.json` (new) — declared absences, each with a
  reason and an owner.
- `scripts/data-build/__tests__/intake-family-coverage.test.ts` (new) — 19 cases.
- `package.json` — adds `check:intake-family-coverage`.

### The two states this keeps apart

`SUMMARIZED` means the packet tells the model the file exists, its domain, and its row count.
`FACTS` means the packet carries something from inside the file that a claim can rest on. A summary
is a description of a file, not its contents: *"00_enterprise_profile.csv, 1 record, domain
enterprise_profile"* does not tell a model that revenue is $25B. Only the second state is evidence,
so `summarized_only` is a **failure**, not a partial pass — it is precisely the state that reads as
covered on every report that counts files.

### Why the packet shape is read two ways

The two packet builders in this repository do not agree on shape. The chapters packet emits
`sourceSummaries` keyed by source path; the ECL packet emits `coverageManifest.dimensionCoverage`
keyed by dimension. Coverage has to be answerable from either, so the family-to-dimension join is
declared explicitly in code rather than inferred from a filename.

## QA / Validation

- PASS `npx jest scripts/data-build/__tests__/intake-family-coverage.test.ts` — 19/19
- PASS `npx eslint` on all three new TypeScript files
- PASS `tsc --noEmit -p tsconfig.json` (full project; needs
  `NODE_OPTIONS=--max-old-space-size=8192` locally)
- Measured `npm run check:intake-family-coverage -- --packet <golden snapshot>` for both active tenants

### Gate observed failing

Both failure modes are covered by a planted case, because a gate never seen failing is not a gate:

- A packet whose profile is summarized while `enterpriseIdentity` is all-null, `businessEconomics`
  is empty and `strategicPriorities` is `[]` is reported `summarized_only` and **fails** — the exact
  defect this exists for.
- A declared absence whose family has since started contributing is reported as a **stale
  exception** and fails, so a waiver cannot outlive the problem it waived.

### Measured result

| Family | Tenant A | Tenant B |
| --- | --- | --- |
| `02_org_ownership.csv` | summarized only (225 rows) | summarized only |
| `12_relationships.csv` | contributing | summarized only |
| `15_industry_context_patterns.csv` | summarized only (12 rows) | summarized only |
| `16_expert_lenses.csv` | summarized only (9 rows) | summarized only |
| **Contributing** | **16 / 19** | **15 / 19** |

Read precisely: `summarized_only` means no signal or context item in the packet declares that
family's domain, so no claim can cite it. The rows are loaded. They are not reachable as evidence.

## Rollout Plan

Merge to main. No runtime rollout, no image build, no traffic change, no migration. The check is a
CLI over a plan-only artifact and is not wired into CI in this release — wiring it is a follow-up
once the four families above are either fixed or signed for, so that CI does not land red.

## Deployment Authority

- Repo-owned deploy workflow: not exercised
- Shared runtime mutators: none in this change
- Approved image digest: not applicable
- ACA runtime invariant: not affected
- Worker image invariant: not affected
- Feature/env flag update path: none
- Live signed-in proof required: no — no product surface changes

## Audit Evidence

- Test output for `scripts/data-build/__tests__/intake-family-coverage.test.ts`, including the two
  planted failures.
- The per-tenant coverage tables produced by `npm run check:intake-family-coverage`, which name the
  families and row counts and are the record of what was and was not reachable at this commit.
- `docs/governance/intake-family-coverage-exceptions.json` — empty at this commit, so no absence has
  been signed for yet.

## Rollback Plan

Revert the commit. All three new files are additive and unreferenced by any runtime path; the
`package.json` script is the only edit to an existing file.

## Known Gaps

- **Not yet enforced in CI.** Deliberate: four families currently fail, and turning the gate on
  before they are fixed or signed for would land CI red. Wire it after.
- **`reserveOnePerFamily` is not yet called.** It exists and is tested, but `buildSourceSummaries`
  still sorts by record count and caps at 180 — so the single-row enterprise profile remains
  structurally the earliest summary evicted if that cap tightens. Calling it touches a file another
  lane is currently editing.
- **Fact binding is declared for family 00 only.** Every other family is evidenced through the
  signal/context domain join. That is sufficient to detect the failure seen here, but a family with
  a structured packet field of its own would need its paths added to `FAMILY_FACT_PATHS`.
- **Per-page coverage is not measured.** This answers "did the workbook reach the packet", not "did
  it reach this chapter's prompt". That is the next level and it is not in this release.
