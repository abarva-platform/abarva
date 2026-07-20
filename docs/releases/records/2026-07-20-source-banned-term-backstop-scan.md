# 2026-07-20-source-banned-term-backstop-scan — Deterministic banned-term backstop for Source generation

## Release ID

`2026-07-20-source-banned-term-backstop-scan`

## Status

`candidate`

## Plain-English Summary

Source has two existing layers meant to keep internal labels (d-codes, "AI generated",
"substrate", tenant-schema terms) out of client-facing artifacts: the per-artifact
`bannedTerms` list in `source-artifact-profiles.ts`, and the LLM-judgment-based
consulting-grade quality gate (extended to be artifact-aware in
[[2026-07-20-source-quality-gate-artifact-aware]]). Neither actually scans generated
output for those literal terms — the profile's `bannedTerms` list existed only as
documentation and as an input to a language-policy-prompt generator
(`buildLanguagePolicyBlock`) that itself had zero call sites anywhere in the generation
pipeline. LLM judgment can miss a literal leaked term even when it correctly judges the
overall artifact as high quality; a deterministic scan doesn't have that failure mode.

This release wires the already-built, already-tested `scanForBannedTerms()` (in
`source-documentation-standards.ts`) into every Source artifact generation as a
non-blocking backstop. After the body is final (post quality-gate, post client-facing
sanitizer), it's scanned against its artifact code's banned-term list and any hits are
recorded in `body_generation_metadata.bannedTermMatches` — a visibility signal for human
review, not a new generation failure mode.

## Layer Impact

- `global-control-lane`: Source artifact generation
  (`src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts`) for all
  tenants. Purely additive — writes one more field to the existing generation-metadata
  record; does not change the generated body, does not block generation, does not change
  the response shape returned to the client.
- No database schema change: `body_generation_metadata` is an existing untyped JSON
  column; this adds a new key within it.

## Client Applicability

- All clients: yes — the scan runs for every artifact code with a registered profile.
- Specific clients: none.
- Internal only: no (though the resulting data is a governance/QA signal, not
  user-facing UI in this release).
- Public/demo only: no.
- Feature flag: none — this is a read-only, non-blocking scan; there is no behavior to
  gate.

## Changes Included

- `src/lib/source/agent-generation/types.ts` — add `bannedTermMatches?: string[]` to
  `SourceArtifactBodyGenerationMetadata`.
- `src/lib/source/agent-generation/quality-review.ts` — export
  `shortSourceArtifactCode()` (previously module-private) so the generate route can
  derive the short profile-registry code from the long generation-pipeline code without
  a second implementation of the same split.
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts` — call
  `scanForBannedTerms(body, shortSourceArtifactCode(artifactCode))` after the body is
  finalized and attach the result to `generationMetadata.bannedTermMatches`.
- This release record.

## QA / Validation

- `pass` — Focused Jest:
  `npx jest --runTestsByPath src/lib/source/agent-generation/__tests__/quality-review.test.ts src/lib/source/documentation-standards/__tests__/source-documentation-standards.test.ts`
  — 38/38 passed. `scanForBannedTerms` itself already had dedicated test coverage in
  `source-documentation-standards.test.ts` prior to this release (this release adds no
  new tests for that function — it's exercised through its existing suite, not
  duplicated); no new tests were added for the two-line call-site wiring in
  `generate/route.ts` since that route has no existing dedicated test file (confirmed via
  search) and the wiring itself has no branching logic to test beyond what
  `scanForBannedTerms`'s own suite already covers.
- `pass` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
  — clean, no errors.
- `pending` — `npm run release:check` — to run before PR.
- `not run` — Live signed-in proof. This writes to an existing metadata column that has
  no current UI surface displaying it (the File Cabinet / Files & deliverables view shows
  artifact status and lifecycle stage, not the generation-metadata JSON). There is nothing
  to click through and observe yet; verifying this requires either a direct database read
  after a live generation or a follow-up UI surface to display the signal. Recorded here as
  an explicit known gap rather than skipped silently.

## Rollout Plan

Merge to main via the repo-owned ACA main-deploy workflow. Takes effect on every Source
generation immediately after deploy — no flag, no migration, no rollback dependency.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none beyond the standard main-deploy workflow.
- Approved image digest: recorded post-merge once the deploy run completes.
- ACA runtime invariant: to be verified post-deploy (template image = 100%-traffic
  revision image = worker images, matching approved digest).
- Worker image invariant: covered by the same main-deploy workflow step.
- Feature/env flag update path: none — no flag introduced.
- Live signed-in proof required: no observable UI change to prove; see Known Gaps.

## Rollback Plan

Revert the merge commit. The new metadata field is additive and optional
(`bannedTermMatches?`); removing the write path leaves existing records with the field
simply absent, no cleanup required.

## Audit Evidence

- PR URL: recorded post-open.
- Focused Jest log: 38/38 passed (see QA / Validation).
- Typecheck log: clean, no errors.

## Known Gaps

- No UI currently surfaces `bannedTermMatches` to a human reviewer. The signal is
  captured but invisible until a follow-up wires it into the File Cabinet or an
  admin/QA view — without that, this release only proves the scan *runs*, not that anyone
  *sees* its output. Flagging this explicitly rather than implying the backstop is
  "complete" end-to-end.
- The scan is literal substring matching (case-insensitive), same as
  `scanForBannedTerms`'s existing implementation — it does not distinguish a genuine leak
  from an incidental substring match (e.g., a term appearing inside a longer legitimate
  word). This was an accepted tradeoff in the original `scanForBannedTerms`
  implementation, not introduced by this release; it is inherited, not fixed, here.
- `buildLanguagePolicyBlock()` — the other half of `source-documentation-standards.ts`,
  which would inject artifact-specific depth/evidence/language guidance into each
  artifact's *generation* system prompt (as opposed to this release's *post-generation*
  scan) — remains unwired. Investigation this pass found `prompt-registry.ts`'s ~30
  hand-written system prompts already carry ad hoc, per-artifact versions of some of that
  guidance (e.g. d01's prompt already says "Never expose internal product terms..."
  inline), and a third, mostly-empty required-sections vocabulary
  (`SOURCE_ARTIFACT_REQUIRED_SECTIONS` in `section-conformance.ts`, only 2 of 30+ codes
  populated) sits alongside the profile registry's `requiredExhibits` and the prompts'
  own inline section lists. Wiring `buildLanguagePolicyBlock` in safely means
  reconciling three overlapping vocabularies across every prompt, not a one-line
  addition — deliberately deferred as its own, more careful piece of work rather than
  risked in this pass.
