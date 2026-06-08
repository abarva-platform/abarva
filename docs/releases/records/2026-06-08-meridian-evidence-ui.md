# 2026-06-08-meridian-evidence-ui — Visible Evidence Basis in Sentinel answers

## Release ID

`2026-06-08-meridian-evidence-ui`

## Status

`candidate`

## Plain-English Summary

When a user asks Sentinel a question on `/intelligence/ask`, the server already
streams an `sources` event describing what the answer is grounded on (client
facts, healthcare patterns, model inference, and any missing evidence). The
client was silently dropping that event, so Meridian (Pipeline A) answers
rendered as plain text with no visible evidence basis. This change adds a
compact, collapsible "Evidence basis" panel under the answer that groups the
sources, labels confidence honestly (partial vs high), warns clearly when there
are no grounded sources (citation gap), and lists missing evidence segments. To
protect PHI, raw record ids and filesystem paths are scrubbed from the main view
and only appear behind a diagnostic "Details" toggle.

## Layer Impact

- `global-control-lane`: Shared app/control-plane UI behavior. This is a
  presentational client-side change to the Intelligence Ask renderer. No
  retriever, route, synthesizer, schema, or data-plane changes. The server
  contract (the `sources` NDJSON event) is unchanged; the client now consumes
  an event it previously ignored.

## Client Applicability

- All clients: Yes — the renderer is shared. The grouping copy ("Healthcare
  patterns") reflects the Meridian-led evidence-hardening lane but the component
  is tenant-agnostic and renders correctly for any tenant whose answers carry
  the same `AskSource` types.
- Specific clients: N/A
- Internal only: No
- Public/demo only: No
- Feature flag: None

## Changes Included

- New `src/components/intelligence/EvidenceBasis.tsx` — presentational,
  props-in panel (`sources`, `coverageReport`, `tone`).
- Wired `sources` event handling + render into
  `src/app/(maestro)/intelligence/ask/SentinelReasoningCards.tsx` (Pipeline A
  fallback column and Pipeline B card column).
- New test `src/components/intelligence/__tests__/EvidenceBasis.test.tsx`.
- This release record.

No retrievers, API routes, or synthesizer code were touched (owned by other
agents in the lane).

## QA / Validation

- `npx jest src/components/intelligence/__tests__/EvidenceBasis.test.tsx --no-coverage` → PASS (9/9): grouping, citation-gap present/absent, path + raw-id scrubbing, diagnostics-only raw id, partial/low confidence labeling, inference-only cap, missing-evidence group.
- `npx eslint` on the three changed source files → PASS (0 problems).
- `node ./node_modules/typescript/bin/tsc --noEmit -p tsconfig.json | grep -E "EvidenceBasis|SentinelReasoningCards|SentinelChat"` → 0 errors for changed files (pre-existing `@azure-rest`/`@axe-core` errors unrelated and out of scope).
- Manual live retrieval QA against signed-in Meridian: NOT run in this lane (no DB/Clerk creds in the worktree). See Known Gaps.

## Rollout Plan

Merge to `main`; ships with the next Azure Container Apps web image build/deploy.
No migration, no feature flag, no runtime config. Purely additive client UI.

## Rollback Plan

Revert the single commit on `cursor/meridian-evidence-ui`. The component is
additive and isolated; reverting restores the prior (evidence-less) render with
no data or schema implications.

## Audit Evidence

- Branch: `cursor/meridian-evidence-ui`
- Commit: `feat(intelligence): visible Evidence Basis ...`
- Jest output (9 passing) and ESLint/tsc results captured in PR CI.
- Component test file doubles as the behavioral contract for grouping +
  scrubbing + citation-gap.

## Known Gaps

- Secondary surface `src/components/intelligence-v3/SentinelChat.tsx` (the
  shared `<AgentDock>` adapter) was intentionally NOT wired. `AgentDock`'s
  `ChatMessage` type carries only `body: string` and renders it through
  `shapeAgentResponseForSurface`; passing structured evidence would require
  modifying AgentDock's shared rendering internals (out of scope / risk to all
  surfaces) or smuggling evidence as text (defeats scrubbing/grouping). Deferred
  as follow-up: add an optional per-message evidence slot to `AgentDock`.
- Live signed-in retrieval QA (answer renders the panel with real Meridian
  `sources`) was not executed here; requires Clerk + Azure/Postgres creds. The
  client wiring is unit-verified against the documented `sources` event shape.
- Scrubbing regexes are heuristic (path/raw-id patterns). They are validated for
  the `/tmp/...` and `CHG-MH-00034`-style cases; novel id formats may pass
  through and should be added to `RAW_ID_RE` as discovered.
