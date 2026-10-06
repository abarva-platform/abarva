# 2026-09-26-record-browser-row-identity — Every record row is named once, and opens its own detail

## Release ID

`2026-09-26-record-browser-row-identity`

## Status

`candidate`

## Plain-English Summary

Home's record browser identified each row on screen by the identifier the row itself carried. On one
synthetic-demo tenant's infrastructure estate, fourteen of forty-seven platforms carried the same
identifier, so the browser treated fourteen different platforms as one. The consequence was not a
cosmetic one: clicking the thirty-fourth platform opened the **first** platform's detail panel, under
the first platform's ordinal, showing the first platform's cost, criticality and constraints — with
nothing on screen to say a substitution had happened. A reader asking what one data centre costs was
shown a different data centre's numbers and had no way to tell.

Two things changed.

The browser now guarantees the identity it renders with, instead of trusting the one it is handed. A
record whose identifier is already unique keys exactly as before; a repeated identifier is separated,
and the surface **says so** — a short notice above the table states how many records share an
identifier and that the identifier does not single out one record, so the defect is visible to the
people who can correct it rather than quietly absorbed by the view.

The fixture generator that produced the duplicate no longer copies a row's name. It appended rows by
spreading the file's first row, which is right for the descriptive columns — an appended platform
really does share the estate's stack and owner — and wrong for the three columns that *name* a row.
Those are now derived per row, and the script refuses to write a file in which any two rows share one,
rather than warning. Twenty-three rows across two files on one synthetic-demo tenant were corrected;
the other tenant's files were already correct and were not touched at all.

## Layer Impact

**Release lane: `global-control-lane`**, with the intake-file correction in `public-demo`. The reader
side is shared app behaviour that reaches every client unconditionally and is not feature-gated — a
duplicated identifier is not a condition a flag should be able to re-enable. The two corrected files
belong to synthetic-demo tenants, so nothing in `client-data-lane` is touched.

- **Layer 1 — client intake.** Three row-naming columns (`original_row_id`, `original_row_number`,
  `source_fingerprint`) were corrected on 13 rows of one synthetic-demo tenant's infrastructure file
  and 10 rows of its programmes file. No descriptive column changed, no row was added or removed, and
  the second active tenant's files are byte-identical to before. Thirteen of those rows had asserted
  they came from line 2 of the intake file, which they did not.
- **Layer 4 — products (Home).** The record browser's row identity is now guaranteed by the view and
  a colliding record is reported on the surface. Selection, ordinal and the detail panel now answer
  about the row that was clicked.

Layer 2 and layer 3 are untouched by this release. The canonical object ids on those same rows are
*also* duplicated, and are deliberately **not** repaired here — see Known Gaps.

## Client Applicability

- All clients: no. Nothing client-specific ships.
- Specific clients: none. Both affected files belong to synthetic-demo tenants.
- Internal only: the generator change and its CI gate.
- Public/demo only: the two corrected intake files and the Home surface behaviour.
- Feature flag: none. The reader-side change is unconditional, because a duplicated identifier is not
  a condition a flag should be able to re-enable.

## Changes Included

- `src/components/home/v4/RecordBrowser.tsx` — `rowKey` becomes `declaredRowId` (the identifier the
  record asserts) plus `indexRows` (one guaranteed-distinct key per row, and a count of the records
  that had to be separated); a notice renders above the table when that count is non-zero.
- `src/components/home/v4/__tests__/record-browser-row-identity.test.tsx` — new suite, 6 cases.
- `scripts/data/fixtures/deepen-fixture-substrate.mjs` — `ROW_NAMING_COLUMNS`, `declareRowNames`,
  `assertRowNamesAreDistinct`, and a `--check` mode that reads the committed files and exits non-zero
  on a duplicate.
- `scripts/data/fixtures/deepen-fixture-substrate.test.mjs` — new suite, 4 cases, driving the real
  script as a subprocess over a scratch copy.
- `.github/workflows/fixture-row-identity.yml` and the `check:fixture-row-identity` npm script,
  classified `pr-gate` in `docs/architecture/ci-gate-registry.json`. The registry check caught the
  unclassified script on the first CI run and refused it, which is the control working: a gate nobody
  runs looks exactly like a tool nobody needs to run.
- `datasets/tenant-inputs/active/skyharbor-air/current/06_infrastructure_platforms.csv` (13 rows) and
  `.../09_programs_initiatives.csv` (10 rows).

No migration, no route, no adapter, no projection.

## QA / Validation

**The reader-side defect, measured before the fix.** The new suite drives the real component over the
committed bundle and reports 13 misrouted rows by name, each one naming the platform clicked and the
platform shown. After the fix: 0. The case walks **every** rendered row rather than sampling one — the
collision is a run of fourteen inside a record of forty-seven, so a sample can miss it entirely.

**The instrument the acceptance asked for is not sufficient, and both are kept.** Counting rendered
rows was the prescribed proof. It passes both before and after: React warns that duplicate keys make
children liable to be duplicated or omitted, and on this bundle it does not in fact omit one. The
misrouted detail panel is the assertion that bites, and it holds in a production build, where React's
warning does not exist. The row-count case is retained as the guard for the omission mode.

**Deliberate breakage, seven mutations, all caught.** Each was applied to the fixed code and the suite
re-run:

| mutation | cases failing |
|---|---|
| rendered key never de-duplicated (the fix reverted) | 2 of 6 |
| collision count forced to 0 (never reported) | 1 of 6 |
| collision count forced to `rows.length` (always reported) | 2 of 6 |
| naming pass in the generator made a no-op | 3 of 4 |
| refusal guard made a no-op | 1 of 4 |
| first carrier of a repeated name restamped too | 3 of 4 |
| canonical id minted by the generator after all | 1 of 4 |

The report is proven in **both** directions — forced-off and forced-on each fail a different case — so
a green suite cannot mean the notice is simply absent.

**The CI gate fails in both directions.** `node scripts/data/fixtures/deepen-fixture-substrate.mjs
--check` exits `1` against the pre-fix intake files and `0` against the corrected ones, measured from a
clean detached worktree of `origin/main` rather than from a stash. `--check` is deliberately not a dry
run: a dry run reports what the repair pass *would* fix and therefore passes on a file that is broken
today, which is the exact state these files were in.

**Same-scope baseline**, `src/components/home/v4/__tests__` and `src/lib/home/preview`, on a clean
`origin/main` worktree and on this branch:

- before: 36 suites, 469 tests, **0 failing**
- after: 37 suites, 475 tests, **0 failing**

**Column-level diff of the two corrected files** against `origin/main`: 13 and 10 rows changed, and
the only columns touched are `original_row_id`, `original_row_number` and `source_fingerprint`. Row
counts unchanged (46 and 38). The second active tenant appears in no diff.

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` → exit 0.
- `npx eslint` on the four changed files → 0 errors, 1 warning, and that warning is present unchanged
  on `origin/main`.
- `npm run check:fixture-row-identity` → 4 of 4 cases pass, gate exits 0.
- `npm run audit:ci-gate-registry` and `audit:ci-gate-registry-order` → both pass with the new entry.

No signed-in run was performed and none is claimed.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds and deploys from the merge commit; no
manual Azure command is involved and no shared runtime is mutated by hand. The intake-file correction
has no runtime rollout of its own: the checked-in Home preview bundles are produced by a separate
reviewed promotion run, so they still carry the duplicate until that run happens. That is precisely
why the reader-side change stands on its own rather than depending on the data being fixed first.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`.
- Shared runtime mutators: none. No `az containerapp` command is run by this release.
- Approved image digest: assigned by the main deploy workflow from the merge SHA.
- ACA runtime invariant: to be proven after the deploy — Container App template image, 100%-traffic
  revision image and required worker job images all equal to the approved digest.
- Worker image invariant: unchanged; no worker job image changes here.
- Feature/env flag update path: none.
- Live signed-in proof required: no. Nothing here is gated on a signed-in session, and the reader-side
  behaviour is proven by a suite that renders the real component over the real bundle.

## Rollback Plan

Revert the squash commit. The component change is self-contained and the two intake files revert with
it; there is no migration and no state to unwind. Re-introducing the duplicate would restore the
misrouted detail panel, so a revert should be paired with re-opening the item rather than treated as a
resolution.

## Audit Evidence

- The pull request and its CI run, including the new `Fixture rows are named, not copied` check.
- `src/components/home/v4/__tests__/record-browser-row-identity.test.tsx` — the failure list names
  every misrouted row, so the pre-fix behaviour is reproducible from the suite alone.
- `scripts/data/fixtures/deepen-fixture-substrate.test.mjs` — the generator's contract, including the
  refusal and the no-op-on-clean-file case, which asserts mtime rather than bytes.
- The column-level diff of the two corrected files.
- The ACA deploy run keyed to the merge SHA, and the digest comparison recorded against it.

## Known Gaps

- **The canonical object ids on the same rows are still duplicated, and this release does not repair
  them.** Fourteen platforms share one `infrastructure_id` and eleven programmes share one
  `program_id` on that tenant. Those columns belong to a different repo-owned script, which mints
  them and — the half that matters — records each one in the tenant's identity ledger, so a rename
  becomes an alias against an id that never moves. Minting them from the depth pass would have
  produced ids in the ledger's shape that no ledger declares, so the depth pass now asserts only the
  columns it writes. Running the owning script repairs this, and it also mints 410 previously
  undeclared ids across 14 files, which is a change of a different size and needs its own record. It
  is filed as a separate backlog item with those numbers. Home is unaffected in the meantime: the
  row identifier the browser reads is now unique, so it never falls through to the canonical id.
- **The checked-in Home preview bundles are not regenerated**, so they still carry the duplicated
  identifier until a reviewed promotion run. The reader-side fix covers that interval by design.
- The prescribed acceptance instrument for this work — counting rendered rows — does not detect the
  defect on this bundle. That is recorded against the item so the next reader of it does not repeat
  the measurement.
