# 2026-07-19-source-event-facts-gate-readiness — Source Event Facts Gate Readiness

## Release ID

`2026-07-19-source-event-facts-gate-readiness`

## Status

`candidate`

## Plain-English Summary

Source gate readiness now recognizes trusted, cited `source_event_facts` as fact-backed evidence for the canonical gate engines. A parsed or structured fact can support evidence readiness when it has a citation, a real value, medium/high confidence, and is not stale. The bridge is deliberately conservative: facts can produce `Available` evidence, but they do not masquerade as uploaded artifacts or `Usable Evidence`.

## Layer Impact

- `global-control-lane`: Updates shared Source gate-readiness behavior for all clients using canonical Source event facts and canvas substrate.
- Source data-plane read layer: Adds a read seam for non-stale `source_event_facts` beside existing artifact, gate, and evidence substrate reads.
- Source UI/API substrate: The event detail shell and stage substrate now consume an effective evidence list that merges persisted evidence with fact-backed evidence.

## Client Applicability

- All clients: Yes, when a Source event has cited `source_event_facts`.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/data-plane/read-adapters/sourceCanvasSubstrateReadAdapter.ts`: adds Supabase and Azure Postgres reads for non-stale `source_event_facts`.
- `src/lib/source/canvas-substrate/fact-derived-evidence.ts`: maps a narrow set of trusted fact keys into fact-backed `Available` evidence rows.
- `src/lib/source/canvas-substrate/queries.ts`: adds effective evidence reads and uses them in `getStageSubstrate`.
- `src/app/(maestro)/source/events/[eventId]/page.tsx`: renders the Source shell from effective evidence so visible gate readiness sees the same fact bridge as stage APIs.
- `src/lib/source/source-governance-enforcement.ts`: keeps the client-stated placeholder block, but excludes explicitly fact-backed evidence from that classification.
- `src/lib/source/gate-auto-assessment.ts` and `gate-auto-assessment-persist.ts`: carry fact ids through auto-assessment evidence matches and persisted system provenance.
- Focused tests for mapper semantics, data-plane reads, substrate merge wiring, governance readiness, auto-assessment, persistence, and the Source route shell guard.

## QA / Validation

- `npx jest src/lib/source/canvas-substrate/__tests__/fact-derived-evidence.test.ts src/lib/source/canvas-substrate/__tests__/queries.test.ts src/lib/source/__tests__/source-governance-enforcement.test.ts src/lib/source/__tests__/gate-auto-assessment.test.ts src/lib/source/__tests__/gate-auto-assessment-persist.test.ts src/lib/data-plane/read-adapters/__tests__/source-canvas-substrate-read-adapter.test.ts src/__tests__/integration/source/source-route-shell-enforcement.test.ts --runInBand`: pass, 56/56. Jest printed existing duplicate manual mock warnings.
- `npx eslint 'src/app/(maestro)/source/events/[eventId]/page.tsx' src/lib/data-plane/read-adapters/sourceCanvasSubstrateReadAdapter.ts src/lib/data-plane/read-adapters/__tests__/source-canvas-substrate-read-adapter.test.ts src/lib/source/canvas-substrate/queries.ts src/lib/source/canvas-substrate/types.ts src/lib/source/canvas-substrate/fact-derived-evidence.ts src/lib/source/canvas-substrate/__tests__/fact-derived-evidence.test.ts src/lib/source/canvas-substrate/__tests__/queries.test.ts src/lib/source/source-governance-enforcement.ts src/lib/source/gate-auto-assessment.ts src/lib/source/gate-auto-assessment-persist.ts src/lib/source/__tests__/source-governance-enforcement.test.ts src/lib/source/__tests__/gate-auto-assessment.test.ts src/lib/source/__tests__/gate-auto-assessment-persist.test.ts src/__tests__/integration/source/source-route-shell-enforcement.test.ts`: pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`: pass.

## Rollout Plan

Open PR from `codex/source-slice2c-event-facts`. After review approval, squash-merge to `main` and deploy through the repo-owned Azure Container Apps main deploy workflow. No migration, data load, feature flag, or manual Azure mutation is required.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge for `app.abarva.ai`.
- Shared runtime mutators: Not used by this candidate.
- Approved image digest: Pending repo-owned deploy workflow.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: No worker image change expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes. Source signed-in proof should verify that fact-backed evidence appears in gate readiness without labeling it as uploaded or usable evidence.

## Rollback Plan

Revert the merged PR and redeploy through the repo-owned ACA main deploy workflow. No schema rollback is required because this candidate only reads existing `source_event_facts`.

## Audit Evidence

- Candidate branch: `codex/source-slice2c-event-facts`.
- PR URL: Pending.
- Local validation: focused Jest, lint, and TypeScript commands listed above.
- Live proof: Pending merge/deploy. Existing Source shell proof has confirmed the new all-step shell for Scope on production; all-step rail crawl is still pending because the local Mac locked during browser crawl.

## Known Gaps

- The fact-to-evidence map is intentionally narrow and AMS-oriented. SaaS/BPO archetype expansion remains a later backlog item.
- Fact-backed rows are capped at `Available`; requirements that demand `Usable Evidence` still need uploaded/processed evidence or explicit usable-evidence review.
- Signed-in all-stage Source rail proof remains pending until the local Mac is unlocked.
