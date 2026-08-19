# 2026-08-19-home-chapter-writer-foundation — grounded prose synthesis, business-first framing, deterministic 8-chapter router

## Release ID

`2026-08-19-home-chapter-writer-foundation`

## Status

`candidate`

## Plain-English Summary

Three changes, all still inside the `:plan`-only data-build layer -- nothing here writes to a
database, changes `/home`, or touches the legacy reader.

**1. Published prose is now always synthesized FROM the verified claim ledger, not conditionally
patched.** A review of the latest full-content dump found a real trust gap: `enterprise_story`
said "a well-capitalized, strategically clear organization," but nothing in
`enterprise_story_claims` established "well-capitalized" at all -- the sentence was never
decomposed into a claim, so it was never checked, no matter how carefully the claims that *did*
exist were verified. The previous fix only patched prose when verification happened to flag a
specific claim underneath it, which cannot catch content that was never decomposed in the first
place. This release replaces that conditional reconciliation with an unconditional synthesis step
that runs after every generation: the final paragraph is now built strictly from the approved
claim list, with the original draft available only as a tone/structure reference, never as a
source of facts.

**2. `value_creation_model` now leads with business economics, not technology cost.** A live run
on SkyHarbor opened its value-creation summary with "Airport & Ground Operations has 217
applications and $471.2M of technology cost" -- a real fact, useful to a CIO, wrong answer to "how
does this business make money." The prompt now explicitly separates the two questions and requires
the model to say so honestly ("segment-level revenue economics are not represented in the current
context") when business-segment data is genuinely thin, rather than substituting a technology fact
for a business-value fact.

**3. A new deterministic chapter router assembles the single published thesis into eight chapter
views** (Executive Brief, Our Business, Strategy & Value Creation, How We Operate, Technology &
Data, Performance & Value, Leadership Perspective, What Needs Attention) instead of eight
independent generation calls that could disagree with each other about what the enterprise
fundamentally is. Every claim, visual, and question in a chapter is routed from the existing
thesis by array/domain -- no chapter rediscovers the enterprise from raw signals. Each chapter's
headline and executive synthesis is then written by a narrowly-scoped model call that receives
only that chapter's assigned claims and is held to the identical "assert nothing beyond what these
claims establish" discipline as the thesis-level prose synthesis above.

## Layer Impact

Lane: `global-control-lane`. Layer 4 (Products) generation tooling only --
`scripts/data-build/build-enterprise-thesis.ts` (prose synthesis + prompt fix) and new
`scripts/data-build/build-home-chapters.ts` (chapter router + per-chapter synthesis). No canonical
model change, no database write path, no product route change.

## Client Applicability

- All clients: applies to any tenant this generator is run against.
- Specific clients: none.
- Internal only: yes -- data-build scripts, not served routes.
- Public/demo only: no.
- Feature flag: none. `build-home-chapters.ts` has no `:apply` script and no write-gated env var
  at all -- not because a flag is off, but because no database-write code path exists in the file.

## Changes Included

- `scripts/data-build/build-enterprise-thesis.ts` -- `reconcileNarrative` replaced with
  `synthesizeProseFromClaims`, called unconditionally (not gated on `verificationLedger` changes)
  for both `enterprise_story` and `value_creation_model.summary`; new `PROSE_SYNTHESIS_SYSTEM_PROMPT`
  instructs the model to treat the draft as tone/structure reference only, never a source of facts;
  new `VALUE CREATION MODEL` section in `SYSTEM_PROMPT` requiring business-economics-first framing
  with an explicit honesty requirement when segment data is thin; `buildTenant`, `callClaude`, and
  the `ReasoningEffort`/`AnthropicLikeClient` types now exported for reuse by the chapter writer.
- `scripts/data-build/build-home-chapters.ts` (new) -- eight `ChapterId` definitions; deterministic
  `assembleChapterSlices`/`assignVisuals`/`assignQuestions` routing the published thesis's claims,
  visuals, and questions into chapter-shaped slices with no duplication across chapters (Executive
  Brief is the one deliberate exception, as a landing-page echo); `synthesizeChapterNarrative`
  producing a grounded headline + executive_synthesis per chapter from its assigned claim slice
  only; `main()` builds both tenants in plan-only mode and prints the same
  `__HOME_CHAPTERS_RESULT_BEGIN__`/`END__` stdout-marker pattern the thesis script uses.
- `tests/behaviors/build-home-chapters.test.ts` (new) -- 12 test cases covering visual routing
  (no duplicate dataset_ref across non-Executive-Brief chapters, Executive Brief gets the single
  highest-priority visual, unmapped datasets fall back rather than drop), question routing
  (keyword match, unmatched fallback, Executive Brief top-slice), and claim routing (tech/ops
  split by evidence domain, strategic bets to the right chapter only, value-creation-model claims
  to Our Business, leadership claims to Leadership Perspective, Executive Brief's deliberate
  duplication of what_needs_attention, null/dropped claims filtered out without crashing).
- `package.json` -- new `data-build:home-chapters:plan` script. No `:apply` variant exists.

## QA / Validation

- `NODE_OPTIONS="--max-old-space-size=6144" npx tsc --noEmit -p tsconfig.json` -- PASS, 0 errors.
- `npx eslint` on all changed/new files -- PASS, 0 errors.
- `npx jest tests/behaviors/build-home-chapters.test.ts tests/behaviors/enterprise-thesis-validation.test.ts
  tests/behaviors/enterprise-signal-packet.test.ts` -- PASS, 57/57 (12 new cases, 45 pre-existing
  unaffected).
- Not yet run: a live generation pass exercising the unconditional prose synthesis and the chapter
  router against real tenant data. Tracked as a required follow-up before any conclusion is drawn
  about output quality -- this release is architecture and routing logic, verified against
  fixtures; the live proof is the next step.

## Rollout Plan

Merge to `main`. ACA main-deploy builds a new digest-pinned image. A fresh
`data-build:enterprise-thesis:plan` run (confirming the unconditional prose synthesis doesn't
reintroduce a truncation/latency problem) followed by a `data-build:home-chapters:plan` run for
both tenants is the live proof. Output stays in `:plan` mode -- no database write, no route change
-- until a human reviews the eight-chapter output against the acceptance gate (story quality,
analytical quality, evidence quality, specificity, visual quality, executive usefulness) agreed for
this workstream.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Live signed-in proof required: not for this PR -- both scripts are plan-only ACA Job runs, no
  product surface reads either artifact type yet.

## Rollback Plan

Revert the commit. No database row has been written by either script this stretch (`THESIS_WRITE`
has never been enabled for a live run, and `build-home-chapters.ts` has no write path to disable),
so rollback is a pure code revert with no data migration needed.

## Audit Evidence

PR link recorded at merge. The follow-up live job's captured log and exported chapter output
become the audit evidence for whether the unconditional prose synthesis and chapter routing
actually hold on real content -- tracked as the immediate next step.

## Known Gaps

No live model call has exercised `synthesizeProseFromClaims`'s unconditional path or
`build-home-chapters.ts`'s per-chapter synthesis yet -- validated only by type/lint/unit tests
against fixtures so far, the same caveat as every generation-mechanics change this stretch. The
production React/Recharts render layer that would actually display chapter output (a preview
route, not `/home` itself) does not exist yet -- tracked as a separate, following piece of work.
