# 2026-06-17-charter-content-contract — P1 Charter content contract (phase discipline)

## Release ID

`2026-06-17-charter-content-contract`

## Status

`candidate`

## Plain-English Summary

Constrains what a generated **P1 Program Charter** contains so it stays a chartering
*decision* document and stops drifting into work that belongs to later phases.

Previously the charter's generation structure listed a **required "Current-State
Evidence"** section — a governed-facts current-state analysis — and the AI architect
pass would freely add target-state / solution-design sections "to improve the
artifact." That produced premature current-state and target-state perspectives in the
charter (which the founder flagged: those belong to P2 Discovery and P3 Design), and
made the output vary run-to-run.

Now the charter generates against its canonical **decision-sections** — Executive
Summary, Decision Required, Sponsor & Stakeholder Commitment, Problem/Opportunity &
Why Now, Strategic Objectives, Scope, Value Hypothesis & Success Metrics, Governance/
Operating Model & Phase Gates, Key Risks/Dependencies & Kill Criterion, plus Evidence
Gaps and Recommendation. There is **no** current-state evidence analysis and **no**
target/future-state or solution/architecture design. A new phase-discipline guard
lists forbidden later-phase topics; the architect is told to omit them, and a
deterministic plan sanitizer drops any section/exhibit/enhancement that slips through
— so runs are consistent. The charter still grounds in governed evidence (via its
`mixed` sections), just framed as a commitment instrument rather than an analysis.

## Layer Impact

- `global-control-lane`: shared deliverable-generation behavior. Changes the composed
  artifact brief and the architect plan-sanitizer for the Moves charter only; no
  schema, data-plane, or runtime-dependency change. All other deliverable types are
  unaffected (the guard is opt-in per structure via `forbiddenSectionTopics`).

## Client Applicability

- All clients: yes — every newly generated Moves P1 Charter follows the new contract.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none. (Affects only charters generated *after* this ships; existing
  generated charters are unchanged until re-run.)

## Changes Included

- `briefs/deliverable-structures.ts` — rewrote `MOVES_CHARTER` to the decision-sections
  (removed the required `current_state` analysis section; added `sponsor_commitment`,
  `kill_criterion`, `governance_gates`); added `forbiddenSectionTopics` to the
  `DeliverableStructure` type + the charter.
- `types.ts` — `DeliverableArtifactBrief.forbiddenSectionTopics?: string[]`.
- `artifact-brief-registry.ts` — `composeBrief` threads `forbiddenSectionTopics`.
- `prompt-builder.ts` — architect context block emits a PHASE DISCIPLINE / out-of-scope
  instruction when forbidden topics are present.
- `generation-plan.ts` — `sanitizeGenerationPlan(plan, req, brief)` deterministically
  drops planned sections / exhibits / enhancements matching a forbidden topic.
- `orchestrator.ts` — passes `brief` to the sanitizer.
- Tests: `generation-plan.test.ts` (+3 sanitizer cases, +2 charter-structure cases);
  `brief-library.test.ts` (grounding invariant relaxed to `governed_facts || mixed`,
  with rationale).

## QA / Validation

- `npx tsc --noEmit` — **PASS** (no new errors; two pre-existing missing-optional-dep
  errors in unrelated ingestion/axe files are not introduced here).
- `npx eslint` on all changed files — **PASS** (exit 0).
- `npx jest src/lib/deliverables/orchestrator` — **PASS** (13 suites, 98 tests,
  including the 5 new ones).
- Live regenerate of the SkyHarbor P1 Charter on ACA confirming the rendered sections
  are the decision-sections with no current/target-state — **NOT-RUN** at authoring;
  runs post-deploy (worker job + web), evidence appended below.

## Rollout Plan

Squash → main. `az acr build` a new image; deploy the **worker job**
(`job-abarva-deliv-worker`, which runs the decomposed generator) AND a new web
revision; shift traffic; deactivate idle revisions. No migration, no flag.

## Rollback Plan

Revert the squash-merge and redeploy the prior image to both the worker job and the
web app. No data/schema migration to unwind; previously generated charters are
unaffected either way.

## Audit Evidence

- PR URL (filled at PR open).
- `jest` / `tsc` / `eslint` output in the PR.
- Post-deploy: worker job image tag + a regenerated SkyHarbor charter artifact id with
  its section list (no `current_state` / target-state).

## Known Gaps

- The guard is applied to the Moves charter only. Other deliverable structures keep
  their current sections; extending phase-discipline topics to P2–P5 deliverables is a
  follow-up.
- `forbiddenSectionTopics` matching is substring/case-insensitive on section key+title;
  it intentionally does not police *prose inside* an allowed section (the disallowed-
  fabrication + quality gates still cover content).
