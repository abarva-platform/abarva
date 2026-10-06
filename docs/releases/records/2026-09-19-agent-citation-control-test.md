# 2026-09-19-agent-citation-control-test - The Citation Control Gets A Test That Can Fail

## Release ID

`2026-09-19-agent-citation-control-test`

## Status

`candidate`

## Plain-English Summary

The shared agent response renderer carries five declared AI controls. Four of
them had a behavioral test. The fifth — the one that makes a cited claim resolve
to its source rather than showing the reader a raw `{{cite:...}}` placeholder —
had none, and the catalog said so in writing.

This adds the missing test and wires it into the same CI job as its four
siblings, so the control is now proven by something that runs rather than by a
component name appearing in a file.

Nothing about the product changed. The control already worked; what was missing
was any way to notice if it stopped.

## Layer Impact

`global-control-lane`, and only its test and gate surface — layer 4 (products)
in the enterprise information architecture. No change to the
canonical model, to any adapter, to any loader, or to any rendering code. The
three product files this work touched (`AgentResponse.tsx`,
`markdownTokens.tsx`, `AgentCitation.tsx`) were each edited only to run a
mutation and were restored immediately; the final diff contains none of them.

## Client Applicability

- All clients: no behavior change. The control being tested is on the shared
  response renderer every agent surface uses.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/agent/__tests__/AgentResponse.citation-control.test.tsx`
  (new) — ten cases driving the real `AgentResponse`.
- `docs/security/ai-surface-control-catalog.json` — the `citation` control of
  `agent-response-output` moves from `status: "none"` to that path. One entry;
  nothing else in the catalog changed.
- `.github/workflows/ai-surface-control-catalog.yml` — one appended step that
  runs the suite.
- `src/components/agent/__tests__/AgentResponse.controls.test.tsx` — comment
  only. That suite carries a case documenting what it cannot prove, and the
  comment told the next reader to go and write the suite this change writes.
  The assertion is untouched and still passes; only the pointer is corrected.

## Why a second suite rather than more cases in the first

`react-markdown` is mocked repo-wide to a passthrough because its ESM breaks
`next/jest`'s transform, and citation substitution happens inside
react-markdown's component overrides. The existing suite runs under that mock on
purpose: its four controls are then proven against the component exactly as
every other suite in the repo renders it.

Covering the fifth needs `@/lib/agent/markdownRenderer` stood in for, which
would change what the other four are proven against. So the coverage lives in
its own file and the first suite keeps its honest limit.

## What the test actually proves, and what it does not

The control is a two-link chain, and the links fail differently.

1. `AgentResponse` builds a placeholder-to-node map from `response.citations`,
   keyed under **both** the placeholder the model emitted and the canonical
   `{{cite:type:id}}` form.
2. `tokenize` substitutes any key it finds in the answer text.

Link 2 already had coverage, and it substitutes a node the test itself supplies
— which says nothing about what the product puts in the map. Link 1 had none,
and it is the link that fails silently: drift one character in the key grammar
and the map still exists, still has entries, still gets passed down, and every
citation in every answer degrades to literal placeholder text with nothing red
anywhere.

The suite drives the real component, intercepts the real map, and runs it
through the real tokenizer. The one thing it does not run is react-markdown
parsing the answer into blocks — that is what the repo-wide mock blocks. The
limit is asserted as a case of its own rather than left in a comment, so a
future change that makes the real renderer reachable has a line to delete
instead of a paragraph to find.

Fixtures are single-paragraph deliberately: the real renderer tokenizes the text
children of each parsed element, which for one paragraph is the paragraph. A
multi-block fixture would make the stand-in diverge from the renderer and the
suite would start proving its own arithmetic.

## The first version of this suite was vacuous, and the mutation check is what said so

Worth recording, because it is the failure mode this whole programme exists to
catch. The first draft used the canonical spelling as the fixture's
"model-emitted placeholder". Ten cases passed. Then deleting the line that maps
the model's placeholder — half the control — left all ten still passing, because
the *other* map key happened to supply the same string.

The fixtures now use a non-canonical placeholder so the two keys are
independently observable, and the mutation fails five cases. A test suite that
cannot point at a mutation it newly catches has not demonstrated anything.

## QA / Validation

Clean baseline over the same scope, measured by stashing rather than asserted:

- `npx jest src/components/agent src/lib/agent --runInBand`:
  **2 failing before / 2 after**, the same two, both in
  `src/components/agent/__tests__/AgentDock.test.tsx` — the pre-existing red
  suite the catalog workflow already name-filters around, for the reason stated
  in that workflow. Passing 1130 → 1140; the ten are this suite.
- New suite alone: **10 passed, 10 total.**
- Catalog audit coverage: **28 of 37 controls before → 29 of 37 after.**

The gate was confirmed able to refuse before it was satisfied: with the catalog
pointed at the new path and the workflow step not yet added,
`npm run audit:ai-surface-controls` **exits 1** with
`behavioral test ... is never run by .github/workflows/ai-surface-control-catalog.yml
— a test that does not run proves nothing`. Adding the step takes it to exit 0.

**Six mutations, all six caught** (failing-case counts in brackets):

1. Drop `map.set(citation.placeholder, node)` — the model's own grammar stops
   resolving [5].
2. Drop the canonical `{{cite:type:id}}` key [2].
3. `buildCitationNodeMap` returns an empty map [7].
4. Canonical key built with `target_id` and `target_type` swapped [2].
5. `tokenize` loses its inline-substitution stage [4].
6. A broken citation target returns `null` instead of rendering visibly [1].

Each mutation was reverted immediately and the suite re-run green; the working
tree was confirmed clean of product edits before commit.

Typecheck: `tsconfig.tsbuildinfo` removed first, then
`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` —
**exit 0, zero diagnostics**, exit code judged rather than the output grepped.
ESLint over both touched test files: exit 0.

## Rollout Plan

Merges to `main` and ships through the repo-owned ACA main deploy workflow with
everything else on that commit. No staged rollout: there is no runtime change to
stage.

## Deployment Authority

Required when the release can affect Azure Container Apps, deploy workflows, runtime images, feature flags, environment variables, worker jobs, traffic, DNS, or client/product environment promotion.

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged by this release.
- Shared runtime mutators: None. This release adds no Azure command and no runtime mutation.
- Approved image digest: Whatever the main deploy workflow builds for the merge commit; this release pins nothing of its own.
- ACA runtime invariant: To be proven after merge with `scripts/deploy/check-aca-runtime-invariant.mjs`, as for any commit on `main`.
- Worker image invariant: Unchanged; no worker job touched.
- Feature/env flag update path: None. No flag and no environment variable is read, written or added.
- Live signed-in proof required: **No.** No product code ships in this diff — the only product files edited were mutations, each reverted. The CI-side proof is that the new step executes on the runner, which is recorded in the PR before merge.

## Rollback Plan

Revert the commit. The only consequences are that the `citation` control returns
to `status: "none"` in the catalog and the CI job runs one step fewer. No data
migration, no runtime state, nothing to undo in Azure.

## Audit Evidence

- `npm run audit:ai-surface-controls` — exit 1 with the catalog pointed at an
  unwired path, exit 0 once the workflow step exists. Both captured above.
- Six mutation runs with their failing-case counts, above.
- Scope baseline before and after, measured by stash, above.
- The new CI step's execution on the runner, to be linked in the PR before
  merge.

## Known Gaps

- **react-markdown's own parse is still not exercised by any jsdom suite.**
  Unmocking it needs a `transformIgnorePatterns` change with repo-wide blast
  radius, which is a larger decision than this change. The new suite asserts
  this limit rather than implying coverage it does not have.
- **Eight of the catalog's 37 controls sit on surfaces no route reaches** and
  are excluded from the coverage count. Six of the seven controls that had no
  behavioral test before this change are among them — five on
  `ProgramPressureCards.tsx` and one on `EstimateAssumptionDisclosure.tsx`.
  Writing behavioral tests for screens no user can open would raise the number
  and prove nothing; those wait on the mount-or-retire decision that owns them.
  This change took the one coverable control of the seven.
- **The pre-existing two failures in `AgentDock.test.tsx` are untouched.** They
  are outside this change's subject and were measured, not inherited silently.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
