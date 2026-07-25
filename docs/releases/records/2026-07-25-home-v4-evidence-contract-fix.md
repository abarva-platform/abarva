# 2026-07-25-home-v4-evidence-contract-fix — Close the evidence_status/evidence_refs loophole

## Release ID

`2026-07-25-home-v4-evidence-contract-fix`

## Status

`candidate` — prompt/schema/validator fix, zero-cost-verified. First-capital regeneration is a
separate, scoped-to-one-tenant action after this merges and deploys.

## Plain-English Summary

Today's real book-mode canary+persist job persisted a `candidate_failed` row for first-capital:
12 validator findings, all `insight_without_evidence`, collapsing to 3 distinct substantive
claims (franchise breadth across products, initiative-to-sponsor relationship linkage,
application ownership completeness) that Claude wrote with `evidence_status: "evidenced"` while
providing zero `evidence_refs` -- a real, false claim of support, not a benign omission (the
existing renderer fallback only auto-fills `evidence_status: "not_evidenced"` when the field is
missing entirely; it correctly leaves an explicit-but-false `"evidenced"` claim alone for the
validator to catch, which it did).

The validator was behaving correctly and is unchanged in that respect. This PR tightens the
generation contract Claude is asked to follow, so this class of miss is less likely to recur, and
adds one new, narrower validation rule for a related gap:

1. **Prompt**: the `evidence_refs`/`evidence_status` relationship is now stated as an isolated,
   mechanically-checked HARD RULE (not one clause buried in a longer evidence-semantics
   paragraph), with an explicit right/wrong example naming the exact real defect
   (`evidence_status: 'evidenced'` with `evidence_refs: []`) and an explicit instruction to
   default to honest disclosure when uncertain.
2. **New field**: `evidence_gap_note` -- required whenever a conclusion is marked
   `evidence_status: "not_evidenced"`, naming in one short phrase what evidence would be needed.
   An honest-but-unexplained "no evidence" marker is functionally the same silent omission the
   marker exists to prevent.
3. **New validator rule**: `missing_evidence_gap_note` -- fails a candidate whose `key_insight` is
   marked `not_evidenced` but carries no gap note. Applies at the same per-dimension `key_insights`
   level as the existing `insight_without_evidence` rule (both operate on the renderer's
   deterministic `conclusions[] -> key_insights[]` projection, described below).
4. **Renderer**: passes `evidence_gap_note` through from `book.conclusions[]` into each rendered
   dimension's `key_insights[]`, so the validator (and, once built, the review UI) can see it.
5. **Regression tests**: 3 new fixtures reproducing the exact real first-capital failure shape
   (`evidence_status: "evidenced"` + `evidence_refs: []`) for each of the three real claim
   patterns, plus 1 new fixture proving the `missing_evidence_gap_note` rule fires. The existing
   `honest-not-evidenced` fixture is updated to carry a real `evidence_gap_note` (previously valid
   under the old, looser contract).

### What this is not

This does not touch `insight_without_evidence` itself, does not weaken any existing rule, and does
not regenerate any tenant. First-capital's regeneration -- the one place this fix needs to prove
itself against real content -- is a separate, explicit, single-tenant action after this merges and
deploys, per standing instruction not to regenerate blindly before understanding the failure.
skyharbor-air and meridian-health are unaffected either way (they passed validation cleanly and are
not touched by this change).

## Layer Impact

- `internal-admin` lane: operator/generator script and validator changes only. No product-surface
  code changes (the type extension is additive and currently unconsumed by any UI).

## Client Applicability

- Internal only. No tenant's approved content changes; no tenant is approved by this PR.

## Changes Included

- `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`: HARD RULE paragraph in the
  `enterprise_book` prompt instruction; `evidence_gap_note` added to `conclusions_shape` and
  reinforced in `hard_limits`; `renderDimensionsFromBook()` passes `evidence_gap_note` through
  into rendered `key_insights`.
- `scripts/knowledge/validate-integrated-manifest.mjs`: new `missing_evidence_gap_note` rule.
- `scripts/knowledge/__fixtures__/integrated-manifest/`: `honest-not-evidenced.json` updated with
  a real gap note; 4 new fixtures (`franchise-breadth-false-evidenced.json`,
  `relationship-sponsor-linkage-false-evidenced.json`,
  `application-ownership-false-evidenced.json`, `not-evidenced-missing-gap-note.json`).
- `scripts/knowledge/__tests__/run-integrated-manifest-tests.mjs`: registers the 4 new fixture
  cases.
- `src/components/home/v4/homeV4Visual.ts`: additive `evidence_gap_note?: string` on
  `HomeV4BookKeyInsight` and `HomeV4Conclusion`.

## QA / Validation

- `pass` — `node --check` and `npx eslint` on all changed `.mjs`/`.ts` files, exit 0.
- `pass` — `npm run home:knowledge-v4:test-manifest-validator`: 16/16 fixture cases (12 existing +
  4 new), including all three real first-capital failure patterns and the new gap-note rule.
- `pass` — `npm run home:knowledge-v4:test-prompt-preflight`: 6/6, including `real-current-prompt`
  (proves the edited prompt text still carries no forbidden fields and all required fields).
- `pass` — Full production `npm run build`, zero errors.
- `not yet run` — regeneration of first-capital against the fixed prompt (separate, scoped,
  post-merge action; see Rollout Plan).

## Rollout Plan

1. Merge → `aca-main-deploy.yml` builds and deploys automatically.
2. Separate governed ACA job, scoped to first-capital only:
   `HOME_KNOWLEDGE_V4_TENANT=first-capital HOME_KNOWLEDGE_V4_BOOK_MODE=true npm run
   home:knowledge-v4:canary-and-persist-job`. skyharbor-air and meridian-health are not
   regenerated.
3. Pull the fresh candidate's `quality_report` via `home:knowledge-v4:inspect-candidate` and
   confirm `validation_status: pass` before considering first-capital reviewable.
4. Only after that: proceed to the UI (`candidate_failed` state, findings display, audited
   override) and job-hardening (durable proof bundle, fail-if-no-quality-report, separate
   pass/fail counts) work, per the explicit sequencing given for this fix.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`, triggered by merge.
- Shared runtime mutators: none in this PR. The scoped first-capital regeneration is a separate,
  explicit action, not part of this merge.
- Live signed-in proof required: no — no user-facing surface changes.

## Rollback Plan

Revert the PR. The prompt reverts to the prior (looser) contract and the new validator rule
disappears; no persisted data is affected.

## Audit Evidence

- `docs/releases/records/2026-07-25-home-v4-book-live-cutover.md` and
  `2026-07-25-home-v4-book-canary-and-persist-job.md` — the original book-mode generator and job
  script this fix builds on.
- Real first-capital `quality_report` (row `33b5b010-651e-4a21-a351-30a44b5dd01f`), retrieved via
  `home:knowledge-v4:inspect-candidate`, is the source of the three real failure patterns encoded
  in this PR's regression fixtures.

## Known Gaps

- The review UI (findings display, `candidate_failed` state, audited override) and job hardening
  (durable proof bundle, fail-if-no-quality-report, separate success/failure counts) are explicitly
  deferred to a follow-up PR, per the sequencing given for this fix: correct the generation
  contract and prove it against first-capital before improving the review experience.
