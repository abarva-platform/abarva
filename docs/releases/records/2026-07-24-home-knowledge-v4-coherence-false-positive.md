# 2026-07-24-home-knowledge-v4-coherence-false-positive — fix a self-contradictory prompt instruction

## Release ID

`2026-07-24-home-knowledge-v4-coherence-false-positive`

## Status

`candidate`

## Plain-English Summary

The live Meridian canary (execution `job-abarva-private-operator-eus-vw1torp`) is the only one of
three canaries that failed — `candidate_failed, findings=1`. The one finding was
`coherence_high_severity_findings`, and it traces to a bug in the prompt fix shipped earlier today
(2026-07-24-home-knowledge-v4-graph-visual-contamination), not a new generation defect.

### What actually happened

That earlier fix corrected a real bug — a dimension's `primary_visual` was being contaminated
with the wrong branch's fields when `visual_type: relationship_graph`. The fix added this
instruction to the **shared system prompt**, sent to every pass type:

> "A visual object with visual_type: relationship_graph — **wherever it appears**, including as a
> dimension's primary_visual — ... There is no separate 'graph_display_contract' field to nest
> this inside."

That "wherever it appears" is a blanket claim, and it's wrong. The `06-relationships` pass
produces `graph_projections[]` — an array of **narrative wrapper objects** (`headline`,
`business_meaning`, `dependencies`, `constraints`, etc.) each legitimately carrying a nested
`graph_display_contract` sub-object holding just the strict visual fields. That nested shape was
already correct and already validated by `validateClosedEnums` (confirmed by the offline-replay
work in PR #5527, which explicitly distinguishes "a narrative wrapper carrying a
`graph_display_contract` child" from "the wrapper itself being treated as a visual").

Claude's own coherence reviewer (`08-coherence-review`, a separate LLM call) read the
contradiction between the shared instruction and the relationship writer's own local instructions
and correctly flagged it as a genuine internal contradiction. It was right to flag it — the prompt
really was self-contradictory. The gate correctly failed the candidate rather than let a pack with
a `revise_before_human_review` recommendation through, exactly as the user's original audit
demanded.

### Verified: the underlying content was already correct

Before writing this fix, all six `graph_projections[]` items in the real Meridian output were
checked directly:

```
[0] enterprise_structure — graph_display_contract missing: NONE — well-formed
[1] operating_model      — graph_display_contract missing: NONE — well-formed
[2] technology_dependency — graph_display_contract missing: NONE — well-formed
[3] business_change_impact — graph_display_contract missing: NONE — well-formed
[4] value_realization    — graph_display_contract missing: NONE — well-formed
[5] evidence_lineage     — graph_display_contract missing: NONE — well-formed
```

This is a **false positive**, not a content defect. The candidate content was already sound; only
the meta-level judgment (informed by my own contradictory instruction) was wrong.

### The fix

Scoped the shared-system-prompt instruction to name the one legitimate exception explicitly,
instead of claiming a blanket rule that contradicted the relationship writer's own design:

> "As a dimension's primary_visual, it carries these fields directly — there is no separate
> 'graph_display_contract' field to nest it inside. The one exception: the relationship writer's
> graph_projections[] items are narrative wrappers ... that legitimately carry the visual contract
> nested under a graph_display_contract key — that nested key is intentional there and must not be
> flattened or removed."

## Layer Impact

- `global-control-lane`: prompt text only, in one operator script. No schema, no validator logic
  change, no runtime path.

## Client Applicability

- Internal only: operator tooling for the Home V4 candidate pipeline.
- Feature flag: None.

## Changes Included

- `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`: shared system prompt instruction
  scoped to carve out the relationship writer's legitimate nested shape.

## QA / Validation

- `pass` — `node --check` clean; `npx eslint` exit 0.
- `pass` — Verified against the real Meridian artifact that the underlying content this finding
  was about is already well-formed (all six projections, all required fields present).
- **`unverifiable offline`** — Unlike every other fix shipped this session, this one changes the
  input to an LLM judgment call (the coherence reviewer), not a deterministic check. Offline
  replay cannot prove whether the corrected prompt actually changes the reviewer's future output —
  only a fresh generation call can. This is stated plainly rather than implied as proven.
- `n/a` — No migration, no runtime change, no database writes.

## Rollout Plan

Merge + deploy. **Requires a fresh Meridian canary run to confirm** the coherence reviewer no
longer raises this specific contradiction. Given the underlying content was already correct, a
clean coherence pass on re-run would confirm this was purely a prompt-contradiction false
positive; a repeat of the same finding would mean the diagnosis was incomplete and needs
revisiting.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main deploy after merge.
- Shared runtime mutators: none — operator script only.
- Migration application: none.
- Feature/env flag update path: none.
- Live signed-in proof required: no runtime-visible change.

## Rollback Plan

Revert the PR. Restores the blanket "wherever it appears" instruction, which is safe (over-strict
in the wrong direction — fails more, not less) but reintroduces this false positive.

## Audit Evidence

- Meridian canary execution `job-abarva-private-operator-eus-vw1torp`, proof bundle retrieved and
  the `08-coherence-review` finding quoted verbatim.
- Direct field-level check of all six `graph_projections[]` items confirming well-formed content.

## Known Gaps

- **Not proven to fix the coherence reviewer's future behavior.** Only a fresh canary run confirms
  it. This is the honest limit of what offline tooling can verify for an LLM-judgment gate.
- This is the second time in one session a shared-system-prompt instruction, written to fix one
  call site, has silently applied to and broken another. Worth considering whether pass-specific
  instructions should live in each pass's own prompt block rather than the shared system prompt
  when they don't actually apply universally — not done here, flagged for later.
