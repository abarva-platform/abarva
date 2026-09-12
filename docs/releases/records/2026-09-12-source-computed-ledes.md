# 2026-09-12-source-computed-ledes — Surfaces open with a finding, not a row count

## Release ID

`2026-09-12-source-computed-ledes`

## Status

`draft`

## Plain-English Summary

The design opens every Contract 360 surface with a finding — something an
executive can repeat out loud. "Four declared workload scopes, and 91% of
consumption sits in two of them."

The product opened them with a row count instead. "4 scoped application or
service rows are loaded." True, and the builder's sentence rather than the
reader's. An audit of the design file against the live pages found the same gap
on four surfaces: the labels, cards and figures all matched the design, and the
opening sentences were evidence summaries.

Those sentences are now computed from the rows the surface already renders, so
a lede cannot drift from the figures beneath it:

- **Story** leads with the gap between what was committed and what is drawn on,
  because on a commitment that is the decision.
- **Scope** states where consumption concentrates across the declared workloads.
- **Relationship** counts only declared rows, and names the hosting model when
  the rows agree on one.
- **Evidence** counts the lanes that hold rows, and reports lanes this contract
  type does not require separately, so a not-applicable lane cannot be mistaken
  for a gap.

Each returns nothing when the rows do not support a claim, and the surface falls
back to the governed narrative rather than to an invented sentence.

## Layer Impact

- `global-control-lane`: shared Source product behaviour, not feature-gated.
- **Layer 4 (Products · Source).** Presentation only — sentences derived from
  rows already rendered on the same surface.
- **Layer 3 (Canonical model).** Unchanged. No schema, migration, loader or
  adapter is touched, and no stored value changes.

## Client Applicability

- All clients: yes.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `contract360Ledes.ts` — new. Four pure functions, each taking the rows the
  surface renders and returning a sentence or null.
- `Contract360Surfaces.tsx` — Story, Scope, Relationship and Evidence read the
  computed lede, falling back to the governed narrative and then to a literal
  count.
- `workspace.css` — one class for the Story position line.
- `__tests__/contract360Ledes.test.ts` — new. Fourteen cases, including the
  single-workload shape the current data actually has and the null paths.

## QA / Validation

- The gap was measured, not guessed: every eyebrow and display sentence was
  extracted from the design file and compared against the live DOM tab by tab.
  Eyebrows matched; four ledes did not.
- `npx tsc -p tsconfig.json --noEmit` — clean.
- `npx eslint src/app/(maestro)/source/preview/workspace/` — clean.
- `npx jest 'preview/workspace' src/lib/source/contract-intelligence
  src/lib/source/data-model` — 42 suites, 335 tests, passing.
- Two defects were caught in the draft before it shipped: a currency reference
  that did not match the data, and a no-op conditional.

## Rollout Plan

Merge to `main`; the repo-owned ACA main deploy workflow builds and deploys. No
migration, no seed, no data build, no flag.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: assigned by the workflow on merge.
- ACA runtime invariant: asserted by the workflow's own verification step.
- Worker image invariant: unchanged.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **yes.** On a contract with loaded rows,
  confirm Story, Scope, Relationship and Evidence each open with a computed
  sentence rather than a row count, and that the figures beneath each one agree
  with it.

## Rollback Plan

Revert and redeploy. Presentation only; no migration and no data change.

## Known Gaps

- **The design's concentration claim cannot be reproduced on current data.**
  Every loaded spend row carries the same workload label, so Scope truthfully
  reads "all attributed consumption sits in one of them" rather than the
  design's "91% of consumption sits in two of them". The computed sentence will
  match the design once the spend rows carry workload variety. This is a data
  shape, not a display choice, and the code deliberately does not invent the
  split.
- **The governed narrative is still the fallback, and still reads as a row
  summary.** Where the rows support no computed claim, the reader sees the
  authored sentence. Rewriting those records is a load-path content pass and is
  not done here.
- Ledes are authored English with computed figures interpolated. They are not
  generated prose, and they do not vary by tenant; a contract shape the wording
  suits poorly would need its own branch rather than a template.

## Audit Evidence

- Commit on branch `claude/source-computed-ledes`, based on `3a7cce657`.
- CI run for the PR, including `npm run release:check`.
- Design-versus-live comparison and local validation recorded under QA /
  Validation.
- Post-deploy: the workflow's runtime invariant check and the signed-in proof
  named under Deployment Authority.
