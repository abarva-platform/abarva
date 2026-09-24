# 2026-09-24-t755-per-row-tenant-fence — Assert the per-row and per-metric tenant fence in the contract evidence persistence suite

## Release ID

`2026-09-24-t755-per-row-tenant-fence`

## Status

`candidate`

## Plain-English Summary

`buildContractEvidencePersistencePayload()` stamps a tenant key in three separate
places: on the manifest, on every structured evidence row, and on every derived
metric. Its test suite asserted only the first of those three.

The consequence is the one the item names. Replacing the per-row `tenant_key`
inside `toStructuredRows()` with a hard-coded constant — so that every structured
evidence row is written under a tenant the caller never asked for — left all three
cases of the suite green. This change asserts the two missing fences, and proves
by mutation that each of the three now fails on its own.

**The item named two fences; there are three.** It describes the manifest fence
and the per-row fence. Measured on `origin/main` before anything was written, the
per-metric fence inside `metric()` is undefended in exactly the same way and by
exactly the same mutation: every derived metric could be written under the wrong
tenant with the suite green. It is fixed here with the other two rather than left
for a later item, because it is the same defect in the same function on the same
line shape, and splitting it would leave a known hole open behind a closed item.

Two things about the shape of the assertions, both of which are the reason the
original miss happened:

- They assert the **distinct set** of tenant keys over **every** row and **every**
  metric, not a sampled one. The suite already had a `toMatchObject` on `rows[1]`
  and that is precisely what did not catch this. A mutation that leaves `rows[0]`
  correct and moves every other row to a foreign tenant is exercised below and
  fails; a single-row sample keyed on `rows[0]` would have passed it.
- A fourth case builds the identical pack under a **second tenant**. Without it,
  a fence replaced by a literal equal to the one tenant string the fixture already
  uses would still satisfy every assertion. That mutation is exercised below and fails
  **only** the new case, which is what shows the case is load-bearing rather than
  decorative. The case also asserts that the row hashes and metric values are
  identical across the two tenants, so it is proving the same pack under a
  different fence and not quietly a different pack.

## Layer Impact

Release lane: **`global-control-lane`** — shared repository-wide test behavior,
behind no feature gate and scoped to no client.

Layer 2 / source adapters — test-only. No runtime file changed; the subject
module `src/lib/source/contract-evidence/persistence.ts` is byte-identical to its
state at `origin/main` (verified by sha256 after every mutation below). No
canonical model, product surface, schema, migration or governed dataset moves.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — a test assertion and a release record
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/lib/source/contract-evidence/__tests__/persistence.test.ts` — asserts the
  per-row and per-metric tenant fence in every case, keeps the manifest fence, and
  adds one opposite-tenant case.
- `docs/releases/records/2026-09-24-t755-per-row-tenant-fence.md` — this record.

## QA / Validation

**The item re-verified on `origin/main` `81fbe620b` before a line was written.**
Baseline over the same scope: 1 suite, 3 tests, 0 failing. The mutation the item
names, applied to `persistence.ts` and reverted with the file's sha256 checked
byte-identical afterwards each time:

| at base | mutation | result |
|---|---|---|
| line 120 | per-row `tenant_key` → foreign constant | **3 passed, 0 failed — the defect, reproduced** |
| line 148 | per-metric `tenant_key` → foreign constant | **3 passed, 0 failed — undefended too, and not in the item** |
| line 327 | manifest `tenant_key` → foreign constant | 1 failed, 2 passed |

After the change: 1 suite, **4 tests, 0 failing**.

**Six mutations, five caught and one required to stay green.** Each one is applied
to a copy, the subject file restored afterwards, and its sha256 verified
byte-identical — a mutation that changed no bytes reads exactly like a caught one,
so the harness aborts when the bytes do not move.

| # | mutation | required | observed |
|---|---|---|---|
| M1 | per-row fence → foreign constant | fail | 4 of 4 cases fail |
| M2 | per-metric fence → foreign constant | fail | 4 of 4 cases fail |
| M3 | manifest fence → foreign constant | fail | 4 of 4 cases fail |
| M4 | per-row fence → a literal equal to the fixture's **own** tenant key | fail | **exactly 1** case fails — the opposite-tenant one |
| M5 | `tenant_key` moved to the end of the row object literal | **stay green** | 4 passed |
| M6 | only `rows[0]` keeps the fence; every other row goes foreign | fail | 4 of 4 cases fail |

**The three fences are proven independent, measured rather than asserted.** Each
mutation was re-run capturing the source line of every failing assertion. The
three sets are disjoint and each names only its own fence:

- M1 (rows) → `persistence.test.ts` lines 131, 193, 213, 239 — every
  `distinctTenantKeys(payload.rows)` assertion and nothing else.
- M2 (metrics) → lines 133, 195, 215, 241 — every
  `distinctTenantKeys(payload.metrics)` assertion and nothing else.
- M3 (manifest) → lines 117, 191, 211, 237 — every manifest assertion and nothing
  else.

M5 is what shows the control is about the value and not the key order in the
returned object literal; M4 is what shows the fourth case is not redundant with
the first three; M6 is what shows "over all rows" is doing work that "over one
row" would not.

Other checks, all from the item's own worktree:

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` —
  **exit 0**, judged by the exit code after removing `tsconfig.tsbuildinfo`, with
  0 diagnostic lines.
- `npx eslint src/lib/source/contract-evidence/__tests__/persistence.test.ts` — exit 0.
- `src/__tests__/behaviors/source-contract-suite-ci-coverage.test.ts` — 2 passed.
  This is the control that owns the quarantine list discussed below, and it is
  green because nothing was wired.
- `git status` after every mutation showed exactly the one changed test file, so
  no mutation leaked into the tree.

## Rollout Plan

Merge to `main` through the repo-owned squash path. No runtime rollout: this
change is loaded by Jest and by nothing else.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge
- Shared runtime mutators: none in this change
- Approved image digest: unchanged by this change; the deploy invariant is proven
  from the merge run's own `runtime-invariant-proof.json`
- ACA runtime invariant: to be proven after merge and appended to the register
- Worker image invariant: unchanged
- Feature/env flag update path: none
- Live signed-in proof required: **no** — nothing under `src/app` imports the
  changed file, so a signed-in lane would be a proof with no subject

## Rollback Plan

Revert the single commit. No migration, no data change, no flag.

## Audit Evidence

- The PR for this record, its CI run, and its squash SHA
- The mutation table above, reproducible from the repository at the merge SHA
- The deploy run keyed to the merge SHA and its `runtime-invariant-proof.json`

## Known Gaps

**The suite is NOT wired into CI by this change, and that is deliberate.** T-755's
acceptance ends "only then may the suite be credited and wired under T-754's
rule". That is a necessary condition, not a sufficient one.
`src/lib/source/contract-evidence/__tests__/persistence.test.ts` is a quarantined
path in `src/__tests__/behaviors/source-contract-suite-ci-coverage.test.ts`, a
control that runs today and asserts that no jest command in `unit-suites.yml`
mentions it. Its quarantine reason is a **different and still undischarged**
defect — the fixture carries no register contract identity, so it cannot reproduce
the live identity split — and nothing in this change touches that. Wiring the
suite here would have required deleting a quarantine entry so that a new workflow
step could pass, which is the exact move the backlog exists to prevent. The
tenant-fence half of the condition is now met; the identity half is not.

Two further residuals, named rather than folded in:

- `source_event_id` and `archetype_key` are stamped on rows and metrics from the
  same input by the same code and are asserted on neither. They are a narrower
  instance of the same shape as this item. **Not filed as an id**, because the
  Claude T band `T-500`–`T-599` reads 0 of 100 free and the generated queue marks
  that a range decision rather than a reading; it is recorded in the pulse.
- The suite's pre-existing fixture tenant key is not in `CANONICAL_TENANT_KEYS`.
  The second one added here is. The fixture's own key is left exactly as it was:
  changing it is not this item, and the opposite-tenant case already proves the
  value is derived from the input rather than from any one string.
