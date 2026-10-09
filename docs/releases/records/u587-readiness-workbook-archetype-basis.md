# u587 — The readiness workbook says which archetype shaped its questions

## Release ID

`2026-10-07-readiness-workbook-archetype-basis`

## Status

`candidate`

## Plain-English Summary

A stage-readiness workbook asks an operator a fixed set of questions before a
Move can leave a phase. Those questions are not generic: they are the evidence
families of the resolved use-case archetype, so the archetype decides every
question asked and every gap the workbook reports.

Until this change the workbook never told the operator which archetype it had
used. The archetype label was written only into the workbook's `_metadata`
sheet, which is marked `veryHidden` — the person filling the workbook in cannot
open it. Worse, the readiness evaluator already computes *what decided* that
archetype and whether anyone declared it, and it already hands both of those
facts to the workbook builder on the same object the builder reads for
everything else. The builder ignored both. So a workbook built on an archetype
that a human declared and a workbook built on a keyword guess — or on the
general-case fallback because nothing was declared at all — were
indistinguishable to the operator answering them.

There is a sharper case. When a declaration *is* supplied but does not name a
catalog archetype, the resolver discards it and falls back to the general-case
question set, recording the discarded value. The type carrying that value says
in its own documentation to show it rather than present the archetype as
declared. Nothing showed it. The operator who supplied the declaration received
a general-case workbook with no indication that what they declared had been
dropped.

This change derives one sentence from the two provenance facts and puts it on
the workbook's visible first sheet, on a new `Question set` row beside the Move
and workbook name. The sentence names the archetype, says what decided it, and
says "declared" only when a declaration actually resolved. A discarded
declaration is quoted and stated first, because the person who supplied it is
the one who most needs to know it did not take effect. The same sentence travels
into the sample evidence pack, whose rows are shaped by the same archetype, and
the basis is additionally recorded in `_metadata` so a parsed workbook keeps the
provenance.

No question, dimension, gap, score, or gate verdict changes. This change adds a
statement of basis; it does not alter what the workbook asks or how readiness is
computed.

## Layer Impact

Release lane: `global-control-lane`

- **Layer 4 (Products — Moves).** The stage-readiness workbook and the sample
  evidence pack, both reached from the phase workspace, now state the basis of
  their own question set. Presentation only; the question set is unchanged.
- **Layer 3 (Canonical model).** Not changed. The two provenance facts already
  existed on the readiness object and are now read rather than dropped. Nothing
  new is loaded, persisted, or inferred.

## Client Applicability

- All clients: yes — the workbook and sample pack routes are not flag-gated, so
  every tenant that can download a readiness workbook gets the basis sentence.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The behaviour is unconditional.

## Changes Included

- `src/lib/programs/stage-readiness-workbooks/archetype-basis.ts` (new) — derives
  the basis statement from `blueprintBasis` and `unknownDeclaredArchetype`, and
  exports `DECLARED_ARCHETYPE_MARKER`, the one phrase that asserts a declaration.
- `src/lib/programs/stage-readiness-workbooks/resolver.ts` — the spec builder
  now derives `archetypeBasis` from the readiness object it already receives.
- `src/lib/programs/stage-readiness-workbooks/types.ts` — `archetypeBasis` on the
  workbook spec.
- `src/lib/programs/stage-readiness-workbooks/xlsx.ts` — the visible `Question
  set` row on `Start Here`, plus three `_metadata` rows.
- `src/lib/programs/stage-readiness-workbooks/synthetic-evidence-pack.ts` — the
  same sentence in the pack's `README.md` header.
- `src/lib/programs/stage-readiness-workbooks/__tests__/xlsx.test.ts` — two
  `Start Here` assertions changed from absolute cell addresses to item-name
  lookup. They pinned `A5`/`A6`, so adding any row above them failed the case
  for a position change rather than a behaviour change.
- `src/lib/programs/__tests__/stage-readiness-archetype-basis.test.ts` (new, 8
  cases) and `src/lib/programs/__tests__/stage-readiness-workbook-archetype-render.test.ts`
  (new, 6 cases).
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- **PASS** `npx jest src/lib/programs/__tests__` — 164 suites, 2106 tests. This
  is the directory the required check `AI surface control catalog` sweeps, which
  is why both new suites live here rather than beside the module: the workbook
  module's own `__tests__` directory is wired only in `Unit suites that pass on
  main`, which is not a required context and so cannot fail a merge.
- **PASS** `npx jest src/lib/programs/stage-readiness-workbooks/__tests__` — 10
  suites, 101 tests, including the sibling case whose assertions were
  de-positioned.
- **PASS** the two consuming route suites
  (`stage-readiness-workbook`, `stage-readiness-evidence-pack`) — 17 tests.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json
  --noEmit` — exit 0, no output.
- **PASS** `npx eslint` over every changed path — exit 0.
- **PASS** mutation testing, 8 of 8 killed. The two that matter are the wiring
  hops, which a module-only suite would have left unpinned: deleting the visible
  `Start Here` row (3 cases fail) and replacing the resolver's
  `input.readiness.blueprintBasis` pass-through with a hardcoded `"declared"`
  (3 cases fail). Also killed: dropping the discarded declaration in the
  resolver, leaking the declared marker into the general-case clause, appending
  the discard instead of leading with it, removing the sentence from the evidence
  pack, hardcoding the `_metadata` declared flag, and marking `Start Here`
  hidden. Baseline restored to 14 of 14 green afterwards.
- **PASS** resolver probe against the real catalog, which is what established the
  cases rather than assuming them: no declaration yields basis `default` and the
  general-case blueprint; a `functionPackKey` or charter archetype that names no
  catalog archetype yields basis `default` with the supplied value carried as the
  discarded declaration; only an id that resolves yields a declared basis.
- **PASS** `npm run audit:test-ci-coverage:write`. Counts move 2833/2668/2667 to
  2837/2672/2671, and the split is worth stating: `main`'s committed census was
  already **two files behind its own tree** when this branch was cut (the base
  tree regenerates to 2835/2670/2669), so **+2 is inherited drift and +2 is
  mine** — the two new suites. `uncoveredTestFiles` holds at 165 throughout,
  which is the proof both new suites landed covered rather than dark.
- **NOT RUN** live signed-in walk. No runtime rollout happens from this record,
  and a signed-in walk is a human step.

## Rollout Plan

Merge to `main`. No migration, no flag, no environment variable, no worker job.
The change is in the server-side render path of two existing GET routes and
becomes active with the next image build through the repo-owned ACA main deploy
workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`. Nothing
  here deploys outside it.
- Shared runtime mutators: none. No `az` command, no revision weight change, no
  Container App template change.
- Approved image digest: not applicable at merge; the main deploy workflow pins
  the digest it builds.
- ACA runtime invariant: unchanged by this record. The existing invariant proof
  applies at the next deploy and is not claimed here.
- Worker image invariant: not applicable. No worker job changes.
- Feature/env flag update path: not applicable. No flag.
- Live signed-in proof required: yes, to call the operator-facing sentence
  live-proven. This record claims `merged`, not `live-proven`.

## Rollback Plan

Revert the squash commit. The change is additive and read-only with respect to
stored data: it adds one spec field, one visible spreadsheet row, three hidden
metadata rows, and one README line. No migration, no backfill, no persisted
shape change, so a revert needs no data repair. The workbook content hash is
computed over the spec and therefore changes with this release; a workbook
generated before the revert and parsed after it still parses, because the parser
reads metadata keys by name and tolerates keys it does not know.

## Audit Evidence

- The PR for this record and its CI run.
- The mutation table in QA / Validation above: which line was changed, and how
  many cases failed for each.
- `uncoveredTestFiles` at 165 across the committed, base-regenerated, and final
  censuses, which is what distinguishes a registered suite from a dark one.

## Known Gaps

- **The basis is stated on the workbook, not yet in the product UI.** The phase
  workspace renders a `Download P{N+1} readiness workbook` control and a
  readiness pack with open needs; neither surface says what archetype shaped the
  needs. The sentence now exists and is derivable at the surface, but no
  component reads it. That is the natural follow-up and is not in this change.
- **`inferred` is reachable in type but was not reproduced from a program
  fixture.** The probe produced `declared` and `default` from realistic program
  shapes; keyword inference did not fire for the inputs tried. The `inferred`
  clause is covered by unit cases over the basis value directly, so the sentence
  is correct if the resolver ever returns it, but this record does not claim to
  have observed a program that produces it.
- **A declared basis is not proof the declaration is *right*.** The sentence
  reports who chose the archetype, not whether the choice fits the Move.
- **The `_metadata` basis rows have no parser field.** They are written and
  survive a round trip, but `StageReadinessWorkbookParsedMetadata` does not
  expose them, so nothing downstream reads the basis back yet.
