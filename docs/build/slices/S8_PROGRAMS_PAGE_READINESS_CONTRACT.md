# S8 · Programs Page Readiness Contract

Slice ID: S8
Slice name: Programs page readiness contract
Status: code_complete (documentation only — pending founder review for AUTHORED-LOCKED)
Authored: 2026-04-24
Author: Code (sole)
Source-of-truth references:
- `docs/platform-design/00_AGENT_CENTRIC_MASTER_ANCHOR.md`
- `docs/platform-design/01_PLATFORM_NORTH_STAR.md`
- `docs/platform-design/02_CONTEXT_BUNDLE_STANDARD.md`
- `docs/platform-design/03_PAGE_LEVEL_AGENT_CONTRACTS.md`
- `docs/platform-design/04_VISUAL_AND_INTERACTION_SYSTEM.md`
- `00-vision-catalog-template-first-pattern.md` (M1 meta-pattern)
- `01-meta-patterns-m2-m6.md` (M2–M6 meta-patterns)
- `docs/CORE_APP_CONTEXT_PACK.md`
- `docs/build/BUILD_OPERATING_MODEL.md`
- `docs/build/build-slices.json`

This contract is the documentation gate before S9 implementation begins. It does not change any runtime code. Implementing slices must trace each acceptance criterion below to specific files they touch.

---

## A. Purpose and scope

### Purpose

Programs is the first canonical proof surface for the AbarVa agent-centered runtime. Every other surface (Source, Intelligence, Tower, Admin) inherits the patterns this contract establishes. This document defines what Programs must look, feel, and behave like before any S9-series code lands.

### Scope

**In scope:**
- The four canonical Programs routes listed in §B.
- The agent behavior contract for Nexus and Steward on those routes.
- The Context Bundle requirements that gate Nexus speech.
- The visual zoning (Zones A–E from `04_VISUAL_AND_INTERACTION_SYSTEM.md`).
- The state, gate, and audit model for the six canonical phases and four hard gates.
- The data and registry contracts the canonical routes depend on.
- The acceptance criteria a persona crawler must validate.

**Out of scope (explicitly deferred — see §O):**
- Full deliverable generation pipeline.
- Upload / parsing pipeline.
- Pattern graph traversal beyond the M1–M6 hooks.
- Database migrations.
- Modernization of legacy `/programs/*` (see §B).

### Pattern alignment

Programs implements:
- **M1 · Six-Phase Engagement Architecture** (Origination → Verify) verbatim.
- **M2 · Pattern Library Tiering** as the source of authored guidance Nexus cites.
- **M3 · Agent Voice Contracts** — Nexus = maestro-collegial, Steward = operationally-terse.
- **M4 · Hard-Gate Discipline** for the four canonical gates listed in §H.
- **M5 · Evidence Provenance** — every claim either cites a specific evidence id or labels itself as authored-from-industry-knowledge.
- **M6 · Dual-Ledger Value Tracking** — projected and realized value rendered side-by-side.

---

## B. Routes covered

| Route | Purpose | Agent owner |
|-------|---------|-------------|
| `/tenant/[tenantSlug]/programs` | Programs index for the tenant | Nexus (portfolio scope) |
| `/tenant/[tenantSlug]/programs/[programSlug]` | Program detail surface | Nexus (program scope) + Steward (gate scope) |
| `/tenant/[tenantSlug]/programs/[programSlug]/deliverables/[deliverableCode]` | Single deliverable detail | Nexus + Sentinel handoff for evidence |
| `/tenant/[tenantSlug]/programs/[programSlug]/phase/[phaseNum]` | Phase workspace (1–6) | Nexus + Steward (gate enforcement) |

### Legacy `/programs/*` is NOT canonical for new work

The pre-tenant `/programs`, `/programs/new`, `/programs/[programId]/...` and `/programs/patterns` surfaces remain in the codebase for archival continuity, but no S8/S9 work extends them. New product code targets only `/tenant/[tenantSlug]/programs/*`. Per `docs/platform-design/00_AGENT_CENTRIC_MASTER_ANCHOR.md` lines 161–164, `src/app/programs/*`, `src/app/(maestro)/preview/*`, `src/app/demo/*`, `src/components/programs/ProgramSurface.tsx`, and `src/lib/programs/mock.ts` are prohibited-until-reviewed.

---

## C. Primary users

Drawn from `docs/CORE_APP_CONTEXT_PACK.md §1` and validated against the four canonical demo tenants (apexretail, meridian, arcturus, keystone).

| Role | Primary need on Programs |
|------|--------------------------|
| CIO / CTO | Portfolio pressures, gate readiness, dollar exposure, decision queue |
| Program sponsor (CXO) | Phase status, blockers requiring my decision, value at stake |
| Program owner | Active deliverables, missing inputs, next action with owner and due date |
| PMO / Transformation lead | Cross-program portfolio view, aging, ownership, escalation paths |
| CFO / Value Office | Projected vs. realized value, attribution, variance, dual-ledger integrity |
| Admin / Steward operator | Audit gaps, gate-bypass attempts, ownership voids, quality signals |

Each agent response on Programs must be defensible against any of these readers. Marcus T (CFO) and Dr. L (CMIO) crawler personas remain the canonical verification leads.

---

## D. User questions Programs must answer

Within three seconds of landing on a Programs surface, the user must be able to answer six questions without typing a prompt. Each question maps to a specific zone or contract section.

| # | Question | Where it is answered |
|---|----------|----------------------|
| 1 | What is this program? | Zone B context strip · `Identity` + `Work Object` categories |
| 2 | What phase is it in? | Zone B + Zone C top · `Workflow State` category |
| 3 | What is stuck or risky? | Zone C agent editorial + risk register · `Workflow State` + `Business Context` |
| 4 | What value is at stake? | Zone C value strip · `Business Context` + value ledger |
| 5 | What evidence supports the recommendation? | Zone D agent rail · `Evidence` + `Patterns` |
| 6 | What should happen next? | Zone D suggested actions · gate + missing-inputs derivation |

Failure to answer any of these within three seconds is a design defect, not a content problem. The five-question test from `04_VISUAL_AND_INTERACTION_SYSTEM.md` extends to a sixth on Programs because dollar exposure is load-bearing for CIO/CFO trust.

---

## E. Agent responsibilities

### Nexus (primary)

- Open every Programs surface with editorial that names current phase, primary blocker (if any), and the recommended next action with owner and due date.
- Cite evidence inline using the §10.5 provenance rules: `authored` / `observed` / `measured` / `composite`.
- Name the pattern (M1–M6 + tier-3 if applicable) it grounded the recommendation in.
- Defer to Steward when the user attempts a gate-controlled action.
- Hand off to Sentinel when the user asks "what evidence supports this?" and the bundle's `Evidence` category exceeds five references or contradictions.
- Hand off to Atlas when a portfolio-level synthesis is requested.

### Steward (gatekeeper)

- Validate hard-gate readiness before any phase advancement action renders as `allowed`.
- List blocked actions with the specific missing artifact, owner, and an expected unblock date when known.
- Refuse to advance a program through a hard gate when:
  - Required artifacts are missing, OR
  - Required signatures/approvals are absent, OR
  - The Context Bundle state is `insufficient` or `blocked` per S2.
- Emit an audit event for every gate decision (advance / hold / refuse) with `actor`, `programSlug`, `phaseNum`, `gateId`, `reason`, `timestamp`.

### Sentinel handoff triggers

- User asks for evidence drill-down on a Nexus claim.
- Pattern library disagrees with itself across the bundle's `Patterns` category (contradictions present).
- Claim depends on industry knowledge that has no observed/measured backing.

### Atlas signal emission triggers

- A program enters or leaves `at_risk` lifecycle status.
- Projected vs. realized variance crosses a tenant-configured threshold (default ±15%).
- A hard gate has been blocked for > 7 days.
- A new blocker appears whose category Atlas tracks at the portfolio level (governance, vendor, sponsor).

Every handoff is **explicit and rendered**, never silent. Cross-agent silent retrieval is a violation per `03_PAGE_LEVEL_AGENT_CONTRACTS.md`.

---

## F. Context Bundle requirement by category

For each canonical category from `02_CONTEXT_BUNDLE_STANDARD.md`, this section states what Programs must populate, an example, the empty-state behavior, and the failure mode if the category is absent or thin. The platform-wide bundle types in `src/lib/agent/context-bundle.ts` are the authoritative shape.

### F.1 Identity

- **Required fields:** `tenantId`, `tenantName`, `userId`, `userRole`, `route`, `surface='programs'`.
- **Example:** `{ tenantId: 'meridian', userRole: 'cio', route: '/tenant/meridian-health/programs/mrd-01' }`.
- **Empty-state behavior:** Bundle assembly fails with `missingTenant` or `missingUser`. Page renders sign-in redirect or `forbidden()` per `assertTenantAccess`.
- **Failure mode:** Identity absent → bundle state classified `blocked` → Steward refuses, no Nexus speech.

### F.2 Work Object

- **Required fields:** `workObjectKind='program'`, `workObjectId` (programSlug), `programArchetype`, `programPhase` (1–6), `programSponsor`, `programModulesActive`, `programShapeClass`.
- **Example:** `{ workObjectKind: 'program', workObjectId: 'morrison-margin-recapture', programPhase: 3, programSponsor: 'CFO Apex Retail', programModulesActive: ['Diagnose', 'Findings'] }`.
- **Empty-state behavior (index):** category absent on `/tenant/[slug]/programs` (no specific program). Nexus opens with portfolio editorial sourced from `Workflow State` aggregates.
- **Empty-state behavior (detail):** programSlug missing or unresolved → 404 via seed resolver.
- **Failure mode:** programSlug resolves but no archetype → bundle state `usable_with_gaps`; Nexus discloses limitation.

### F.3 Workflow State

- **Required fields:** `currentPhase` (1–6), `lifecycleStatus`, `gates_status` (array of 4 hard gates), `blockers` (array), `agingDays`, `nextGate`, `nextGateRequirements`, `nextAction`, `nextActionOwner`, `nextActionDueDate`.
- **Example:** `{ currentPhase: 3, lifecycleStatus: 'active', gates_status: [{ id: 'charter-signed', cleared: true }, ...], blockers: [{ description: 'CXO interview not scheduled', owner: 'pmoLead', age: 12 }] }`.
- **Empty-state behavior:** No gates resolved → bundle state `pattern_only`; Nexus answers from M1 only, declines program-specific advice.
- **Failure mode:** Phase mismatch between portfolio card and detail (the April 24 Marcus T finding) → cross-surface consistency test fails; ship is blocked.

### F.4 Business Context

- **Required fields:** `projectedValue`, `valueTimeline`, `valueConfidence`, `realizedValue` (when Phase 6 has run), `varianceToProjection`, `varianceAttribution`, `risks[]`, `assumptions[]`, `decisionsPending[]`.
- **Example:** `{ projectedValue: '$14-22M/yr', valueConfidence: 'MEDIUM', risks: [{ id: 'r1', severity: 'critical', owner: 'CFO' }] }`.
- **Empty-state behavior:** projectedValue absent → Nexus must prefix any value claim with "no projection on file" rather than fabricate a figure.
- **Failure mode:** Specific dollar amount with `evidenceCoverage = 0` → response composition layer rejects the response (S2 vanilla-risk gate).

### F.5 Artifacts

- **Required fields:** `artifactsList[]` with per-artifact `artifactId`, `artifactType`, `artifactStatus`, `artifactTier` (rich/outline/stub), `artifactOwner`, `artifactCitations[]`, `artifactMissingInputs[]`.
- **Example:** `{ artifactId: 'd16-business-case', artifactType: 'BusinessCase', artifactTier: 'outline', missingInputs: ['baseline-spend'] }`.
- **Empty-state behavior:** Empty array is valid (early-phase programs may have no artifacts). UI shows "No artifacts yet — first artifact emerges in Charter."
- **Failure mode:** Artifact rendered without tier or with claimed `rich` tier when missingInputs is non-empty → flagged as F4.2 deliverable-tier-mismatch.

### F.6 Patterns

- **Required fields:** `applicablePatterns[]` always contains M1; tier-3 use-case match populated when archetype + industry resolves.
- **Example:** `[{ id: 'm1-six-phase', tier: 'meta', authoringStatus: 'BATTLE-TESTED' }, { id: 't3-h01-ambient-clinical', tier: 'useCase', authoringStatus: 'AUTHORED-EXPERT', sectionsCited: ['B', 'D'] }]`.
- **Empty-state behavior:** Only M1 attached → Nexus labels response "operating-framework guidance, no industry-specific pattern matched."
- **Failure mode:** Pattern citations referenced in prose but `applicablePatterns[]` is empty → §F2.2 fabricated-citation detection rejects the response.

### F.7 Evidence

- **Required fields:** `evidenceBase[]` per registry entry with `evidenceId`, `evidenceType`, `evidenceSummary`, `evidenceConfidence`, `evidenceUrlOrRef`, `capturedAt`.
- **Example:** `[{ evidenceId: 'E51', type: 'baseline', confidence: 'HIGH' }, { evidenceId: 'E52', type: 'interview', confidence: 'MEDIUM' }]`.
- **Empty-state behavior:** Empty for early-phase programs; Nexus opens responses with the §10.4 sparsity prefix from `honestDisclosure.ts`.
- **Failure mode:** Specific dollar amount with no evidence id → S2 evidence-coverage = 0 → response rejected.

### F.8 Conversation

- **Required fields:** `conversationId`, `conversationTurnCount`, `priorTurns[]`, `userPromptCurrent`, `userIntentNormalized`, `suggestedActionsPrior`, `userSelectedSuggestion?`.
- **Example:** First turn → empty `priorTurns[]` but conversationId present.
- **Empty-state behavior:** First turn always has conversationId; absence is a runtime defect.
- **Failure mode:** Turn count > 1 but `priorTurns` empty → conversation continuity is lost (F3.4 lost-work-on-session-resume).

---

## G. Zone A–E layout contract

Layout zones are defined in `04_VISUAL_AND_INTERACTION_SYSTEM.md`. This section maps them to Programs.

### Programs index — `/tenant/[tenantSlug]/programs`

```text
┌─────────────────────────────────────────────────────────┐
│ Zone A · Top header (tenant identity, nav)               │
├─────────────────────────────────────────────────────────┤
│   No Zone B (no specific program selected)               │
├─────────────────────────────────────────────────────────┤
│ Zone C · Primary workspace                               │
│   [Nexus portfolio editorial — 2-3 sentences]            │
│   [Programs grid: status · phase · owner · value]        │
│   [Atlas pressure strip — top 2-3 portfolio pressures]   │
├─────────────────────────────────────────────────────────┤
│ Zone D · Agent rail (Nexus, portfolio-scoped)            │
│   [Suggested actions: 3 + custom]                        │
│   [Confidence chip + context-used row from S6]           │
└─────────────────────────────────────────────────────────┘
```

### Program detail — `/tenant/[tenantSlug]/programs/[programSlug]`

```text
┌─────────────────────────────────────────────────────────┐
│ Zone A · Top header                                      │
├─────────────────────────────────────────────────────────┤
│ Zone B · Context strip                                   │
│   [Tenant · Program name · Phase · Sponsor · Lifecycle] │
├─────────────────────────────────────────────────────────┤
│ Zone C · Primary workspace                               │
│   [Nexus program editorial — leads the surface]          │
│   [Phase timeline · 6 phases with current marked]        │
│   [Hard-gate strip · 4 gates with cleared/blocked state] │
│   [Active modules grid — module readiness]               │
│   [Risks · decisions · value strip]                      │
├─────────────────────────────────────────────────────────┤
│ Zone D · Agent rail (Nexus + Steward)                    │
│   [Steward gate-status when phase advancement requested] │
│   [Suggested actions · 3 + custom]                       │
│   [Confidence chip + context-used + missing-inputs]      │
├─────────────────────────────────────────────────────────┤
│ Zone E · Drawer (opens on demand)                        │
│   [Deliverable detail · evidence drawer · pattern peek]  │
└─────────────────────────────────────────────────────────┘
```

### Deliverable detail — `/tenant/[tenantSlug]/programs/[programSlug]/deliverables/[deliverableCode]`

Same Zone A/B as Program detail. Zone C displays the single deliverable's structured body (rich / outline / stub per S5). Zone D rail is Nexus with optional Sentinel evidence handoff.

### Phase workspace — `/tenant/[tenantSlug]/programs/[programSlug]/phase/[phaseNum]`

Zone B includes the phase number. Zone C lists phase-scoped modules and the gate that exits the phase. Steward is co-resident in Zone D for the four hard gates.

---

## H. State / gate contract

### Six canonical phases

| # | Phase | Exit gate (if any) | Primary modules |
|---|-------|--------------------|-----------------|
| 1 | Origination | none (soft transition) | Problem Framing · Stakeholder Map · Success Criteria |
| 2 | Charter | **HARD GATE 1** · Charter signed by executive sponsor | Baseline Data Request · CXO Interview Prep |
| 3 | Diagnose | **HARD GATE 2** · CXO interview completed before findings publish | Diagnostic Instrument · Data Analysis + Findings · Contradiction Surface · CXO Interview Capture |
| 4 | Design | **HARD GATE 3** · Design approved with projected value documented | Solution Library Match · Vendor/Tech Evaluation · Tradeoff Matrix · Business Case + ROI |
| 5 | Execute | none (soft transition; verified in Phase 6) | Implementation Plan · Build + Integration Tracking · Change Management Plan |
| 6 | Verify | **HARD GATE 4** · CXO verification of realized outcomes before outcome-fee claim | Outcome Measurement · Benefits Realization + Genome Feedback |

### Allowed transitions

- Forward by one phase only (`n → n+1`) when the exit gate (if any) is cleared.
- Soft transitions (Origination→Charter, Execute→Verify) require all required artifacts marked `approved` or `locked`.
- Hard-gate transitions require the gate's named approval recorded in the audit log with actor identity verifiable via Clerk session claims.

### Blocked transitions

- Backward transitions (`n → n-1`) are blocked unless the user has the `admin` session role and supplies a rationale that lands in the audit log as a `phase-rollback` event.
- Skipping phases (`n → n+2`) is always blocked.
- Hard-gate transitions when the bundle state is `insufficient` or `blocked` (S2 classification) are always blocked.

### Audit events

Every gate decision emits one record:

```text
{
  event: 'gate.advance' | 'gate.hold' | 'gate.refuse' | 'phase.transition' | 'phase.rollback',
  actor: { userId, role },
  programSlug, tenantId,
  fromPhase, toPhase,
  gateId,
  reason: string,
  bundleState: ContextBundleState,
  timestamp: ISO8601,
}
```

Audit events are append-only. Steward owns the writer. Failure to emit is itself an audit-integrity defect (F6.3).

### 17 modules → phase mapping

| Module | Primary phase | Notes |
|--------|---------------|-------|
| 1 Problem Framing | 1 Origination | |
| 2 Stakeholder Map | 1 Origination | |
| 3 Success Criteria Definition | 1 Origination | feeds Charter |
| 4 Baseline Data Request | 2 Charter | |
| 5 Diagnostic Instrument | 3 Diagnose | |
| 6 Data Analysis + Findings | 3 Diagnose | gate 2 input |
| 7 Contradiction Surface | 3 Diagnose | Sentinel handoff trigger |
| 8 CXO Interview Prep + Capture | 2/3 | gate 2 input |
| 9 Solution Library Match | 4 Design | M2 pattern hook |
| 10 Vendor/Tech Evaluation | 4 Design | |
| 11 Tradeoff Matrix + Recommendation | 4 Design | |
| 12 Business Case + ROI | 4 Design | gate 3 input |
| 13 Implementation Plan | 5 Execute | |
| 14 Build + Integration Tracking | 5 Execute | |
| 15 Change Management Plan | 5 Execute | |
| 16 Outcome Measurement | 6 Verify | gate 4 input |
| 17 Benefits Realization + Genome Feedback | 6 Verify | M6 dual-ledger writer |

---

## I. Data contract

The canonical seeds are at `intelligence/seeds/tenant-portfolios/{apexretail,meridian,arcturus,keystone}.json` and surfaced via `getSeedPlan()` in `src/lib/deliverables/seed-route-resolver.ts`.

| Registry | Source | Required fields |
|----------|--------|-----------------|
| Program registry | `TENANT_PORTFOLIOS` | `tenantKey`, `programSlug`, `code`, `archetypeCode`, `currentPhaseSpec`, `sponsorRole` |
| Module registry | `PROGRAMS_ENHANCEMENT_MATRIX` | `module.id`, `phase`, `requirement` (required/optional/additional) |
| Deliverable registry | `PROGRAMS_ENHANCEMENT_MATRIX.deliverables` | `code`, `requirement`, `tier`, `archetypeCompatibility` |
| Phase-gate registry | new (S9b) | `gateId`, `phaseFrom`, `phaseTo`, `requiredArtifacts`, `requiredApprover` |
| Sponsor registry | per program seed | `sponsorRole`, `sponsorName`, `sponsorEmail` (test users only) |
| Risks | `Business Context.risks` | `id`, `severity`, `owner`, `evidenceIds[]` |
| Decisions | `Business Context.decisionsPending` | `id`, `title`, `owner`, `evidenceIds[]` |
| Value ledger | `Business Context` + `Artifacts` | `projectedValue`, `realizedValue`, `attribution`, `confidence` |
| Evidence references | `Evidence.evidenceBase` | `evidenceId`, `type`, `summary`, `confidence`, `urlOrRef`, `capturedAt` |

Cross-tenant data leakage is prevented at the route level via `assertTenantAccess` (verified in S7) and at the data-query level by tenant filter on every Supabase call.

---

## J. UI states

Every Programs surface must render correctly in each of these states.

| State | Trigger | Render rule |
|-------|---------|-------------|
| Loading | Initial page load | Skeleton screens for editorial block + grid; never `loading…` text alone |
| Empty (no programs) | Tenant has zero programs | Nexus opens with onboarding prose pointing to Charter authoring; admin link surfaces if user is admin |
| Insufficient context | Bundle state = `insufficient` | Steward declines substantive answer; Zone D shows guided choices to gather missing inputs |
| Forbidden tenant | `assertTenantAccess` returns 403 | `/forbidden.tsx` with explicit "you do not have access to this tenant" copy |
| Tenant not found | `findTenantByRouteSlug` returns null | `notFound()` → standard 404 |
| Error | Pipeline throws | Specific error text + retry; escalation path to Steward; never silent failure |
| Degraded-context mode | Bundle state = `usable_with_gaps` | S5 honest-disclosure banner above body; missing-inputs row in footer (S6) |
| Pattern-only mode | Bundle state = `pattern_only` | S5 banner labels response "pattern-informed guidance, no client-specific evidence"; `requiresPatternLabeling=true` |
| Blocked | Bundle state = `blocked` | Cannot-help banner + named blocking input; no Nexus prose |

---

## K. Actions

### Three-choices-plus-custom pattern

Every substantive Nexus turn closes with three context-generated suggested actions plus one "Ask something else" custom option, per `docs/platform-design/05_CHAT_INPUT_AND_ATTACHMENT_STANDARD.md`. Programs-specific suggestion examples are illustrative — actual labels derive from Context Bundle state.

### Allowed actions (default surface)

| Action | Kind | When |
|--------|------|------|
| Show open contradictions | `requestInput` | Phase 3 Diagnose with contradictions surfaced |
| Schedule CXO touchpoint | `assignOwner` | Hard gate 2 unmet |
| Draft sponsor update | `openArtifact` | Sponsor-facing artifact applicable |
| Open evidence drawer | `openArtifact` | Bundle has ≥1 evidence reference |
| Pressure-test the recommendation | `ask` | Always available |

### Blocked actions

| Action | Block reason |
|--------|--------------|
| Advance phase | Hard gate not cleared OR bundle state ∈ {insufficient, blocked} |
| Lock business case | Required inputs missing OR no projected-value evidence |
| Approve decision | Cross-tenant URL OR insufficient session role |
| Roll back phase | Non-admin actor without rationale |

### Required-rationale actions

These actions fire only with a typed rationale captured in the audit log:

- Phase rollback (admin only).
- Override missing-input warning.
- Override gate-block (admin only; logged as `gate.override`).
- Soft-delete program (admin only).

### Suggested-action quality rules

Per `05_CHAT_INPUT_AND_ATTACHMENT_STANDARD.md` GPT addendum:

- Suggestions must reference current page, work object, lifecycle status, gate readiness, missing inputs, available artifacts, scorecard/value state, attached files, user role.
- A suggestion that could appear unchanged on every page is a violation.
- Custom input is always available — never the only path.

---

## L. Acceptance criteria

A Programs surface is shippable only when **all** of the following pass.

1. **Three-second test (CIO):** A new CIO crawler can answer all six questions in §D within three seconds of landing on `/tenant/[slug]/programs/[programSlug]` without typing a prompt.
2. **Bundle-grounded recommendation:** Every substantive Nexus claim traces to a populated Context Bundle field (S2 scoring records `evidence_coverage > 0` for dollar claims; `pattern_grounding > 0` for industry claims).
3. **Steward gate enforcement:** A user attempting to advance through a hard gate without the required artifacts sees the action rendered as `blocked` with the specific missing artifact named. Audit log records the refusal.
4. **No cross-tenant data leak:** A Meridian-authenticated user navigating to `/tenant/apex-retail/programs/...` receives 403 (per `assertTenantAccess`). S7 probes pass at HEAD.
5. **Backwards compatibility:** Legacy `RenderedResponse` objects without `honest_disclosure` metadata still render correctly via S6's empty view-model fallback.
6. **Seeded-tenant universe:** All four canonical demo tenants (apexretail, meridian, arcturus, keystone) render Programs index and at least one program detail successfully.
7. **Cross-surface consistency:** Phase shown on the Programs index card matches the phase on the program detail (April 24 Marcus T finding regression-tested).
8. **Pattern citation integrity:** Every pattern citation in Nexus prose resolves to an entry in `applicablePatterns[]`. F2.2 fabrication detection passes.
9. **Honest disclosure on thin context:** Bundle states `pattern_only` / `usable_with_gaps` produce visible disclosure banners (S5/S6 wiring).
10. **No model calls in tests:** S9 verification runs deterministically.

---

## M. Validation plan

### Static tests

- `npx tsc --noEmit --pretty false` clean.
- `npx eslint src/app/(maestro)/tenant src/components/programs src/lib/programs` clean.
- `npm run build` clean.

### Route smoke tests

- Each canonical route loads without 500.
- Tenant guard returns 403 on cross-tenant; 404 on unknown slug; redirect on unauthenticated.
- Programs index lists ≥1 program for every seeded tenant.
- Program detail surface shows current phase + 4 hard gates + active modules.

### Golden prompts (S9 minimum set)

- `What is this program?` → returns archetype, sponsor, current phase, lifecycle status.
- `What is stuck?` → references specific blocker(s) with owner and age.
- `What value is at stake?` → returns projected value with confidence chip and evidence id; refuses fabrication if Evidence is empty.
- `What should I do next?` → returns specific next action with owner and due date.
- `Why this recommendation?` → opens Evidence drawer with specific citation chips; Sentinel handoff if pattern contradiction is present.
- `Advance to next phase` (when hard gate unmet) → Steward refuses with named missing artifact.

### Live persona walk

- Marcus T (CFO) walks Apex Retail Morrison program through Phase 4 readiness.
- Dr. L (CMIO) walks Meridian MRD-01 through Phase 3 contradiction surface.
- Both produce written reports per `06_VALIDATION_AND_CRAWLER_PERSONAS.md`.

### Tenant isolation checks

- S7 probes (50 tests) pass.
- A Meridian session navigating `/tenant/apex-retail/programs/morrison-...` sees 403 with no body leak.

### Test users

Use the existing Clerk test users with OTP `424242` per `docs/CORE_APP_CONTEXT_PACK.md` and `memory/demo_accounts.md`. No new test accounts are required for S8.

---

## N. Implementation slices proposed after S8

These are scope candidates for S9-series. Each requires its own slice manifest entry and founder approval before code lands.

| Slice | Goal | Depends on |
|-------|------|------------|
| **S9** Programs canonical index/detail proof | First end-to-end render of `/tenant/[slug]/programs` and one program detail with bundle-grounded Nexus prose | S8 + S4 |
| **S9b** Programs Nexus rail metadata binding | Wire S6 disclosure footer to Programs surfaces; populate context-used / confidence / missing-inputs from real bundle | S9 + S6 |
| **S9c** Program phase / hard-gate status rendering | Phase timeline + 4-gate strip with Steward gate-state badges | S9 |
| **S9d** Program deliverables evidence + value summary | Deliverable list with tier badges; projected vs. realized value strip with citation chips | S9 + M6 hooks |
| **S9e** Programs Control Tower signal emission | Atlas signal triggers (§E) wired to Tower pressure cards; cross-program portfolio aggregates | S9c + S9d |

Each slice carries its own acceptance criteria, validation commands, allowed/forbidden file lists, and a founder approval line in `docs/build/build-slices.json`.

---

## O. Explicit defer list

The following are intentionally **out of scope** for S8 and S9-series unless founder explicitly amends:

- Full deliverable generation pipeline (LLM authored deliverable bodies).
- Full upload / parsing pipeline (PDF/DOCX/XLSX → structured evidence).
- Full pattern graph traversal beyond the M1–M6 hooks; tier-3 use-case catalog deepening.
- New database migrations (any `supabase/migrations/*` change requires founder amendment per `docs/build/BUILD_OPERATING_MODEL.md`).
- Modernization of legacy `/programs/*` routes (`src/app/programs/*`).
- Source UI expansion (separate slice queue).
- Auth rewrite or Clerk session-claim shape changes.
- Model calls in tests.
- Re-implementation of `src/components/programs/ProgramSurface.tsx` or `src/lib/programs/mock.ts`.

---

## Status

**code_complete** — documentation slice. No production code modified. No tests run beyond static typecheck + build. Promotion to **verified** requires:

1. Founder review of this contract.
2. Acceptance criteria §L marked locked or amended.
3. S9 scope approved against this contract.

After verified, this document becomes the locked input for S9 implementation.
