# PROD4B Unified Production Readiness Control Plane

Status: code_complete
Owner: Steward
Date: 2026-04-26

## Purpose

PROD4B defines the unified Production Readiness Control Plane for AbarVa.
It keeps production readiness from fragmenting across parallel GPT, Codex,
and Claude Code sessions.

The production readiness spine is:

- One machine-readable readiness manifest:
  `docs/build/production-readiness.json`
- One admin readiness page:
  `/platform/admin/production-readiness`
- One update protocol:
  `docs/build/PRODUCTION_READINESS_UPDATE_PROTOCOL.md`
- One component taxonomy owned by the admin readiness read model
- One source of truth for scaffolded, code-complete, tested, full-flow,
  pilot, and production readiness

The production URL remains:
`https://app.abarva.ai/platform/admin/production-readiness`.

## Why This Is Needed

AbarVa now has multiple active workstreams:

- Source / Outsourcing
- Programs and Program Workshop Mode
- Intelligence
- AI Control Tower
- Admin / Setup
- Agent Runtime
- Model Gateway
- Data / Evidence / Knowledge Fabric
- Validation / QA
- Production / Deployment

Those workstreams may have local design notes, Source-specific trackers, or
slice reviews. Those files can explain context, but they must not become
competing readiness authorities. The canonical production readiness decision
must still flow through `docs/build/production-readiness.json` and the admin
Production Readiness page.

## Canonical Readiness Source

The canonical machine-readable source is:

`docs/build/production-readiness.json`

Supporting docs can provide detail, but they do not override the canonical
manifest. Examples:

- `docs/abarva-source/SOURCE_PRODUCTION_READINESS_TRACKER.md`
- `docs/abarva-source/SOURCE_LAYERED_PROGRESS_TRACKER.md`
- Source implementation reviews
- Build slice docs
- Architecture and design docs

When those files change readiness, the owning session must update the
canonical manifest in the same PR or explicitly report why no readiness
change occurred.

## Component Coverage

The unified control plane tracks these canonical components:

- Programs
- Program Workshop Mode
- Deliverables / Artifacts
- Intelligence
- AI Control Tower
- Admin / Setup
- Source / Outsourcing
- Data / Evidence / Knowledge Fabric
- Solution Intelligence
- Agent Runtime
- Model Gateway
- Ingestion / Parsing
- Audit / Governance
- Validation / QA
- Production / Deployment

## Source / Outsourcing Inclusion

Source / Outsourcing is included as one canonical component in the manifest.
Source-specific docs remain useful detail, but they do not create a separate
readiness tracker.

Current Source readiness evidence includes:

- Source dashboard
- Source event canvas
- Source data readiness panel
- Deterministic Source Nexus API stub
- Deterministic multi-agent mission preview and mission reporting
- Context validation
- Workflow validation
- AMS pattern intelligence
- Pricing and negotiation intelligence
- Admin/Setup-to-Source data readiness contract projection

Current Source readiness limits remain:

- No production upload/evidence pipeline
- No production parsing/classification pipeline
- No model-assisted Source Nexus runtime
- No full workflow engine
- No approval engine
- No production persistence
- No scorecard/artifact/value/vendor workflow implementation
- Production-domain authenticated visual QA remains incomplete unless
  explicitly recorded by a later slice

## Deterministic Today

PROD4B is deterministic/read-model alignment only. It does not add live
monitoring, database-backed readiness, or provider polling.

Today the admin page can render a repository-backed readiness view, poll the
internal no-store readiness API, display freshness metadata, and show the
canonical component list. That refresh path still reads the deployed manifest
snapshot.

## Not Live Monitoring Yet

The tracker does not yet:

- Poll GitHub checks
- Poll Vercel deployments
- Execute route smoke checks
- Execute persona crawlers
- Read production observability
- Read database-backed readiness state
- Promote components automatically

Any UI wording must remain honest when the update mode is `static_manifest`
or `repository_snapshot`.

## Deferred

Future slices may add live backing only with explicit approval and safe
server-side configuration:

- GitHub Actions ingestion
- Vercel deployment ingestion
- Route smoke runner results
- Persona crawler results
- Security scan results
- Production observability
- DB-backed readiness state

Until then, the tracker remains a deterministic manifest control plane.

## Future Slice Rule

Every future GPT, Codex, or Claude Code session must:

1. Read the production readiness protocol.
2. Decide whether the slice changes readiness.
3. Update `docs/build/production-readiness.json` when readiness changes.
4. Avoid creating a duplicate readiness manifest or duplicate admin page.
5. Include the required readiness impact section in the final report.

If a slice does not change readiness, the final report must say why.

## Validation

Required validation for this slice:

- `npx tsc --noEmit --pretty false`
- `npx jest src/__tests__/integration/admin/production-readiness-tracker.test.ts`
- `npm run build`
- `git diff --check`
- JSON parse checks for `docs/build/production-readiness.json` and
  `docs/build/build-slices.json`

Regression checks when practical:

- `npx jest src/__tests__/integration/admin/steward-setup-control-center.test.ts`
- `npx jest src/__tests__/integration/design/abarva-ui-primitives.test.ts`

## Readiness Impact

Production-readiness tracker updated: yes.

Components changed:

- `source`: notes and next action updated to clarify Source remains in the
  unified manifest and is not pilot-ready or production-ready.
- `validation_qa`: notes updated to record the component-map and protocol
  regression coverage.
- `production_deployment`: notes updated to preserve that this is not live
  monitoring and does not promote deployment readiness.

Status changes: none.

No component is promoted by PROD4B.

## Explicitly Out Of Scope

- No new admin page
- No duplicate readiness manifest
- No Source runtime changes
- No Programs, Intelligence, or Control Tower UI changes
- No auth rewrite
- No model calls
- No upload/parsing implementation
- No database migrations
- No live GitHub/Vercel polling
- No production observability
- No manual deploy
