# 2026-07-16-meridian-home-cxo-story-arc-prompt-rewrite — Rewrite Meridian Home/Knowledge narrative prompt for genuine CXO quality

## Release ID

`2026-07-16-meridian-home-cxo-story-arc-prompt-rewrite`

## Status

`candidate`

## Plain-English Summary

Follow-up to [2026-07-16-meridian-home-narrative-validation-fix](2026-07-16-meridian-home-narrative-validation-fix.md), which fixed a silent validation-fallback bug so Meridian's Home/Knowledge page shows Claude-generated content instead of an old hardcoded seed. This release fixes the _quality_ of that generated content, not just its validity.

Root cause investigated this round: the generation prompt forced every `executive_summary` (home-level and per-dimension) through a rigid Situation→Complication→Insight→Implication→Action sequence "inside flowing prose" as one dense block, capped at loose sentence-count guidance. Compared side-by-side against an unconstrained Claude response on an equivalent enterprise-brief task, the constrained version was measurably worse — denser, less scannable, and read as a checklist rather than an advisory brief — even though both used the same underlying model.

Rewrote the prompt to: (1) allow two short paragraphs instead of one dense block, (2) cover the same ideas without forcing the literal S-C-I-I-A structure, (3) use exactly one tenant display name ("Meridian") instead of alternating with the internal "Healthcare Demo" label, (4) cap system-name and executive-role-title enumeration per paragraph (previously the model would chain 6-9 product/role names into one sentence), (5) require `questions_supported` entries to be decision-implication statements grounded in a specific fact, not generic guide-style questions, (6) fact-checked and corrected two specific overclaim patterns flagged in review — "named executive owner" (the context pack's `executiveOwner` field is a role title, not a named individual) and unqualified "fund" language (reserved now for cases with an evidenced budget figure).

Also fixed a real bug in the script's own CXO narrative-quality judge gate (`scoreCxoNarrative`/`cxoPass` in `scripts/knowledge/generate-home-knowledge-claude-narratives.ts`): the gate's `overall` field was a separately-elicited whole-number "holistic" score from the judge, which anchored at 4 regardless of how strong the 9 individual category scores were, making the `overall >= 4.4` pass bar mathematically unreachable. Separately, the per-category pass check (`every category >= 4.0`) iterated `Object.entries(cxoScore)` filtering out only `"overall"` — leaving the string `rationale` field in the iteration, so `Number(rationale) >= 4.0` evaluated `NaN >= 4.0`, always `false`. This meant the CXO gate had never been passable, regardless of content quality, since the script was first written. Fixed both: `overall` is now computed as the mean of the 9 explicitly-typed category scores (requested to 1 decimal place for real differentiation instead of flat integers), and the per-category check now iterates the known category list instead of all object keys. The pass bar itself (`overall >= 4.4`, no category `< 4.0`) was not lowered.

## Layer Impact

- `client-data-lane`: `src/data/enterprise-knowledge/narratives/generated/meridian-claude-approved.ts` and `meridian-claude-visual-blocks-approved.ts` — Meridian-specific approved narrative content, regenerated under the new prompt.
- `internal-admin`: `scripts/knowledge/generate-home-knowledge-claude-narratives.ts` — the offline generation script's prompt and CXO gate logic. Not a runtime code path; only affects future regeneration runs.

## Client Applicability

- All clients: no.
- Specific clients: Meridian Health only (`tenant_key: "meridian-health"`).
- Internal only: the generation script change is internal tooling; the content change is client-visible to Meridian.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/knowledge/generate-home-knowledge-claude-narratives.ts` — prompt rewrite (two-paragraph structure, single tenant name, system-name/role-title budgets, decision-implication grounding for `questions_supported`, claim-strength discipline for geography/ownership/funding language, banned report-speak phrases) and CXO judge gate math fix (computed `overall` from category mean at decimal precision; fixed `rationale`-string-poisons-`every()` bug in the pass check).
- `src/data/enterprise-knowledge/narratives/generated/meridian-claude-approved.ts` — regenerated home insight summary and all 19 dimension narratives under the new prompt.
- `src/data/enterprise-knowledge/narratives/generated/meridian-claude-visual-blocks-approved.ts` — regenerated home visual blocks (same 5 existing visual types; no new visual types introduced this round).
- `reports/home-knowledge-story-quality/`, `reports/home-cxo-narrative-visuals/` — regenerated proof/audit artifacts from this run (structural validation results, CXO judge score, raw Claude prompt/response text).

## QA / Validation

- Pass: `validateHomeInsightSummary` / `validateDimensionNarrative` (all 19 dimensions) / `validateHomeVisualBlocks` — zero structural failures (`reports/home-knowledge-story-quality/summary.json`: `"status": "passed"`, `"validation": []`).
- Pass: CXO narrative-quality judge gate — `overall: 4.4/5`, all 9 categories >= 4.0 (lowest: clutter_control 4.0, language_quality 4.1) — `reports/home-cxo-narrative-visuals/summary.md`.
- Pass: `npx jest src/lib/enterprise-knowledge/narratives/__tests__/knowledge-narrative-store.test.ts --runInBand` (7/7, pre-existing regression suite, re-run against the newly regenerated content).
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p .` — clean.
- Manual content review: home executive brief and 5 dimension summaries (Enterprise Profile, Applications & Systems, Data Assets & Integrations, Risks & Controls, Metrics & Outcomes) read in full by the requester before this record was written, per standing instruction to review actual generated text before shipping, not just validator/gate pass status.
- Known residual, non-blocking: one dimension (Risks & Controls) still contains the plumbing word "loaded" ("no loaded data quality rules") that should have been caught by the report-speak ban; left for a follow-up prompt pass rather than blocking this release, per explicit direction not to over-index on perfecting every phrase in one round given this content will be regenerated repeatedly as source data changes.
- Live signed-in re-test on Meridian pending this PR's merge + ACA deploy.

## Rollout Plan

Merge via squash to `main`. `.github/workflows/aca-main-deploy.yml` builds and deploys automatically on push to `main`. No env var, flag, or migration change — this is a static content file plus an offline generation script; no runtime code path changed.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (existing, unmodified).
- Shared runtime mutators: none.
- Approved image digest: assigned by the existing main-deploy workflow on merge.
- ACA runtime invariant: unaffected.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after merge + deploy — load `https://app.abarva.ai/home` as Meridian and confirm the Overview tab and all 19 left-nav dimension Summary tabs show the new two-paragraph, single-name, decision-framed narrative content.

## Rollback Plan

Revert the PR. The generated content files are fully regenerable from the prior prompt version (still in git history) if needed; reverting restores the prior validation-passing content with no other side effects.

## Audit Evidence

- CXO judge score and rationale: `reports/home-cxo-narrative-visuals/summary.md`, `cxo-narrative-score.csv`.
- Structural validation output: `reports/home-knowledge-story-quality/summary.json`, `validation-results.json`.
- Raw Claude prompt and responses (for full-text audit): `reports/home-knowledge-story-quality/claude-prompts/meridian-home-story-prompt.txt`, `claude-responses/meridian-home-insight-response.txt`, `claude-responses/meridian-dimension-narratives-response.txt`.
- PR URL: pending (this record ships in the same PR).

## Known Gaps

- The "loaded" plumbing-word slip in Risks & Controls (noted above) — low-priority follow-up.
- This release covers Home Overview and the 19 dimension Summary tabs only. Home's Evidence Gaps/Use Cases/Proof tabs already render from the same `homeInsightSummary` fields regenerated here (`top_gaps`, `module_readiness`, `enterprise_context_map`) and did not need separate generation. Each dimension's Data/Relationships/Gaps/Evidence sub-tabs render structured records today, not narrative prose — extending short narrative intros to those sub-tabs is scoped as a separate follow-up increment, not included here.
- Broader "advanced visual spec" system (dependency maps, risk heatmaps, readiness matrices beyond the existing 5 visual types) requires new types, new validators, and new renderer components in `HomeSurface.tsx` — explicitly out of scope for this release; scoped as its own future PR.
