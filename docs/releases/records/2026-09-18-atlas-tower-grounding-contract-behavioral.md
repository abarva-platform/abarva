# 2026-09-18-atlas-tower-grounding-contract-behavioral — a contract test that passed because of an unused import

## Release ID

`2026-09-18-atlas-tower-grounding-contract-behavioral`

## Status

`candidate`

## Plain-English Summary

A test that claimed to prove the advisor prompt is wired to current Tower state and to
retrieved corpus context was not checking the wiring at all. It opened the module as a
text file and asserted that six words appeared somewhere inside it. One of those six,
`formatTowerCurrentStateForPrompt`, was present only as an import that nothing called —
a different function does that formatting — so the test was reporting a symbol's
presence as evidence of behaviour.

That is measured rather than argued. Deleting the unused import is a change with no
effect on any prompt the product ever sends, and it turned the test red: 1 failed / 4
passed. A check that can be broken by a no-op, and satisfied by an import, is not
evidence the behaviour exists.

The case is now four cases that run the real prompt assembly and read the prompt
actually handed to the audited model client. They assert that current Tower state is
queried and its business facts reach the prompt, that retrieval runs and the retrieved
text reaches the prompt, that the citation instruction and the cited source key are
present, and that record identifiers are withheld from the supporting payload. The
unused import is removed, which also clears an ESLint `no-unused-vars` warning that had
been reporting this all along.

## Layer Impact

- Lane: `global-control-lane`.
- Layer 4 (products) — Tower advisor prompt assembly. No behaviour changes: the only
  non-test edit deletes an import that no code path referenced, proven by the suite
  returning byte-identical results before and after that deletion.
- CI control surface — one step added to an existing required job. No new required
  context, no change to any other workflow.
- Layers 1–3 untouched. No intake, adapter, canonical-model, schema or data change.

## Client Applicability

- All clients: no observable change. The product behaves identically.
- Specific clients: none.
- Internal only: the test coverage change is internal.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/__tests__/integration/atlas/atlas-tower-grounding-contract.test.ts` — the
  source-text case over the advisor module is replaced by four cases that drive the real
  `runAtlasLlm` and assert on the assembled prompt.
- `src/lib/atlas/llm.ts` — removes the unused `formatTowerCurrentStateForPrompt` import.
- `.github/workflows/atlas-quality.yml` — adds one step so the suite actually runs in CI.
  See **QA / Validation**: no workflow ran `src/__tests__/integration` at all.

## QA / Validation

**The defect, measured before any edit** (clean `origin/main`, `eccd7aee6`): the suite is
green at 5 passed / 5 total. Deleting the unused import — no behavioural effect —
produces **1 failed / 4 passed**. With the replacement suite in place the same deletion
produces **0 failed / 8 passed**: the check is now silent on a no-op and loud on a
regression.

**Suite:** 5 passed / 5 total before → **8 passed / 8 total** after.

**Four mutations of the real assembly, each caught by the case that should catch it:**

| mutation | result |
|---|---|
| drop `towerContext` from the user message | 1 failed — the Tower-state case |
| drop `retrievedContext` from the user message | 2 failed — the retrieval case and the citation case |
| drop `CITATION_INSTRUCTION` from the user message | 1 failed — the citation case |
| serialize tool results without `sanitizeForTenantPrompt` | 1 failed — the identifier case |

**The finding worth keeping, because it is the same defect one layer in.** The first
draft of the replacement asserted over the whole prompt, and dropping `retrievedContext`
left the retrieval case **green**. The tool results are serialized into the prompt's
payload half as well, so the retrieved chunk appears twice for two different reasons and
an unscoped `toContain` could not tell which one it had found. The `RETRIEVED CONTEXT`
header was worse: `CITATION_INSTRUCTION` names that header in its own wording, so the
header survived the section being deleted. Every assertion is now scoped to the composed
prose half of the prompt, above the payload marker, and the reason is written beside the
helper. Without that scoping this record would have claimed a mutation was caught by a
case that was reading something else.

**Scope baseline, same command either side** — `npx jest src/__tests__/integration/atlas
src/lib/atlas`: **3 suites / 3 tests failing before → 3 / 3 after**, with a byte-identical
failing-suite list (`atlas-ask-route`, `orchestrator-governed-tower`,
`tower-grounding-client-name` — all pre-existing). Passing 283 → 286, total 291 → 294,
which is the five replaced cases becoming eight.

**Gate checks, all judged by exit code:** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc
--noEmit --pretty false` exit 0 with `tsconfig.tsbuildinfo` removed first; `npx eslint`
exit 0 on both changed files with **no output**, where before the change it reported
`'formatTowerCurrentStateForPrompt' is defined but never used`.

**Where the suite runs — and the second defect, found by checking rather than assuming.**
`src/__tests__/integration` is one of the three directories in `test:before-commit`, and
on this repository that has been read in several records as meaning CI-covered. It is
not. **No workflow runs that directory.** `coverage:behavior-gate` runs
`src/__tests__/behaviors` only; `production-readiness-gate.yml` runs one named file from
the integration tree; `atlas-quality.yml` *triggers* on
`src/__tests__/integration/atlas/**` but its only step was `npm run atlas:eval`. So this
suite had been enforced by a local command and by nothing in CI — and making a check able
to fail is worth little if it fails nowhere.

This change therefore adds one step to `atlas-quality.yml`, the workflow whose path
filter already names both `src/lib/atlas/**` and `src/__tests__/integration/atlas/**`.
The step is inside the existing required job, so no new required context is created. The
CI log is read after push to confirm the step **executed**, not merely that it is present.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds and deploys from the
merge SHA as usual. No migration, no flag, no manual runbook, no data build.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No Azure command is run by hand for this change.
- Approved image digest: produced by the main deploy workflow from the merge SHA.
- ACA runtime invariant: to be proven after merge — Container App template image equals
  the 100%-traffic revision image, digest-pinned.
- Worker image invariant: unchanged; no worker job is touched.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no**, and the reason is specific rather than a
  wave-through. The only non-test edit removes an import nothing referenced, so the
  assembled prompt and every rendered answer are byte-identical before and after. There
  is no surface a signed-in session could observe a difference on. The proof that matters
  is the assembled prompt, and the suite reads it directly.

## Rollback Plan

Revert the PR. Three files, no schema, no data, no runtime configuration. Reverting
restores the previous test, the unused import and the workflow without the extra step;
nothing else changes.

## Audit Evidence

- The PR and its CI run.
- The before/after and mutation figures in **QA / Validation**, each reproducible by the
  commands named there.
- ESLint output on `src/lib/atlas/llm.ts` before and after, showing the unused-variable
  warning clearing.
- The `Atlas quality` CI job log for this PR, showing the new step executing the suite.

## Known Gaps

- **The function itself is now orphaned.** `formatTowerCurrentStateForPrompt` is exported
  from `src/lib/atlas/tower-grounding.ts:431` and, with this import gone, has no importer
  anywhere. Deleting an exported function is a different decision from removing a lying
  import and would widen the review surface for no gain here, so it is reported rather
  than swept in. Same treatment as the sibling finding logged during the previous change
  on this module.
- **One source-text assertion is deliberately left standing in the same file.** The case
  covering the retrieval fallback reads `src/lib/agent/retrieval.ts` as text. Its subject
  is live — the function is defined at line 160 and called at line 294 — so it is a weak
  assertion, not a false one, and it is not the class this change removes. Driving it
  behaviourally means standing up the vector-search failure path, which is its own piece
  of work. The reason is written beside the case so it is a decision rather than an
  oversight.
- Signed-in acceptance is not owed here; see **Deployment Authority** for why.
