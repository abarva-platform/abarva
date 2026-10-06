# 2026-10-03-home-walkthrough-export-enterprise-context-declaration — Home walkthrough export declares an absent enterprise context

## Release ID

`2026-10-03-home-walkthrough-export-enterprise-context-declaration`

## Status

`candidate`

## Plain-English Summary

The Home walkthrough export can carry a source-linked enterprise-context section: declared business
scale, operating segments, declared priorities, function ownership, dependency paths, investment
against proof, and a risk review queue, each labelled as a synthetic reference and carrying the
source dates behind it.

That section is built from a context the export reads off the bundle it was handed. When the
bundle carries no such context, the section was simply not emitted and the document said nothing
about it. Six of the seven elements disappear together, so a reader holding only the document could
not tell a record that carries no enterprise context from one whose context was served and
rendered. Those have different owners and different fixes, and the document is the only artifact
the reader holds.

The export now states which. On every chapter that would carry a section, it prints
`ENTERPRISE CONTEXT NOT SERVED` and one sentence naming the reason:

- the export was built from the reviewed snapshot, so no serving projection was read at all;
- a serving projection was read but no context was attached to the bundle, which is a defect in the
  export's input rather than an absence in the record;
- a serving projection was read and its rows could not establish a context, with the four
  conditions the builder requires named;
- a context was established but no canonical ID-linked dependency path reached the export, so the
  dependency-paths table is withheld rather than rendered empty.

Chapters that never carry a context section are untouched, and when the narrative is aligned with
the served record the export still renders the aligned narrative alone — that was already a
deliberate choice and is now pinned by a test so a later reader cannot mistake it for a miss.

Nothing about what the record declares changed. This release only makes the document say what it
does not have.

## Layer Impact

**Release lane: `global-control-lane`.** Shared Home product behaviour for all clients, not gated
behind a flag. No client-scoped schema, seed, ingestion, retrieval or private data-plane change, so
this is not `client-data-lane`; no AbarVa-only operations capability, so not `internal-admin`; no
public route or investor-facing artifact, so not `public-demo`; and the declaration is
unconditional, so not `experimental`.

- **Layer 4 — Products (Home).** Presentation only. The walkthrough export's HTML and PDF renderers
  gain a declaration block; no new field is read from the canonical model and no number is computed.
- **Layer 3 — Canonical model.** No change. The enterprise-context builder and its preconditions are
  untouched; the new code only reports on their outcome.
- **Layers 1–2 — Intake and adapters.** No change.

## Client Applicability

- All clients: yes, for any tenant with a Home walkthrough export. The change is presentational and
  behaves the same for every tenant.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The declaration is unconditional.

## Changes Included

- `src/lib/home/export/enterprise-context.ts` — adds `ENTERPRISE_CONTEXT_CHAPTER_IDS` and
  `enterpriseContextExportAbsence`, which answers *why* a chapter carries no context section.
- `src/lib/home/export/walkthrough-export.tsx` — renders the declaration in the HTML path (both the
  mixed-narrative and reviewed-snapshot branches) and in the PDF path.
- `src/lib/home/export/__tests__/enterprise-context-declaration.test.tsx` — new behavioral suite.
- `.github/workflows/integrity.yml` — one step in the **required** `Routes and disclaimers` job runs
  `src/lib/home/export` with coverage off.
- `package.json` — `test:home-export` runs the same directory locally.

No migration, no route change, no schema change, no dependency change.

### Why the suite is wired by a named step rather than by the behaviour-directory sweep

It was first placed in `src/__tests__/behaviors`, and the required `Behavior coverage floor` check
went red there — with **188 of 188 suites and 1946 of 1946 tests passing**. The gate failed on its
own coverage floor: `lines 87.88% < 90%`.

That was measured rather than guessed, on both sides, in two separate worktrees:

| | files in denominator | lines | covered | pct | gate |
|---|---|---|---|---|---|
| merge base `3dc2d655b1` | 247 | 121,053 | 109,169 | **90.18%** | passes |
| branch, suite in `behaviors` | 268 | 132,076 | 116,076 | **87.88%** | fails |

`jest.config.ts` sets `coverageProvider: 'v8'` and declares no `collectCoverageFrom` and no
`coveragePathIgnorePatterns`, so the denominator is whatever the run loads. Exercising this exporter
loads 21 files the behaviours run had never loaded — 11,023 lines, 4,116 of them uncovered, led by
`ecl-projection-bundle.ts` (3,278 lines, 2,004 missed), the synthetic pack generator
`scripts/ecl/load_synthetic_enterprise_v1.ts` (1,081 / 733) and `page-tables.ts` (2,761 / 641).

**Remove exactly those 21 files from the denominator and the branch reads 90.18% — the base's figure
to the decimal.** No file already in scope lost coverage, and nothing was removed from the
denominator. The code this change adds measures 95.8% and 96.6%. So the red was the suite's
*exposure* of large modules, not uncovered work it introduced.

The suite therefore runs in a required job with `--no-coverage`, which is the pattern
`coverage-threshold.yml` already uses for five named suites. Nothing was weakened to achieve it: no
threshold lowered, no coverage ignore added, no case deleted, and the assertions still drive the real
exporter over a context built by the real `buildHomeEnterpriseContext` from the synthetic pack. The
alternative — rebuilding the record as a hand-written context literal to keep the module out of
scope — was rejected because it would trade real evidence for a green number.

The step names the **directory**, not one file, which also wires
`src/lib/home/export/__tests__/walkthrough-export.test.tsx`. That suite was reached by no workflow
and no npm script, so its eight green cases — including the repository's only assertions that the
five enterprise-context section titles render — gated nothing.

## QA / Validation

Measured on branch base `3dc2d655b1b537f4ff5109f689c29010578deb7e`.

**Red first, measured with the final test against unfixed source** (not carried forward from an
earlier draft): `5 failed / 2 passed` → `7 passed / 0 failed`. The two cases that pass on unfixed
source are deliberate guardrails: an export whose context *is* established must carry all seven
claimed elements and must not print a declaration, and an aligned narrative must not be declared a
gap. A fix broad enough to break either would be the wrong fix.

**Mutation check — seven mutations, seven caught, each by a distinctly named case:**

| mutation | result | caught by |
|---|---|---|
| drop the reviewed-snapshot declaration | 1 failed / 6 passed | `declares that a reviewed-snapshot export emits no source-linked enterprise context` |
| drop the context-null declaration | 3 failed / 4 passed | `declares that the served projection could not establish an enterprise context` + 2 |
| drop the dependency-proof declaration | 1 failed / 6 passed | `names the absent dependency proof rather than dropping the technology chapter's section in silence` |
| declare on every chapter (drop the membership guard) | 1 failed / 6 passed | `declares the gap on every chapter that carries a context section, and on no other chapter` |
| drop the PDF declaration block | 1 failed / 6 passed | `carries the same declaration into the PDF, not only the HTML` |
| drop the reviewed-snapshot HTML render path | 1 failed / 6 passed | `declares that a reviewed-snapshot export emits no source-linked enterprise context` |
| declare on an aligned narrative too | 1 failed / 6 passed | `treats an aligned narrative as a deliberate suppression, not a gap` |

All seven mutations were reverted and the suite returned to `7 passed`; `git status` clean of them.

**Clean baseline over the same scope, in a separate worktree at the same base commit:**
`src/__tests__/behaviors` runs `187 suites / 1939 tests / 0 failing` on the base and
`188 / 1946 / 0` on the branch. The one added suite and its seven cases are the whole difference.

**Export-adjacent suites on the branch:** `6 suites / 32 tests / 0 failing` across the
walkthrough-export route suite, its tenancy fence, the export/record parity suite, the existing
export renderer suite, and two Home preview suites.

**Typecheck:** `tsconfig.tsbuildinfo` removed first, then
`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — exit `0`, zero lines of
output, exit code judged rather than grepped. This mattered here: the first draft passed the
context under the wrong property name, the declaration silently reported the wrong reason, and the
destructured-argument mismatch is exactly what the typecheck names.

**Lint:** `npx eslint` over the three changed files — exit `0`.

**Formatting:** the new test file is Prettier-clean. The two changed source files are *not*
Prettier-clean, and were not Prettier-clean on the base commit either — verified by running
`prettier --check` against both in the baseline worktree. Reformatting them would produce a large
diff unrelated to this change, so they were left as the repository has them.

**Control gates for the wiring itself:** `scripts/quality/check-named-suite-requiredness.mjs` exits
`0` ("every individually named suite that a required job also runs is named inside a required job"),
and `unit-directory-ci-coverage`, `named-suite-requiredness` and `t557-unrun-suite-wiring` run
3 suites / 68 tests / 0 failing.

**Not validated:** no signed-in walk was performed, so nothing here is live-proven. See Known Gaps.

## Rollout Plan

Merge to `main`. The repo-owned `aca-main-deploy` workflow builds the digest-pinned image and
shifts Lab/Product web traffic; no manual Azure command is involved and no worker job image moves,
because no worker code changed. No migration to apply, no flag to flip.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, triggered by the merge to
  `main`. No other path is used.
- Shared runtime mutators: none. This change runs no `az` command and mutates no Container App
  template, revision weight, env var, secret or scale setting.
- Approved image digest: assigned by the deploy workflow for the squash SHA; recorded in the claim
  log and the pulse entry once the run keyed to that SHA completes.
- ACA runtime invariant: to be proven after deploy — the Container App template image must equal the
  image on the sole 100%-traffic revision, and that revision must be active, Healthy and Running.
- Worker image invariant: no worker image is expected to move. The main deploy workflow carries one
  `--image` and it targets the web Container App only; this change touches no worker code.
- Feature/env flag update path: not applicable. No flag.
- Live signed-in proof required: yes, and it is owed, not performed. The export is reachable only
  behind a Clerk session, and an agent must not perform a signed-in acceptance.

## Rollback Plan

Revert the squash commit and let the repo-owned deploy workflow build and ship the parent image.
The change is additive and presentational: reverting restores the previous silence and removes
nothing a reader depends on. No migration, so no migration rollback constraint. The behavioral
suite reverts with the code, so no gate is left asserting behaviour that is no longer present.

## Audit Evidence

- The pull request for this record, its CI run, and the `Behavior coverage floor` job within it —
  that job is the one that executes the new suite, so it is the run to read rather than the PR's
  aggregate tick.
- The red-first and mutation numbers in **QA / Validation** are reproducible from the branch:
  restore the two source files from the merge base, run the suite, and the five named cases fail.
- `aca-main-deploy` run keyed to the squash SHA, and the read-only `az containerapp show` output
  behind the runtime invariant above.

## Known Gaps

- **Signed-in acceptance is owed and is not claimed.** A green suite proves the exporter declares
  the four absence states it can reach; it does not prove what the live export renders for a
  signed-in reader. The honest ceiling for this record is `deployed`.
- **One element of the seven is not section-owned.** `source dates` is rendered by the document
  header as well as by the section, so it reads present even when the section is wholly absent. The
  declaration makes that unambiguous but does not change where the element comes from.
- **The behaviour coverage floor's denominator is accidental, and `main` has 0.18 percentage points
  of headroom above it.** Because the gate collects v8 coverage with no `collectCoverageFrom`, any
  new behavioural suite that exercises a large under-covered module lowers the total regardless of
  how well the new code is covered — as this change demonstrates, at 95.8% and 96.6% on its own
  files. That makes the gate an obstacle to adding behavioural coverage, which is the opposite of
  its purpose and works directly against the backlog's standing request for a behavioural test per
  declared control. Giving the gate an explicit `collectCoverageFrom` scope would fix it, but that
  changes a required gate's meaning repository-wide and is a decision rather than a drive-by; it is
  **not** done here and is raised for the owner. The workaround used here is sound and established,
  but it is a workaround.
- **Out of scope:** whether the live export *should* read the serving projection when no `provider`
  query parameter is supplied. That is a routing question about which bundle the export is handed,
  not about whether the document says what it was handed, and changing it would alter what every
  export contains.
