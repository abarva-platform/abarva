# 2026-09-25-source-surface-vocabulary-audit-slice — Source surface vocabulary audit, first slice

## Release ID

`2026-09-25-source-surface-vocabulary-audit-slice`

## Status

`candidate`

## Plain-English Summary

The Source canvas was showing internal storage names to the people who read it.

Three cells on the canvas printed the raw code of an intake template — the string
the engine files an upload under — instead of the name the product already
publishes for it. A client asked to supply ticket volumes saw the code, not
"Ticket volumes & volumetrics". Separately, eleven explanatory notes on the
Intelligence tab told the reader which internal field a figure would be stored
in: "upload the award commitments so each lever gets a `committed_value_usd`
fact". One of those notes was worse than the rest — it printed a list of missing
field names assembled while the page was rendering, so no search of the source
code would ever have found it.

All of it now reads the name the product already publishes for that template or
that figure. Nothing was renamed by hand: the label is read from the same
registry the rest of the product reads, so a template or figure whose wording is
improved later is named correctly without anyone editing these screens.

The change also widens the automated check that catches this class of defect.
That check previously mounted three Source screens; it now also mounts the main
canvas — driven through all five of its workspaces and both of its collapsed
sections, the way an operator actually reads it — and the per-step intelligence
panel across every kind of insight the product can build. The canvas audit found
the defects above. Where a code is deliberate rather than accidental — the
document register prints each document's code beneath that document's own
published name, in a monospaced sub-line, and it is the same string the export
routes take — it is recorded as examined and left, with the reason, and the
product decision is filed as separate work rather than guessed at here.

## Layer Impact

Release lane: `global-control-lane` — shared Source surface behavior for all
clients, not feature-gated and not client-scoped.

- `4 PRODUCTS` — Source. Rendered copy on the canvas and on the Intelligence
  tab. No read model, no route, no schema, no retrieval and no number changed;
  every figure is the same figure, described by its published name.
- Test/tooling — the render-measured vocabulary control gains two surfaces, and
  two catalogue guards now assert that every shipped template and every shipped
  fact carries a non-empty client-facing label, which is what makes the new
  "read the published label" path safe to depend on.

## Client Applicability

- All clients: yes — copy on shared Source surfaces, not gated.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx` — new
  `clientTemplateName` helper reading `templateFactMapByCode`; three cells
  (evidence-ask table, guide prep table, upload readback) now render the
  published template label.
- `src/lib/source/facts/view/step-insight-builder.ts` — new `clientFactName`
  helper reading `factSpecByKey`; nine note strings and the transition-risk
  `missingEvidence` join now name the published label for a fact rather than its
  key.
- `src/components/source/__tests__/source-surface-builder-vocabulary.test.tsx` —
  two new audited surfaces with their walks, the derived document-code
  adjudication, and the guard case proving that adjudication is a rule and not a
  blanket pass.
- `src/testing/source-builder-vocabulary-coverage.ts` — the two new roots
  declared, so the committed coverage artifact knows about them.
- `docs/architecture/source-builder-vocabulary-render-coverage.json` —
  regenerated.
- `src/lib/source/facts/__tests__/template-fact-map.test.ts`,
  `src/lib/source/facts/__tests__/fact-catalog.test.ts` — per-entry label
  guards.
- Three existing canvas suites and one insight fixture updated, each with the
  reason recorded inline: they asserted that the raw code renders, which
  codified the defect.

## QA / Validation

Status: **pass.** Every check below ran locally on this branch and passed; none
was skipped, and nothing here is blocked or not-run.

Baseline measured on a separate clean worktree of `origin/main` over the same
scope, not by subtracting from memory:

```
npx jest src/components/source src/lib/source/facts \
  src/__tests__/behaviors/source-builder-vocabulary-render-coverage.test.ts \
  --no-coverage --ci
```

- Before, on a clean checkout of `origin/main`: **103 suites, 822 tests, 0
  failing**.
- After, on this branch: **103 suites, 837 tests, 0 failing** (+15 cases, no new
  suite file).

Typecheck: `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty
false` — **exit 0**, judged by exit code, not by grepping for `error TS`.

Lint: `npx eslint` over every changed file — clean.

**Each new assertion was shown to be able to fail.** Four deliberate mutations,
each reverted immediately after:

| mutation | result |
|---|---|
| restore the raw template code in the evidence-ask cell | canvas case red — reported `templateVOLUMETRICS_V1` |
| restore the fact key in one Intelligence note | insight case red — reported `committed_value_usd` |
| make the document-code adjudication return a reason unconditionally | guard case red |
| rename one of the two canvas disclosures | canvas case red — "never found the control, so the surface behind it was not audited" |

Rendered yield, measured rather than asserted:

| rank | surface | prescreen candidates | terms actually rendered |
|---|---|---|---|
| 1 | the canvas, all five workspaces | 32 | **10** — 5 template codes (fixed), 5 document codes (examined and left) |
| 5 | per-step insight panel, all 11 kinds | 11 | **6** — all fixed; **none of them from this file** |

Two findings about the prescreen itself, which is the number the next slice
needs:

1. The ranking **is** predictive at the top: rank 1 produced ten terms, and the
   walk was worth building — reading the canvas once audits 6 KB of text, and
   driving it the way an operator does audits 84 KB.
2. The per-file ranking **cannot rank a container**. All 11 of rank 5's
   candidates are `switch` discriminants and not one of them renders; the six
   real terms came from the panel's children. A file-level prescreen is
   therefore a floor on a dispatcher, never an estimate.

Committed coverage artifact, read per path in both directions as the item
requires: covered upper bound **2 → 43** of a 102-file route-reachable
population, remainder **100 → 59**. 41 paths entered `coveredPaths` and the same
41 — name for name — left `remainderPaths`; nothing else moved.

`node scripts/release-check.mjs --base origin/main --head HEAD` — recorded in
the PR.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds and deploys on
merge. No migration, no flag, no worker job, no data build.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge
  to `main`.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the main deploy workflow; recorded in the
  pulse entry for this item.
- ACA runtime invariant: to be proven after deploy — Container App template
  image digest equal to the 100%-traffic revision digest.
- Worker image invariant: unaffected; no worker job touched.
- Feature/env flag update path: none.
- Live signed-in proof required: **No.** Every claim in this record is a
  rendered-DOM assertion in jsdom over the product's own components, builders
  and canonical specs — no tenant read model and no signed-in surface is
  involved, and a signed-in run would not prove anything this suite does not.

## Rollback Plan

Revert the squash commit. The change is copy plus test scope; there is no
migration, no persisted state and no schema, so a revert is complete on the next
deploy. Reverting restores the raw codes on those cells — which is the defect,
not a neutral state, so prefer a forward fix.

## Audit Evidence

- PR URL — recorded in the pulse entry for this item.
- CI run for the merge commit.
- The four mutation results in the table above, each with the term the control
  reported.
- `docs/architecture/source-builder-vocabulary-render-coverage.json`, whose
  `coveredPaths` and `remainderPaths` name every path that moved.

## Known Gaps

- **32 of the ranked 34 surfaces remain unaudited by a render-measured control.**
  This slice took ranks 1 and 5 and stopped there deliberately. Ranks 2 and 3
  (`SourceOptimizeContractPage.tsx`, 25 candidates;
  `new-workspace/SourceNewWorkspace.tsx`, 17) are page-level surfaces that each
  need a page-sized set of required server projections before they will mount;
  that is its own slice, not a paragraph in this one.
- **`coveredPaths` is an upper bound and must not be quoted as proven
  coverage.** It is an import closure, and importing a module is not rendering
  it. 43 route-reachable files are now reachable from an audited root's import
  graph; what this release *proves* is the rendered text of two roots. The
  artifact says so in its own `upperBoundCaveat`, and the gap — 59 files no
  audited root can reach at all — is the sound half of the measurement.
- **The document register's code is examined and left, not resolved.** Whether a
  client-facing register shows a document code at all, and whether as
  `d04_app_inv` or a display form such as `D04`, is a product decision. Filed as
  a follow-on backlog item with a recommendation; the adjudication is derived
  from `SOURCE_ARTIFACT_SPECS`, so it will not outlive the codes it describes,
  and the control's staleness half deletes it once the decision lands.
- The label fallback (render the code when the registry publishes no label) is
  deliberately visible rather than hidden behind a vague phrase. Two per-entry
  guards assert it is unreachable today; if a template or fact ever ships
  without a label, those guards redden before the fallback can render.
