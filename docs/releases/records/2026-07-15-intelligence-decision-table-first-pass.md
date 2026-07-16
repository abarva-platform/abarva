# 2026-07-15-intelligence-decision-table-first-pass — Move Decision-Table Contract to the Always-On First Pass

## Release ID

`2026-07-15-intelligence-decision-table-first-pass`

## Status

`candidate`

## Plain-English Summary

Follow-up to [#4851](https://github.com/abarva-platform/abarva/pull/4851) (`2026-07-15-intelligence-decision-table-artifacts`). Live signed-in testing on Meridian immediately after that PR deployed showed the reported bug — ranking asks falling back to the "Requested Visual Boundary" guardrail — was still happening. Root-caused to two things:

1. PR #4851's fix lived inside a **second-pass "repair" call** gated behind `isBlockingIntelligenceRepairEnabled()`, which reads the `INTELLIGENCE_LIVE_REPAIR_MODE` environment variable. That variable is **not set at all** in the production Container App, so the repair pass — and therefore the whole fix — never executed live. This was true even before #4851; the pre-existing Markdown-table repair pass was equally dead code in production.
2. The Intelligence page's "aVa · Intelligence advisor" chat dock calls the synthesizer with `answerOnly=true`, which takes a **completely separate first-draft prompt-construction branch** (`isVisualTableAsk` → `CONSULTANT_ANSWER_SHAPE_CONTRACT_TABLE`) that PR #4851 never touched. The repair-pass code path only mattered for a different (`richText && !answerOnly`) tabbed-canvas mode this dock doesn't use.

This PR moves the decision-table contract into that first-draft `answerOnly` prompt path directly — always on, no feature flag, no second API call. It also found and fixed a related gap: `isRankedDecisionAsk()` correctly detects bare "rank X vs Y by ..." phrasing, but the pre-existing `isExplicitVisualAsk()` word list only matched "ranking"/"ranked", not "rank" — so the exact reported query would never have qualified for table-first treatment under any gating scheme that relied on `isExplicitVisualAsk` alone. Separately, a second live-tested query ("tables and charts" with thin follow-up evidence) hit the _pre-existing_ generic mandatory-table prompt and still failed — the same "Claude hedges rather than mark a value directional under thin evidence" behavior Slice 3 of the original design already recognized, but the generic table prompt never got that permission. That prompt now includes the same directional-estimate permission.

## Layer Impact

- `global-control-lane`: `src/lib/intelligence/ask/synthesizer.ts` first-draft prompt construction for the `answerOnly` streaming path (used by the Intelligence advisor chat dock, and any other caller using the same flags).

## Client Applicability

- All clients: yes — shared prompt-construction fix, not tenant-scoped.
- Specific clients: reported and live-tested on Meridian Health.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none — this fix specifically REMOVES a dependency on the `INTELLIGENCE_LIVE_REPAIR_MODE` flag, since that flag was found to be unset (disabled) in production.

## Changes Included

- `src/lib/intelligence/ask/synthesizer.ts`:
  - Extracted the decision-table format contract into a shared `DECISION_TABLE_FORMAT_CONTRACT` string, reused by both the new first-pass prompt (`mandatoryDecisionTableFormatPrompt()`) and the existing repair-pass instruction.
  - New `wantsDecisionTableFirstPass` gate (`answerOnly && isRankedDecisionAsk(args.query)`) that selects the decision-table mandatory format on the FIRST model call, independent of `isExplicitVisualAsk` and independent of `isBlockingIntelligenceRepairEnabled()`.
  - Added a "use your best professional judgment, label directional" permission to the pre-existing generic mandatory-table prompt (the `isVisualTableAsk` branch), so generic table/chart asks under thin evidence no longer have to choose between fabricating a value and refusing to produce a table.
- `src/lib/intelligence/ask/__tests__/decision-table-gate.test.ts` — new tests locking in the `isRankedDecisionAsk` vs `isExplicitVisualAsk` gating gap (the exact reported query matches the former, not the latter) and the complementary generic case.
- This release record.

## QA / Validation

- Pass: `npx jest src/lib/intelligence/ask/__tests__/decision-table-gate.test.ts --runInBand` (4/4, new)
- Pass: `npx jest src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts --runInBand` (37/37, unaffected by this change — regression check)
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- Pass: `node scripts/release-check.mjs --base origin/main --head HEAD`
- Live signed-in re-test on Meridian pending this PR's merge + ACA deploy (tracked as a known gap below) — the previous live test that surfaced this bug was run against the #4851 deploy, before this fix existed.

## Rollout Plan

Merge via squash to `main`. `.github/workflows/aca-main-deploy.yml` builds and deploys automatically on push to `main`. No env var, flag, or migration change required — this fix intentionally removes a runtime dependency on `INTELLIGENCE_LIVE_REPAIR_MODE` rather than turning that flag on, since flipping that flag would also change latency/behavior for the separate `richText && !answerOnly` tabbed-canvas path, which is out of scope for this fix.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (existing, unmodified).
- Shared runtime mutators: none.
- Approved image digest: assigned by the existing main-deploy workflow on merge.
- ACA runtime invariant: unaffected.
- Worker image invariant: not applicable.
- Feature/env flag update path: none — see Rollout Plan.
- Live signed-in proof required: yes, after merge + deploy — re-ask "rank agent assist vs payment integrity vs cost transparency by value, complexity, readiness" as Meridian and confirm a real decision table + 3 derived charts render, no "Requested Visual Boundary" fallback.

## Rollback Plan

Revert the PR. The change is confined to prompt-string construction inside one function; reverting restores the prior (broken, for this query shape) first-pass prompt with no other side effects.

## Audit Evidence

- Parent PR: [#4851](https://github.com/abarva-platform/abarva/pull/4851)
- Live failure screenshots: captured in-session (not committed) showing the "Requested Visual Boundary" guardrail firing on `https://app.abarva.ai/intelligence?client=meridian` after #4851 deployed, for both "rank agent assist vs payment integrity vs cost transparency by value, complexity, readiness" and a follow-up "tables and charts" query.
- Production env var check: `az containerapp show --name ca-abarva-web-lab-eastus --resource-group rg-abarva-controlplane-lab-eastus --query "properties.template.containers[0].env[?contains(name,'INTELLIGENCE') || contains(name,'REPAIR')]"` returned no `INTELLIGENCE_LIVE_REPAIR_MODE` or `INTELLIGENCE_DISABLE_BLOCKING_REPAIR` entry, confirming the repair pass is disabled in production.
- PR URL: pending (this record ships in the same PR).

## Known Gaps

- Live signed-in re-proof on Meridian pending this PR's merge + deploy.
- The pre-existing `richText && !answerOnly` tabbed-canvas code path (used by other Intelligence surfaces, not this chat dock) still depends on the disabled `INTELLIGENCE_LIVE_REPAIR_MODE` flag for its Markdown-table repair pass. That path is out of scope for this fix; if the same guardrail-fallback bug is observed there, it will need the same first-pass treatment rather than relying on the repair pass.
