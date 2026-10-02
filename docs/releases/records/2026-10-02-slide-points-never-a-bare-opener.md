# 2026-10-02 — A Slide Point Is Never a Bare Opener

## Release ID

`2026-10-02-slide-points-never-a-bare-opener`

## Status

`candidate`

## Plain-English Summary

When a generated deck has no authored slide for a section, the product builds the slide from the section's text. Points too long for the slide are shortened only at sentence ends, so nothing is cut mid-claim, and the full text goes to the speaker notes.

That sentence rule had a hole. Many points open with a short lead ("Workflow timings.") and then state the substance. When the substance was long, the rule kept the first sentence that fitted — the lead — and sent everything else to the notes. Every word on the slide was whole and the point was gone: the slide showed a list of headings with the numbers underneath them missing.

A short opener is now printed only together with at least one complete statement after it. If nothing after it fits, the whole point is held in the notes and the slide does not show the opener alone. To make room for the substance, a point may be longer than before; the slide has a total word budget and a second, smaller point size so the fuller text still fits the page as written. In sections written as prose, a short opener stays attached to the sentence it leads into instead of becoming a point of its own. A sentence about the document itself ("This section establishes…") is no longer used as the slide's headline or as a point; it is kept in the notes.

## Layer Impact

**Release lane: `global-control-lane`.** Shared deliverable rendering for every client; not behind a feature flag.

- **Product layer — deliverable rendering:** How fallback slide text is selected and sized. Authored slides are untouched. The sign-off scanner and its rules are unchanged; nothing is relaxed.
- **Canonical model:** No schema or data changes.

## Client Applicability

- All clients receive the behavior after deployment, on decks generated after it.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/deliverables/orchestrator/slide-text.ts`: a short opener is kept only with a complete statement after it, and is not charged against the per-point limit; per-point limit raised; a per-slide word budget; a point-size step for a full slide; prose openers joined to the sentence they lead into; document-meta sentences held in the notes.
- `src/lib/deliverables/orchestrator/renderers.tsx`: the point size comes from the amount of text instead of a constant.
- Tests for each rule.

## QA / Validation

- Targeted Jest: pass — `32 suites, 456 tests` across the deliverable orchestrator, 8 new.
- Mutation checks, each failing the suite as it should: opener kept alone (3 failures); prose openers not joined (1); slide budget removed (1); point-size step removed (1); document-meta rule removed (2).
- Rendered check: a worst-case section (a 34-word headline and three 51-word points) rendered through the real renderer and converted to an image; all text inside the slide, no overflow.
- Targeted ESLint: pass.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: pass.
- Typecheck: deferred to CI (the local compiler run is not reliable on this machine).
- Deployed-runtime observation that motivated the change: on a synthetic workflow, a generated deck's summary slide showed two points consisting only of their opener, with the quantities they introduced present only in the notes.
- Signed-in runtime verification of this change: pending deployment.

## Rollout Plan

Merge through a reviewed PR. Deploy only through the repository-owned ACA main deploy workflow. After the exact merge SHA is live, rebuild the discovery deck of the synthetic workflow and confirm no slide point is a bare opener and the quantities appear on the slide face.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the deploy workflow.
- Approved image digest: Pending exact-SHA deployment.
- ACA runtime invariant: Pending exact-SHA verification.
- Worker image invariant: Pending exact-SHA verification.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, on a synthetic workflow.

## Rollback Plan

Use the repo-owned ACA main deploy workflow to redeploy the prior approved digest, or revert this change. No database migration or data mutation is included. Decks already generated are not altered either way.

## Audit Evidence

- PR and exact-SHA CI checks: pending.
- Targeted test output and mutation results: recorded in the PR.
- Exact-SHA ACA deployment, digest invariants, and signed-in proof: pending.

## Known Gaps

- Whether a short first sentence is a label or a short statement is not decided; both are treated as openers. A point that is a short statement followed by support too long to fit is held in the notes entirely, where before the short statement alone was shown.
- The headline is still the section's first sentence. A section whose first sentence is itself only a label is not detected.
- The point-size step is fixed for the fallback layout's text box. The fit was checked by rendering one worst case, not measured per deck at build time.
- A headline that depends on a preceding sentence ("That boundary shapes…") is not detected.
