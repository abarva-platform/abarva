# 2026-06-11-moves-orchestrated-deliverables — wire the Deliverable Intelligence Orchestrator into the board-grade business-case (flag-gated)

## Release ID

`2026-06-11-moves-orchestrated-deliverables`

## Status

`candidate`

## Plain-English Summary

Today the board-grade "Generate" buttons in a Move render **deterministic
templates** — there is no per-click instruction to Claude to use the Move's
data, write rich detail, or format like a board deck. A governed multi-pass
authoring layer (the Deliverable Intelligence Orchestrator) already exists in
the codebase with exactly those instructions (citation policy, formatting
instructions, expert latitude, anti-fabrication boundary, quality gate) but had
**no runtime call-site** — it was dormant.

This change wires that orchestrator into the **Costed Business-Case** board-grade
route, behind a tenant feature flag (`moves_orchestrated_deliverables`, default
OFF). When the flag is on for a tenant, clicking Generate authors the deck
through the orchestrator: it binds **only the Move's recorded facts** (the P1
charter fields and `engagements.baseline_metrics`) as citation-numbered governed
evidence, runs the six-pass flow (architect → evidence-grounding → draft →
red-team → board-grade rewrite → render), and enforces the **plan and quality
gates**. The structured result is rendered to a self-contained HTML deck (safe,
escaped markdown). If the Move has no recorded evidence, or the quality gate
blocks (too short, unsupported claims, leaked internal tags, no source
register/decision/recommendation/risk table), the route **falls back to the
existing deterministic deck** — it never emits fabricated board content.

Default behavior is unchanged: with the flag off, every tenant gets the
deterministic deck exactly as before.

## Layer Impact

- `global-control-lane`: new orchestrated authoring module
  (`src/lib/programs/deliverables/orchestrated/*`), a new feature flag, and a
  flag-gated branch in the board-grade business-case route. No schema change.
- `experimental`: the orchestrated path is behind a default-OFF tenant flag.

## Client Applicability

- All clients: the deterministic path is unchanged (default).
- Specific clients: the orchestrated path activates only for tenants added to
  the flag's `includeTenants` (or the `ABARVA_FEATURE_MOVES_ORCHESTRATED_DELIVERABLES_TENANTS`
  env allowlist). Currently empty — no tenant is on it yet.
- Internal only / public-demo only: no.
- Feature flag: `moves_orchestrated_deliverables` (policy `tenant`, default OFF).

## Changes Included

- `src/lib/programs/deliverables/orchestrated/build-request.ts` — binds a Move's
  recorded charter fields + baseline metrics into a `DeliverableIntelligenceRequest`
  (governed evidence + source register; absent charter fields become
  missing-evidence entries). No fabrication.
- `src/lib/programs/deliverables/orchestrated/render-html.ts` — renders the
  orchestrator's `RenderableDeliverable` to a self-contained HTML deck via a
  SAFE escaped markdown subset (headings, lists, tables, bold, inline code).
- `src/lib/programs/deliverables/orchestrated/run-orchestrated-business-case.ts`
  — runs the multi-pass orchestration (audited Anthropic egress by default,
  injectable for tests), enforces the plan + quality gates, returns HTML only
  when both pass; otherwise `{ ok:false, blockedReason }`.
- `src/lib/features/registry.ts` — registers `moves_orchestrated_deliverables`
  (tenant, default OFF).
- `src/app/api/v1/moves/board-grade-business-case/route.ts` — flag-gated
  orchestrated branch with deterministic fallback; `maxDuration` raised to 300s
  for the multi-pass path; `x-deliverable-engine: orchestrated` response header.
- Tests: `…/orchestrated/__tests__/orchestrated-business-case.test.ts` — 7 tests:
  evidence binding (no fabrication), missing-evidence labelling, full multi-pass
  flow + gate pass → HTML, no-evidence block, thin-document block, markdown
  escaping/table rendering.

## QA / Validation

- `npx tsc --noEmit`: no new errors (pre-existing `.next/dev` validator only).
- `npx eslint` on all changed files: clean.
- Jest: the 7 orchestrated tests pass; they exercise the REAL orchestration
  driver and quality validator with an injected stub model (verification at the
  logic level, not UI text) — proving gate-pass → HTML and gate-block → honest
  fallback, and that the request binds only recorded facts.

## Rollout Plan

Merge and deploy. The path stays dormant until a tenant is added to the flag's
`includeTenants` (or the env allowlist) — at which point that tenant's Costed
Business-Case clicks author through the orchestrator. Recommend enabling first
for one pilot tenant (e.g. SkyHarbor) and confirming a real run on ACA against a
Move with recorded charter + baseline evidence before wider rollout. No
migration, no schema change.

## Rollback Plan

Remove the tenant from the flag allowlist (instant, per-tenant) — the route
returns to the deterministic deck. Or shift ACA ingress to the prior revision.
No destructive change.

## Audit Evidence

- Every orchestrated pass goes through the audited Anthropic egress
  (`createAuditedModelCaller`) with a per-pass workflow tag
  (`deliverable:moves:business_case:<pass>`), model `claude-opus-4-8`,
  dataClass `confidential`, and the Move id in metadata.
- The quality gate's blockers/metrics are returned on the result and logged when
  the route falls back.

## Known Gaps

- Only the **Costed Business-Case** route is wired in this slice. The other 7
  board-grade routes still render deterministically; wiring them is the next
  slice (the orchestrator and HTML renderer are now reusable).
- Evidence binding currently uses the P1 charter fields + `baseline_metrics`.
  Richer governed evidence (full EvidenceStateMap, KPI catalog, value pools) is a
  follow-up — the request builder is the single seam to extend.
- The orchestrated path is **synchronous** within the request (up to six opus
  passes, `maxDuration=300`). For production scale this should move to a queued
  job with a progress UI; acceptable for flag-gated pilot use.
- A tenant only resolves the flag when its key maps to a canonical `ClientKey`
  (or alias); enabling for a non-`ClientKey` tenant requires adding it to
  `client-config` first.
- Live proof on ACA against a real Move (real Anthropic egress) is not yet run —
  it requires the flag enabled for a tenant with recorded evidence.
