# 2026-07-09-source-stage-entry-artifact-autodraft — Wire gate approval to real deliverable generation

## Release ID

`2026-07-09-source-stage-entry-artifact-autodraft`

## Status

`candidate`

## Plain-English Summary

Source's stage gates ("Approve & advance to Scope →", etc.) advance the event's
stage correctly, but never actually triggered generation of that stage's
deliverable document (Strategy memo / Scope memo / RFP package), despite the
UI copy on every gate reading "Then Source generates the [stage] documents"
and "Nothing is generated yet. These are prepared automatically the moment
you approve — there is no build step." That promise was aspirational UI
copy, not shipped behavior: the approve route only wrote the approval record
and advanced `current_stage_key`. Live-verified on the Lakeshore Holdings AMS
test event (`adcb1cd0-c586-4622-bd29-574cc5a10862`): Strategy, Scope, and RFP
gates were all approved, yet all three stages' deliverable panels still read
"Nothing is generated yet" because nothing had ever called the generation
pipeline.

The generation pipeline itself (prompt templates, consulting-grade quality
gate + rewrite loop, blob/File Cabinet persistence, activity logging) was
already fully built and working — reachable manually via
`POST /api/v1/source/:eventId/artifacts/:artifactCode/generate` — and a
durable job queue (`source_artifact_generation_jobs`) plus a purpose-built
helper (`autoDraftOnStageEntry`, with a `requested_via: "stage_entry"` enum
value that nothing had ever set) already existed for exactly this trigger.
The helper was simply never called. This change wires it in at the two real
entry points: event creation (drafts the Strategy memo, d01) and gate
approval (drafts the newly-entered stage's deliverable — Scope memo d05 on
Strategy→Scope, RFP package d09 on Scope→RFP, Decision brief d24 on entering
Executive Decision).

## Layer Impact

- `client-data-lane`: writes real deliverable bodies into
  `source_event_artifact_states.body` for the affected client's Source
  events, via the existing durable job queue.
- `global-control-lane`: shared behavior for every Source event across every
  tenant — this is not feature-gated, since it activates an already-shipped,
  already-tested generation pipeline rather than adding a new capability.

## Client Applicability

- All clients: yes — this fixes the trigger for the shared Source stage-gate
  flow used by every tenant's sourcing events, not a client-specific feature.
- Feature flag: none. The affected generation pipeline
  (`agent-generation`/`quality-review`) and the queue helper
  (`autoDraftOnStageEntry`) were already unconditionally live code; this
  change only adds the missing caller.

## Changes Included

- `src/app/api/v1/source/events/[eventId]/approve/route.ts`: after a
  successful stage advance, call `autoDraftOnStageEntry({ eventId,
  clientKey, enteredStage: decision.advanceStageTo })` (not awaited —
  generation can take minutes; the approve response must not block on it).
- `src/lib/source/queries.ts`: call the same helper for `enteredStage:
  "strategy"` right after a brand-new event's canvas substrate is scaffolded
  in `createSourcingEvent`, and for the seed's actual current stage in
  `ensurePersistedSourceEventForClient` (legacy seed-materialization path can
  land on any stage, not just Strategy).
- `scripts/qa/lakeshore-ams-artifact-audit.mjs` (+ `package.json` script
  entry `qa:lakeshore-ams-artifact-audit`): read-only diagnostic that reports
  which artifact codes on `source_event_artifact_states` have a persisted
  body for the Lakeshore AMS test event, for future audits of generated
  content. Must run inside the VNet (via the established one-off job
  pattern); does not reach the private DB from localhost.

## QA / Validation

Status: **pass** (static); **live proof pending post-deploy**.

- `npx tsc -p . --noEmit`: clean, 0 errors (ran directly under the harness's
  own background execution, not an inner-backgrounded process, per this
  session's standing discipline against silently-orphaned/false-clean tsc
  runs).
- `npx jest src/lib/source/__tests__/stage-entry-autodraft.test.ts`: 8/8
  passing (unchanged — confirms `autoDraftOnStageEntry`'s existing contract,
  which this change now actually calls in production).
- `npx jest src/lib/source/__tests__/queries-tenant-scope.test.ts`: 11/11
  passing (unchanged).
- No dedicated test file exists for `approve/route.ts` — none added in this
  change; the modification is a single non-awaited call at an existing,
  already-tested seam (`autoDraftOnStageEntry`), and the route's own
  approval/stage-advance logic is untouched.
- Live proof required before calling this `released`: approve a real gate on
  a live event post-deploy and confirm a real deliverable body appears in
  `source_event_artifact_states` for the newly-entered stage's artifact
  code, without any manual `/generate` call.

## Rollout Plan

Merge via squash to `main`. Deploy through the repo-owned
`aca-main-deploy.yml` workflow to `ca-abarva-web-lab-eastus`, following
[docs/runbooks/azure-container-apps-deploy.md](/Users/anand/Projects/nexus-port-main/docs/runbooks/azure-container-apps-deploy.md).
No migration required — `source_event_artifact_states` and
`source_artifact_generation_jobs` already exist and are already written to
by the manual `/generate` route; this change only adds a new caller of
already-proven write paths.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (only
  authority that shifts shared web traffic for `app.abarva.ai`).
- Shared runtime mutators: none outside the standard deploy workflow used by
  this change.
- Approved image digest: whatever digest the main-deploy workflow produces
  and pins for this merge; verified post-deploy per the runtime invariant
  below.
- ACA runtime invariant: verify the Container App template image, the 100%
  traffic revision image, and (if applicable) worker job images match the
  digest built for this PR's merge commit before calling this `released`.
- Worker image invariant: n/a — no dedicated worker container for Source
  artifact generation; generation runs in-process inside the web revision,
  same as the existing manual `/generate` route.
- Feature/env flag update path: none — no flag added or changed.
- Live signed-in proof required: yes — approve a real Source gate as a
  signed-in tenant user post-deploy and confirm the newly-entered stage's
  deliverable body is persisted, per QA/Validation above.

## Rollback Plan

Revert this commit. The non-awaited `autoDraftOnStageEntry` calls are
additive: removing them returns the approve route and event-creation path to
their prior (non-generating) behavior with no data loss — any artifact
bodies already generated under this change remain valid, persisted rows.

## Audit Evidence

- PR URL: to be filled in once opened.
- CI run: to be filled in once the PR's checks complete.
- Pre-merge tsc + jest results: see QA/Validation above.
- Post-deploy live proof: to be captured (browser test approving a real
  gate + confirming a real generated body) before this record moves to
  `released`.

## Known Gaps

- The "Generated after you approve" panel in the stage-gate UI
  (`src/components/source/canvas/analytics/ScopeGate.tsx`) still renders a
  static, unconditional "Nothing is generated yet" caption regardless of
  actual generation status — it was never wired to a real query against
  `source_event_artifact_states`. This change fixes the backend generation
  trigger but does not yet fix that UI truthfulness gap; the panel will keep
  saying "ungenerated" even after a real deliverable body exists. Tracked as
  a follow-up, not fixed here.
- 30 of the 33 canonical artifact codes (`d01`-`d33`/`dx0`-`dx7`) still have
  no registered prompt template in `agent-generation/prompt-registry.ts` —
  this change only activates auto-generation for the 4 that already have
  templates and a stage mapping (`d01`, `d05`, `d09`, `d24`). The remaining
  templates are a separate, larger build, not in scope here.
