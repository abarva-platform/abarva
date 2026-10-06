# 2026-10-05-moves-expected-exhibit-attribution — the exhibit shortfall names the visual that is actually absent

## Release ID

`2026-10-05-moves-expected-exhibit-attribution`

## Status

`candidate`

## Plain-English Summary

When the product generates a client document, the brief states which exhibits
the document is expected to contain. A quality check then compares what was
expected against what arrived and, if something is short, warns with a count
and a list of titles — "2 of 4 received — missing: X, Y".

The count was right. The list of titles was not.

The check paired expected exhibits with produced ones **by shape alone** — a
matrix with any matrix, a timeline with any timeline — taking them in the order
the brief declared them. Titles and keys were read only to print the message,
never to decide the pairing. So whenever a brief asked for two or more exhibits
of the same shape, the first-declared one claimed whatever arrived and the rest
were listed as missing. If the exhibit that actually arrived was not the
first-declared one, the warning named a visual that was sitting in the
document, while the one genuinely absent was silently counted as received.

That is worse than no warning at all: an operator reads a specific, confident
title and goes looking for something already on the page, and the real gap
keeps its credit. It was also not a corner case — measured over the shipped
catalogs, **86 of the 105** section-flow × use-case briefs the registry can
compose declare two or more expected exhibits of the same shape, so the
mis-attribution was the normal path rather than the exception.

The pairing now runs in two passes. First it claims the pairs that identify
each other — same shape **and** the same title or key, compared loosely, since
the generation prompt names expected exhibits by title and the author echoes
it. Then the original shape-only rule runs over whatever is left, so no brief
loses a pairing it had before.

The number the warning prints is deliberately unchanged. Within one shape, both
the old rule and the new one leave a maximal pairing, so the received count is
still the sum over shapes of min(expected, produced). Only the attribution
moves. Both halves of that claim are pinned by tests, because a change that
improved the names and quietly moved the number would be a worse regression
than the defect it replaced.

## Layer Impact

Release lane: `global-control-lane` — shared app behaviour for all clients, not
feature-gated.

- **Layer 4 — Products (Moves).** The advisory quality warning attached to a
  generated Moves artifact now names the correct missing exhibits. No layer-3
  canonical object, no metric or fact value, and no stored number changes.
- **Layers 1–3 — unaffected.** No intake tab, source adapter, schema,
  migration, loader, or canonical record is touched. The change is confined to
  one pure function inside the deliverable quality gate.

## Client Applicability

- All clients: yes — the gate runs for every generated artifact, and the
  corrected warning text is what an operator reads. No client-visible document
  content changes; only the advisory diagnosis attached to it.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is a correction inside an existing advisory
  check, is strictly additive to the previous pairing rule, and cannot refuse an
  export, so it carries no flag.

## Changes Included

- `src/lib/deliverables/orchestrator/quality-validator.ts` — `matchExpectedExhibits`
  rewritten as two passes; new `exhibitIdentity` and `identifiesSameExhibit`
  helpers. No exported surface added or changed.
- `src/lib/deliverables/orchestrator/__tests__/expected-exhibit-attribution.test.ts`
  — new suite (14 tests) in the CI-wired `__tests__` directory already named in
  `.github/workflows/unit-suites.yml`.
- `docs/architecture/test-ci-coverage-census.json` — regenerated; `testFiles`
  2714 → 2715, `coveredTestFiles` 2550 → 2551, uncovered unchanged, which is
  the proof the new suite is reached by a required job rather than sitting in a
  dark directory.

No route, no API surface, no schema, no migration, no flag registry entry, no
script, and no generated client artifact changed.

## QA / Validation

Lane: `global-control-lane`.

- **PASS** — pre-fix baseline. With `quality-validator.ts` restored to its
  `origin/main` state, the new suite reports **4 failed, 10 passed**. The four
  failures are exactly the attribution cases; every count case passes on both
  sides, which is the evidence that the received figure does not move.
- **PASS** — `npx jest src/lib/deliverables/orchestrator/__tests__/` → 46
  suites, 541 tests, all passing. The whole directory, not only the two related
  suites, because the change is inside a function the directory's other suites
  drive through the real validator.
- **PASS** — the pre-existing `c514-expected-exhibit-shortfall.test.ts` (7
  tests) passes unchanged both before and after. Its one same-shape case happens
  to declare the delivered exhibit first, so it is green either way; that is why
  it never caught this.
- **PASS** — mutation testing, 6 designed mutations, **6 of 6 killed**:
  deleting the identity pass (4 failures), letting identity ignore shape (2),
  not consuming the arrival in the identity pass (11), comparing raw strings
  instead of normalised ones (1), dropping the title↔key cross-comparison (1),
  and deleting the shape-only fallback pass (2).
- **PASS** — reachability measurement, run as a test rather than asserted: 105
  composable briefs, 86 with a same-shape expected set, and one shipped pack
  declaring three exhibits of one shape. Both are read off the live catalogs, so
  the premise stops holding the moment the catalogs stop making it true.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`,
  exit code 0, no diagnostics.
- **PASS** — `npx eslint` on both changed files, no findings.
- **PASS** — `npm run release:check -- --base origin/main --head HEAD`.
- **NOT RUN** — signed-in live walk. Nothing in this change is rendered on a
  product surface: the corrected text is an advisory warning on the generation
  result, and reaching it requires a real generation run against the AI egress
  path. This record therefore claims `merged`, not `live-proven`.
- **NOT RUN** — end-to-end generation smoke. Same reason; a generation run is a
  data-lane action and is out of this lane.

## Rollout Plan

Merge to `main` via squash, through the repo-owned pull-request path. No image
build, no Azure Container Apps deploy, no migration, no flag change, and no
environment-variable update is required for this to take effect — the corrected
function ships with the next image built from `main` by the repo-owned deploy
workflow on its own schedule.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`. This
  release requests no out-of-band deploy.
- Shared runtime mutators: none. No `az containerapp update`, no traffic shift,
  no revision weight change, and no Container App template edit is part of this
  release.
- Approved image digest: not applicable — no runtime image is pinned, replaced,
  or promoted by this release.
- ACA runtime invariant: unchanged. The invariant is neither asserted nor
  altered here; the next main deploy proves it as usual.
- Worker image invariant: unchanged. No worker job image, schedule, or argument
  is touched.
- Feature/env flag update path: not applicable. No flag registry entry and no
  environment variable is added, removed, or re-scoped.
- Live signed-in proof required: no, for this release. The change is not visible
  on any signed-in surface, so no walk can prove or disprove it.

## Rollback Plan

Revert the single squash commit. The change is one pure function plus one test
file plus a regenerated census; there is no migration, no stored value, no flag
state, and no generated artifact to unwind, so a revert restores the previous
pairing rule exactly and immediately. No data repair is possible or needed,
because nothing was written.

If a narrower rollback is wanted, deleting the identity pass and its two helpers
restores the previous behaviour on its own — the fallback pass **is** the old
rule, kept verbatim.

## Audit Evidence

- The pull request for this record, its diff, and its CI run.
- The pre-fix baseline figure (4 failed / 10 passed) is reproducible by checking
  out `origin/main`'s `quality-validator.ts` under this branch's test file and
  running the new suite.
- The mutation table in QA / Validation above, each row reproducible by applying
  the named edit to `matchExpectedExhibits` and running the two suites.
- The reachability figures (105 composable, 86 same-shape, 3 of one shape) are
  produced by the first two tests in the new suite and appear in its output.
- `docs/architecture/test-ci-coverage-census.json` in this diff, whose
  `coveredTestFiles` increment with unchanged uncovered count is the CI-wiring
  proof for the new suite.

## Known Gaps

- **Advisory only, on purpose.** The shortfall remains a warning and does not
  refuse an export. Escalating it to a blocker decides whether a client document
  is withheld, which is a product decision and is deliberately not taken here.
- **Shape-only pairings are still arbitrary among peers.** When nothing
  identifies itself, the fallback pass pairs by shape in declaration order,
  exactly as before. That residual arbitrariness is intended: it is the only way
  to credit an exhibit the author named freely, and tightening it would make the
  gate stricter than the one it replaces.
- **Expected exhibits are still not de-duplicated by key.** The brief composer
  concatenates a section flow's expected exhibits with a use-case pack's with no
  de-duplication. The shipped catalogs collide on zero keys today — probed, and
  the zero is why no test here can kill a guard for it — but a *configured* pack
  will be able to collide once the pack configuration loader has a caller, and a
  duplicate would inflate the warning's denominator so the shortfall could never
  close. Owed as its own slice, after that loader is wired.
- **A pack's declared evidence families are still free strings.** They are
  checked against no vocabulary, so a typo yields a retrieval query for a family
  that does not exist, silently. Unchanged by this release and worsened once
  packs are configurable by an operator.
- **No live proof.** As recorded under QA / Validation, this release is not
  `live-proven`; it claims only that it is merged and locally validated.
