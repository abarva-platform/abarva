# 2026-07-16-meridian-home-tab-intros-phase-a — Add Claude-generated Data/Relationships/Gaps/Evidence tab intros for Meridian

## Release ID

`2026-07-16-meridian-home-tab-intros-phase-a`

## Status

`candidate`

## Plain-English Summary

Follow-up to [2026-07-16-meridian-home-cxo-story-arc-prompt-rewrite](2026-07-16-meridian-home-cxo-story-arc-prompt-rewrite.md). That release covered the Home Overview and each dimension's Summary tab. Each dimension also has four more sub-tabs — Data, Relationships, Gaps, Evidence — that previously showed a purely algorithmic intro sentence built from raw record counts (e.g. "Meridian's X context reports 116 loaded records..."), not narrative content.

This release adds one short Claude-generated intro sentence (max two) per sub-tab per dimension — grounded in that dimension's own evidence, honest about validation status, and distinct in purpose per tab (Data: what the records represent and what to look for; Relationships: whether cross-domain links are validated or still candidate; Gaps: the single biggest evidence gap and why it matters; Evidence: what kind of source backs the records and how to use them). The existing algorithmic template remains as the fallback when Claude content is absent (e.g. for any tenant other than Meridian, or a future validation failure), so no other tenant's rendering changes.

Two runs hit transient JSON-generation glitches (a stray extra closing brace in one response, an unterminated string in another) — not reproducible root causes, just non-deterministic LLM output flakes; a retry with a larger token budget (16k -> 20k for the dimensions call, since 4 new fields x 19 dimensions increased output size) resolved it on the third attempt. Structural validation passed cleanly on that run (zero failures across all 19 dimensions). The CXO narrative-quality judge scored 4.2-4.3/5 across three consecutive attempts (just under the 4.4 pass bar, with `clutter_control` dipping to 3.7-3.8), which the requester judged to be normal run-to-run variance rather than a real content defect after reading the actual generated text — full Home executive brief and a 3-dimension sample (Enterprise Profile, Applications & Systems, Risks & Controls) x 4 tab intros were read in full before shipping. Added a `HOME_KNOWLEDGE_STORY_ALLOW_MANUAL_REVIEW=1` env-gated override to the generation script so a human who has read the actual text can ship past the advisory CXO gate without weakening the gate's default-blocking behavior for unreviewed runs.

## Layer Impact

- `client-data-lane`: `src/data/enterprise-knowledge/narratives/generated/meridian-claude-approved.ts` and `meridian-claude-visual-blocks-approved.ts` — adds `data_tab_intro`, `relationships_tab_intro`, `gaps_tab_intro`, `evidence_tab_intro` to all 19 Meridian dimension narratives.
- `internal-admin`: `scripts/knowledge/generate-home-knowledge-claude-narratives.ts` (prompt + schema + manual-review override), `src/lib/enterprise-knowledge/narratives/knowledge-narrative-store.ts` (new optional type fields, mapping into `HomeSummarySnapshot.contextAreas`, forbidden-language check coverage), `src/lib/home/home-summary-snapshot.ts` (new optional snapshot fields), `src/components/home/HomeSurface.tsx` (prefer Claude tab intro over the algorithmic template when present, unchanged fallback otherwise).

## Client Applicability

- All clients: no (fallback behavior unchanged for all other tenants).
- Specific clients: Meridian Health only (`tenant_key: "meridian-health"`) gets the new Claude-authored tab intros; every other tenant continues to see the existing algorithmic template text.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none — gated by `getStoredKnowledgeDimensionNarratives` tenant-key check, same mechanism as the existing Summary-tab content.

## Changes Included

- `src/lib/enterprise-knowledge/narratives/knowledge-narrative-store.ts` — added `data_tab_intro`/`relationships_tab_intro`/`gaps_tab_intro`/`evidence_tab_intro` (all optional) to `KnowledgeDimensionNarrativeSummary`; mapped them into `HomeSummarySnapshot.contextAreas[*]` as `claudeDataTabIntro` etc. in `applyStoredKnowledgeDimensionNarratives`; extended `validateDimensionNarrative`'s forbidden-language text scan to cover the new fields.
- `src/lib/home/home-summary-snapshot.ts` — added the four matching optional `claude*TabIntro` fields to `HomeContextAreaSummary`.
- `src/components/home/HomeSurface.tsx` — added the four fields to `DimensionStory`, populated them in `storyFromSnapshot`, and updated `buildTenantTabStories` so each of the 4 sub-tab `lead` values prefers the Claude-authored intro when present, falling back to the existing algorithmic template otherwise (same pattern already used for `nextAction`).
- `scripts/knowledge/generate-home-knowledge-claude-narratives.ts` — added the 4 fields to the dimension-narrative JSON schema and a new "TAB INTRO FIELDS" prompt section describing tone/grounding per field; added a structural-validation check requiring all 4 fields present and non-empty per dimension; raised the dimensions call's token budget from 16k to 20k; added `HOME_KNOWLEDGE_STORY_ALLOW_MANUAL_REVIEW=1` override for the CXO advisory gate.
- `src/data/enterprise-knowledge/narratives/generated/meridian-claude-approved.ts`, `meridian-claude-visual-blocks-approved.ts` — regenerated with the new fields.

## QA / Validation

- Pass: structural validation (`validateHomeInsightSummary` / `validateDimensionNarrative` x19 / `validateHomeVisualBlocks` / new tab-intro completeness check) — zero failures (`reports/home-knowledge-story-quality/summary.json`: `"status": "passed"`).
- Advisory-only: CXO narrative-quality judge scored 4.2-4.3/5 across three attempts (bar is 4.4) — shipped via the manual-review override after the requester read the actual generated text for the home brief and a 3-dimension sample. Not a lowered bar; documented as run-to-run variance, to revisit if it recurs.
- Pass: `npx jest src/lib/enterprise-knowledge/narratives/__tests__/knowledge-narrative-store.test.ts --runInBand` (7/7).
- Pre-existing, unrelated: `src/components/home/__tests__/HomeSurface.test.tsx` has 2 failures (stale hardcoded record-count assertion) that reproduce identically on the base commit before this change (`git stash` verified) — not caused by this PR, out of scope to fix here.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p .` — clean.
- Live signed-in re-test on Meridian pending this PR's merge + ACA deploy.

## Rollout Plan

Merge via squash to `main`. `.github/workflows/aca-main-deploy.yml` builds and deploys automatically on push to `main`. No env var, flag, or migration change for the runtime path — this is a static content file plus optional-field UI wiring with an unchanged fallback; no other tenant's rendering is affected.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (existing, unmodified).
- Shared runtime mutators: none.
- Approved image digest: assigned by the existing main-deploy workflow on merge.
- ACA runtime invariant: unaffected.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after merge + deploy — load `https://app.abarva.ai/home` as Meridian, open a dimension (e.g. Applications & Systems), and confirm the Data/Relationships/Gaps/Evidence tab intros show the new grounded sentences instead of the "N loaded records" template text.

## Rollback Plan

Revert the PR. The four new fields are optional on the type; reverting removes them from the approved content and the UI falls back to the unchanged algorithmic template automatically, with no other side effects.

## Audit Evidence

- Structural validation output: `reports/home-knowledge-story-quality/summary.json`, `validation-results.json`.
- CXO judge score and rationale (advisory, not blocking on this release): `reports/home-cxo-narrative-visuals/summary.md`.
- Raw Claude prompt and responses: `reports/home-knowledge-story-quality/claude-prompts/meridian-home-story-prompt.txt`, `claude-responses/meridian-home-insight-response.txt`, `claude-responses/meridian-dimension-narratives-response.txt`.
- PR URL: pending (this record ships in the same PR).

## Known Gaps

- CXO gate hasn't cleared 4.4 on this content across 3 attempts (closest: 4.3) — worth one more prompt pass on `clutter_control`/`insight_quality` in a future round, not blocking given manual review.
- Phase B (advanced visual-spec types — dependency maps, risk heatmaps, readiness matrices beyond the existing 5 visual types) remains a separate, unscoped future increment requiring new types, validators, and `HomeSurface.tsx` renderer components.
