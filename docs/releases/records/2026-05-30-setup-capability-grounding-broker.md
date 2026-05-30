# 2026-05-30-setup-capability-grounding-broker — Live Capability Grounding Matrix (Wave 3 PR-1)

## Release ID

`2026-05-30-setup-capability-grounding-broker`

## Status

`candidate`

## Plain-English Summary

The Setup landing's Section 05 "Agent Readiness" panel no longer claims a hard-coded `Sentinel L3 · others L2`. It now reads the real per-agent, per-capability-family grounding rollup from the new Capability Grounding broker. The foot label becomes, e.g., `Sentinel L3 · 3 others avg L1 · estimated` — honest about Sentinel's headline level, honest about the average across the other three agents, and honest about whether the rollup is derived from substrate alone (today: always, since no evaluator table exists in production yet).

The `/admin/agent-readiness` page gains a new "Capability grounding · per-agent · per-family" strip between the agent state-header cards and the Capability Constellation matrix. The strip surfaces each agent's L0–L3 grounding level for every primary segment family it depends on, with the evidence flag (`estimated` vs `live`) called out in the header. The Constellation matrix itself is unchanged — the verdict §7 constraint that the matrix layout stay identical is preserved.

Grounding levels follow a deterministic rubric: a family is "covered" when its substrate health state is `partial`, `mature`, or `complete`. Coverage ratios map to L0 (0), L1 (<0.25), L2 (<0.75), and L3 (≥0.75). When `lastEvalScore` is present and below 0.8, the rubric demotes L3 to L2 so the surface never calls something board-ready against a failing evaluator. When `lastEvalScore` is null for any family — today the always-true case — the parent rollup is flagged `evidence: 'estimated'` and the surface text explicitly says so.

Honesty doctrine (memory · `feedback_no_demo_thinking.md`):
- L0 is preferred to a sympathetic L1 when no segments load.
- L3 requires either a passing evaluator score or an explicit `estimated` flag bubbled up so the UI never silently asserts board-ready capability.
- When the broker can't resolve a tenant, the page omits the new strip rather than fabricate L-levels.

## Layer Impact

- `runtime-app-lane`: New `capability-grounding-broker.ts` under `src/lib/admin/broker/**`; `home-overview-v2.ts` Section 05 panel composes its foot text + status from the broker when supplied, falling back to a conservative substrate-only label otherwise. `/admin/page.tsx` and `/admin/agent-readiness/page.tsx` fetch the rollup and pass it through.
- `qa-validation-lane`: 12 capability-grounding-broker unit tests (new file), 2 home-overview-v2 panel computed-text tests (new file), 3 CapabilityGroundingSummary component smoke tests (new file).
- `architecture-lane`: No new direct Supabase reads — the broker composes through the existing `getSetupInventorySnapshot` adapter and authored fallback. Broker-boundary hygiene gate preserved.
- `data-plane-lane`: No schema change. The `lastEvalScore` read path is stubbed (returns null) pending a future `eval_runs` / `answer_eval` table.

## Client Applicability

- All clients: Every tenant's Setup landing now derives Section 05 foot text from the broker. Every tenant's `/admin/agent-readiness` page surfaces the new grounding-summary strip.
- Specific clients: None.
- Internal only: No. This is a tenant-admin surface.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/admin/broker/capability-grounding-broker.ts` (new) — canonical broker contract `getCapabilityGrounding(tenantKey)`; deterministic rubric mapping coverage ratio → L0/L1/L2/L3 with eval-score gating; exposes `panelFootFromGrounding` and `panelStatusFromGrounding` helpers used by the landing panel.
- `src/lib/admin/broker/__tests__/capability-grounding-broker.test.ts` (new) — 12 unit tests covering canonical agent order, L0-cold-start, L3 promotion, thin-substrate demotion, partial-substrate soft coverage, the always-estimated flag, snapshot-throw fallback, snapshot-null fallback, ISO timestamp, per-family counts, and the two helper outputs.
- `src/lib/admin/home-overview-v2.ts` (modified) — imports `panelFootFromGrounding` / `panelStatusFromGrounding`; adds optional `capabilityGrounding` field to `ComposeHomeV2Input`; Section 05 panel uses the broker's output when present and a conservative substrate-only fallback marked `· estimated` otherwise.
- `src/lib/admin/__tests__/home-overview-v2-grounding.test.ts` (new) — 2 tests verifying the panel computed text (live wiring + fallback honesty).
- `src/app/(maestro)/admin/page.tsx` (modified) — fetches `getCapabilityGrounding` in the existing `Promise.all` block; passes the result through `composeHomeV2Extras`.
- `src/app/(maestro)/admin/agent-readiness/page.tsx` (modified) — fetches the broker rollup; renders the new `CapabilityGroundingSummary` between the state header and the Constellation matrix; the matrix layout is untouched.
- `src/components/admin/agent-readiness-redesign/CapabilityGroundingSummary.tsx` (new) — small per-agent strip showing top / average level and per-family pills, with the `estimated` / `live` marker in the header.
- `src/components/admin/agent-readiness-redesign/__tests__/CapabilityGroundingSummary.test.tsx` (new) — 3 jsdom smoke tests covering per-agent rendering and the evidence-flag marker.
- `docs/releases/records/2026-05-30-setup-capability-grounding-broker.md` (new) — this record.

## QA

- `npx tsc --noEmit` — clean (pre-existing `@azure/*` and `pptxgenjs` not-found errors are workflow artifacts, not part of this PR).
- `npx jest --testPathPatterns='capability-grounding-broker|home-overview-v2-grounding|CapabilityGroundingSummary'` — 19 passed.
- `npx jest --testPathPatterns='home-overview-v2|HomeOverviewV2|admin-routes-resolve|agent-readiness-composer'` — pre-existing 63 tests still passing.

## Rollout

- Merge to main.
- Vercel auto-deploys preview → production. No env vars added or removed.

## Rollback

- `git revert` the squash-merge commit. No schema migration to undo. Section 05 panel reverts to its hard-coded "Sentinel L3 · others L2" label; the `/admin/agent-readiness` page loses the new summary strip but the Constellation matrix continues to render from the composer unchanged.

## Audit Evidence

- `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §3 (Intelligence coverage gap — "per-agent grounding scores in panel 05 are hard-coded (`Sentinel L3 · others L2`). No grounding score per *capability family*.").
- `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §7 Wave 3 PR-1 (Live capability matrix — "Replace hard-coded 'Sentinel L3 · others L2' with real per-capability-family grounding scores derived from substrate + last-N answer evaluation. Drives the panel-05 status and the constellation.").
- Honesty / broker-boundary memory: `feedback_no_demo_thinking.md`, `feedback_broker_boundary.md`.
