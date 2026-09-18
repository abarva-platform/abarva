# 2026-09-18-atlas-enterprise-read-scrub — Govern the Atlas enterprise-read lead block

## Release ID

`2026-09-18-atlas-enterprise-read-scrub`

## Status

`candidate`

## Plain-English Summary

When a user asks Atlas a broad "what should I know / what's the current state"
question, the answer is led with a short block drawn from the tenant's derived
enterprise read artifact: a headline, the lead recommended move, and — from this
change — the artifact's own data-quality caution.

That lead block is written by the orchestrator, not by the model. It was being
prepended *after* the answer producer had already run its autonomous-decision
scrub, so the block itself was never scrubbed. The scrub exists so that advisory
text cannot read as a decision that has already been taken: it rewrites phrases
like "<agent> selected …" into "the AI advisor recommended for human review", and
"must approve …" into "should review whether to". Any such phrasing sitting in
the artifact's headline or its lead recommended move reached the reader verbatim,
above the answer, in the position of greatest authority.

The same block also dropped the artifact's `dataQualityCaution` — the field in
which the read states what it is unsure about (coverage gaps, attestation levels,
stale rows). Leading an answer with the read's conclusion while discarding its
stated caveat quotes the read more confidently than the read claims to be. The
artifact's other consumer, the Intelligence sources builder, already carried this
field; the Atlas lead block did not.

Both are now fixed in the one place that composes the block: the authored text
passes the same scrub every other rendered line passes, and the caution is
rendered when the read declares one.

## Layer Impact

**Release lane: `global-control-lane`.** Shared app behaviour for every client;
not feature-gated.

- **Layer 4 (Products) — Tower / Atlas advisory surface.** Changes only how the
  enterprise-read lead block is composed before display. No change to what is
  retrieved, calculated or stored.
- **Layer 3 (Canonical model).** Unchanged. No metric, fact or value is computed,
  altered or re-derived here; Tower numbers remain deterministic and owned by the
  read models.
- **Layers 1–2 (Intake, adapters).** Unchanged.

## Client Applicability

- All clients: yes — every tenant for which a derived enterprise read artifact
  resolves, on broad-context Atlas questions.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The lead block is not flag-gated; this change governs text
  that already renders today.

## Changes Included

- `src/lib/atlas/orchestrator.ts` — `enrichWithEnterpriseRead` now runs
  `sanitizeAutonomousDecisionLanguage` over the authored lead block and renders
  `dataQualityCaution` when the read declares one. The de-duplication guard also
  compares the scrubbed headline, so a producer that already emitted the headline
  in scrubbed form does not get a second lead block prepended.
- `src/lib/atlas/__tests__/orchestrator-enterprise-read-enrichment.test.ts` — new
  behavioural suite driving the real `runAtlasTurnDetailed`.

No migration, no route contract change, no schema change.

## QA / Validation

**Behavioural suite.** Seven cases drive the real `runAtlasTurnDetailed` with the
answer producer mocked and `@/lib/ai-liability/human-decision-controls`
deliberately **not** mocked, so the real scrub has to run for the assertions to
mean anything. The suite fails when the control stops running, not when a token
stops appearing in a file.

- Authored ahead of the fix: **3 failed, 4 passed.** The three failures were the
  defect — unscrubbed decision language in the lead recommended move, unscrubbed
  obligation language in the headline, and the missing caution. The four passes
  were the guard cases that already behaved (no read available, off-topic
  question, read with no caution, lead block already present).
- After the fix: **7 passed.**

**Mutation checks**, each applied and reverted:

| Mutation | Result |
|---|---|
| Drop the scrub on the authored lead block | 2 failed, 5 passed |
| Drop the `dataQualityCaution` line | 1 failed, 6 passed |
| Emit the caution line unconditionally, ignoring the read's own null | 1 failed, 6 passed |

Restored: 7 passed.

**Regression over the same scope** (`src/lib/atlas/**/__tests__`), clean
`origin/main` versus the branch: **2 failing before, 2 after**; 222 passing → 229.
The two pre-existing failures (`tower-grounding-client-name.test.ts`, which fails
to run, and the two cases in `orchestrator-governed-tower.test.ts`) fail
identically on clean `origin/main` and are unrelated to this change.

**Typecheck.** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit
--pretty false` — **exit code 0**, zero diagnostics, run against a fresh
`tsconfig.tsbuildinfo`. Judged by exit code, not by grepping output.

**Lint.** `npx eslint` over both changed files — exit 0, no findings.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds the image and
shifts traffic. No migration to apply, no flag to flip, no data build to run.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to
  `main`. No ad-hoc `az` command is used by this release.
- Shared runtime mutators: none. This change does not touch env vars, secrets,
  scale, revision weights, or the Container App template.
- Approved image digest: recorded after the deploy run completes.
- ACA runtime invariant: to be proven after deploy — Container App template image
  digest must equal the digest on the 100%-traffic revision, and that revision
  must report Healthy/Running.
- Worker image invariant: not applicable; no worker job changes.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **yes** — see Known Gaps.

## Rollback Plan

Revert the PR and let the deploy workflow ship the prior image, or re-point ACA
traffic at the previous digest-pinned revision. The change is confined to one
pure composition function and its test; there is no persisted state to unwind and
no migration to reverse.

## Audit Evidence

- PR URL and CI run: recorded on merge.
- Merge SHA, deploy run id, and the digest equality check: recorded on deploy.
- Test evidence: the suite named above, plus the before/after and mutation
  numbers in QA / Validation, all reproducible locally with
  `npx jest --runTestsByPath src/lib/atlas/__tests__/orchestrator-enterprise-read-enrichment.test.ts`.

## Known Gaps

- **No signed-in acceptance yet.** This is `candidate`, not `live-proven`. The
  suite proves the control runs inside the real orchestrator turn; it does not
  prove that a signed-in user on the deployed revision now sees a scrubbed lead
  block carrying the caution. That check is owed.
- **The scrub is pattern-based.** It rewrites a fixed set of phrasings. An
  artifact that asserts a settled decision in wording outside those patterns is
  not caught. That limitation predates this change and is unchanged by it — this
  release repairs *where* the scrub runs, not *what* it recognises.
- **The model prompt context still omits the caution.** The same artifact is
  summarised into the model's prompt elsewhere in the Atlas path without its
  `dataQualityCaution`. That is a separate surface from the rendered lead block
  and is out of scope here; it is worth a follow-up so the model reasons with the
  caveat the reader now sees.
- **Sibling composition paths not audited.** Only the enterprise-read lead block
  was in scope. Whether every other authored prepend across agent surfaces passes
  the same scrub was not surveyed in this release.
