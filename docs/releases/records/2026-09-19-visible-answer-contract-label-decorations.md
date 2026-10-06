# 2026-09-19-visible-answer-contract-label-decorations — A scaffolding label is still a label when it is decorated

## Release ID

`2026-09-19-visible-answer-contract-label-decorations`

## Status

`candidate`

## Plain-English Summary

The product has a rule that the advisor must write connected prose rather than
prefixing sentences with template labels — `Read:`, `Evidence:`, `Next:`,
`Next move:`. A runtime check enforces that rule on every visible model answer
and refuses the answer if it finds one.

The check could only see the plainest form of those labels. Each of the four
patterns was written to allow only whitespace between the start of a line and
the label, and whitespace is not a bullet. So `Next: do X` was refused while
`- Next: do X`, `1. Next: do X` and `**Next:** do X` were all allowed through.

That gap mattered more than a general one, because the bulleted form is the
exact shape that was removed from the product in June and the check is what
stops it from coming back. The check written to catch it could not see it.

All four labels shared one pattern shape and therefore one hole; all four are
fixed together, from a single shared rule, so they cannot drift apart again.
Nothing a reader sees changes when the advisor is behaving: the same prose that
passed before still passes. What changes is that the decorated label is now
caught rather than silently allowed.

A second, separate problem is fixed in the same change: the test suite that
proves this check works ran in no CI job at all, so none of its cases were
enforced on any pull request. It is now wired into the Atlas quality workflow.

## Layer Impact

- **Release lane: `global-control-lane`.** Shared control-plane behaviour for
  every client, with no feature gate.
- **Layer 4 (products).** `assertVisibleAnswerContract` is the
  runtime half of the visible-answer contract. It governs answer text on the
  Atlas ask and chat routes, the Home Know ask route, the Tower synthesis route
  and the Knowledge aVa route. Its reach over one class of violation widens;
  its interface, violation ids, version string and every other check are
  unchanged.
- **No other layer is touched.** No intake, no adapter, no canonical model, no
  schema, no migration, no data movement, no tenant-scoped read or write.

## Client Applicability

- All clients: yes — the contract runs on every visible answer on the five
  surfaces above, for every tenant. A decorated scaffolding label that used to
  reach a reader is now refused before display.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The check has no flag and this change does not add one.

## Changes Included

- `src/lib/agent/visible-answer-contract.ts` — the four label patterns are now
  built from one shared decoration rule, `LINE_LABEL_DECORATION`, instead of
  four hand-maintained literals. The rule adds unordered list markers
  (`-`, `*`, `+`), ordered markers (`1.`, `2)`) and emphasis markers
  (`**`, `__`, `*`, `_`) to what may sit between the start of a line and the
  label. The line-start anchor is unchanged.
- `src/lib/agent/__tests__/visible-answer-contract.test.ts` — 38 new cases
  covering all four labels across eight decorations, the specific bulleted
  closing removed in June, the false-positive boundary, and the two exclusions
  recorded below.
- `src/__tests__/behaviors/shared-shaper-no-manufactured-next-step.test.ts` —
  one existing case updated in place, with the reason written beside it. That
  case deliberately recorded the gap and asked to be updated if the contract
  were ever widened; it has been, and it now states the sharper reason the
  shaper cases around it still carry the weight.
- `.github/workflows/atlas-quality.yml` — one path pair and one step, running
  the contract suite.

No route, component, prompt, schema, migration, dataset or dependency changed.

## QA / Validation

Measured by driving the real `assertVisibleAnswerContract`, not by reading the
source.

**The defect, reproduced before any edit.** The new cases were written first and
run against unchanged code: **33 failed / 21 passed**. The failures are exactly
the 32 decorated label/decoration combinations plus the specific June closing;
the undecorated, blockquote and ordinary-prose cases passed on unfixed code by
design, because they are the guardrails an over-broad fix would break. This also
settles a question the backlog item recorded as unverified — it suspected the
three sibling labels had the same hole but had not checked. They do: all four
failed identically.

**After the fix.** 0 failed / 55 passed in that suite. Scoped pair
(contract suite plus the behavioural shaper suite): 61 → 62 passing, 0 failing.

**False-positive pass, run before the pattern was touched**, because this gate
returns 422 on four routes and forces a degraded fallback on a fifth, so a false
positive costs the user their answer:

- Against the answer corpus the gate actually governs — 24 files, 3,672 lines of
  golden answers, answer-quality eval fixtures and failure-mode fixtures — the
  widened patterns produce **0** new matches.
- A repository-wide scan of 21,662 files surfaces 178 newly matched lines, and
  every one inspected is a documentation or source-material file rather than
  model output — the `- Evidence: <list>` shape in authored intelligence-pack
  material. Those files are not answer text and the gate does not run on them.
  They are recorded here because they show what the shape looks like in the
  wild, and because a model that echoes that shape into an answer is doing the
  thing the contract prohibits.

**Mutation checks — six, all caught:**

| Mutation | Result |
|---|---|
| Revert the decoration rule to the original `\s*` (the defect itself) | 34 failed |
| Drop the list-marker branch, keep emphasis | 22 failed |
| Drop the emphasis branch, keep list markers | 8 failed |
| Widen too far — let a blockquote `>` count as decoration | 1 failed |
| Widen far too far — drop the line-start anchor so a label matches anywhere | 2 failed |
| Fix `Next:` only and leave the three siblings behind | 24 failed |

The last is the failure mode the backlog item explicitly warned about, and it is
now enforced rather than trusted. The fifth was caught by only one case at first,
and incidentally; a case pinning the line-start requirement against ordinary
mid-sentence English was added so the position rule is load-bearing rather than
accidental.

**Two exclusions, each a decision and each pinned by a case so it cannot be
mistaken for an oversight:**

- A blockquote `>` is not decoration. A `>` line is quoted material — a clause
  from a vendor's own document — and refusing it would cost a user the whole
  answer for quoting a supplier deadline back to them.
- The label must lead the line. `...one thing to do next: name an owner` is
  ordinary English and still passes.

**Scope baseline, same scope both sides** (`src/lib/agent`,
`src/__tests__/behaviors`, `src/lib/atlas`, `src/app/api/home/know`):
**18 failing before, 18 failing after**, with byte-identical failing-suite
lists across the same 7 suites — all pre-existing on the base commit, none
caused by this change. Passing 1,496 → 1,533.

**Typecheck** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit
--pretty false` with `tsconfig.tsbuildinfo` removed first: **exit 0**, 0
diagnostics — exit code judged, not grep output. **ESLint** over the changed
files: exit 0. **`npm run release:check`**: exit 0.

**The suite ran nowhere, and that is fixed here.** Before this change
`src/lib/agent/__tests__/visible-answer-contract.test.ts` was named by no
workflow and no npm script; the committed CI census records
`src/lib/agent/__tests__` as 1 of 33 test files covered, and that one file is
the retrieval suite. Every case in the contract's own suite — including the
ones above — was enforced only by a local command. The suite is now wired into
`atlas-quality.yml`, which already triggers on `src/lib/atlas/**` and
`src/app/api/v1/atlas/**`, two of this gate's own blocking callers. Execution in
the real CI job is to be confirmed on this pull request before merge, not
assumed from the file being present.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds the image and
shifts traffic; no manual Azure command, no migration, no data build, no flag
change. The behaviour is active as soon as the deployed revision serves.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge
  to `main`. No other path.
- Shared runtime mutators: none. This change runs no `az containerapp` command
  and touches no Container App template, revision weight, env var, secret or
  worker job.
- Approved image digest: produced by the main deploy workflow for the merge SHA;
  recorded in Audit Evidence once read back from Azure.
- ACA runtime invariant: to be proven after deploy — Container App template
  image, the 100%-traffic revision image and both required worker job images all
  equal to the same digest for the merge SHA.
- Worker image invariant: same digest as the web template; read back in the same
  snapshot.
- Feature/env flag update path: not applicable; no flag.
- Live signed-in proof required: **yes, and owed** — see Known Gaps.

## Rollback Plan

Revert the pull request and let the main deploy workflow ship the revert, or
shift ACA traffic back to the previous healthy revision's digest by the runbook
at `docs/runbooks/azure-container-apps-deploy.md`. No migration, so no migration
rollback constraint. The change is confined to one pure function's patterns, two
test files and one workflow, so a revert restores the prior behaviour exactly.

## Audit Evidence

- The pull request and its diff.
- The `Atlas quality` CI job on this pull request, specifically the
  `Exercise the visible-answer contract` step — the step output is the evidence
  that the suite executes on the runner rather than merely existing in the file.
- The failing-first numbers above (33 failed / 21 passed on unchanged code) and
  the six mutation results, each reproducible by the edit named in its row.
- The merge SHA, the repo-owned ACA deploy run keyed to it, and the Azure
  readback proving the runtime invariant.

## Known Gaps

- **Signed-in acceptance is owed and has not been attempted.** This change
  alters when a blocking gate fires on model output. No unit test establishes
  what a live model writes, so only a signed-in answer on a deployed revision
  can show that the widened reach refuses nothing a user should have seen. It is
  named here as owed rather than implied to have passed.
- **Blockquoted labels are deliberately not covered.** The reason is recorded
  above and pinned by a case. If a model is ever observed using a blockquote to
  carry its own scaffolding rather than to quote a source, that exclusion is the
  thing to revisit.
- **The repository-wide scan's 178 hits are reported, not triaged.** They are
  documentation and authored source material, outside the corpus this gate runs
  on, so they are out of scope here. Whether authored intelligence-pack material
  should itself avoid the `- Evidence:` shape is a content question for its
  owner, not a control question.
- **The rest of `src/lib/agent/__tests__` still runs nowhere.** This change
  wires one file. The census records 33 test files in that directory with 1
  covered; after this change it is 2. The directory-versus-file wiring question
  is backlog item T-004 and is not decided here.
