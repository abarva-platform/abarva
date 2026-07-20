# 2026-07-20-source-artifact-quality-contract-unification — Reconcile the three artifact-quality vocabularies and wire the canonical contract into generation

## Release ID

`2026-07-20-source-artifact-quality-contract-unification`

## Status

`candidate`

## Plain-English Summary

Three separate systems in Source described "what a good artifact contains and how it
should read," and none of them talked to each other:

1. `source-artifact-profiles.ts`'s `requiredExhibits` — a semantic, snake_case exhibit
   list covering all 40 registered artifact codes, plus a rich profile (audience, risk
   depth, reader mode, evidence mode, banned terms) used to build a full language-policy
   prompt block (`buildLanguagePolicyBlock`) — which, until this release, had **zero call
   sites in the actual generation pipeline**.
2. `SOURCE_ARTIFACT_REQUIRED_SECTIONS` — a hand-authored, human-readable section-heading
   list used for post-generation structural verification (`verifyArtifactSections`) and
   heading normalization. Only 2 of 40 codes had an entry; everything else silently had
   zero structural verification.
3. `prompt-registry.ts`'s ~30 hand-written per-artifact `systemPrompt` strings — each
   independently encoding its own subset of structural and tone guidance, sometimes
   overlapping with #1 and #2, sometimes not.

This release makes #1 (`source-artifact-profiles.ts`) the canonical artifact-quality
contract and reconciles the other two around it, without touching or weakening any
artifact's existing hand-tuned content:

- **#2 is now derived from #1**, not hand-maintained separately.
  `getRequiredSectionsForArtifact()` checks the 2 existing hand-tuned literal entries
  first (kept byte-identical — d05's literal text is materially different content from
  its profile's `requiredExhibits`, proving the override genuinely wins, not silently
  replaced) and, for every other code, derives a humanized heading list from the
  profile's `requiredExhibits` — extending real structural-verification coverage from
  2/40 codes to 40/40.
- **#3 is left completely unedited.** Every one of the ~30 hand-written `systemPrompt`
  strings keeps 100% of its existing structural and tone instructions. Instead, the
  canonical language-policy block (`buildLanguagePolicyBlock`, previously orphaned) is
  appended additively — via a new pure `appendLanguagePolicyBlock()` wrapper — to the
  *effective* system prompt actually sent to Claude, computed once in
  `generate/route.ts` at both real consumption points (the AI-egress preflight audit
  call and the actual Anthropic `messages.stream` call). A template author's carefully
  written prompt is never rewritten; the profile's audience/depth/evidence-mode/
  banned-terms guidance is layered on top.

## Layer Impact

- `global-control-lane`: Source artifact generation
  (`generate/route.ts`, `section-conformance.ts`, `source-documentation-standards.ts`)
  for all tenants. This is a real behavior change to every future Source generation call
  (larger system prompts; genuinely new structural verification for 38 previously-
  uncovered codes) — see Known Gaps for the expected consequence.
- No database, migration, or schema change.

## Client Applicability

- All clients: yes — every future Source artifact generation, across all 40 registered
  codes, now carries the canonical language policy and (for codes without a literal
  override) a derived section-verification list.
- Specific clients: none.
- Internal only: no — the language policy affects the actual generated artifact text
  quality/tone, which reaches clients and vendors.
- Public/demo only: no.
- Feature flag: none. This is additive to every generation and was judged low-risk
  enough not to warrant a flag (unlike the quality-gate expansion in
  [[2026-07-20-source-quality-gate-artifact-aware]], which changes whether generation can
  *fail*; this changes only prompt content and post-generation metadata, never blocks a
  generation from completing).

## Changes Included

- `src/lib/source/agent-generation/section-conformance.ts` — renamed the literal map to
  `SOURCE_ARTIFACT_REQUIRED_SECTIONS_OVERRIDES` (kept the old export name as a
  `@deprecated` alias for any external reader), added `getSourceArtifactProfile`-backed
  derivation with a local `humanizeExhibitKey` helper, rewrote
  `getRequiredSectionsForArtifact()` to check the override map first, then derive.
- `src/lib/source/documentation-standards/source-documentation-standards.ts` — added
  `appendLanguagePolicyBlock(systemPrompt, artifactCode)`, a pure wrapper around the
  existing (previously unused) `buildLanguagePolicyBlock`.
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts` — compute
  `effectiveSystemPrompt` once via `appendLanguagePolicyBlock`, right after the prompt
  template is resolved; use it at both places `template.systemPrompt` was previously read
  directly (the AI-egress preflight audit call, and the real Anthropic `messages.stream`
  call).
- Tests: `section-conformance.test.ts` (override-wins vs. derived-fallback, unregistered
  code), `source-documentation-standards.test.ts` (artifact-specific requirements reach
  the prompt; d09's evidence-coverage-map language does not leak into a non-RFP artifact
  even though "RFP" itself legitimately appears in d01's own decision purpose; banned-terms
  prevention instruction present alongside the independent deterministic backstop scan;
  no-op for an unregistered code).
- This release record.

## QA / Validation

- `pass` — Focused Jest:
  `npx jest --runTestsByPath src/lib/source/agent-generation/__tests__/section-conformance.test.ts src/lib/source/documentation-standards/__tests__/source-documentation-standards.test.ts`
  — 45/45 passed.
- `pass` — Broader Source regression:
  `npx jest --testPathPatterns="src/lib/source|src/app/api/v1/source"` — 2227/2259 passed,
  10 suites / 32 tests failing, matching the exact pre-existing failure baseline confirmed
  repeatedly earlier this session (unrelated to this change).
- `pass` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
  — clean, no errors.
- `pending` — `npm run release:check` — to run before PR.
- `pending` — Live signed-in generation proof for at least one high-stakes artifact,
  confirming (a) the effective system prompt actually reaches Claude with the appended
  policy block, (b) generation still succeeds end-to-end, (c) the resulting artifact's
  `body_generation_metadata.sectionVerification` shows real (not `null`) coverage for a
  code that previously had none. To be completed and recorded before claiming
  "live-proven."

## Rollout Plan

Merge to main via the repo-owned ACA main-deploy workflow. Takes effect immediately on
every Source generation call — no flag, no migration.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none beyond the standard main-deploy workflow.
- Approved image digest: recorded post-merge once the deploy run completes.
- ACA runtime invariant: to be verified post-deploy (template image = 100%-traffic
  revision image = worker images, matching approved digest).
- Worker image invariant: covered by the same main-deploy workflow step.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — a real generation run, see QA above.

## Rollback Plan

Revert the merge commit. No migration, no data mutation. Note: any artifact generated
between this deploy and a rollback carries the appended language-policy block in its
prompt (not stored on the artifact itself beyond the body text it may have influenced) —
a rollback stops future generations from getting it; it does not and cannot retroactively
change already-generated bodies.

## Audit Evidence

- PR URL: recorded post-open.
- Focused + broader Jest logs: 45/45 and 2227/2259 with confirmed pre-existing baseline.
- Typecheck log: clean.

## Known Gaps

- **`normalizeRequiredSectionHeadings` / `verifyArtifactSections` will very likely report
  `status: "incomplete"` for many of the 38 newly-covered artifact codes on their first
  generations after this deploy.** Their prompts (`prompt-registry.ts`) were never
  written with these exact derived heading strings in mind — most will not produce
  headings that match word-for-word. This is expected and honest, not a bug: previously
  these codes had `sectionVerification: null` (never checked at all); now they get a real
  check that may initially fail. This is intentionally not treated as a blocking gate
  (verification is metadata-only, never fails generation) precisely because the prompts
  need their own follow-up tuning pass to actually pass it — that tuning pass is
  explicitly out of scope here.
- **The D09 map-reduce path (`d09-map-reduce.ts`, flag `ABARVA_SOURCE_D09_MAP_REDUCE`,
  default off) builds its own independent per-section system prompts and does not go
  through `effectiveSystemPrompt`/`appendLanguagePolicyBlock` at all.** d09 already
  receives the most rigorous review in the system (the consulting-grade quality gate with
  its own detailed source context), so this was judged an acceptable, disclosed scope
  boundary rather than a silent gap — retrofitting a self-contained, flag-gated,
  single-artifact optimization path is separate, additional work.
- **Prompt-registry.ts's own hand-written structural instructions are left completely
  untouched**, by design — this release deliberately does not attempt to rewrite or
  reconcile the *content* of any of the ~30 individual prompts (only appends a
  supplementary layer). A prompt whose own hand-written instructions actively conflict
  with the appended policy block (none identified during this pass, but not exhaustively
  audited across all 40) would need its own review.
- Live signed-in generation proof is pending as of this record's initial write.
