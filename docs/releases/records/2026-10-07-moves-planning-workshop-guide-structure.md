# 2026-10-07-moves-planning-workshop-guide-structure — The last structureless working-session guide gets its own section flow

## Release ID

`2026-10-07-moves-planning-workshop-guide-structure`

## Status

`candidate`

## Plain-English Summary

A Move produces a working session guide at four of its phases. Each one is a
facilitation document: it says which approved facts are settled, which sessions must
run, what evidence to bring, who decides, and what has to be in place before the next
gate. Each one's own quality profile says exactly that — "working guide, not the formal
gate artifact" — and asks for session instructions, evidence requests, owners, outputs
and next-gate readiness checks.

Three of the four had no declared section flow. Two were authored in a prior change.
This change authors the third and last: the design-phase planning workshop guide, which
prepares the roadmap, business-case, finance, measurement and readiness sessions of the
following phase.

Until now that guide fell through to the generic fallback: a twelve-section executive
board paper — executive summary, decision required, problem, current-state evidence,
objectives, scope, value hypothesis, operating model, risks, phase gates, evidence
gaps, recommendation — with no length guidance on any section, no fixed shape, and
nothing telling the model the document was a session plan rather than a board paper.
One of those twelve sections is "Decision Required", which is the opposite of what this
document's quality profile asks for: it is explicitly not allowed to take new design,
funding or execution decisions.

The fallback also resolves no use-case content at all. Measured before the change
through the same resolver production uses, the served brief had twelve sections and
**every one of the twelve carried an empty evidence-family list** — so a Move could
declare a use case, collect its required evidence through the discovery phase, get that
evidence approved, and still produce a planning guide that could cite none of it. After
the change the brief has five authored sections and the two whose job is to enumerate
accepted facts carry all of the use case's evidence families.

The guide had been left structureless on a stated product ground rather than by
omission: what a guide may assert about a design that is **still being chosen** was
judged a narrower question than either later guide faced. That premise is not what the
deliverable declares. Its registry entry opens with a "Design recap (approved target
state, option decisions, …)" section and describes itself as "derived from the accepted
design"; its quality profile prepares sessions "from the accepted design" and asks it to
state "which approved phase facts are settled". The guide sits after the design
decision, in the same post-decision posture as the two already authored, and the
earlier-phase design workshop guide was always the precedent for taking the judgment.
The unresolved design caveats the registry also names are carried forward as caveats
with their evidence status, which is the treatment every one of these guides already
gives an open item.

The section flow is the five-section spine the registry already declares for this
deliverable, in the same order, with the registry's own generation hint as the source of
its prohibitions, and a word cap on every section. The sections that enumerate accepted
facts carry the use case's evidence families; the question set and the readiness
checklist deliberately do not, because their job is to ask and to name what is missing,
and giving them families would widen their retrieval toward evidence they do not cite.
The use case's exhibits and tables are withheld, as they are from all three sibling
guides, with the reason recorded in the declared withholding set.

No gate criterion is added, removed or re-graded, and no change is made to which
documents a phase builds. This guide is not a gate artifact.

## Layer Impact

- `global-control-lane` — layer 4 (Products · Moves). Deliverable brief composition
  only. No schema, no data-plane write, no retrieval index change, no gate criterion
  added, removed or re-graded, and no change to which documents a phase builds.

## Client Applicability

- All clients: yes — brief composition is shared and not flag-gated.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change replaces a fallback with a declared structure for one
  document type; there is no new surface or new capability to gate.

## Changes Included

- `src/lib/deliverables/orchestrator/briefs/structure-phase-session-guides.ts` —
  adds `MOVES_PLANNING_WORKSHOP_GUIDE`: five sections from the registry's declared
  spine, a word cap on each, two declared evidence landing sites, a fixed shape,
  forbidden section topics, and three prohibitions. The module header is rewritten:
  it covered two guides and now covers three, and the paragraph recording the P3
  guide as deliberately excluded is replaced by the reason the exclusion was lifted.
- `src/lib/deliverables/orchestrator/briefs/deliverable-structures.ts` — one import
  and one catalog entry, placed beside the other design-phase deliverables.
- `src/lib/deliverables/orchestrator/briefs/archetype-asset-withholding.ts` — one
  declared withholding entry with its stated reason, matching its three siblings.
- `src/lib/reasoning/__tests__/moves-phase-session-guide-structures.test.ts` — the
  guide joins the existing parameter table rather than getting a parallel suite, so
  every assertion written for the other two now also binds this one: registry spine,
  structure resolved at the key production sends, its own sections and not the generic
  spine, all sections required, fixed shape, forbidden topics and prohibitions, a cap
  on every section, full evidence landing on the fact-enumerating sections, no landing
  on the question set or readiness checklist, and no use-case exhibits or tables. Four
  cases are added for the boundary the shared cases cannot express, this guide being
  the only one of the four that sits in the same phase as the artifact it recaps.
- `src/lib/reasoning/__tests__/moves-phase-deliverable-archetype-reach.test.ts` — the
  structureless sets shrink. The production-key set is now EMPTY and is kept as an
  empty literal rather than deleted, because the assertion it anchors holds in both
  directions: a new phase deliverable arriving without a structure still fails.
- `src/lib/reasoning/__tests__/moves-process-change-estimate-brief-structure.test.ts`
  — the structureless-by-decision set is now empty, with the reason the decision was
  taken recorded in its place.
- `src/lib/deliverables/orchestrator/__tests__/archetype-pack-governed-data-foundation.test.ts`,
  `src/lib/deliverables/orchestrator/__tests__/archetype-evidence-landing.test.ts`,
  `src/lib/programs/__tests__/orchestrated-deliverable-map.test.ts` — three sibling
  guards independently asserted this key had no structure, or counted the shipped
  structures. Each is updated to the measured new truth. They were found by running
  the whole of three suite directories rather than the suites this change edits.

## QA / Validation

- **PASS** — `npx jest src/lib/reasoning src/lib/deliverables src/lib/programs`:
  504 suites, 6834 tests, 0 failures. Run over the whole of the three directories,
  not the edited suites alone, which is what surfaced the three sibling guards.
- **PASS** — measured before/after through `getArtifactBrief` at the key production
  sends, which is the resolver `/api/v1/deliverables/generate-phase` and the phase
  documents panel both use. Before: no structure resolved, 12 generic sections, 0
  exhibits, 1 generic table, and an empty evidence-family list on all 12 sections.
  After: structure resolved, the 5 declared sections, 0 exhibits, 0 tables, and all
  of the use case's evidence families on both declared landing sites. Measured by
  running it, not by reading the declaration — a resolver that short-circuits before
  the composition function would otherwise make a declared structure inert silently.
- **PASS** — mutation testing, 10 mutations, 10 killed: dropping the evidence landing
  sites; dropping the fixed shape; dropping each of the two forbidden topics the added
  cases name; dropping the funding prohibition while KEEPING the matching topic (and
  the reverse), which pins the two as independent claims rather than one; dropping the
  declared withholding entry; unregistering the structure from the catalog (18
  failures); removing one section's word cap; adding the question set as an evidence
  landing site; and renaming the recap section key consistently across all three of
  its sites. An eleventh attempt reported ANCHOR-FAIL and applied nothing.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json
  --noEmit`, exit 0. Re-run after the sibling-guard edits, not only before them.
- **PASS** — `npx eslint` over every changed TypeScript file, exit 0, no output.
- **PASS** — both coverage censuses regenerated with the `:write` scripts and both
  produce NO change, which is the honest result: this change adds no test file, so
  there is no census delta to claim and no ordering hazard against other open work.
- **PASS** — `npm run release:check -- --base origin/main --head HEAD`.
- **NOT RUN** — live signed-in phase build at the design phase reading the generated
  guide. Generating a phase deliverable for a Move is an authorized human step and was
  not performed here. See Known Gaps.

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
  signed-in phase build at the design phase, reading the generated guide and confirming
  it carries its own five sections, stays within its caps, takes no new decision, and
  cites approved evidence in the recap and evidence-request sections. Approving and
  building a phase is an authorized human step and was not performed here.

## Rollback Plan

Revert the squash commit. The change is one declaration appended to an existing
declaration module, one import, one catalog entry, one withholding entry, and test
updates — no schema, data, configuration or prompt-runtime component — so a revert
restores the prior brief exactly. Reverting returns the guide to the generic
twelve-section fallback with no evidence families on any section, which is the state
this change was written to leave, so prefer rolling forward. No migration rollback
applies.

## Audit Evidence

- The before/after brief measurement described under QA, taken through the production
  resolver at the production key.
- The mutation log described under QA: 10 mutations, 10 killed, one anchor-fail that
  applied nothing.
- The three structureless sets, now empty or shorter, each held in both directions so
  the set can only shrink and a new structureless deliverable fails loudly.
- The declared withholding set and its per-entry reasons, asserted against the module
  rather than restated.

## Known Gaps

- **The over-length generation failures this change is partly aimed at remain
  attributed by reasoning, not by measurement.** The prior record made the same
  statement about the other two guides. The failing run predates both changes and was
  not re-run, so that the word caps close those specific failures is unproven until a
  live phase build produces the document. The caps are the same instrument the
  already-authored guides use.
- **Section word caps are stated to the model as latitude prose**, as they are in every
  other structure. They are not enforced against the rendered document by the shared
  word-budget contract, which keys its per-section caps to one document type only.
  Unchanged by this release and the same for all four guides.
- **The generic fallback itself is unchanged.** It is now reached by no canonical phase
  deliverable, but any future phase document arriving without a declared structure will
  still be served twelve uncapped sections with no evidence families. The emptied
  structureless sets are what make that arrival fail a test rather than ship silently.
- **Two authored section flows are still routed to by no phase document key at all** (a
  mobilization plan and an executive playback). Neither is a session guide, so neither
  was reused here. Whether either should be a phase document is an open product
  question, carried forward unchanged from the prior record.
- **This guide is not a gate artifact**, so this change does not move any gate. It
  improves a document the design phase builds; it does not make a phase easier or
  harder to exit. No gate criterion was loosened.
