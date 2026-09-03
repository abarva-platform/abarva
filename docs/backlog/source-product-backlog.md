# Source Product Backlog (Canonical)

This is the canonical, permanent backlog for the AbarVa Nexus Source module. Established
2026-07-21, following the same convention as `docs/backlog/moves-product-backlog.md`
(the Moves Continuous Execution Directive, established 2026-07-20). Completed items are
never deleted — history is preserved. This file should be reconciled against `main` and
merged PRs at the start of every execution loop.

**Status values** (use only these): `Proposed`, `Needs Design`, `Needs Owner Decision`,
`Approved`, `Ready`, `In Progress`, `In Review`, `Merged`, `Deployed`, `Runtime Proven`,
`Blocked`, `Deferred`, `Superseded`, `Closed`.

**Priority order** (mirrors Moves): (1) security/data-corruption/tenant-isolation/
unauthorized-mutation, (2) evidence-integrity and governed-migration correctness, (3)
live runtime failures, (4) approval/authority/lineage controls, (5) deliverable/content
quality, (6) workspace UX, (7) automation and efficiency, (8) cosmetic.

---

## Active Source 360 execution

### SOURCE-360-CXO-001 — Source 360 chart, cube, and evidence-depth proof

- **Problem statement**: Source 360 needs to render the governed contract-depth package
  as an executive-ready cockpit without debug scaffolding, blank charts, legacy explorer
  chrome, or unsupported value claims.
- **User/business impact**: executive narration depends on the page showing only
  deterministic, evidence-backed claims: what is in the governed contract book, what is
  supplemental depth, what is actionable now, and what evidence blocks stronger language.
- **Severity**: P1 (executive demo readiness and evidence-integrity).
- **Workstream**: Source workspace UX / governed Source data projection.
- **Status**: `In Progress` — chart fixes are merged; the governed contract-depth
  package is physically loaded and reconciled through Layer 2, Layer 3, and Layer 4 via
  operator jobs; the recoverable-credit lane patch is merged and awaiting final ACA
  deploy/live proof so the page cannot blend deterministic impact coverage with older
  snapshot rollups.
- **Layer proof**: Layer 2 has 342 adapter rows, including 8 change-order rows and 30
  page-text rows. Layer 3 has 30 page-text fact assertions and 36 change-order fact
  assertions. Layer 4 has 78 contract-360 rows, 5 package contract rows, 6 action
  candidates, 6 claim cards, 5 vendor positions, 30 package page-text rows, 8 package
  change-order rows, $4.16M candidate amount, and $102.7K deterministic unclaimed
  service-credit exposure.
- **Current UI proof**: signed-in Source 360 crawl clicked 14 views with no tab failures,
  no tenant bleed-through, no load errors, no debug scaffolding, no legacy left explorer,
  and chart/graph surfaces rendering. A follow-up live proof found the page still showed
  the older `$189K` recovery amount in the Optimize lane; the merged follow-up patch
  removes that fallback from the current action headline.
- **Open gaps**: final ACA deploy/live proof must confirm the older `$189K` recovery
  headline is gone, the deterministic `$102.7K` service-credit exposure is visible where
  supported, all charts and graph surfaces render non-empty visuals, and aVa answers
  cite/refuse against the same governed bundle.
- **Acceptance criteria**: Source 360 shows the verified deterministic credit amount in
  Optimize/Evidence basis; all top-level tabs and subtabs render without blank charts;
  contract graph renders an actual lineage visualization; live proof captures no
  unsupported dashboard language; aVa answers cite/refuse against the same governed
  bundle.
- **Required tests**:
  `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts`;
  signed-in Source 360 visual crawl after deploy.
- **Discovered from**: the Source 360 data-depth and chart audit attached to the
  2026-08-31 execution loop.

### SOURCE-360-CXO-002 — Source 360 aVa deterministic-bundle proof

- **Problem statement**: Source 360 now has a governed deterministic action bundle, but
  the aVa dock still needs a focused production proof that it answers from that bundle
  with citations, refuses unsupported value claims, and preserves tenant isolation.
- **User/business impact**: a CXO rehearsal can tolerate an honest missing-evidence
  refusal, but it cannot tolerate a confident answer that blends old snapshot rows,
  invents finance-confirmed value, or crosses tenants.
- **Severity**: P1 (executive demo readiness and evidence-integrity).
- **Workstream**: Source aVa / governed answer quality.
- **Status**: `Closed` — post-deploy signed-in proof completed on 2026-09-03
  against the current Source 360 substrate.
- **Acceptance criteria**: signed-in proof asks why the actionable contract is
  actionable, what is missing before claiming value, requests a chart/table where
  appropriate, and probes an out-of-tenant vendor. Responses must cite or refuse from
  the governed Source bundle and must not surface any out-of-tenant data.
- **Required tests**: signed-in aVa transcript proof plus any focused answer-engine
  regression if the live proof exposes unsupported claims.
- **Closure evidence**: the proof covered a grounded current-page context answer,
  refusal to claim realized value without finance confirmation, refusal to make a
  supplier-selection recommendation without evaluation evidence, and refusal to
  expose out-of-tenant pricing. No focused regression was required because the live
  proof matched the expected answer contract.
- **Discovered from**: the Source 360 data-depth and chart audit attached to the
  2026-08-31 execution loop.

## Completed and closed

### SOURCE-GUIDEBOOK-001 — Stage guidebooks foundation + read-only workspace tab

- **Problem statement**: Source had no facilitator-guide content system for the working
  session that moves an event through a stage's gate (Moves' Workshop Facilitator Guide
  had this; Source did not).
- **User/business impact**: No structured agenda/talking-points/decision-capture surface
  for the Strategy gate conversation (or any stage).
- **Severity**: P4 (capability gap, not a defect)
- **Workstream**: Deliverable/content quality
- **Status**: `Deployed` — code and migration both live; component rendering proven; a
  real signed-in click-through is not yet done (tracked separately as
  `SOURCE-GUIDEBOOK-002`).
- **Dependencies**: the governed database-migration delivery lane
  (`docs/releases/records/2026-07-20-db-migration-lab-workflow.md`) — this was the
  feature that originally surfaced the need for that lane.
- **Acceptance criteria**: schema + repository function + one real authored guidebook
  (Strategy); a read-only "Guidebook" workspace tab on the Source event shell, visible
  only for stages with authored content.
- **Required tests**: `src/lib/source/stage-guidebooks/__tests__/repository.test.ts`;
  `src/lib/source/__tests__/source-event-shell-v2.test.ts` (guidebook cases);
  `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.guidebook.test.tsx`.
- **PR**: #5135 (schema/repository/seed), #5175 (workspace tab UI)
- **Merge SHA**: `02c08d3e28f16d6fe708fb9caaca3c56d3e1547b` (#5135),
  `4a4290345db4624bbcee08e4f66f98574b82c5fe` (#5175)
- **Deploy run**: aca-main-deploy [29790788429](https://github.com/abarva-platform/abarva/actions/runs/29790788429),
  `success`
- **Runtime proof**: ACA revision `ca-abarva-web-lab-eastus--m4a429034` confirmed
  matching the deploy digest via `az containerapp show`. Migration applied for real via
  the governed migration lane, real apply run
  [29789097644](https://github.com/abarva-platform/abarva/actions/runs/29789097644);
  real repository readback confirms the seeded Strategy row. Component rendering proven
  via real RTL tests. **Live signed-in server-to-database rendering is NOT proven** —
  see `SOURCE-GUIDEBOOK-002`.
- **Release record**: `docs/releases/records/2026-07-20-source-stage-guidebooks-foundation.md`,
  `docs/releases/records/2026-07-20-source-guidebook-workspace-ui.md`
- **Discovered from**: a proposal for consulting-grade Source artifact governance,
  referencing Moves' Workshop Facilitator Guide pattern.
- **Notes / remaining gaps**: only the Strategy stage has authored content (the other 10
  stages correctly hide the tab, not show it empty); no authoring/edit UI exists yet.

### SOURCE-GUIDEBOOK-003 — Render guidebook section bodies as real Markdown

- **Problem statement**: `SourceStageGuidebookSection.body` is typed and documented as
  Markdown, but `GuidebookWorkspace` in `SourceAnalyticsCanvas.tsx` rendered it with
  `whiteSpace: 'pre-wrap'` plain text — the seeded Strategy agenda's numbered list
  showed literal `1. `/`2. ` prefixes instead of a real ordered list.
- **User/business impact**: Cosmetic (content-fidelity), not a defect.
- **Severity**: P7 (cosmetic / content-quality)
- **Workstream**: Workspace UX
- **Status**: `Deployed` — real Markdown rendering via `react-markdown` +
  `remark-gfm` + `rehype-sanitize` (already-bundled dependencies, no new one added).
- **Dependencies**: none.
- **Acceptance criteria**: met — real `<ol>`/`<li>` output confirmed via
  `renderToStaticMarkup` against the real library and the real seeded agenda content.
- **Required tests**:
  `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.guidebook.test.tsx`
  — asserts rendering delegates to `ReactMarkdown` (this repo's global Jest mock for
  `react-markdown` is a hard passthrough, so the committed test can only guard against
  regressing back to plain text; real markup rendering was verified separately, see the
  release record).
- **PR**: #5180
- **Merge SHA**: `7888cab375fde5224bb03f6b9b7100a46ef66deb`
- **Deploy run**: [aca-main-deploy #29793844800](https://github.com/abarva-platform/abarva/actions/runs/29793844800),
  `success`
- **Runtime proof**: ACA revision `ca-abarva-web-lab-eastus--m7888cab3` confirmed
  matching the deploy digest via `az containerapp show`. Live signed-in
  server-to-database rendering not proven — same open item as `SOURCE-GUIDEBOOK-002`.
- **Release record**: `docs/releases/records/2026-07-20-source-guidebook-markdown-rendering.md`
- **Discovered from**: `SOURCE-GUIDEBOOK-001`'s own Known Gaps.
- **Notes / remaining gaps**: none yet.

### SOURCE-GUIDEBOOK-004 — Client-specific guidebook override resolver

- **Problem statement**: the `source_stage_guidebooks.client_key` column was designed to let
  tenant-specific guidebooks override global defaults, but the behavior was not directly
  proven and relied on a combined tenant-or-global query plus SQL null ordering.
- **User/business impact**: before authoring client-tailored facilitator guidance, Source
  needs a simple, auditable resolver contract: exact client content wins, global content
  is the fallback, and another client's guidebook can never bleed into the viewed tenant.
- **Severity**: P5 (deliverable/content quality and tenant-specific guidance readiness)
- **Workstream**: Guidebook quality
- **Status**: `Shipped — deployed and signed-in proven` — code-only, no migration and no
  production data mutation. Merged in PR #5426 as `f83eeb95f2067a0ec54da06bba53461fa58f675d`;
  the PR's immediate deploy was superseded by the next successful main deploy run
  `29980215454`, and later main revisions continue to contain the merge. Signed-in
  Lakeshore proof on `app.abarva.ai` confirmed the Strategy Guidebook tab renders the
  global default and does not falsely show a tenant guidebook when no tenant-specific row
  exists.
- **Dependencies**: the existing `source_stage_guidebooks.client_key` column and RLS policy
  from `SOURCE-GUIDEBOOK-001`; no new schema is required.
- **Acceptance criteria**: `getSourceStageGuidebook(stageKey, clientKey)` performs an exact
  client lookup first, falls back to the global `client_key IS NULL` row only when the exact
  client row is absent, orders each lookup deterministically by newest published version,
  and never uses a broad OR filter as the authority mechanism. The existing Guidebook
  workspace continues to render global content and labels tenant-specific content when a
  client row is passed through.
- **Required tests**:
  `src/lib/source/stage-guidebooks/__tests__/repository.test.ts`,
  `src/lib/source/__tests__/source-event-shell-v2.test.ts`,
  `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.guidebook.test.tsx`.
- **Release record**:
  `docs/releases/records/2026-07-23-source-guidebook-client-overrides.md`.
- **Discovered from**: the 6-area Source audit's guidebook-quality finding and the
  follow-on backlog note to activate per-client guidebook content using the existing
  `client_key` override column.
- **Notes / remaining gaps**: this PR does not author tenant-specific rows. Live
  client-specific rendering remains data-blocked until a governed content/data change
  publishes a tenant override row.

### SOURCE-INGEST-001a — Binary workshop/session evidence extraction

- **Problem statement**: Source artifact uploads accept PDF, XLSX, and PPTX files, but the
  arbitrary evidence upload lane only turned text-like files into parsed Source evidence. A
  buyer could upload workshop decks, session-note workbooks, or client-approved PDFs and get a
  durable registry row, while the evidence chunks/facts that aVa and the workspace rely on
  stayed unavailable.
- **User/business impact**: uploaded session evidence looked stored but not learned from.
  That undermines the Source data-layer promise: client workshop notes and approved versions
  should become Azure/Postgres-backed evidence objects that can later populate enterprise
  context, not inert files in the cabinet.
- **Severity**: P2 (evidence-layer integrity and aVa readiness).
- **Workstream**: Ingestion / data persistence.
- **Status**: `Shipped — deployed and regression/signed-in proven` — first slice only;
  code-only, no migration and no production data mutation. Merged in PR #5432
  (`919b7ae487e237c1157c50d92c613efc23624e70`), deployed by ACA main run
  `29981467082`, and still present on the independently verified production revision
  `ca-abarva-web-lab-eastus--me89b7e4d` (`main-e89b7e4d`). Focused extraction/upload
  route tests passed again on 2026-07-23. Signed-in Files proof confirms the
  Source ingest/readiness surfaces render on `app.abarva.ai`; no production upload
  mutation was performed for this closure without a dedicated safe test file/event.
- **Dependencies**: existing `source_artifacts`, `source_artifact_chunks`,
  `source_artifact_facts`, `source_meeting_outcomes`, `source_requirements`, and
  `source_pricing_components` tables; existing upload route and parser; existing dependencies
  `pdf-parse`, `exceljs`, and `jszip`.
- **Acceptance criteria**: uploaded PDFs, XLSX workbooks, and PPTX decks are converted to
  bounded markdown-ish text when extraction succeeds; the upload route feeds that text through
  the existing `parseSourceTextArtifact` path; malformed/unextractable files still upload as
  registry-only artifacts with warnings instead of fabricated content; image/audio/video remain
  explicitly unsupported until governed OCR/transcription exists.
- **Required tests**:
  `src/lib/source/artifact-registry/__tests__/upload-text-extraction.test.ts`,
  `src/app/api/v1/source/[eventId]/artifacts/upload/__tests__/route.test.ts`.
- **Release record**:
  `docs/releases/records/2026-07-23-source-binary-evidence-extraction.md`.
- **Discovered from**: the 6-area Source audit and the standing ingest gap under
  `SOURCE-UX-DECLUTTER-001`.
- **Notes / remaining gaps**: this does not add the dedicated workshop/session-notes capture
  surface, async parse worker, OCR/transcription, vector indexing, or enterprise-context
  promotion job. Those remain follow-on `SOURCE-INGEST-001` slices.

### SOURCE-INGEST-001b — Dedicated workshop/session-notes capture surface

- **Problem statement**: the Files workspace had a registry-backed upload path, but workshop
  output and meeting notes were still hidden inside generic file upload behavior. Users could
  attach session evidence, but they were not guided to classify it as `meeting_notes` or
  `workshop_output`, so the upload relied on filename inference and made the Source evidence
  layer feel accidental instead of intentional.
- **User/business impact**: sourcing teams need a simple, repeatable place to capture session
  notes, workshop outputs, and client review notes into the Azure/Postgres-backed Source data
  layer. aVa can only answer better over time if those notes enter the governed registry with
  explicit family, kind, stage, classification, parse state, and evidence-sync receipt.
- **Severity**: P2 (evidence-layer integrity and workflow clarity).
- **Workstream**: Ingestion / workspace UX.
- **Status**: `Shipped — deployed and signed-in proven` — code-only, no migration and
  no production data mutation. Merged in PR #5434
  (`8ac1adb5272208d9689678aec90600425344df15`), deployed by ACA main run
  `29982980000`, and still present on the independently verified production revision
  `ca-abarva-web-lab-eastus--me89b7e4d` (`main-e89b7e4d`). Focused UI/upload-contract
  tests passed again on 2026-07-23. Signed-in Files proof confirms the Meeting Notes
  and Workshop Output capture surface renders with honest Azure/Postgres persistence
  copy on `app.abarva.ai`; no upload mutation was performed.
- **Dependencies**: existing Source Files workspace, existing `/api/v1/source/:eventId/artifacts/upload`
  route, existing `source_artifacts` registry, existing synchronous first-mile parser, and
  existing upload-to-canvas-substrate sync.
- **Acceptance criteria**: the Files workspace shows a dedicated session-evidence capture panel;
  Meeting Notes uploads post `artifactFamily=meeting_notes` and `artifactKind=source_session_notes`;
  Workshop Output uploads post `artifactFamily=workshop_output` and
  `artifactKind=source_workshop_output`; upload receipts honestly show parse/substrate-sync status
  without claiming OCR, transcription, vector indexing, or enterprise-context promotion.
- **Required tests**:
  `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx`,
  `src/lib/source/artifact-registry/__tests__/upload-contract.test.ts`.
- **Release record**:
  `docs/releases/records/2026-07-23-source-session-evidence-capture.md`.
- **Discovered from**: the 6-area Source audit and the standing ingest gap under
  `SOURCE-INGEST-001a`.
- **Notes / remaining gaps**: this does not add the async parse worker, OCR/transcription,
  vector indexing, or enterprise-context promotion/backfill job. Those remain follow-on
  governed slices because they may require worker/job operations, indexing policy, or data
  promotion approval.

### SOURCE-INGEST-001c — Evidence readiness status in Files

- **Problem statement**: after binary extraction and the dedicated session/workshop upload
  panel shipped, the Files workspace still did not make evidence-processing state visible at a
  glance. Users could upload notes and see a one-off receipt, but on return they could not
  quickly tell which files were merely stored, which were parsed into Source evidence, which
  were search-ready, and which still needed a parser/backfill step.
- **User/business impact**: workshop/session evidence can appear "done" just because it is
  uploaded, even when it is only registered and not yet usable for Source evidence, search, or
  enterprise-context promotion. That blurs the exact state distinctions this backlog requires:
  stored, parsed, indexed, promoted, and agent-ready are separate states.
- **Severity**: P5 (evidence integrity / workspace UX).
- **Workstream**: Evidence ingestion and persistence readiness.
- **Status**: `Shipped — deployed and signed-in proven` — code-only, no migration and
  no production data mutation. Merged in PR #5454
  (`d436d4b654dc6e920db9fb2753ecd8867b846205`), deployed by ACA main run
  `29991443166` with a later successful retry/superseding run `29991922890`, and
  still present on the independently verified production revision
  `ca-abarva-web-lab-eastus--me89b7e4d` (`main-e89b7e4d`). Focused Files workspace
  tests passed again on 2026-07-23. Signed-in Files proof confirms Stored, Parsed,
  Needs parser, and Search-ready states render on `app.abarva.ai` while keeping
  search indexing and enterprise-context promotion separate governed steps.
- **Dependencies**: existing `source_artifacts.parse_status`, `embedding_status`, and
  `graph_status` fields already returned to the Source event shell. No schema or data-build job
  dependency.
- **Acceptance criteria**: the Files workspace shows a compact evidence-readiness summary using
  existing durable Source artifact state: Stored, Parsed, Needs parser, Search-ready; per-file
  chips show Parsed, Registered only, Parser failed, or Search ready; copy stays honest that
  search readiness and enterprise-context promotion remain separate governed steps; no upload,
  artifact acceptance, lifecycle scoring, or file-list behavior changes.
- **Required tests**:
  `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx`.
- **Release record**:
  `docs/releases/records/2026-07-23-source-evidence-readiness-panel.md`.
- **Discovered from**: standing `SOURCE-INGEST-001` follow-on list and the user requirement
  that Source evidence persistence, search/indexing, and enterprise-context promotion be
  visible as separate proof layers.
- **Known gaps**: this does not run OCR/transcription, async parsing, vector indexing, or
  enterprise-context promotion. It makes the current processing state visible so those future
  steps can be operated and proven honestly.

### SOURCE-INGEST-001d — Source enterprise-context writeback readback verifier

- **Problem statement**: Source has a governed writeback command that can project eligible typed
  Source facts into existing Azure/Postgres enterprise-context tables, but the proof path was
  still operator/manual: readback queries existed only as release evidence, not as a reusable
  verifier like the Moves learning writeback path has.
- **User/business impact**: the Source data layer promise needs repeatable proof at each layer:
  persisted Source evidence, enterprise-context records/facts, governed readiness, indexing, and
  `agent_ready` promotion are separate states. Without a read-only verifier, a future operator
  could claim Source "learned" from an event without proving the Azure/Postgres read model and
  conservative readiness rows are actually present.
- **Severity**: P3 (data-layer integrity / enterprise-context promotion readiness).
- **Workstream**: Ingestion / data persistence.
- **Status**: `Shipped — deployed and runtime-proven` — code-only, read-only, no migration
  and no production data mutation. Merged in PR #5465, deployed by ACA main run
  `30009823928`, independently invariant-checked on revision
  `ca-abarva-web-lab-eastus--m68b1570e`, and read-only VNet-proven against an existing
  Lakeshore Source writeback with 14 records, 14 facts, 14 readiness rows, and 0 premature
  promotion violations.
- **Dependencies**: existing Source enterprise-context writeback module and existing
  `enterprise_context_records`, `enterprise_context_facts`, and `governed_object_readiness`
  tables. No new schema or data-build job is required.
- **Acceptance criteria**: add a read-only Source writeback readback verifier command; it resolves
  one tenant-scoped Source event, reads persisted enterprise-context records/facts/readiness rows,
  writes a proof JSON, fails when records are missing facts/readiness, and fails if any row has
  been prematurely promoted beyond `not_reviewed` / `committed_not_indexed` / `pending`. It must
  not write, index, promote, mutate runtime flags, or mark anything `agent_ready`.
- **Required tests**:
  `src/lib/source/context-writeback/__tests__/source-context-writeback.test.ts`.
- **Release record**:
  `docs/releases/records/2026-07-23-source-enterprise-context-readback-verifier.md`.
- **Discovered from**: standing `SOURCE-INGEST-001` follow-on list, the Source enterprise-context
  writeback release's Known Gaps, and the user's requirement that Source persistence in Azure be
  provable before it can populate the enterprise context layer over time.
- **Known gaps**: this does not run writeback apply, OCR/transcription, vector indexing,
  enterprise-context retrieval, or `agent_ready` promotion. It proves the committed
  Azure/Postgres layers and guards against premature promotion.

### SOURCE-INGEST-001e — Source artifact parse backlog verifier

- **Problem statement**: Source now has durable upload, parsing, readiness-panel, and
  enterprise-context readback slices, but operators still lacked a reusable way to inspect the
  artifact parse/index backlog itself. The next obvious ingest work — async parse worker,
  backfill, OCR/transcription, vector indexing, and enterprise-context promotion — crosses
  governed job/index/data-promotion boundaries, so the safe next step is a read-only verifier
  that shows what the current Azure/Postgres artifact registry already proves.
- **User/business impact**: Source can only "learn over time" if each evidence state remains
  inspectable and honest. This verifier lets operators distinguish stored-only files,
  parser-ready files, parsed evidence, search-ready artifacts, stale parsing rows, failed rows,
  and image/audio/video files that still need governed OCR/transcription before any future
  backfill or promotion job is approved.
- **Severity**: P4 (evidence-layer integrity / ingestion operations readiness).
- **Workstream**: Ingestion / data persistence.
- **Status**: `Shipped — deployed and runtime-proven` — code-only, read-only, no migration,
  no data-build job, no vector indexing, no OCR/transcription, no enterprise-context
  promotion, and no production data mutation. Merged in PR #5475, deployed by ACA main run
  `30015900379`, superseded by current healthy main revision `ca-abarva-web-lab-eastus--mc6fbb7ff`,
  and VNet-proven with the read-only operator command for Lakeshore event
  `LAKE-AMS-2026-C1402EFD` (`c05872d8-0465-4bc8-8eeb-ff3d42ac6761`): 9 artifacts read,
  9 parser-ready, 0 parsed, 0 search-ready, 0 graph-projected, and 0 attention items.
- **Dependencies**: existing `source_artifacts` rows and existing parse, embedding, graph, family,
  format, and timestamp columns. No schema change is required.
- **Acceptance criteria**: add a read-only command that resolves a tenant-scoped Source event or
  tenant-wide artifact scope, summarizes parse/search/graph readiness into a proof JSON, reports
  attention items without reading or parsing artifact bytes, and can optionally fail on attention
  for strict operator runs. The report must never claim `agent_ready`, enterprise-context
  promotion, OCR/transcription, vector indexing, or learned context unless those states already
  exist in a governed downstream proof.
- **Required tests**:
  `src/lib/source/artifact-registry/__tests__/parse-backlog.test.ts`.
- **Release record**:
  `docs/releases/records/2026-07-23-source-artifact-parse-backlog-verifier.md`.
- **Discovered from**: standing `SOURCE-INGEST-001` follow-on list after the evidence-readiness
  and enterprise-context readback slices, plus the user requirement that the Source data layer be
  persisted in Azure/Postgres and provable before later enterprise-context learning.
- **Known gaps**: this does not add the async parse worker/backfill job, repair old artifacts,
  run OCR/transcription, create embeddings/vector indexes, project graph rows, execute
  enterprise-context writeback, or promote anything to `agent_ready`.

### SOURCE-SHELL-001 — Stage header lead-agent label was hardcoded

- **Problem statement**: found while comparing a user-provided Source Event Shell redesign
  mockup against the live app. The stage header printed "Stage NN · aVa" for every stage,
  including Transition and Value, contradicting the canvas's own rail note on the same page
  ("aVa guides steps 1-9 · Atlas takes over for Transition & Value").
- **User/business impact**: cosmetic but visibly self-contradictory copy on every Source
  event's Transition and Value stages.
- **Severity**: P7 (cosmetic)
- **Workstream**: Workspace UX
- **Status**: `Runtime Proven` (partial) — merged, deployed, ACA runtime invariant confirmed;
  the `aVa` branch is live-verified on real production data, the `Atlas` branch is not (no
  real event in current tenant data has reached Transition/Value — see the release record's
  Known Gaps).
- **Dependencies**: none.
- **Acceptance criteria**: header label derives from `view.stage.key`
  (`transition`/`value` → Atlas, else aVa) instead of a hardcoded string. Met.
- **Required tests**: `SourceAnalyticsCanvas.stageHeader.test.tsx` (new) — asserts both
  branches.
- **PR**: #5192
- **Discovered from**: direct comparison against the user's mockup, which correctly showed
  "STAGE 11 · ATLAS" for Value.
- **Notes / remaining gaps**: deliberately does not reconcile with the separate, richer
  `Nexus`/`Sentinel`/`Governance`/`Atlas`/`aVa` per-stage model in `stage-canvas-config.ts`
  (used by a different, older component) — that's a separate product decision.

### SOURCE-SHELL-002 — Per-file artifact role badge (Authoritative/Evidence)

- **Problem statement**: the mockup showed each Files-tab file tagged `AUTHORITATIVE` or
  `EVIDENCE` — whether the file is required to gate the stage. Live Source already computed
  this exact classification (`ArtifactLifecyclePanel`'s Gate-defining/Supporting split) but
  only showed it in the aggregate quality matrix, not per file.
- **User/business impact**: a user scanning the Files tab couldn't tell at a glance which
  files actually matter for gate advancement without cross-referencing the separate matrix
  panel.
- **Severity**: P6 (workspace UX / information density)
- **Workstream**: Workspace UX
- **Status**: `Runtime Proven` — merged, deployed, ACA runtime invariant confirmed, live
  signed-in click-through performed against real production data (real `.docx` shows
  `AUTHORITATIVE`, real `.md`/`.html` renderings of the same memo show `EVIDENCE`).
- **Dependencies**: none — reuses the existing `specByCode().gateDefining` lookup, no new
  derivation logic, no schema change.
- **Acceptance criteria**: `SourceShellFileItem` carries `artifactRole`; `FileCard` renders
  an `ArtifactRoleBadge`; unknown artifact codes default to `evidence` (fail-safe). Met.
- **Required tests**:
  `SourceAnalyticsCanvas.artifactRoleBadge.test.tsx` (new) — functional: real click to open
  the Files tab, real differing badge output from two real spec codes, real status values,
  real unknown-code fallback.
- **PR**: #5195, merged as `5721079099d86bbd611b349177af7ebde619c9eb`.
- **Discovered from**: direct comparison against the user's mockup.
- **Notes / remaining gaps**: the Files-tab lifecycle-explainer banner half of the mockup's
  two-axis pattern was evaluated and found to already exist in substance
  (`ArtifactLifecyclePanel`'s intro paragraph) — not duplicated with different wording.

### SOURCE-SHELL-003 — Single-event Approvals ledger view

- **Problem statement**: the mockup's "Approvals & advance" page shows one event's full
  11-stage gate history as a table — named approver role per gate, sequential
  APPROVED/LOCKED chips. Live `ApprovalsWorkspace` is a cross-event inbox of pending
  approvals only; the real governance mechanics (server-enforced sequential gates,
  append-only `source_event_approvals`) already exist, but this per-event table view does
  not.
- **User/business impact**: no single place to see one event's full governance history at a
  glance; must infer state from the cross-event inbox plus each stage's own gate card.
- **Severity**: P5 (workspace UX / governance visibility)
- **Workstream**: Approval/authority/lineage controls
- **Status**: `Merged` — PR merged; migration dependency applied and confirmed live
  (`2026-07-21-source-event-approvals-stage-key-migration`); ACA deploy/runtime-proof
  evidence for the app-code PR pending.
- **Dependencies**: `source_event_approvals.stage_key` migration — **resolved**: real
  investigation of `source-access-policy.ts` found Source approval authority is a flat,
  per-person capability uniform across all 11 stages, with no per-stage named-approver-role
  data anywhere. Rather than fabricate that concept, the ledger shows the real historical
  approver (Clerk-resolved) when a matching `stage_key` row exists, and a plain, honest
  authorization statement otherwise — not a named individual invented for stages nobody is
  specifically assigned to.
- **Acceptance criteria**: `SourceShellApprovalsWorkspace.ledger` carries the real 11-row
  ledger; approved/current/locked derives from stage position (always reliable); approver
  name/timestamp is real-or-null, never guessed; UI renders it in the Approvals workspace.
  Met.
- **Required tests**: `approval-ledger.test.ts` (7 pure-function cases, including the
  send-back/most-recent-row-wins case and the honest-null case) +
  `SourceAnalyticsCanvas.approvalLedger.test.tsx` (2 functional UI cases, real click + real
  differing rendered output).
- **PR**: schema — #5201 (merged, applied); app code — to be recorded on merge.
- **Discovered from**: direct comparison against the user's mockup.
- **Notes / remaining gaps**: no event in currently-available tenant data has a
  `stage_key`-tagged approval yet (migration just landed) — every ledger currently shows the
  honest "not recorded" path for its already-approved stages, which is correct, not a bug.

### SOURCE-SHELL-004 — Two-track artifact approval (Track A/B)

- **Problem statement**: the mockup's design-contract page specifies that artifact
  acceptance and the stage gate are two distinct approvals — an authoritative artifact must
  be explicitly accepted (author, timestamp, rationale, append-only) independent of the gate
  being armed. No live equivalent exists; today acceptance is inferred from artifact status
  flags, not recorded as its own action.
- **User/business impact**: no accountable, auditable record of who accepted a specific
  artifact as final and why, independent of the separate gate-approval record.
- **Severity**: P4 (approval/authority/lineage controls)
- **Workstream**: Approval/authority/lineage controls
- **Status**: `Merged — live-proven`. Migration applied through the governed
  `db-migration-lab.yml` lane with explicit user confirmation (`mode=status` then
  `mode=apply`, both succeeded, all steps including the new repository-readback step and the
  post-migration health check passed). Live signed-in proof performed: a real artifact was
  accepted on a real production event, with the real "Artifact status" panel confirming the
  real rationale, real Clerk accepted-by id, and real gate-precondition selection persisted
  and rendered back.
- **Dependencies**: none remaining — schema built using the field list from the mockup's
  design-contract page as the source of truth. Investigation found 2 of the 11 fields
  (`artifact_origin`, `supersedes_artifact_id`) already exist as exact-match columns on
  `source_artifacts` — reused via join, not duplicated. `artifact_role` was reconciled with an
  existing computed-only UI concept (`SourceShellFileItem.artifactRole`) rather than creating a
  second, colliding vocabulary. See the release record for the full field-by-field accounting.
- **Acceptance criteria**: new `source_artifact_acceptances` table (append-only); `POST
.../artifacts/:artifactCode/accept` route, `artifactState`/`artifactRole` computed
  server-side (never trusted from the client), requires a non-empty `approvalRationale`; an
  "Artifact status" panel on each File Cabinet card showing the latest real acceptance or an
  honest never-accepted state, with an Accept form; the existing "Stage gate" panel
  (`SOURCE-SHELL-003`) unchanged, placed alongside; `resolveAuthoritativeArtifact()` gains one
  new optional, backward-compatible pool. Plain-language UI copy only — no "Track A"/"Track B"
  anywhere on screen. All met, migration applied, live-proven.
- **Required tests**: `artifact-acceptances.test.ts` (7 cases), the accept route's own test
  suite (6 cases), 2 new `client-final-artifacts.test.ts` cases for the new resolver pool, and
  `ArtifactAcceptancePanel.test.tsx` (5 cases). Full adjacent-suite regression sweep confirmed
  zero regressions against a clean `origin/main` baseline (byte-identical failing-suite set
  before/after, via `git stash`).
- **PR**: [#5264](https://github.com/abarva-platform/abarva/pull/5264), squash-merged as
  `539ae678a9cb6cf0b93878894673c4d0f3b22437`.
- **Discovered from**: user-directed follow-up after reviewing the mockup's Track A/B
  prototype; UI copy explicitly must NOT say "Track A"/"Track B" on screen — plain language
  ("Artifact status"/"Stage gate") per direct user feedback.
- **Notes / remaining gaps**: `downstream_context_policy` is now enforced at
  `buildValidatedAgentContextBundle` by SOURCE-SHELL-004a: `exclude` is blocked, `restricted`
  is blocked unless a caller explicitly opts into restricted downstream use, and `include`
  remains eligible for the normal Context & Corpus gate. No backfill of historical acceptances
  for already-approved artifacts, matching the same honesty pattern `SOURCE-SHELL-003`
  established.

### SOURCE-SHELL-004a — Enforce accepted-artifact downstream context policy

- **Status**: `Shipped — deployed and runtime-proven` — code-only, no migration, no
  data-build job, no vector indexing, and no production data mutation. Merged in PR #5470
  (`0c2bd5c83ebbf07eba5ef3a7ea2b366dcc5b935d`), deployed by ACA main run
  `30013071091`, and still present on the independently verified production revision
  `ca-abarva-web-lab-eastus--m4eaa2e30` (`main-4eaa2e30`). Focused governance test,
  governance lint, and heap-sized TypeScript check passed again on 2026-07-23.
- **Problem statement**: SOURCE-SHELL-004 captured `downstream_context_policy` when a human
  accepted an artifact, but the central governed context gate ignored that field. A default
  `restricted` acceptance could therefore become indistinguishable from explicitly included
  context once mapped into a `GovernedCandidate`.
- **User/business impact**: client-final and workshop artifacts need a trustworthy path into
  enterprise context over time, but Source must not over-promote reviewed artifacts just because
  a row exists. This makes "include", "restricted", and "exclude" mean something at the shared
  agent-context boundary.
- **Implementation scope**: add optional `downstream_context_policy` support to
  `GovernedCandidate`; block `exclude`; block `restricted` unless
  `allowRestrictedDownstreamContext` is set by a caller performing explicit downstream review;
  preserve the policy through the enterprise bundle adapter when present. No schema changes,
  migrations, data-build jobs, vector indexing, or production data mutation.
- **Acceptance criteria**: focused regression proves `exclude` never enters usable model
  context, `restricted` is blocked by default and only allowed with explicit opt-in, `include`
  flows through the normal governance gate, and adapter mapping does not drop the policy field.
- **Required tests**: `npm test -- --runTestsByPath
  src/lib/governance/__tests__/agent-context-bundle.test.ts`; `npx eslint src/lib/governance`;
  `npx tsc --noEmit`; `npm run release:check`.

### SOURCE-SHELL-005 — Real per-vendor coverage in the Responses step body

- **Problem statement**: the mockup's Responses stage shows each vendor's response
  completeness inline in the step body (Halcyon MS/Northgate Global "complete", Vantage
  Digital "partial", Cormorant IT "awaiting"). Live `StepDetail` rendered only a bare upload
  prompt with no per-vendor breakdown.
- **User/business impact**: no at-a-glance view of which vendors have actually responded to
  which value levers while working the Responses step; that data existed but only surfaced
  in the separate Intelligence tab.
- **Severity**: P5 (workspace UX / information density)
- **Workstream**: Stage step-body content parity
- **Status**: `Merged` — see PR below.
- **Dependencies**: none — reuses the already-live `buildResponseCoverageInsight` →
  `VendorCoverageView` computation (Intelligence tab's `response_coverage` insight); no new
  data source.
- **Acceptance criteria**: when the active step's `factTemplateCode` is
  `RESPONSE_COVERAGE_V1` and the insight is genuinely live (`isModel: false`) with vendor
  data, `StepDetail` renders a `VendorResponseCoverageList` below the upload widget — real
  addressed/partial counts over `totalLevers`, status Complete/Partial/Awaiting derived from
  those counts. Renders nothing extra when the insight is still the honest MODEL state. Met.
- **Required tests**: `SourceAnalyticsCanvas.vendorResponseCoverage.test.tsx` — fixture-drift
  guard + real live-data render assertions + honest-MODEL-state no-render assertion.
- **PR**: [#5239](https://github.com/abarva-platform/abarva/pull/5239).
- **Discovered from**: mockup-anchored audit pass across Responses/Evaluation/Executive
  Decision/Selection stages.
- **Notes / remaining gaps**: does not replicate the mockup's file-chip / document-upload
  treatment (`response.pdf`, "148 requirements answered") — that would require a different,
  not-currently-computed data source (per-document upload tracking cross-referenced by
  vendor). Surfaces real per-vendor **value-lever** coverage instead, reusing the one
  source of truth the Intelligence tab already has, rather than fabricating a second one.
  Two other candidate gaps from the same audit pass (Evaluation should-cost step body,
  Executive Decision bridge step body) were investigated and retracted — direct mockup
  verification showed both already match live behavior.

### SOURCE-SHELL-006 — Keep viewed stage label and step body coherent

- **Problem statement**: a live Source event sitting at Scope could be opened with
  `?stage=responses`; the header, breadcrumb, and rail correctly said Responses, but the
  Steps workspace rendered the Scope fallback scaffold ("Provide the volumetrics",
  "Inclusions & exclusions", "Baseline evidence", "Boundary & owner"). The page was mixing
  the requested viewed-stage label with the generic Scope sample fallback when no live stage
  view existed for the requested stage.
- **User/business impact**: users reviewing a future stage could see the wrong work under the
  right stage label, making live QA and operator guidance misleading.
- **Severity**: P4 (stage navigation correctness / shell trust)
- **Workstream**: Stage route/view coherence
- **Status**: `Merged` — see PR below.
- **Dependencies**: none — uses existing stage sample view models, no schema/API/data changes.
- **Acceptance criteria**: when `viewStage` is `responses` or `evaluation` and the route has no
  live fact-backed `stageView`, `SourceAnalyticsCanvas` falls back to that requested stage's
  own scaffold rather than Scope. The focused regression uses an event whose current stage is
  Scope while `viewStage="responses"` and verifies the Responses step appears and Scope's
  "Provide the volumetrics" step does not.
- **Required tests**: `SourceAnalyticsCanvas.vendorResponseCoverage.test.tsx` — viewed-stage
  fallback coherence regression plus existing vendor-coverage checks.
- **PR**: [#5239](https://github.com/abarva-platform/abarva/pull/5239).
- **Discovered from**: signed-in live proof attempt for `SOURCE-SHELL-005` against a Healthcare
  Demo Source event currently sitting at Scope.

### SOURCE-SHELL-007 — Honest placeholders for Source stages without sample fixtures

- **Problem statement**: after `SOURCE-SHELL-006`, Responses and Evaluation correctly use their
  own fallback scaffolds, but Pricing, Executive Decision, and Transition still had no sample
  fixtures. With no live `stageView`, those stages could still fall through to Scope's sample
  body because the fallback selector's final default was `SAMPLE_SCOPE_STAGE`.
- **User/business impact**: users opening a stage without live facts could still see another
  stage's work under the correct stage label, eroding trust in stage navigation and QA proof.
- **Severity**: P4 (stage navigation correctness / shell trust)
- **Workstream**: Stage route/view coherence
- **Status**: `Live-proven` — merged in PR below and deployed through ACA main deploy run
  [29874391399](https://github.com/abarva-platform/abarva/actions/runs/29874391399).
- **Dependencies**: none — uses existing view-model contract, no schema/API/data changes.
- **Acceptance criteria**: the fallback selector explicitly maps every existing fixture-backed
  canonical stage; Scope has its own explicit branch; Pricing, Executive Decision, and Transition
  render stage-specific "no illustrative preview built yet" placeholders with zero tasks rather
  than Scope content.
- **Required tests**: `SourceAnalyticsCanvas.stageFallbacks.test.tsx` iterates the real
  `SOURCE_STAGE_ORDER` and renders `SourceAnalyticsCanvas` with `stageView={undefined}` for all 11
  canonical stages.
- **PR**: [#5242](https://github.com/abarva-platform/abarva/pull/5242).
- **Discovered from**: follow-up root-cause prompt for
  `SOURCE_SHELL_SAMPLE_STAGE_FALLBACK_FIX_PROMPT_2026-07-21`.

### SOURCE-GUIDEBOOK-002 — Signed-in guidebook runtime certification

- **Problem statement**: `SOURCE-GUIDEBOOK-001` shipped and is deployed, but a real
  signed-in user opening a Source event's Strategy stage and seeing the Guidebook tab
  render real content from the live database had never been observed. Component-level
  tests are real and pass, but they do not exercise the live server-side
  `getSourceStageGuidebook()` call against real Postgres through a real authenticated
  session.
- **User/business impact**: The feature was very likely working (every layer up to the
  authenticated boundary was independently proven), but "very likely" is not "proven" —
  this was the one remaining gap between deployed code and a certified user-facing
  feature.
- **Severity**: P5 (verification/evidence gap, not a known defect)
- **Workstream**: Live runtime verification
- **Status**: `Closed — live-proven 2026-07-21`. An earlier attempt via a fresh
  claude-in-chrome browser was stopped by Clerk's one-time-email-code sign-in flow with
  no inbox access available. Closed using an already-authenticated claude-in-chrome
  session (the same one used to live-verify `SOURCE-SHELL-006`/`007` the same day) — no
  credentials were entered by the agent at any point; the session was already signed in
  as Anand Sundaram, Healthcare Demo tenant.
- **Dependencies**: none (resolved).
- **Acceptance criteria** — all met, see
  `docs/releases/records/2026-07-20-source-guidebook-workspace-ui.md` for full evidence:
  1. Authenticate using an approved test account or reusable signed-in storage state. Met.
  2. Open a Source event at the Strategy stage. Met — event
     `cea10d0a-6d5d-49d2-8522-173c2d6fd520`.
  3. Verify the Guidebook workspace tab is visible. Met.
  4. Confirm the rendered title is "Strategy Gate Review". Met.
  5. Verify all five authored sections render. Met.
  6. Confirm stages without guidebooks hide the workspace tab (not shown-and-empty).
     Met — verified on the Scope stage of the same event.
  7. Capture screenshot, response evidence, tenant/event identity, and the deployed
     commit SHA. Met — commit `01723ef0123a4e7d85716f1133ae67cd58f72263`.
  8. Add the evidence to `docs/releases/records/2026-07-20-source-guidebook-workspace-ui.md`.
     Met.
- **Required tests**: none new — this was a verification pass, not a code change.
- **PR**: N/A (docs-only evidence update).
- **Discovered from**: `SOURCE-GUIDEBOOK-001`'s deploy — flagged honestly rather than
  claimed complete; closed once real signed-in access became available.

### SOURCE-APPROVAL-UX-001 — Approval brief simplification (slice 1 of 5)

- **Problem statement**: the Source event approval page (`EventApprovalCard.tsx`) surfaced too
  many adjacent governance details at once, forcing an approver to hunt for the actual decision
  among evidence, intake trail, routing, and audit detail all shown at equal visual weight.
- **User/business impact**: slower, more error-prone approvals; the actual decision (approve /
  request changes / reject) competed for attention with secondary reference material.
- **Severity**: P5 (workspace UX / decision clarity)
- **Workstream**: Approval/authority/lineage controls
- **Status**: `Merged — live-proven`. Two PRs: initial compact-brief slice
  ([#5277](https://github.com/abarva-platform/abarva/pull/5277), bundled with
  `SOURCE-SHELL-003/004/005/006/007` e2e coverage in the same PR — a scope-mixing deviation
  from this workstream's own stated non-goal, noted for future PR hygiene, not reverted since
  both halves shipped clean) and a flattening polish pass
  ([#5279](https://github.com/abarva-platform/abarva/pull/5279), merged as `b7138c81`). ACA
  deploy run succeeded for `b7138c81`; live signed-in browser proof performed on the Source
  approval page.
- **Dependencies**: none.
- **Acceptance criteria**: a compact approval brief (five governed facts, flattened into a
  definition-list layout, not nested tiles) appears first; required rationale, gate
  confirmations, blocker state, and the primary approval action stay in the active path;
  evidence review, intake audit trail, routing, and next-step detail move behind disclosures;
  existing approval API payload, permissions, self-approval behavior, and strategy-gate
  confirmation semantics unchanged. Met.
- **Required tests**: `EventApprovalCard.test.tsx` (6 cases, existing gate-readiness/API-payload
  coverage preserved plus new hierarchy regression coverage).
- **PR**: [#5277](https://github.com/abarva-platform/abarva/pull/5277),
  [#5279](https://github.com/abarva-platform/abarva/pull/5279).
- **Discovered from**: surfaced during the `SOURCE-SHELL` golden-event E2E crawl extension —
  the approval page "looked too cluttered for the decision being asked of the user."
- **Notes / remaining gaps**: full target shape captured in
  `docs/codex-handoff/SOURCE_P1_APPROVAL_UX_RECOMMENDATIONS_2026-07-22.md` — this slice covers
  recommendation point 1 only (first-viewport fact hierarchy). Direct code inspection found
  slice 1 actually shipped more of points 2-4 than initially assumed (evidence/audit
  disclosures, disabled-until-ready Approve, overflow menu for secondary actions already
  exist). What's genuinely still open — real governance history in the audit disclosure, an
  evidence freshness signal, and a verification-first closing pass — is
  `SOURCE-APPROVAL-UX-002` through `004` below.

### SOURCE-APPROVAL-UX-002 — Governance history in the audit disclosure

- **Problem statement**: **correction to an earlier version of this entry** — direct
  inspection of `EventApprovalCard.tsx` shows slice 1 already shipped both a collapsed evidence
  disclosure (`data-testid="source-approval-evidence-disclosure"`, summary shows
  `Evidence reviewed · N facts`) and a collapsed audit disclosure
  (`data-testid="source-approval-audit-disclosure"`, summary shows
  `Intake audit trail · N turns`) — the "build a collapsed drawer" work this entry originally
  described is already done. The real, verified gap: the audit disclosure only renders
  `IntakeChatTrail` (intake conversation turns) — it never queries or shows the
  `SOURCE-SHELL-003` `source_event_approvals` ledger or the `SOURCE-SHELL-004`
  `source_artifact_acceptances` records, even though the recommendations doc explicitly asked
  for "prior approvals, acceptances, and reviewer notes" together in this drawer.
- **User/business impact**: an approver reviewing this event's governance history sees only
  the intake conversation, not who approved prior stage gates or accepted which artifacts as
  authoritative — the two features shipped earlier this session are invisible on the one page
  where a reviewer would most want to see them.
- **Severity**: P5 (workspace UX / decision clarity)
- **Workstream**: Approval/authority/lineage controls
- **Status**: `Merged — live-proven`. PR
  [#5299](https://github.com/abarva-platform/abarva/pull/5299), merged as `cc81e1b`.
  ACA deploy run `29917417511` succeeded; live signed-in proof captured on the SkyHarbor
  Source approval page. The tested live event had no prior stage approvals or artifact
  acceptances, so the proof confirms the honest empty state in production; render tests cover
  populated approval-ledger and artifact-acceptance rows.
- **Dependencies**: none — `loadApprovalLedger()` (`SOURCE-SHELL-003`) and
  `listArtifactAcceptances()`/`getLatestArtifactAcceptancesByArtifactIds()`
  (`SOURCE-SHELL-004`) already exist and are already tested; this wires existing repository
  functions into an existing disclosure, no schema change.
- **Acceptance criteria**: the existing audit disclosure (or a clearly-labeled adjacent one, if
  mixing intake chat with governance history reads badly) shows real approval-ledger rows and
  real artifact-acceptance records for the event, alongside the existing intake chat turns; an
  honest empty state when none exist yet (matching this session's established pattern — never
  fabricate placeholder rows); the existing intake-chat content is not removed, only
  supplemented.
- **Required tests**: render test confirming real ledger + acceptance data appears when
  present; honest-empty-state test when absent; existing `EventApprovalCard.test.tsx` cases
  must still pass unmodified in behavior.
- **Discovered from**: `docs/codex-handoff/SOURCE_P1_APPROVAL_UX_RECOMMENDATIONS_2026-07-22.md`,
  recommendation point 2 — corrected against actual code state 2026-07-22 after an initial,
  inaccurate version of this entry assumed no disclosure existed yet.
- **Execution instructions** (apply to `002` and `003` together): these touch two different,
  independent disclosures with no shared state — run them as two parallel work threads rather
  than serially, land as one integration PR or two, whichever is cleaner. Once each slice
  passes full local validation (typecheck, lint, tests, `release:check`), merge and deploy it
  without pausing to ask first — standing authority for this workstream, matching every other
  `SOURCE-SHELL`/`SOURCE-APPROVAL-UX` item this session. After deploying, capture live
  signed-in proof, update this entry's status, and move to `004` without stopping for
  confirmation. Real stop conditions: a database migration, a change to existing approval
  permissions/payload semantics, or a validation failure that isn't a simple fix.

### SOURCE-APPROVAL-UX-003 — Evidence freshness signal

- **Problem statement**: **correction to an earlier version of this entry** — the evidence
  disclosure already exists and already shows a count (`Evidence reviewed · N facts`); the
  originally-described "build a drawer" task is done. The real, verified gap: neither
  `EventApprovalCard.tsx`'s disclosure summary nor `IntakeFactsReview.tsx` (grepped directly,
  zero hits for any date/timestamp/freshness field) shows any recency signal — the
  recommendations doc specifically asked for "counts **and freshness signals** visible" while
  collapsed, and only the count half exists today.
- **User/business impact**: an approver can't tell, without expanding the disclosure, whether
  the evidence behind this approval is current or stale.
- **Severity**: P6 (workspace UX polish)
- **Workstream**: Approval/authority/lineage controls
- **Status**: `Merged — live-proven`. PR
  [#5299](https://github.com/abarva-platform/abarva/pull/5299), merged as `cc81e1b`.
  ACA deploy run `29917417511` succeeded; live signed-in proof confirms the collapsed evidence
  summary shows the event-level `updated_at` freshness signal (`Evidence reviewed · 5 facts ·
updated 19 d ago` on the proof event).
- **Dependencies**: none — check what timestamp field is actually available on captured
  intake facts (likely `capturedAt`/`updatedAt` on the underlying fact record; verify the real
  field name before assuming one) and surface it, no schema change if one already exists.
- **Acceptance criteria**: the evidence disclosure's collapsed summary shows a freshness signal
  (e.g. "updated 2 days ago" or the most-recent capture date) alongside the existing fact
  count; if facts have materially different capture dates, show the most-stale one (worst
  case, not best case) so the signal is honest about what an approver should actually verify.
- **Required tests**: render test confirming the freshness signal appears with real data;
  confirm it reflects the most-stale fact when facts have mixed dates.
- **Discovered from**: `docs/codex-handoff/SOURCE_P1_APPROVAL_UX_RECOMMENDATIONS_2026-07-22.md`,
  recommendation point 2 — corrected against actual code state 2026-07-22.
- **Execution instructions**: same as `SOURCE-APPROVAL-UX-002` — build in parallel with `002`,
  merge/deploy/live-verify without pausing, then continue to `004`.

### SOURCE-APPROVAL-UX-004 — Acceptance-criteria verification pass

- **Problem statement**: **correction to an earlier version of this entry** — the originally
  proposed "footer action bar + checkout-style gating" slice is, on inspection, already
  substantially shipped: `Approve` is already `disabled={!actionReady}`, blocker copy already
  surfaces in the approval brief's "Next required step" strip, and the footer already
  distinguishes a primary action (Approve) from lower-frequency ones (Request changes/Reject
  already sit inside an "Other decisions" `<details>` overflow, "Send to co-approver" as the
  visible secondary). What's actually unverified is whether this already-shipped shape
  satisfies the recommendations doc's 5 explicit acceptance criteria (5-second scan test, ≤1
  primary + 1 secondary action visible in the first viewport, required confirmations visible
  without scrolling, evidence/audit reachable within one click, no unrelated
  future-stage/artifact-maintenance content shown by default) — nobody has checked this against
  the real, deployed page.
- **User/business impact**: without this pass, "done" is asserted per-slice but never confirmed
  against the original design intent as a whole, and `002`/`003` land without knowing whether
  they've actually closed the gap.
- **Severity**: P5 (workspace UX / decision clarity, closing verification)
- **Workstream**: Approval/authority/lineage controls
- **Status**: `Merged — live-proven`. PR
  [#5299](https://github.com/abarva-platform/abarva/pull/5299), merged as `cc81e1b`.
  Live signed-in proof confirmed all 5 acceptance criteria on the deployed Source approval
  page: approval object and primary action visible, only one primary + one direct secondary
  approval action visible, required confirmations visible without scrolling, evidence/audit
  reachable within one click, and no unrelated future-stage or artifact-maintenance content
  shown by default.
- **Dependencies**: `SOURCE-APPROVAL-UX-002`, `SOURCE-APPROVAL-UX-003`.
- **Acceptance criteria**: all 5 criteria from the recommendations doc's "Suggested acceptance
  criteria" section checked against the real, deployed page via live signed-in browser proof —
  not asserted from reading the code. For any criterion that fails, make the smallest
  targeted fix that closes it (e.g. if "Request changes" being inside an overflow menu turns
  out to fail the ≤1-primary/1-secondary-action criterion in practice, promote it to a visible
  secondary button — don't rebuild the footer from scratch if it's already close). Confirm
  governed evidence/approvals/artifact-acceptance/audit records are never removed or
  permanently hidden (only collapsed), matching the doc's own stated Non-Goals.
- **Required tests**: whatever's needed for any targeted fix made during this pass; none if all
  5 criteria already pass.
- **Discovered from**: `docs/codex-handoff/SOURCE_P1_APPROVAL_UX_RECOMMENDATIONS_2026-07-22.md`,
  "Suggested acceptance criteria" + "Non-Goals" sections — corrected against actual code state
  2026-07-22 (originally split across two entries, `004`/`005`, on the wrong assumption that
  the footer/gating work hadn't started; consolidated into one verification-first pass).
- **Execution instructions**: this is the closing slice — verify first, fix only what's
  genuinely failing, merge/deploy/live-verify without pausing between any targeted fixes. After
  it passes, update the "Ready / in progress" section below to reflect closure, or note
  honestly what's still open if a criterion doesn't pass and isn't a small fix.

### SOURCE-UX-DECLUTTER-001 — P0 approvals bugs + first Stripe-style declutter pass

- **Problem statement**: a broad 5-area UI/UX audit (UI/UX quality, aVa chat analytics
  capability, artifact narrative quality, guidebook content, upload/persistence) found real
  bugs and clutter in the Source event canvas. This entry covers batch 1: two confirmed P0
  bugs in the per-event Approvals workspace, and a first Stripe-style decluttering pass
  (reduce repeated/redundant content, keep all functionality) per direct user instruction to
  fix incrementally rather than batch everything into one large change.
- **User/business impact**: the Approvals tab showed other events' pending items mixed in with
  no explanation and rendered its own featured card twice — undermines trust in the one
  surface that most needs to be unimpeachable. The Evidence ledger repeated an internal QA
  sentence 25+ times and always showed all 11 stages/33 artifact standards regardless of which
  stage the user was viewing — reads as noise and alarm rather than progress.
- **Severity**: P0 (approvals bugs) / P2 (declutter)
- **Workstream**: Workspace UX
- **Status**: `Merged — live-proven`. Live signed-in verification confirmed: exactly one
  approval card per event (no duplicate, no cross-event mixing), the "Go to steps to decide"
  button correctly switches tabs, the stage-relative progress line and "Show all 11 stages"
  toggle render with real data.
- **Dependencies**: none.
- **Acceptance criteria**: Approvals workspace shows only this event's items, never renders
  the featured item twice; the featured stage-gate card's CTA switches to Steps instead of
  linking to the page already open; the Evidence ledger's per-row "not scored" boilerplate is
  shown once (already-existing summary line) instead of per-row; the artifact-standards table
  defaults to the viewed stage with a one-click "show all 11 stages" toggle; the quality-score
  KPI leads with a stage-relative "N of M artifacts due so far are registered" line. All met.
- **Required tests**: new regression test in `source-event-shell-v2.test.ts` (cross-event
  exclusion + no duplicate); new test in `SourceAnalyticsCanvas.approvalLedger.test.tsx` (real
  render, CTA behavior); 2 existing `SourceAnalyticsCanvas.chat.test.tsx` cases updated for
  the new default stage-scoping (not weakened — they now explicitly toggle to all-stages,
  matching what they were actually testing).
- **PR**: [#5322](https://github.com/abarva-platform/abarva/pull/5322), squash-merged as
  `1d01c16d82c8eee057a32bfe6ba2922c09d15cfd`.
- **Discovered from**: 5 parallel-agent audits launched from a direct user request to evaluate
  UI/UX quality, aVa chat analytics capability, artifact narrative quality, guidebook content,
  and upload/persistence. One reported finding (the "✦ Intelligence" tab silently redirecting
  out of Source) was live-tested and disproven before any code was touched — recorded in the
  release record so it isn't rediscovered as a false lead later.
- **Notes / remaining gaps**: this was batch 1 of a larger incremental sequence. Follow-on
  batches now closed below include `SOURCE-UX-002`, `SOURCE-ANALYTICS-CHAT-001` through
  `004`, `SOURCE-ARTIFACT-QUALITY-001`, `SOURCE-GUIDEBOOK-004`, and the safe
  `SOURCE-INGEST-001` verifier/capture/readiness slices. The remaining ingest frontier is the
  governed worker/index/promotion family, which still requires explicit job/data-build approval.

### SOURCE-UX-002 — Files lifecycle matrix execution-first declutter

- **Problem statement**: live Source Files proof still showed the artifact lifecycle panel
  leading with a large 18-counter audit scoreboard (`Quality score`, `Hard fails`, `Gate B`,
  export coverage, evidence-only counts, etc.) before users reached the actual files. The
  information is valid, but its default presentation reads like internal QA machinery rather
  than a Stripe-like execution surface.
- **User/business impact**: sourcing teams opening Files to capture notes, upload evidence,
  or accept client-final artifacts should see the next execution state first. Full audit
  metrics still matter for governance, but they should be deliberate drill-in context, not
  first-paint clutter.
- **Severity**: P6 (workspace UX / information density).
- **Workstream**: Workspace UX.
- **Status**: `Shipped — deployed and signed-in proven` — code-only, no migration and no
  production data mutation. Merged in PR #5437 as
  `fef10108e283e8140ed9f292ba5299c40ec60f93`, deployed by ACA main run
  `29984083764`, and re-proven on `app.abarva.ai` during the 2026-07-23 proof-closure
  pass: the Files workspace shows the execution-first `ARTIFACT LIFECYCLE` panel,
  `Due so far`, `Registered`, `Missing required`, `Client finals`, standards CSV export,
  all-stage toggle, and audit metrics behind one click. No upload or mutation was performed.
- **Dependencies**: existing Source Files lifecycle matrix and artifact-quality summary; no
  schema or data dependency.
- **Acceptance criteria**: the lifecycle panel defaults to four execution-oriented metrics
  (`Due so far`, `Registered`, `Missing required`, `Client finals`); the full audit metrics
  remain reachable in one click; the standards CSV export and all-stage toggle remain visible;
  no artifact rows, approval controls, lifecycle states, quality findings, or CSV export fields
  are removed.
- **Required tests**:
  `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx`.
- **Release record**:
  `docs/releases/records/2026-07-23-source-files-lifecycle-declutter.md`.
- **Discovered from**: signed-in live proof after `SOURCE-INGEST-001b` and the standing
  `SOURCE-UX-DECLUTTER-001` follow-on list.
- **Notes / remaining gaps**: this does not redesign the FileCard list, lifecycle row table,
  or artifact-quality scoring rules. It only changes the default hierarchy so routine Files
  work starts with execution state while audit depth remains available.

### SOURCE-ANALYTICS-CHAT-001 — Wire Source's aVa chat to the AgentAnswerRenderer pipeline

- **Problem statement**: Source's chat surfaces (in-canvas `AvaBottomBar`, portfolio
  `SourceEventsAgentDockView`) only stream raw prose. A real, already-live chart/table
  rendering pipeline (`AgentAnswerRenderer`, driven by an `AvaAnswerPacket`) already works in
  production on Home and Intelligence — Source just never builds a packet to hand it.
- **User/business impact**: real, already-computed Source analytics (vendor response
  coverage, value waterfall, artifact quality/lifecycle) can only be seen on their own canvas
  panels — aVa chat can't answer a question like "how are vendors doing on coverage?" with
  an actual table, only prose.
- **Severity**: P3 (real capability gap, highest-leverage item from the 6-area UX audit)
- **Workstream**: Analytics / aVa chat
- **Status**: `Shipped — deployed and live-proven`. First slice built: vendor
  response-coverage only (value waterfall and artifact-quality answers are explicit follow-on,
  not in this slice). See
  `docs/releases/records/2026-07-22-source-vendor-coverage-governed-chat-answer.md` for the
  full build record, including the honest `retrievability: "not_indexed"` /
  `requireAgentReady: false` limitation this data class hits under the current governance
  model. **Correction (same day, caught during live-verify)**: the initial client wiring
  targeted `UniversalCanvasShell.tsx`/`AvaBottomBar.tsx`, which turned out to be unmounted
  dead code — the real live Source event chat is the platform-wide
  `AtlasPageStateProvider`/`AgentColumn` (rendered by `AppShell` on every page). See
  `docs/releases/records/2026-07-22-source-vendor-coverage-live-surface-fix.md` for the
  follow-up that moves the NDJSON request + `AgentAnswerRenderer` rendering to the real
  surface; `UniversalCanvasShell`/`AvaBottomBar` remain in the tree as confirmed dead code,
  flagged as cleanup debt, not deleted in this pass. Below is the original
  architecture-decision grounding this build resolved:
  1. **No dormant transport exists.** Source's chat calls `/api/chat/agent`
     (`src/app/api/chat/agent/route.ts`, ~3630 lines, shared by many non-Source surfaces) —
     this route streams plain text only, with no NDJSON `agent-answer` event mechanism. The
     real, proven `AvaAnswerPacket` pattern lives entirely on the separate
     `/api/intelligence/ask` NDJSON route (Home + Intelligence), which Source does not call.
     Building this means either retrofitting the large shared route (broad blast radius) or
     adding a new Source branch to the Intelligence-ask route (new code, not flipping on
     something latent) — both are real builds, not toggles. **Resolved**: neither — the
     event-canvas chat calls its own `/api/v1/source/[eventId]/nexus/ask` route (not
     `/api/chat/agent`), which got a new opt-in NDJSON branch instead, leaving both existing
     shared routes untouched.
  2. **A real governance gap was found and deliberately NOT fixed here** — see
     `docs/governance/CONTEXT_CORPUS_ENFORCEMENT_TRACKER_2026-06-08.md`'s "Known gap
     (2026-07-22)" section: Home/Intelligence's actual live packet-building path
     (`composeAvaAnswer`/`buildStructuredExhibits`) never calls the mandatory
     `buildValidatedAgentContextBundle` gate — it hardcodes `safety` flags as passed rather
     than deriving them from a real check. Per explicit user decision (2026-07-22): **build
     the new Source chat-answer path as the first surface that actually wires the governance
     gate into a live route** — do not just copy the existing (ungoverned) Home/Intelligence
     pattern for consistency. Retrofitting Home/Intelligence's existing routes is tracked as
     separate, deliberate follow-up work, not bundled into this item.
  3. **`isSourceSurface()` may not even be firing today** — `SourceEventsAgentDockView.tsx`
     sends `surface: 'source/events'` (no leading slash), which doesn't match
     `isSourceSurface()`'s matcher (`src/app/api/chat/agent/route.ts`) — worth fixing
     regardless of which transport path is chosen, since it gates whether Source-scoped
     context/access-policy logic fires at all.
- **Dependencies**: a real implementation plan covering the transport decision and the new
  governance wiring (turning `VendorCoverageView`/waterfall/lifecycle data into
  `GovernedCandidate[]` for `buildValidatedAgentContextBundle`) before any code is written.
- **Acceptance criteria**: TBD — to be finalized in the implementation plan.
- **Discovered from**: the 6-area UX audit's aVa chat/analytics capability finding, then
  deep-grounded before implementation per this session's established discipline (verify
  before building, especially for anything touching the mandatory governance gate).

### SOURCE-ANALYTICS-CHAT-002 — Artifact quality/lifecycle governed chat answer

- **Problem statement**: the first Source structured aVa answer shipped only vendor response
  coverage. Artifact quality and lifecycle posture still required users to leave chat, open the
  Files workspace, and interpret the lifecycle matrix manually.
- **User/business impact**: a reviewer should be able to ask "which artifacts are missing?",
  "how is artifact quality?", or "are the client finals ready?" and get a rendered chart/table
  grounded in the same lifecycle matrix the Files workspace uses.
- **Severity**: P3 (analytics / aVa chat capability gap).
- **Workstream**: Analytics / aVa chat.
- **Status**: `Shipped — deployed and live-proven` — base artifact-quality/lifecycle packet
  merged in PR #5441 as `ae3f20568e6ea576a8e5cd3f1d32b7490b9eb58d`, followed by event-id
  routing and slug-safe read fixes in PR #5444 and PR #5445. The final overlapping-intent
  priority fix merged in PR #5498 as `3956858600e4ffce115a917e8d4a5bee06a2c4a9`, deployed
  by ACA main run `30031601221`, and signed-in production proof confirmed artifact lifecycle
  prompts now return `intent=artifact_quality_lifecycle` with chart/table while evidence
  processing prompts return `intent=evidence_processing_readiness` with chart/table.
- **Dependencies**: existing Source artifact registry repository, existing
  `buildSourceArtifactLifecycleSummary()`, existing `AvaAnswerPacket` / `AgentAnswerRenderer`
  pipeline, and the mandatory `buildValidatedAgentContextBundle()` gate.
- **Acceptance criteria**: Source's opt-in NDJSON event-chat route recognizes artifact
  quality/lifecycle questions; returns a governed `AvaAnswerPacket` with a rendered posture
  chart and action table; uses real `source_artifacts` rows for citations when present; reports
  an honest no-data/canonical-standards zero state when no artifacts are registered; does not
  claim OCR, transcription, vector indexing, or enterprise-context promotion unless those
  existing statuses are already present.
- **Required tests**:
  `src/lib/source/ava/__tests__/artifact-quality-governed-answer.test.ts`,
  `src/app/api/v1/source/[eventId]/nexus/ask/__tests__/vendor-coverage-intent.test.ts`.
- **Release record**:
  `docs/releases/records/2026-07-23-source-artifact-quality-governed-chat-answer.md`.
- **Discovered from**: the standing `SOURCE-ANALYTICS-CHAT-001` follow-on list and the
  6-area Source audit's request for aVa to render impactful analytics/insights, not prose-only
  answers.
- **Notes / remaining gaps**: value-waterfall chat answers remain a separate follow-on; async
  parse worker, OCR/transcription, vector indexing, and enterprise-context promotion remain
  governed ingest/data-build slices.

### SOURCE-ANALYTICS-CHAT-003 — Value ledger/waterfall governed chat answer

- **Problem statement**: Source's Value Ledger page and stage-specific analytics can separate
  projected, committed, measurement-pending, and realized value, but aVa chat still cannot answer
  "show the value waterfall" with a rendered chart/table grounded in the existing ledger.
- **User/business impact**: sourcing leaders need a fast executive read on value without leaving
  chat, but the answer must not collapse projected value into realized savings or imply Tower /
  enterprise-context ingestion before that promotion exists.
- **Severity**: P3 (analytics / aVa chat capability gap).
- **Workstream**: Analytics / aVa chat.
- **Status**: `Shipped — deployed and live-proven` — code-only, read-only, no migration and no
  production data mutation. Merged in PR #5462, deployed by ACA main run `30006567762`, and
  signed-in proven on `app.abarva.ai` for the Apex AMS Source event.
- **Dependencies**: existing `getSourceValueLedger()` read model, existing `AvaAnswerPacket` /
  `AgentAnswerRenderer` pipeline, and the mandatory `buildValidatedAgentContextBundle()` gate.
- **Acceptance criteria**: Source's opt-in NDJSON event-chat route recognizes value-ledger /
  value-waterfall questions; returns a governed `AvaAnswerPacket` with a waterfall chart and
  ledger line-item table; scopes rows to the requested event / event aliases; keeps projected,
  committed, measured, and realized states distinct; reports an honest no-data state when no
  event-scoped ledger rows exist; does not claim vector indexing, `agent_ready` promotion, Tower
  ingestion, enterprise-context promotion, or realized savings unless the persisted ledger and
  governance state support it.
- **Required tests**:
  `src/lib/source/ava/__tests__/value-ledger-governed-answer.test.ts`,
  `src/app/api/v1/source/[eventId]/nexus/ask/__tests__/vendor-coverage-intent.test.ts`.
- **Release record**:
  `docs/releases/records/2026-07-23-source-value-ledger-governed-chat-answer.md`.
- **Discovered from**: the standing `SOURCE-ANALYTICS-CHAT-001` follow-on list, the 6-area Source
  audit's request for aVa-rendered analytics/insights, and the user's requirement to keep Source's
  persisted Azure/Postgres evidence layer distinct from future enterprise-context promotion.

### SOURCE-ANALYTICS-CHAT-004 — Evidence-processing readiness governed chat answer

- **Problem statement**: Source can now show evidence readiness in the Files workspace and operators
  can run a read-only artifact parse-backlog verifier, but aVa chat cannot yet answer "which files
  are parsed, search-ready, or blocked?" with a rendered chart/table grounded in the existing
  `source_artifacts` statuses.
- **User/business impact**: a reviewer should be able to ask aVa for the current evidence-processing
  state without leaving the event. The answer must keep stored, parsed, search-ready,
  graph-projected, enterprise-context-promoted, and `agent_ready` states separate so users do not
  mistake uploaded files for learned context.
- **Severity**: P3 (analytics / aVa chat capability gap; evidence-layer integrity).
- **Workstream**: Analytics / aVa chat, Source ingest readiness.
- **Status**: `Shipped — deployed and live-proven` — code-only, read-only, no migration, no
  production data mutation, no parser/indexer/OCR/transcription/promotion job. Merged in
  PR #5477 as `cc74d791d0f3bdcb86b25cda0d82210408efe7a6`, deployed by ACA main run
  `30018168714`, independently runtime-invariant checked, and signed-in proven on
  `app.abarva.ai` against Apex and Lakeshore Source events.
- **Dependencies**: existing Source artifact registry repository, existing
  `buildSourceArtifactParseBacklogReport()`, existing `AvaAnswerPacket` / `AgentAnswerRenderer`
  pipeline, and the mandatory `buildValidatedAgentContextBundle()` gate.
- **Acceptance criteria**: Source's opt-in NDJSON event-chat route recognizes evidence parse/index
  readiness questions; returns a governed `AvaAnswerPacket` with a processing-readiness chart and
  item table; reads real `source_artifacts` parse/search/graph statuses and citations when present;
  reports an honest no-data state when no files are registered; blocks restricted evidence through
  the governance gate; does not claim OCR, transcription, vector indexing, graph projection,
  enterprise-context promotion, or `agent_ready` unless those existing statuses already support it.
- **Required tests**:
  `src/lib/source/ava/__tests__/evidence-readiness-governed-answer.test.ts`,
  `src/app/api/v1/source/[eventId]/nexus/ask/__tests__/vendor-coverage-intent.test.ts`.
- **Release record**:
  `docs/releases/records/2026-07-23-source-evidence-readiness-governed-chat-answer.md`.
- **Discovered from**: the standing `SOURCE-INGEST-001` follow-on list, the shipped artifact parse
  backlog verifier, and the 6-area Source audit's request for aVa to render impactful analytics
  while preserving Azure/Postgres evidence-layer truth.
- **Notes / remaining gaps**: this is not the async parse worker, OCR/transcription path, vector
  indexing, or enterprise-context promotion. Those remain governed data-build/job slices.

---

### SOURCE-ARTIFACT-AUTHORITY-001 — One authoritative artifact per event+slot, consumed everywhere downstream

- **Problem statement**: Source has a real, working artifact-authority resolver
  (`resolveAuthoritativeArtifact()` in `src/lib/source/client-final-artifacts.ts`) and a real
  precedence order (client-final → explicit acceptance → current-authoritative →
  approved/locked → generated → any). It is correctly wired into the client-final route and
  the artifact render route's client-final short-circuit, and into two aVa-adjacent modules
  (`ava/mode-grounding.ts`, `source-answer-engine.ts`). But it is **not** the single downstream
  authority layer yet — several real consumers still read raw/unscoped artifact records
  instead of resolving through it, so a superseded or generated draft can still surface as if
  it were current in some surfaces even after a client-final has been accepted.
- **User/business impact**: A reviewer or downstream system (chat, Files list, direct
  download, Deal Pack) can be shown or can retrieve a stale/generated version of an artifact
  the client has already superseded with an accepted final — the exact trust failure the
  client-final acceptance flow (`SOURCE-SHELL-004`, PR #5114) exists to prevent.
- **Severity**: P4 (evidence-integrity / lineage-controls class — priority tier 4 in this
  backlog's ordering)
- **Workstream**: Deliverable/content quality, evidence integrity
- **Status**: `Closed` — the authority sequence is merged, deployed, and proven to the extent
  current production data allows: 001a PR #5370, 001b PR #5379, 001c PR #5381, 001d PR #5384,
  001e PR #5386, 001f PR #5389, and 001g PR #5391. The remaining named prompt/workflow maturity
  scope in item #9 closed in PR #5420 and was also deployed/invariant-checked/signed-in proven.
- **Reconciliation method**: inspected `origin/main` directly (not assumed from memory),
  confirmed via `git grep` which real call sites already import
  `resolveAuthoritativeArtifact`/`client-final-artifacts.ts`, and read the actual route bodies
  for the two most consequential findings (render-route format-mismatch fallback,
  nexus/ask's un-scoped evidence context) rather than taking the audit claims at face value.

**Reconciliation table** (state as of `main` @ `d5610a737`, 2026-07-22):

| #   | Item                                                                                 | Already fixed on `main`?                                                                                                                                                                                                                                                                                                                                                                                           | Open gap                                                                                                                                                          | Proposed PR scope                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Tests                                                                                                                                                                                                                                                                           | Deploy proof needed                                                                                                                                                            |
| --- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Artifact Authority Resolver (one artifact per event+slot, with audit history)        | **Fixed — merged, deployed, live-proven.** PR #5370 added the slot resolver primitive and authoritative-audit shape needed by downstream Source surfaces.                                                                                                                                                                                                                                                           | None known for this slice.                                                                                                                                        | Closed in `SOURCE-ARTIFACT-AUTHORITY-001a`. Keep future resolver changes additive and covered by precedence/history tests.                                                                                                                                                                                                                                                                                                                                                  | Resolver tests cover slot collapse, precedence, and lineage/history behavior.                                                                                                                                                                                                    | ACA deploy/invariant and signed-in proof captured with PR #5370 evidence.                                                                                                      |
| 2   | aVa / Source ask authority slice                                                     | **Fixed — merged, deployed, live-proven.** PR #5370 scoped Source aVa artifact context to authoritative slot winners, leaving superseded rows available only as labeled audit lineage instead of substantive evidence.                                                                                                                                                                                                | None known for this slice.                                                                                                                                        | Closed in `SOURCE-ARTIFACT-AUTHORITY-001a`; keep richer acceptance-ledger joins as separate context-binding work if needed.                                                                                                                                                                                                                                                                                                                                                 | Route/lib tests cover authoritative scoping and prevent superseded draft text from entering primary aVa evidence when a client-final sibling exists.                                                                                                                             | Signed-in Source aVa proof captured with PR #5370 evidence.                                                                                                                    |
| 3   | Files API/listing unification                                                        | **Fixed — merged, deployed, live-proven.** PR #5379 wired `src/app/api/v1/source/events/[eventId]/artifacts/route.ts` through `resolveAuthoritativeArtifactSlots()` for the default response and preserved raw rows behind `includeHistory=1`.                                                                                                                                                                     | None known for this slice.                                                                                                                                        | Closed in `SOURCE-ARTIFACT-AUTHORITY-001b`; keep any richer Files-tab history UX as separate polish.                                                                                                                                                                                                                                                                                                                                                                       | Route tests cover same-stage durable+generated collapse by default and raw preservation with `includeHistory=1`.                                                                                                                                                                | Live signed-in SkyHarbor proof confirmed default `rfp::d09_rfp_pack` collapsed to 1 row while `includeHistory=1` preserved 5 rows.                                             |
| 4   | Render/export authority slice — format-mismatch honesty                              | **Fixed — merged, deployed, live-proven.** PR #5381 changed the render route so a client-final format mismatch returns explicit `409 client_final_format_mismatch` instead of silently falling through to generated rendering. Generated fallback responses now carry `x-source-artifact-authoritative: generated-fallback`; matching client-final streams retain `x-source-artifact-authoritative: client-final`. | None known for this slice.                                                                                                                                        | Closed in `SOURCE-ARTIFACT-AUTHORITY-001c`; keep conversion/transcoding, if ever needed, as a separate explicit feature rather than an implicit fallback.                                                                                                                                                                                                                                                                                                                  | Route tests cover client-final DOCX requested as PDF → explicit conflict/no renderer call, and no-client-final fallback → `generated-fallback` header.                                                                                                                          | Live signed-in SkyHarbor proof confirmed stored-format DOCX streams the final and mismatched PDF returns explicit conflict rather than generated draft.                        |
| 5   | Direct artifact download authority                                                   | **Fixed — merged, deployed, live-proven.** PR #5384 wired the direct download route through `resolveAuthoritativeArtifactSlots()` for File Cabinet artifacts before bytes are streamed.                                                                                                                                                                                                                            | None known for this slice.                                                                                                                                        | Closed in `SOURCE-ARTIFACT-AUTHORITY-001d`; preserve `includeHistory=1` as the escape hatch for retrieving the originally-requested stale/draft id.                                                                                                                                                                                                                                                                                                                        | Route tests cover generated-draft id + client-final sibling in the same slot → streams the final with substitution headers, and `includeHistory=1` → streams the originally-requested draft id.                                                                                 | Live signed-in SkyHarbor proof confirmed an old draft download id served the authoritative final by default and `includeHistory=1` preserved the stale id.                     |
| 6   | Deal Pack authority                                                                  | **Fixed — merged, deployed, live-smoked.** PR #5386 threads File Cabinet authority into Deal Pack assembly so accepted client-final artifacts can replace stale generated `artifactStates` before payload binding and rendering.                                                                                                                                                                                   | Full live substitution proof is data-blocked until an accessible generic Deal Pack event has client-final File Cabinet history.                                   | Closed in `SOURCE-ARTIFACT-AUTHORITY-001e`; if suitable production data appears later, add the missing substitution live proof without changing code.                                                                                                                                                                                                                                                                                                                      | Deal Pack tests cover a superseded AI draft plus accepted client-final in the same slot: final content renders, stale body is excluded, and the draft appears only as labeled audit history.                                                                                    | ACA invariant passed for `ce505b9a`; signed-in generic Deal Pack smoke passed. Tenant scan found no accessible generic event with client-final File Cabinet history.           |
| 7   | Governance label unification                                                         | **Fixed — merged, deployed, live-proven.** PR #5389 removed the duplicated hand-synced precedence order from `source-answer-engine.ts` and routes artifact-governance answer selection through `resolveAuthoritativeArtifact()` directly. It normalizes regex-parsed artifact authority evidence into the shared resolver candidate shape and parses `activeAcceptance=true` when evidence carries it.                                                                                  | None known for this slice.                                                                                                                                        | Closed in `SOURCE-ARTIFACT-AUTHORITY-001f`; keep any richer `source_artifact_acceptances` evidence joins as a separate ingest/context-binding slice.                                                                                                                                                                                                                                                                                                                        | Focused answer-engine regression covers an active-acceptance artifact beating a merely current-authoritative generated record through the shared resolver, while aVa says client-final is not confirmed.                                                                                                              | ACA deploy run #29967031904 succeeded for merge `c308bcde5`; current superseding main revision `8e1cf690` is ACA-invariant-proven and contains that merge. Signed-in Lakeshore proof invoked aVa from the Source analytics shell and rendered the artifact-authority answer.               |
| 8   | Safe repair/regenerate old persisted drafts (`d01_strategy_memo` CONTENT BLOCKERS 3) | **Fixed — merged, deployed, ACA-invariant-proven.** PR #5391 added the explicit safe-repair route for already-persisted bodies. It reuses the current client-facing sanitizer/content-blocker scanner, returns a dry-run receipt first, and applies only to one selected terminal artifact row with exact confirmation phrase + body hash.                                                                                                                                               | Signed-in dry-run proof remains blocked until a fresh Clerk state is available; production apply remains a real data mutation and must not be run silently. | Closed in `SOURCE-ARTIFACT-AUTHORITY-001g`; deterministic safe repair for old persisted client-facing bodies, no Claude regeneration, no automatic batch cleanup, no unlock of locked/superseded status. The route records the before/after content-QA receipt in `body_generation_metadata` and the Source activity log when explicitly applied.                                                                                                                                                                                              | Route test covers dry-run blocker diff without writing; locked artifact apply requires explicit confirmation; confirmed apply keeps terminal status and writes metadata + activity audit receipt.                                                                                                                                  | Add non-mutating signed-in dry-run proof when fresh auth is available; apply proof requires explicit production data-repair approval or an approved test event.                             |
| 9   | Artifact prompt/workflow maturity by phase (d06, d08, d10, d12–d33 partial)          | **Fixed — merged, deployed, live-proven.** Pricing d19–d21, Responses d13–d15, Evaluation d16–d18, BAFO d22–d23, Decision/Selection d25–d28, Transition d29–d31, and Value d32–d33 were already merged/proven. PR #5420 closed the remaining early/mid Scope/RFP gaps: d06 Exclusion Log, d08 Scope Risk Pre-mortem, d10 RFI Summary, and d12 Vendor Shortlist. | None known after this slice for item #9's named d06/d08/d10/d12–d33 scope. Continue to watch for artifact-quality/guidance/ingest gaps in the separate backlog items below. | Closed in `codex/source-early-mid-prompts-001p` / PR #5420. Do not reopen item #9 unless a newly discovered artifact code is explicitly added to scope. | Prompt-registry tests cover d06/d08/d10/d12 availability, upstream blocking, evidence binding, no invented exclusions/workshop decisions/vendor interest/shortlist approvals. Lifecycle-matrix regression asserts d06/d08/d10/d12 export as prompt-backed and no longer show "No dedicated prompt." | ACA deploy run `29978081452` succeeded for merge `0a516cab`; independent invariant passed for `ca-abarva-web-lab-eastus--m0a516cab`; signed-in Apex SRC-004 Files/CSV proof confirmed prompt-backed labels and Claude model markers. |

**Closure note**: the old partial-worktree instruction for `SOURCE-ARTIFACT-AUTHORITY-001a` is
obsolete. That work shipped in PR #5370 and all sequenced authority follow-ons through 001g have
also shipped. Do not revive the stale worktree unless a regression triage proves a missing commit.

---

## Ready / in progress

`SOURCE-UX-DECLUTTER-001` batch 1 is merged and live-proven; `SOURCE-ANALYTICS-CHAT-001`
(vendor-response-coverage governed chat answer) is merged, deployed, and live-proven on
`app.abarva.ai` as of 2026-07-22. `SOURCE-ARTIFACT-AUTHORITY-001a` through `001g`,
item #9 prompt/workflow maturity for d06-d33, `SOURCE-ARTIFACT-QUALITY-001`,
`SOURCE-GUIDEBOOK-004`, and the safe `SOURCE-INGEST-001` verifier/capture/readiness/readback
slices are merged, deployed, ACA-invariant-checked, and signed-in proven to the extent current
production data allows.

No code-safe Source backlog item is currently marked `Ready` or `In Progress` in this file. The
remaining Source frontier is governed data-layer expansion: async parse/backfill execution,
OCR/transcription, vector indexing, and enterprise-context promotion. Those require explicit
data-build job / migration / production-data approval before implementation.

## Blocked

- Governed Source data-layer expansion: async parse/backfill execution, OCR/transcription,
  vector indexing, and enterprise-context promotion require explicit data-build job, migration,
  or production-data approval before implementation.
- Separately tracked, not blocking Source: the Home/Intelligence chat-governance gap in
  `docs/governance/CONTEXT_CORPUS_ENFORCEMENT_TRACKER_2026-06-08.md`'s "Known gap
  (2026-07-22)" section — flagged, not fixed, per explicit user decision to keep it as its own
  follow-up rather than bundle it into `SOURCE-ANALYTICS-CHAT-001`.
