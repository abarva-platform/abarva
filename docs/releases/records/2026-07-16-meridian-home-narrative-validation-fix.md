# 2026-07-16-meridian-home-narrative-validation-fix — Fix Meridian Home Narrative Validation Failures

## Release ID

`2026-07-16-meridian-home-narrative-validation-fix`

## Status

`candidate`

## Plain-English Summary

The Knowledge/Home "Enterprise Brief" page for Meridian was showing an old, narrow, hardcoded fallback narrative ("Meridian Agent Assist Knowledge Command Center") instead of the richer, more balanced Claude-generated content that already existed in the same data file (`meridian-claude-approved.ts`, generated 2026-07-15). Root cause: the runtime picks the Claude-generated content only if it passes `validateHomeInsightSummary()` / `validateDimensionNarrative()` with zero failures — this is a defensible guardrail (it silently protects users from ever seeing broken/meta-referential generated prose) — but two pieces of the approved content failed it, so the whole thing silently fell back to the older seed content with no visible error anywhere:

1. `MERIDIAN_CLAUDE_HOME_INSIGHTS.executive_summary` opened with narrative-construction meta-language ("This narrative is built on...", "The story it tells is deliberate: the enterprise context layer is the hero...") instead of leading with the business situation, and repeated "Meridian" 3 times (max allowed is 2).
2. The `12_relationships` dimension narrative's `executive_summary` used the raw implementation term "source records" ("all 85 source records were skipped").

Because `getStoredKnowledgeDimensionNarratives()` gates on the _entire_ `MERIDIAN_CLAUDE_DIMENSION_NARRATIVES` array passing validation, that single `12_relationships` failure was silently degrading all 19 dimension narratives to the older seeded fallback, not just that one dimension.

Fixed both pieces of content — same underlying facts, same structure, rewritten to open with the business situation and avoid the specific forbidden phrases — and added a regression test so a future content regeneration that reintroduces this class of bug fails CI loudly instead of silently degrading to worse content in production.

## Layer Impact

- `client-data-lane`: `src/data/enterprise-knowledge/narratives/generated/meridian-claude-approved.ts` — Meridian-specific approved narrative content only. No code logic changed.

## Client Applicability

- All clients: no.
- Specific clients: Meridian Health only (`tenant_key: "meridian-health"`).
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/data/enterprise-knowledge/narratives/generated/meridian-claude-approved.ts` — rewrote `MERIDIAN_CLAUDE_HOME_INSIGHTS.executive_summary` and the `12_relationships` dimension's `executive_summary` to pass `validateHomeInsightSummary()` / `validateDimensionNarrative()`.
- `src/lib/enterprise-knowledge/narratives/__tests__/knowledge-narrative-store.test.ts` — new regression tests: all Meridian approved content passes its own runtime validators, and the runtime lookup functions actually resolve to the Claude-generated content (not the seeded fallback).

## QA / Validation

- Pass: `npx jest src/lib/enterprise-knowledge/narratives/__tests__/knowledge-narrative-store.test.ts --runInBand` (7/7, new)
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- Verified via a one-off script (not committed) that `validateHomeInsightSummary`, `validateDimensionNarrative` (all 19 dimensions), and `validateHomeVisualBlocks` all return zero failures against the edited content — now codified as the committed regression test above.
- Live signed-in re-test on Meridian pending this PR's merge + ACA deploy.

## Rollout Plan

Merge via squash to `main`. `.github/workflows/aca-main-deploy.yml` builds and deploys automatically on push to `main`. No env var, flag, or migration change — this is a static content file, no runtime code path changed.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (existing, unmodified).
- Shared runtime mutators: none.
- Approved image digest: assigned by the existing main-deploy workflow on merge.
- ACA runtime invariant: unaffected.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after merge + deploy — load `https://app.abarva.ai/home` as Meridian and confirm the Overview tab shows the richer executive summary (leads with the business situation, "context layer is the foundation, Agent Assist is one worked example" framing) instead of "Meridian Agent Assist Knowledge Command Center," and that all 19 left-nav dimension pages show their Claude-generated narratives.

## Rollback Plan

Revert the PR. Both edits are isolated string changes inside one data file; reverting restores the prior (validation-failing, seeded-fallback) state with no other side effects.

## Audit Evidence

- Live failure evidence: captured in-session (not committed) — screenshot of the Overview tab showing "Meridian Agent Assist Knowledge Command Center" / "Healthcare Demo is exploring AI Agent Assist for Member Service..." on `https://app.abarva.ai/home`.
- Validation run: `validateHomeInsightSummary`/`validateDimensionNarrative`/`validateHomeVisualBlocks` all return `[]` (zero failures) against the edited content — see the new test file for the codified check.
- PR URL: pending (this record ships in the same PR).

## Known Gaps

- This fixes the two content pieces that were failing validation; it does not redesign the broader narrative arc across all 19 dimension pages and their sub-tabs (Overview/Evidence Gaps/Use Cases/Proof) — that's a separate, larger content-strategy exercise the user wants to work through incrementally, dimension by dimension.
- Live signed-in re-proof on Meridian pending this PR's merge + deploy.
