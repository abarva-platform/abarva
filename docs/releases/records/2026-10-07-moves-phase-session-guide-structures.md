# 2026-10-07-moves-phase-session-guide-structures — The later working-session guides stop being generated as generic board papers

## Release ID

`2026-10-07-moves-phase-session-guide-structures`

## Status

`candidate`

## Plain-English Summary

A Move produces a working session guide at four of its phases. Each one is a
facilitation document: it says which approved facts are settled, which sessions must
run, what evidence to bring, who decides, and what has to be in place before the next
gate. Each one's own quality profile says exactly that — "working guide, not the formal
gate artifact".

Three of the four had no declared section flow, so the document generator fell through
to its generic fallback: a twelve-section executive board paper — executive summary,
decision required, problem, current-state evidence, objectives, scope, value
hypothesis, operating model, risks, phase gates, evidence gaps, recommendation — with
no length guidance on any section, no fixed shape, and nothing telling the model the
document was a session plan rather than a board paper. The fallback also resolves no
use-case content at all, so a Move could declare a use case, collect its required
evidence, get it approved, and still produce guides that could cite none of it.

This change authors the section flow for two of the three: the plan-phase mobilization
workshop guide and the final-phase execution kickoff guide. Each follows the one guide
that already had a structure — a carry-forward section stating what is settled, a
session plan, an evidence ask, a facilitation question set, and a next-gate readiness
check — with a word cap on every section and an explicit list of the artifacts the
guide must not become. The sections whose job is to enumerate accepted facts now carry
the use case's evidence families, so approved evidence reaches them; the question set
and the readiness checklist deliberately do not, because their job is to ask and to
name what is missing.

The use case's exhibits and tables stay withheld from both, as they always have been
from the equivalent earlier guide. That rule had been two literals written inline in
the composition function with the reason recorded nowhere; it is now a declared set
with a stated reason per entry.

The third guide is left as it is, under the product decision already recorded with it.

## Layer Impact

- `global-control-lane` — layer 4 (Products · Moves). Deliverable brief composition
  only. No schema, no data-plane write, no retrieval index change, no gate criterion
  added, removed or re-graded, and no change to which documents a phase builds.

## Client Applicability

- All clients: yes — brief composition is shared and not flag-gated.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change replaces a fallback with a declared structure for two
  document types; there is no new surface or new capability to gate.

## Changes Included

- `src/lib/deliverables/orchestrator/briefs/structure-phase-session-guides.ts` (new) —
  the two guides' section flows. Each spine is the five-section list the deliverable
  registry already declares for that document, in the same order, with the registry's
  own generation hint as the source of its prohibitions. Both declare their
  carry-forward and evidence sections as the landing sites for the use case's evidence
  families, and both carry a word cap on every section.
- `src/lib/deliverables/orchestrator/briefs/archetype-asset-withholding.ts` (new) —
  the declared set of document types the use-case pack's exhibits and tables are
  withheld from, with the reason for each. Replaces a two-literal inline expression.
- `src/lib/deliverables/orchestrator/briefs/deliverable-structures.ts` — one import
  and two catalog entries.
- `src/lib/deliverables/orchestrator/artifact-brief-registry.ts` — `composeBrief` asks
  the declared set instead of comparing against two inline literals. Behaviour for the
  two previously withheld types is identical.
- `src/lib/reasoning/__tests__/moves-phase-session-guide-structures.test.ts` (new) —
  27 cases.
- `src/lib/reasoning/__tests__/moves-phase-deliverable-archetype-reach.test.ts` — the
  two keys move out of the structureless lists and into the assets-withheld list; the
  structureless set shrinks, which is the direction that suite only allows.
- `src/lib/programs/__tests__/orchestrated-deliverable-map.test.ts` — the no-aliasing
  claim is kept and separated from the question of whether a guide has a structure,
  which is now asserted per guide.
- `src/lib/deliverables/orchestrator/__tests__/archetype-pack-governed-data-foundation.test.ts`,
  `archetype-evidence-landing.test.ts`, `brief-library.test.ts` — the measured
  before/after these suites pin, updated. The two table-withholding cases now read the
  declared set rather than restating a pair.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- PASS `npx jest src/lib/reasoning/__tests__/moves-phase-session-guide-structures.test.ts`
  — 27/27.
- PASS `npx jest src/lib/reasoning src/lib/deliverables src/lib/programs src/components/strategic-moves src/app/api/v1/deliverables`
  — 552 suites, 7493 tests, 3 snapshots.
- PASS `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — exit 0.
- PASS `npx eslint` on the changed files — exit 0.
- PASS mutation review — 14 mutations, 14 killed. Five against the two structures'
  grounding and shape (drop each guide's declared landing sites; add the question set
  as a landing site; drop the fixed shape; drop the prohibitions), two against the
  forbidden-topic and length guarantees (remove one forbidden artifact; remove one
  section's word cap), three against the declared withholding set (remove a member;
  withhold from everything; blank the stated reason), two against catalog registration
  (unregister each structure), one renaming a section key, and one reverting
  `composeBrief` to the two inline literals — which is caught because the two new
  guides then receive the pack's exhibits.
- PASS census regeneration — `audit:test-ci-coverage:write`: files 2776 -> 2777,
  covered 2612 -> 2613, uncovered flat at 164. The flat uncovered count is the evidence
  the new suite sits in a CI-reached directory rather than dark. Measured against the
  merge base rather than against the committed numbers: the committed census reads
  2773/2609, a regeneration on an unmodified merge base reads 2776/2612, so three files
  of the four-file delta are pre-existing drift from merge order and one file is this
  change.
- PASS `npm run release:check -- --base origin/main --head HEAD`.
- NOT RUN live generation of either guide. Both are produced by a phase build that
  requires an authorized human to approve the phase first; see Deployment Authority.
- NOT RUN live signed-in walk.

## Rollout Plan

Merge to `main` by squash. The repo-owned ACA main deploy workflow then builds and
deploys as usual. No migration, no flag, no environment variable, no worker job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — the only path
  that may shift shared Product/Lab web traffic.
- Shared runtime mutators: none in this change. No `az containerapp update`, no ad-hoc
  `az acr build`, no traffic or revision-weight change.
- Approved image digest: assigned by the main deploy workflow on merge; not pinned by
  this record.
- ACA runtime invariant: to be proven after the deploy — Container App template image,
  100%-traffic revision image, and required worker job images all matching the merged
  digest.
- Worker image invariant: unchanged; no worker job touched.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, before this may be called `live-proven` — a
  signed-in phase build at the plan and final phases, reading the two guides and
  confirming they carry their own sections, stay within their caps, and cite approved
  evidence in the carry-forward and evidence sections. Approving a phase is an
  authorized human step and was not performed here.

## Rollback Plan

Revert the squash commit. The change is two new declaration modules, one import and two
catalog entries, one expression swap in the composition function, and test updates —
no schema, data, configuration or prompt-runtime component — so a revert restores the
prior briefs exactly. Reverting returns both guides to the generic twelve-section
fallback, which is the state this change was written to leave, so prefer rolling
forward. No migration rollback applies.

## Audit Evidence

- The PR for this record, its CI run, and the diff of the two new declaration modules.
- `src/lib/reasoning/__tests__/moves-phase-session-guide-structures.test.ts` — the
  cases measuring the SERVED brief through the resolver at the key production sends,
  rather than reading the catalog, so a resolver that short-circuits before composition
  cannot leave a declared structure inert and still look wired.
- `src/lib/reasoning/__tests__/moves-phase-deliverable-archetype-reach.test.ts` — the
  structureless set, held in both directions, now one entry long.
- `src/lib/deliverables/orchestrator/__tests__/archetype-evidence-landing.test.ts` —
  the per-use-case report showing both guides grounded and their assets withheld, for
  every use case rather than one.

## Known Gaps

- The third guide — the design-phase planning workshop guide — is still structureless
  and still served the generic fallback. That is a stated product decision rather than
  an omission: what a guide may assert about a solution that is still being chosen is a
  narrower question than either of the two authored here faced, and the decision is
  recorded with the key in its own suite. It is the last remaining member of the
  structureless set.
- Two authored section flows are routed to by no phase document key at all (a
  mobilization plan and an executive playback). They are not the same artifacts as the
  guides authored here — one is a go/no-go instrument, the other a readout — so they
  were not reused for them. Whether either should be a phase document is an open
  product question.
- The over-length generation failures these two guides hit on the last live phase build
  are attributed to the uncapped twelve-section fallback by reasoning, not by
  measurement: the failing run predates this change and was not re-run. The word caps
  are the same instrument the earlier guide uses, but that they close those specific
  failures is unproven until a live phase build produces both documents.
- Section word caps are stated to the model as latitude prose, as they are in every
  other structure. They are not enforced against the rendered document by the shared
  word-budget contract, which keys its per-section caps to one document type only.
- The fallback itself is unchanged. Any future phase document arriving without a
  structure gets the same generic board paper, with the structureless-set suite as the
  only thing that makes it visible.
